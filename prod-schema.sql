PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE Message (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  attachments TEXT, -- JSON array of file metadata/URLs
  parentMessageId TEXT,
  versionOf TEXT,
  versionNumber INTEGER DEFAULT 1,
  branchId TEXT,
  referencedConversations TEXT, -- JSON
  referencedFolders TEXT, -- JSON
  timestamp INTEGER, -- Store original timestamp if needed, or use createdAt
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversationId) REFERENCES Conversation(id) ON DELETE CASCADE
);
CREATE TABLE Account (
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
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  UNIQUE(provider, providerAccountId)
);
CREATE TABLE Session (
  id TEXT PRIMARY KEY,
  sessionToken TEXT NOT NULL UNIQUE,
  userId TEXT NOT NULL,
  expires DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);
CREATE TABLE VerificationToken (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires DATETIME NOT NULL,
  UNIQUE(identifier, token)
);
CREATE TABLE Project (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  attachments TEXT, -- JSON array of file metadata
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);
CREATE TABLE Conversation (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  projectId TEXT,
  title TEXT,
  path TEXT, -- JSON array of message IDs
  tags TEXT, -- JSON array of strings
  isPinned BOOLEAN DEFAULT 0,
  activeBranchId TEXT,
  branches TEXT, -- JSON array of Branch objects
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE SET NULL
);
CREATE TABLE Folder (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);
CREATE TABLE FolderConversation (
  folderId TEXT NOT NULL,
  conversationId TEXT NOT NULL,
  PRIMARY KEY (folderId, conversationId),
  FOREIGN KEY (folderId) REFERENCES Folder(id) ON DELETE CASCADE,
  FOREIGN KEY (conversationId) REFERENCES Conversation(id) ON DELETE CASCADE
);
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  emailVerified DATETIME,
  image TEXT,
  credits INTEGER DEFAULT 10,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
