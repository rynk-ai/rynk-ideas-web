# Self-Hosting Rynk Ideas

## Prerequisites
- **Cloudflare Account** (Workers, D1, R2, Vectorize).
- **GitHub Account** (for Auth).
- **Google Cloud Console** (for Google Auth).
- **AI API Keys**: OpenRouter, Groq, or others.

## Setup Steps

### 1. Clone & Install
```bash
git clone https://github.com/rynk-ai/rynk-ideas-web.git
cd rynk-ideas-web
pnpm install
```

### 2. Cloudflare Resources
Initialize the necessary resources using Wrangler:

```bash
# Database
npx wrangler d1 create rynk-db
# Copy the database_id to wrangler.toml

# Storage
npx wrangler r2 bucket create rynk-files

# Vector Database
npx wrangler vectorize create rynk-vectors --dimensions=768 --metric=cosine
```

### 3. Configuration
Copy `.dev.vars.example` to `.dev.vars` and populate secrets:

```bash
cp .dev.vars.example .dev.vars
```

Required Secrets:
- `AUTH_SECRET`: Generate using `npx auth secret`.
- `OPENROUTER_API_KEY`: For primary AI models.
- `GROQ_API_KEY`: For fast inference.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: For login.

### 4. Database Schema
Apply the schema to your D1 database:

```bash
npx wrangler d1 execute rynk-db --local --file=./schema.sql
# For production:
npx wrangler d1 execute rynk-db --remote --file=./schema.sql
```

### 5. Run Locally
```bash
pnpm dev
# App runs at http://localhost:3000 (or 8788)
```

### 6. Deploy to Cloudflare Pages
```bash
pnpm deploy
```
Ensure you add all environment variables/secrets in the Cloudflare Dashboard > Pages > Settings.
