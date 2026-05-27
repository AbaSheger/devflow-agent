import { useMemo, useState } from 'react';

type Analysis = {
  blockers: string[];
  risks: string[];
  nextActions: string[];
  standupSummary: string;
};

const starterText = `Paste GitLab activity here, for example:
- Open issues and blockers
- Merge request notes
- CI failure logs
- Release or sprint status`;

function analyzeProject(input: string): Analysis {
  const normalizedInput = input.toLowerCase();
  const hasCiFailure = /ci|pipeline|test|failed|failure|build/.test(normalizedInput);
  const hasReviewSignal = /merge request|mr|review|approval/.test(normalizedInput);
  const hasBlockerSignal = /blocker|blocked|waiting|dependency|cannot/.test(normalizedInput);

  // TODO: Replace this mock logic with Gemini-powered project analysis.
  // TODO: Connect Google Cloud Agent Builder orchestration for multi-step reasoning.
  // TODO: Pull live GitLab project context through GitLab MCP integration.
  return {
    blockers: hasBlockerSignal
      ? ['A dependency or handoff appears to be blocking progress.']
      : ['No explicit blocker found in the pasted notes.'],
    risks: [
      hasCiFailure
        ? 'CI or test failures may delay merge readiness.'
        : 'CI health is unknown from the provided text.',
      hasReviewSignal
        ? 'Merge requests may need reviewer attention.'
        : 'Review status is unclear and should be confirmed.',
    ],
    nextActions: [
      hasCiFailure ? 'Identify the failing job and assign an owner.' : 'Add current CI status to the project notes.',
      hasReviewSignal ? 'Ask reviewers to confirm approval or requested changes.' : 'List active merge requests before the next check-in.',
      'Capture one concrete owner for each open blocker.',
    ],
    standupSummary:
      input.trim().length > 0
        ? 'Project activity was reviewed. Focus today should be clearing blockers, confirming CI status, and moving merge requests toward review or merge.'
        : 'No project context has been provided yet. Paste GitLab notes to generate a demo summary.',
  };
}

function App() {
  const [projectText, setProjectText] = useState('');
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const analysis = useMemo(() => analyzeProject(projectText), [projectText]);

  return (
    <main className="shell">
      <section className="hero" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Google Cloud Rapid Agent Hackathon MVP</p>
          <h1 id="page-title">DevFlow Agent</h1>
          <p className="lede">
            Summarize GitLab project activity into blockers, risks, next actions, and a daily standup brief.
          </p>
        </div>
      </section>

      <section className="workspace" aria-label="Project analysis workspace">
        <div className="input-panel">
          <label htmlFor="project-context">GitLab project context</label>
          <textarea
            id="project-context"
            value={projectText}
            onChange={(event) => setProjectText(event.target.value)}
            placeholder={starterText}
            rows={14}
          />
          <button type="button" onClick={() => setHasAnalyzed(true)}>
            Analyze Project
          </button>
        </div>

        <div className="output-panel" aria-live="polite">
          <h2>Mock Analysis</h2>
          {hasAnalyzed ? (
            <div className="analysis-grid">
              <AnalysisList title="Blockers" items={analysis.blockers} />
              <AnalysisList title="Risks" items={analysis.risks} />
              <AnalysisList title="Recommended Next Actions" items={analysis.nextActions} />
              <section className="summary">
                <h3>Daily Standup Summary</h3>
                <p>{analysis.standupSummary}</p>
              </section>
            </div>
          ) : (
            <p className="empty-state">Paste GitLab notes and run the mock analyzer to see a demo output.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function AnalysisList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="summary">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default App;
