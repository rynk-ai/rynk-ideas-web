# Rynk Ideas Web

> **Rynk Ideas** is the open-source web interface for Rynk AI, designed for deep research, ideation, and project management.

## Features

- **Infinite Memory**: Search across all your past conversations.
- **Project Workspaces**: Group chats and files for context-aware assistance.
- **Document Analysis**: Chat with PDFs, Code, and Images.

## Documentation

- 📖 **[Architecture Guide](./docs/ARCHITECTURE.md)**
- 💡 **[Ideation & Workflows](./docs/IDEATION.md)**
- 🚀 **[Self-Hosting Guide](./docs/SELF_HOSTING.md)**

## Powered By

<div align="center">

| [Cloudflare for Startups](https://workers.cloudflare.com/) | [Groq](https://groq.com) |
| :---: | :---: |
| Infrastructure | Fast Inference |

</div>

## Stack

- **Framework**: Next.js (App Router)
- **Edge Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1
- **Vector DB**: Cloudflare Vectorize
- **Storage**: Cloudflare R2

## Getting Started

1.  Clone the repository:
    ```bash
    git clone https://github.com/rynk-ai/rynk-ideas-web.git
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```
3.  Set up environment variables (see [Self-Hosting Guide](./docs/SELF_HOSTING.md)).
4.  Run development server:
    ```bash
    pnpm dev
    ```

## License

MIT
