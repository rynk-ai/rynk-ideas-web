# Rynk Ideas Web

> **Rynk Ideas** is an AI-powered thought capture and synthesis tool. Dump anything, and the AI organizes it into actionable plans, finding connections you missed.

> *"AI without the noise"* extended to **ideas**.

## The Concept

Rynk Ideas is a **thought capture → AI synthesis → actionable planning** pipeline. It is distinct from a standard chatbot.

1.  **The Dump**: Capture raw thoughts, images, and links instantly.
2.  **The Brain**: AI continuously clusters dumps into "Idea Threads".
3.  **The Board**: A living dashboard of your creative landscape (Kanban/Graph view).
4.  **Deep Dive**: Turn a vague idea into a concrete action plan with research.

## Documentation

- 💡 **[Ideation & Concepts](./docs/IDEATION.md)**
- 📖 **[Technical Architecture](./docs/ARCHITECTURE.md)**
- 🚀 **[Self-Hosting Guide](./docs/SELF_HOSTING.md)**

## Powered By

<div align="center">

| [Cloudflare for Startups](https://workers.cloudflare.com/) | [Groq](https://groq.com) |
| :---: | :---: |
| Infrastructure | Fast Inference |

</div>

## Stack

- **Framework**: Next.js (App Router)
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Vector Engine**: Cloudflare Vectorize
- **File Storage**: Cloudflare R2

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
