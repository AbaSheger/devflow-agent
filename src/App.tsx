import { useMemo, useState } from 'react';
import { analyzeProjectMock, createActionPack, type Analysis } from './analysis';

const starterText = `Paste GitLab activity here, for example:
- Open issues and blockers
- Merge request notes
- CI failure logs
- Release or sprint status`;

const sampleGitLabContext = `Project: DevFlow Agent MVP
Sprint goal: Prepare a stable hackathon demo that summarizes GitLab project activity for judges.

Issues:
- #42 Blocker: Latest GitLab issue export is missing two release-blocking bugs from the mobile team.
- #45 CI reliability: Playwright smoke test is flaky on the dashboard route after the loading state change.
- #48 UX: Judges need a one-click sample data path before trying their own pasted project context.
- #51 Docs: README needs clearer demo setup notes and fallback behavior language.

Merge requests:
- !17 Add Gemini-backed analysis endpoint
  Status: merged
  Reviewer: Maya Chen
  Notes: Keep API key server-side only. Fallback copy approved for quota/rate-limit cases.
- !19 Improve analysis cards and source label
  Status: open
  Reviewer: Jordan Lee
  Blocking comments: missing empty-state coverage and mobile spacing screenshot.
- !21 Trim oversized pasted context before API call
  Status: ready for review
  Reviewer: Priya Nair
  Notes: Needs one more manual test with long CI logs.

CI pipeline:
- main pipeline #184: passed
- merge request !19 pipeline #188: failed
- Failed job: npm run build
- Failure detail: src/App.tsx rendered duplicate keys in analysis list during test fixture run.

Reviewers:
- Maya Chen approved Gemini API fallback behavior.
- Jordan Lee requested missing tests for sample data loading.
- Priya Nair is reviewing input trimming and JSON parse handling.

Missing tests:
- No test currently verifies that the sample GitLab context populates the textarea.
- No regression test for malformed Gemini JSON fallback messaging.
- No mobile screenshot attached for the updated input panel.

Blockers:
- Vercel environment variable is configured in production but not preview.
- Authenticated/private GitLab project import remains blocked while MCP tool startup is unresolved.
- Pipeline failure on !19 prevents merging the latest UI polish.`;

type AnalysisSource = 'gemini' | 'mock';

type AnalyzeResponse = {
  analysis?: Analysis;
  source?: AnalysisSource;
  error?: string;
};

type GitLabContextResponse = {
  context?: string;
  error?: string;
};

