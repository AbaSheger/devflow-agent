# DevFlow Agent

DevFlow Agent is a small Google Cloud Rapid Agent Hackathon MVP that helps developers turn GitLab project activity into a concise project readout.

The current app is intentionally demo-focused. It accepts pasted GitLab context such as issue notes, merge request updates, CI failures, or project summaries. Judges can use the bundled sample data, import context from a public GitLab project through the public GitLab API, or paste exported GitLab notes manually. The app returns analysis for:

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

## Demo Modes

- Sample data mode: loads realistic GitLab-style issues, merge requests, CI status, reviewers, missing tests, and blockers into the textarea.
- Public GitLab API import mode: accepts a public `gitlab.com` project URL or `namespace/project` path, fetches public project details, issues, merge requests, and pipelines without authentication, then places that context in the textarea.
- Gemini analysis mode: sends the textarea context to the serverless Gemini route and falls back to mock/demo analysis if Gemini is unavailable.
- GitLab MCP planned next: direct GitLab MCP context is not implemented yet and remains the next integration step.

## Architecture and Status

Implemented:

- React UI for pasted GitLab-style project context
- Vercel deployment with a serverless analysis route
- Gemini analysis with mock/demo fallback behavior
- Sample GitLab workflow data for demos
- Public GitLab API import for public projects without authentication

In progress/planned:

- GitLab MCP integration for direct project context
- Google Cloud Agent Builder workflow orchestration

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
