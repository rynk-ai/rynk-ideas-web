-- Rynk Ideas Database Schema
-- Shared DB with rynk-web — includes auth tables for local dev
-- ================================================================

-- ================================================================
-- Auth.js Tables (from rynk-web, needed for shared auth)
-- ================================================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  emailVerified DATETIME,
  image TEXT,
  credits INTEGER DEFAULT 10,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  subscriptionTier TEXT DEFAULT 'free',
  polarCustomerId TEXT,
  polarSubscriptionId TEXT,
  subscriptionStatus TEXT DEFAULT 'none',
  creditsResetAt DATETIME,
  carryoverCredits INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  oauth_token_secret TEXT,
  oauth_token TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, providerAccountId)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  sessionToken TEXT NOT NULL UNIQUE,
  userId TEXT NOT NULL,
  expires DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires DATETIME NOT NULL,
  UNIQUE(identifier, token)
);

-- ================================================================
-- rynk-web Core Tables (needed for FK refs + cross-product context)
-- ================================================================

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  attachments TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  useChatsAsKnowledge INTEGER DEFAULT 1,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  projectId TEXT,
  title TEXT,
  path TEXT,
  tags TEXT,
  isPinned BOOLEAN DEFAULT 0,
  activeBranchId TEXT,
  branches TEXT,
  activeReferencedConversations TEXT,
  activeReferencedFolders TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  surfaceStates TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments TEXT,
  parentMessageId TEXT,
  versionOf TEXT,
  versionNumber INTEGER DEFAULT 1,
  branchId TEXT,
  referencedConversations TEXT,
  referencedFolders TEXT,
  timestamp INTEGER,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  reasoning_content TEXT,
  reasoning_metadata TEXT,
  web_annotations TEXT,
  model_used TEXT,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS folder_conversations (
  folderId TEXT NOT NULL,
  conversationId TEXT NOT NULL,
  PRIMARY KEY (folderId, conversationId),
  FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE CASCADE,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sub_chats (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  sourceMessageId TEXT NOT NULL,
  quotedText TEXT NOT NULL,
  sourceMessageContent TEXT,
  messages TEXT DEFAULT '[]',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  fullMessageContent TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sourceMessageId) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shared_conversations (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  userId TEXT NOT NULL,
  title TEXT,
  isActive INTEGER DEFAULT 1,
  viewCount INTEGER DEFAULT 0,
  cloneCount INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiresAt DATETIME,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================================
-- Rynk Ideas Tables
-- ================================================================

-- Raw user dumps (freewrite sessions)
CREATE TABLE IF NOT EXISTS dumps (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  ipHash TEXT, -- For guest dumps
  content TEXT NOT NULL,
  contentType TEXT NOT NULL DEFAULT 'text', -- 'text', 'mixed'
  mediaUrls TEXT, -- JSON array of R2 keys
  transcript TEXT, -- AI-generated for audio/video
  metadata TEXT, -- JSON: device, time context, etc.
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI-extracted segments from dumps
CREATE TABLE IF NOT EXISTS segments (
  id TEXT PRIMARY KEY,
  dumpId TEXT NOT NULL,
  userId TEXT NOT NULL,
  content TEXT NOT NULL,
  segmentType TEXT NOT NULL DEFAULT 'thought',
  threadId TEXT, -- assigned after clustering
  embeddingStored INTEGER DEFAULT 0,
  confidence REAL, -- clustering confidence (0.0-1.0)
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dumpId) REFERENCES dumps(id) ON DELETE CASCADE,
  FOREIGN KEY (threadId) REFERENCES idea_threads(id) ON DELETE SET NULL
);

-- AI-generated idea threads (graph nodes)
CREATE TABLE IF NOT EXISTS idea_threads (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  ipHash TEXT, -- For guest threads
  title TEXT NOT NULL,
  summary TEXT,
  state TEXT NOT NULL DEFAULT 'seed',
  stateReason TEXT,
  realityScore INTEGER,
  groundingNote TEXT,
  momentum TEXT DEFAULT 'steady',
  segmentCount INTEGER DEFAULT 0,
  lastActivityAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Relationships between threads (graph edges)
CREATE TABLE IF NOT EXISTS thread_edges (
  id TEXT PRIMARY KEY,
  fromThreadId TEXT NOT NULL,
  toThreadId TEXT NOT NULL,
  edgeType TEXT NOT NULL,
  strength REAL DEFAULT 0.5,
  reason TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fromThreadId) REFERENCES idea_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (toThreadId) REFERENCES idea_threads(id) ON DELETE CASCADE
);

-- Indexes
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_dumps_userId ON dumps(userId);
CREATE INDEX IF NOT EXISTS idx_dumps_ipHash ON dumps(ipHash);
CREATE INDEX IF NOT EXISTS idx_dumps_createdAt ON dumps(createdAt);
CREATE INDEX IF NOT EXISTS idx_segments_dumpId ON segments(dumpId);
CREATE INDEX IF NOT EXISTS idx_segments_threadId ON segments(threadId);
CREATE INDEX IF NOT EXISTS idx_segments_userId ON segments(userId);
CREATE INDEX IF NOT EXISTS idx_threads_userId ON idea_threads(userId);
CREATE INDEX IF NOT EXISTS idx_threads_ipHash ON idea_threads(ipHash);
CREATE INDEX IF NOT EXISTS idx_threads_state ON idea_threads(state);
CREATE INDEX IF NOT EXISTS idx_thread_edges_from ON thread_edges(fromThreadId);
CREATE INDEX IF NOT EXISTS idx_thread_edges_to ON thread_edges(toThreadId);

-- ================================================================
-- Guest Sessions (IP-based limits)
-- ================================================================

CREATE TABLE IF NOT EXISTS guest_sessions (
  ipHash TEXT PRIMARY KEY,
  creditsRemaining INTEGER DEFAULT 5,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastActive DATETIME DEFAULT CURRENT_TIMESTAMP
);