function App() {
  const [projectText, setProjectText] = useState('');
  const [gitlabProject, setGitlabProject] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis>(() => analyzeProjectMock(''));
  const [analysisSource, setAnalysisSource] = useState<AnalysisSource>('mock');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedAction, setCopiedAction] = useState('');
  const actionPack = useMemo(() => createActionPack(analysis), [analysis]);

  async function handleCopy(label: string, content: string) {
    await navigator.clipboard.writeText(content);
    setCopiedAction(label);
    window.setTimeout(() => setCopiedAction(''), 1800);
  }

  async function handleImportGitLabContext() {
    setIsImporting(true);
    setImportMessage('');

    try {
      const response = await fetch('/api/gitlab-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectUrlOrPath: gitlabProject }),
      });
      const data = (await response.json()) as GitLabContextResponse;

      if (!response.ok || !data.context) {
        throw new Error(data.error ?? `Public GitLab API import failed with status ${response.status}.`);
      }

      setProjectText(data.context);
      setImportMessage('Public GitLab API import loaded into the project context field.');
    } catch (error) {
      setImportMessage(
        error instanceof Error
          ? error.message
          : 'Unable to import public GitLab context. You can still load sample data or paste exported GitLab context.',
      );
    } finally {
      setIsImporting(false);
    }
  }

  async function handleAnalyze() {
    setHasAnalyzed(true);
    setIsLoading(true);
    setErrorMessage('');

    const fallbackAnalysis = analyzeProjectMock(projectText);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: projectText }),
      });

      if (!response.ok) {
        throw new Error(`Analysis request failed with status ${response.status}.`);
      }

      const data = (await response.json()) as AnalyzeResponse;

      setAnalysis(data.analysis ?? fallbackAnalysis);
      setAnalysisSource(data.source ?? 'mock');
      setErrorMessage(data.error ?? '');
    } catch (error) {
      setAnalysis(fallbackAnalysis);
      setAnalysisSource('mock');
      setErrorMessage(error instanceof Error ? `${error.message} Showing mock analysis instead.` : 'Analysis failed. Showing mock analysis instead.');
    } finally {
      setIsLoading(false);
    }
  }

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
          <section className="integration-section" aria-labelledby="gitlab-integration-title">
            <div>
              <h2 id="gitlab-integration-title">GitLab Integration</h2>
              <p>
                For this demo, you can import public GitLab project context, load sample data, or paste exported
                GitLab issue/MR/CI context. The deployed web app does not directly use GitLab MCP.
              </p>
            </div>
            <div className="integration-card" aria-label="Integration status">
              <div>
                <span>Sample GitLab data</span>
                <strong className="status-badge status-ready">Available</strong>
              </div>
              <div>
                <span>Public GitLab API import</span>
                <strong className="status-badge status-ready">Available for public projects</strong>
              </div>
              <div>
                <span>Gemini analysis</span>
                <strong className="status-badge status-ready">Connected via Gemini 3.1 Flash Lite</strong>
              </div>
              <div>
                <span>GitLab MCP</span>
                <strong className="status-badge status-planned">OAuth configured, tool startup blocked</strong>
              </div>
            </div>
            <label htmlFor="gitlab-project">GitLab project URL or ID</label>
            <input
              id="gitlab-project"
              type="text"
              value={gitlabProject}
              onChange={(event) => setGitlabProject(event.target.value)}
              placeholder="group/project or https://gitlab.com/group/project"
            />
            <div className="input-actions">
              <button type="button" className="secondary-button" onClick={handleImportGitLabContext} disabled={isImporting}>
                {isImporting ? 'Importing...' : 'Import public GitLab context'}
              </button>
            </div>
            {importMessage ? <p className="import-message">{importMessage}</p> : null}
          </section>

          <label htmlFor="project-context">GitLab project context</label>
          <p className="input-helper">Use sample data or paste your own GitLab project context.</p>
          <div className="input-actions">
            <button type="button" className="secondary-button" onClick={() => setProjectText(sampleGitLabContext)}>
              Load sample GitLab data
            </button>
          </div>
          <textarea
            id="project-context"
            value={projectText}
            onChange={(event) => setProjectText(event.target.value)}
            placeholder={starterText}
            rows={14}
          />
          <button type="button" onClick={handleAnalyze} disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Analyze Project'}
          </button>
        </div>

        <div className="output-panel" aria-live="polite">
          <div className="output-heading">
            <h2>{hasAnalyzed ? (analysisSource === 'gemini' ? 'Gemini Analysis' : 'Mock Analysis') : 'Analysis Preview'}</h2>
            {hasAnalyzed ? <span className={`source-pill source-${analysisSource}`}>{analysisSource}</span> : null}
          </div>
          {isLoading ? <p className="status-message">Analyzing pasted project context...</p> : null}
          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
          {hasAnalyzed ? (
            <>
              <div className="analysis-grid">
                <AnalysisList title="Blockers" items={analysis.blockers} />
                <AnalysisList title="Risks" items={analysis.risks} />
                <AnalysisList title="Recommended Next Actions" items={analysis.nextActions} />
                <section className="summary">
                  <h3>Daily Standup Summary</h3>
                  <p>{analysis.standupSummary}</p>
                </section>
              </div>

              <section className="action-pack" aria-labelledby="action-pack-title">
                <div className="action-pack-heading">
                  <div>
                    <h2 id="action-pack-title">Action Pack</h2>
                    <p>Copy-ready drafts generated in your browser from this analysis. Nothing is posted to GitLab.</p>
                  </div>
                </div>
                <div className="action-pack-grid">
                  <ActionCard
                    title="Daily standup message"
                    content={actionPack.standupMessage}
                    copiedAction={copiedAction}
                    onCopy={handleCopy}
                  />
                  <ActionCard
                    title="GitLab MR comment draft"
                    content={actionPack.mergeRequestComment}
                    copiedAction={copiedAction}
                    onCopy={handleCopy}
                  />
                  <ActionCard
                    title="Issue triage checklist"
                    content={actionPack.issueTriageChecklist}
                    copiedAction={copiedAction}
                    onCopy={handleCopy}
                  />
                  <ActionCard
                    title="CI failure action plan"
                    content={actionPack.ciFailureActionPlan}
                    copiedAction={copiedAction}
                    onCopy={handleCopy}
                  />
                </div>
              </section>
            </>
          ) : (
            <p className="empty-state">
              Load sample GitLab data, import a public GitLab project, or paste your own project context to run the
              analysis.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function ActionCard({
  title,
  content,
  copiedAction,
  onCopy,
}: {
  title: string;
  content: string;
  copiedAction: string;
  onCopy: (label: string, content: string) => Promise<void>;
}) {
  const wasCopied = copiedAction === title;

  return (
    <section className="action-card">
      <div className="action-card-heading">
        <h3>{title}</h3>
        <button type="button" className="copy-button" onClick={() => onCopy(title, content)}>
          {wasCopied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre>{content}</pre>
    </section>
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
