# DevFlow Agent Coding Guide

## Project Goal

DevFlow Agent is a Google Cloud Rapid Agent Hackathon MVP that helps developers understand GitLab project activity by summarizing pasted project context into blockers, risks, recommended next actions, and a daily standup summary.

## Current Scope

- Single local React app.
- User pastes GitLab issue, merge request, CI, or project notes into a textarea.
- App returns mock analysis only.
- Integration TODOs may point to Gemini, Google Cloud Agent Builder, and GitLab MCP, but those integrations are not implemented yet.

## Tech Stack

- React
- TypeScript
- Vite
- Plain CSS
- npm scripts for local development and production build

## Hackathon Constraints

- Keep the app demo-focused and easy to run locally.
- Prefer simple, readable code over abstractions.
- Build only what improves the MVP demo.
- Avoid backend services unless explicitly requested.
- Do not introduce secrets, cloud credentials, or deployment assumptions without user approval.

## Coding Rules

- Do not change application code unless the task asks for it.
- Keep components small and understandable.
- Keep mock logic clearly labeled as mock logic.
- Add TODO comments for future Gemini, Google Cloud Agent Builder, or GitLab MCP work only where the integration would actually connect.
- Run `npm run build` after app code changes.
- Keep generated folders such as `node_modules/` and `dist/` out of commits.

## What Not To Build

- No authentication.
- No payments.
- No teams, roles, organizations, or permissions.
- No full SaaS dashboard.
- No database.
- No complex GitLab project sync.
- No fake live integrations.
- No claims that mock analysis is AI-generated or cloud-backed.

## README and Devpost Honesty

- Describe the current app as an MVP or prototype.
- State clearly when analysis is mock/demo logic.
- Only claim Gemini, Google Cloud Agent Builder, GitLab MCP, or live GitLab functionality after it is implemented and tested.
- Keep future plans separate from completed features.
- If screenshots or demos show sample data, label it as sample or pasted context.
