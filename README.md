# DevFlow Agent

DevFlow Agent is a small Google Cloud Rapid Agent Hackathon MVP that helps developers turn GitLab project activity into a concise project readout.

The current app is intentionally demo-focused. It accepts pasted GitLab context such as issue notes, merge request updates, CI failures, or project summaries and includes a "Load sample GitLab data" button for a quick judge-friendly demo. The app returns analysis for:

- blockers
- risks
- recommended next actions
- daily standup summary

Gemini analysis is the first real integration step. If Gemini is unavailable or the API key is missing, the app clearly falls back to mock/demo analysis so the MVP still works.

## Tech Stack

- React
- TypeScript
- Vite
- Vercel serverless API route

## Local Setup

Install dependencies:

```bash
npm install
```

Start the local Vite development server:

```bash
npm run dev
```

The frontend will run without an API key and will use mock fallback analysis if `/api/analyze` is unavailable.

To test the Vercel API route locally, run the app with Vercel CLI and provide the Gemini API key in `.env.local`:

```bash
GEMINI_API_KEY=your_api_key_here
```

Required environment variable:

- `GEMINI_API_KEY`: Google Gemini API key used only by the serverless API route.

Build for production:

```bash
npm run build
```

## MVP Notes

This version includes a minimal Gemini API route plus mock fallback behavior. The next integration points are marked with TODO comments in the code:

- Google Cloud Agent Builder orchestration
- GitLab MCP integration for live project context
