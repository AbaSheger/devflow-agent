# DevFlow Agent

DevFlow Agent is a small Google Cloud Rapid Agent Hackathon MVP that helps developers turn GitLab project activity into a concise project readout.

The current app is intentionally demo-focused. It accepts pasted GitLab context such as issue notes, merge request updates, CI failures, or project summaries and returns mock analysis for:

- blockers
- risks
- recommended next actions
- daily standup summary

## Tech Stack

- React
- TypeScript
- Vite

## Local Setup

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## MVP Notes

This first version uses mock analysis only. The next integration points are marked with TODO comments in the code:

- Gemini-powered project analysis
- Google Cloud Agent Builder orchestration
- GitLab MCP integration for live project context