, subscriptionTier TEXT DEFAULT 'free', polarCustomerId TEXT, polarSubscriptionId TEXT, subscriptionStatus TEXT DEFAULT 'none', creditsResetAt DATETIME, carryoverCredits INTEGER DEFAULT 0);
CREATE TABLE accounts (
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
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  sessionToken TEXT NOT NULL UNIQUE,
  userId TEXT NOT NULL,
  expires DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires DATETIME NOT NULL,
  UNIQUE(identifier, token)
);
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  attachments TEXT, -- JSON array of file metadata
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP, useChatsAsKnowledge INTEGER DEFAULT 1,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  projectId TEXT,
  title TEXT,
  path TEXT, -- JSON array of message IDs
  tags TEXT, -- JSON array of strings
  isPinned BOOLEAN DEFAULT 0,
  activeBranchId TEXT,
  branches TEXT, -- JSON array of Branch objects
  activeReferencedConversations TEXT, -- JSON array for persistent context
  activeReferencedFolders TEXT, -- JSON array for persistent context
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP, surfaceStates TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE SET NULL
);
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE folder_conversations (
  folderId TEXT NOT NULL,
  conversationId TEXT NOT NULL,
  PRIMARY KEY (folderId, conversationId),
  FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE CASCADE,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
);
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  attachments TEXT, -- JSON array of file metadata/URLs
  parentMessageId TEXT,
  versionOf TEXT,
  versionNumber INTEGER DEFAULT 1,
  branchId TEXT,
  referencedConversations TEXT, -- JSON
  referencedFolders TEXT, -- JSON
  timestamp INTEGER, -- Store original timestamp if needed, or use createdAt
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, reasoning_content TEXT, reasoning_metadata TEXT, web_annotations TEXT, model_used TEXT,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
);
CREATE TABLE embeddings (
  id TEXT PRIMARY KEY,
  messageId TEXT NOT NULL UNIQUE,
  conversationId TEXT NOT NULL,
  userId TEXT NOT NULL,
  content TEXT NOT NULL,
  vector TEXT NOT NULL, -- JSON array of floats
  timestamp INTEGER,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (messageId) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE sub_chats (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  sourceMessageId TEXT NOT NULL,
  quotedText TEXT NOT NULL,
  sourceMessageContent TEXT, -- Full content of the source message for context
  messages TEXT DEFAULT '[]', -- JSON array of {id, role, content, createdAt}
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP, fullMessageContent TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sourceMessageId) REFERENCES messages(id) ON DELETE CASCADE
);
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE attachments_metadata (
  id TEXT PRIMARY KEY,
  messageId TEXT, 
  userId TEXT NOT NULL,
  fileName TEXT NOT NULL,
  fileType TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  r2Key TEXT NOT NULL,
  chunkCount INTEGER DEFAULT 0,
  processingStatus TEXT DEFAULT 'pending', 
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (messageId) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE file_chunks (
  id TEXT PRIMARY KEY,
  attachmentId TEXT NOT NULL,
  userId TEXT NOT NULL,
  chunkIndex INTEGER NOT NULL,
  content TEXT NOT NULL,
  vector TEXT NOT NULL, 
  metadata TEXT, 
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (attachmentId) REFERENCES attachments_metadata(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE knowledge_chunks (
  id TEXT PRIMARY KEY,
  sourceId TEXT NOT NULL,
  content TEXT NOT NULL,
  chunkIndex INTEGER,
  metadata TEXT, parentId TEXT REFERENCES parent_chunks(id), 
  FOREIGN KEY (sourceId) REFERENCES sources(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "conversation_sources" (
  id TEXT PRIMARY KEY,
  conversationId TEXT, 
  sourceId TEXT NOT NULL,
  messageId TEXT,
  projectId TEXT,
  createdAt INTEGER DEFAULT (unixepoch())
);
CREATE TABLE guest_sessions (
  guest_id TEXT PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  user_agent TEXT,
  credits_remaining INTEGER DEFAULT 5,
  message_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE guest_conversations (
  id TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL,
  title TEXT,
  path TEXT,
  tags TEXT,
  is_pinned BOOLEAN DEFAULT 0,
  active_branch_id TEXT,
  branches TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guest_id) REFERENCES guest_sessions(guest_id) ON DELETE CASCADE
);
CREATE TABLE guest_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  guest_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments TEXT,
  parent_message_id TEXT,
  version_of TEXT,
  version_number INTEGER DEFAULT 1,
  branch_id TEXT,
  referenced_conversations TEXT,
  referenced_folders TEXT,
  reasoning_metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES guest_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (guest_id) REFERENCES guest_sessions(guest_id) ON DELETE CASCADE
);
CREATE TABLE guest_folders (
  id TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guest_id) REFERENCES guest_sessions(guest_id) ON DELETE CASCADE
);
CREATE TABLE guest_folder_conversations (
  folder_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  PRIMARY KEY (folder_id, conversation_id),
  FOREIGN KEY (folder_id) REFERENCES guest_folders(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES guest_conversations(id) ON DELETE CASCADE
);
CREATE TABLE guest_sub_chats (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  source_message_id TEXT NOT NULL,
  quoted_text TEXT NOT NULL,
  source_message_content TEXT,
  messages TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES guest_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (source_message_id) REFERENCES guest_messages(id) ON DELETE CASCADE
);
CREATE TABLE guest_attachments_metadata (
  id TEXT PRIMARY KEY,
  message_id TEXT,
  guest_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  r2_key TEXT NOT NULL,
  chunk_count INTEGER DEFAULT 0,
  processing_status TEXT DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (message_id) REFERENCES guest_messages(id) ON DELETE CASCADE,
  FOREIGN KEY (guest_id) REFERENCES guest_sessions(guest_id) ON DELETE CASCADE
);
CREATE TABLE shared_conversations (
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
CREATE TABLE humanizer_limits (
  ip_hash TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TEXT NOT NULL,
  last_request TEXT NOT NULL
);
CREATE TABLE mobile_sessions (
  access_token TEXT PRIMARY KEY,
  refresh_token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'email',
  provider_account_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  access_token_expires_at TEXT NOT NULL,
  refresh_token_expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "sources" (
  id TEXT PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  metadata TEXT,
  documentOutline TEXT,  
  createdAt INTEGER NOT NULL
);
CREATE TABLE document_sections (
  id TEXT PRIMARY KEY,
  sourceId TEXT NOT NULL,
  title TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 3,
  pageStart INTEGER NOT NULL,
  pageEnd INTEGER NOT NULL,
  chunkIndices TEXT NOT NULL,  
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (sourceId) REFERENCES sources(id) ON DELETE CASCADE
);
CREATE TABLE document_profiles (
  sourceId TEXT PRIMARY KEY,
  chunkCount INTEGER NOT NULL DEFAULT 0,
  hasOutline INTEGER NOT NULL DEFAULT 0,
  avgChunkSize INTEGER NOT NULL DEFAULT 0,
  contentType TEXT NOT NULL DEFAULT 'text',
  lastAccess INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (sourceId) REFERENCES sources(id) ON DELETE CASCADE
);
CREATE TABLE parent_chunks (
  id TEXT PRIMARY KEY,
  sourceId TEXT NOT NULL,
  content TEXT NOT NULL,
  chunkIndex INTEGER NOT NULL,
  metadata TEXT,
  createdAt INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (sourceId) REFERENCES sources(id) ON DELETE CASCADE
);
CREATE TABLE pdf_jobs (
  id TEXT PRIMARY KEY,
  r2Key TEXT NOT NULL,
  conversationId TEXT,
  projectId TEXT,
  messageId TEXT,
  sourceId TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0,
  totalChunks INTEGER,
  processedChunks INTEGER DEFAULT 0,
  error TEXT,
  createdAt INTEGER DEFAULT (unixepoch()),
  completedAt INTEGER
, extractedText TEXT);
CREATE TABLE tool_guest_limits (
  ip_hash TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TEXT NOT NULL,
  last_request TEXT NOT NULL,
  PRIMARY KEY (ip_hash, tool_id)
);
CREATE TABLE user_credits (
  user_id TEXT PRIMARY KEY,
  credits_remaining INTEGER NOT NULL DEFAULT 1000,
  total_credits_used INTEGER NOT NULL DEFAULT 0,
  last_refill_date TEXT NOT NULL,
  
  subscription_plan TEXT DEFAULT 'free', 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE dumps (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  content TEXT NOT NULL,
  contentType TEXT NOT NULL DEFAULT 'text', -- 'text', 'mixed'
  mediaUrls TEXT, -- JSON array of R2 keys
  transcript TEXT, -- AI-generated for audio/video
  metadata TEXT, -- JSON: device, time context, etc.
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
, ipHash TEXT);
CREATE TABLE segments (
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
CREATE TABLE idea_threads (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  state TEXT NOT NULL DEFAULT 'seed',
  stateReason TEXT,
  realityScore INTEGER,
  momentum TEXT DEFAULT 'steady',
  segmentCount INTEGER DEFAULT 0,
  lastActivityAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
, groundingNote TEXT, ipHash TEXT);
CREATE TABLE thread_edges (
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
DELETE FROM sqlite_sequence;
CREATE INDEX idx_message_conversation ON Message(conversationId);
CREATE INDEX idx_conversation_user ON Conversation(userId);
CREATE INDEX idx_conversation_project ON Conversation(projectId);
CREATE INDEX idx_folder_user ON Folder(userId);
CREATE INDEX idx_project_user ON Project(userId);
CREATE INDEX idx_embedding_message ON embeddings(messageId);
CREATE INDEX idx_embedding_conversation ON embeddings(conversationId);
CREATE INDEX idx_embedding_user ON embeddings(userId);
CREATE INDEX idx_attachments_message ON attachments_metadata(messageId);
CREATE INDEX idx_file_chunks_attachment ON file_chunks(attachmentId);
CREATE INDEX idx_file_chunks_user ON file_chunks(userId);
CREATE INDEX idx_knowledge_chunks_sourceId ON knowledge_chunks(sourceId);
CREATE INDEX idx_subchat_conversation ON sub_chats(conversationId);
CREATE INDEX idx_subchat_source_message ON sub_chats(sourceMessageId);
CREATE INDEX idx_conversation_sources_conversationId ON conversation_sources(conversationId);
CREATE INDEX idx_conversation_sources_sourceId ON conversation_sources(sourceId);
CREATE INDEX idx_conversation_sources_projectId ON conversation_sources(projectId);
CREATE INDEX idx_guest_session_ip ON guest_sessions(ip_hash);
CREATE INDEX idx_guest_conversation_guest ON guest_conversations(guest_id);
CREATE INDEX idx_guest_message_conversation ON guest_messages(conversation_id);
CREATE INDEX idx_guest_message_guest ON guest_messages(guest_id);
CREATE INDEX idx_guest_folder_guest ON guest_folders(guest_id);
CREATE INDEX idx_guest_folder_conv ON guest_folder_conversations(folder_id);
CREATE INDEX idx_guest_folder_conv_conversation ON guest_folder_conversations(conversation_id);
CREATE INDEX idx_guest_subchat_conversation ON guest_sub_chats(conversation_id);
CREATE INDEX idx_guest_subchat_source_message ON guest_sub_chats(source_message_id);
CREATE INDEX idx_guest_attachments_message ON guest_attachments_metadata(message_id);
CREATE INDEX idx_guest_attachments_guest ON guest_attachments_metadata(guest_id);
CREATE INDEX idx_shared_conv_user ON shared_conversations(userId);
CREATE INDEX idx_shared_conv_conversation ON shared_conversations(conversationId);
CREATE INDEX idx_shared_conv_active ON shared_conversations(isActive);
CREATE INDEX idx_humanizer_limits_window_start ON humanizer_limits(window_start);
CREATE INDEX idx_mobile_sessions_user_id ON mobile_sessions(user_id);
CREATE INDEX idx_mobile_sessions_refresh_token ON mobile_sessions(refresh_token);
CREATE INDEX idx_mobile_sessions_access_expires ON mobile_sessions(access_token_expires_at);
CREATE INDEX idx_mobile_sessions_refresh_expires ON mobile_sessions(refresh_token_expires_at);
CREATE INDEX idx_document_sections_sourceId ON document_sections(sourceId);
CREATE INDEX idx_document_sections_pageRange ON document_sections(sourceId, pageStart, pageEnd);
CREATE INDEX idx_knowledge_chunks_source_chunk ON knowledge_chunks(sourceId, chunkIndex);
CREATE INDEX idx_conversation_sources_conv_msg ON conversation_sources(conversationId, messageId);
CREATE INDEX idx_document_profiles_sourceId ON document_profiles(sourceId);
CREATE INDEX idx_document_profiles_lastAccess ON document_profiles(lastAccess DESC);
CREATE INDEX idx_parent_chunks_source ON parent_chunks(sourceId);
CREATE INDEX idx_pdf_jobs_status ON pdf_jobs(status);
CREATE INDEX idx_pdf_jobs_conversation ON pdf_jobs(conversationId);
CREATE INDEX idx_tool_guest_limits_window ON tool_guest_limits(window_start);
CREATE INDEX idx_dumps_userId ON dumps(userId);
CREATE INDEX idx_dumps_createdAt ON dumps(createdAt);
CREATE INDEX idx_segments_dumpId ON segments(dumpId);
CREATE INDEX idx_segments_threadId ON segments(threadId);
CREATE INDEX idx_segments_userId ON segments(userId);
CREATE INDEX idx_threads_userId ON idea_threads(userId);
CREATE INDEX idx_threads_state ON idea_threads(state);
CREATE INDEX idx_thread_edges_from ON thread_edges(fromThreadId);
CREATE INDEX idx_thread_edges_to ON thread_edges(toThreadId);
CREATE INDEX idx_dumps_ipHash ON dumps(ipHash);
CREATE INDEX idx_threads_ipHash ON idea_threads(ipHash);
