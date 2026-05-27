import { useState } from 'react';
import { analyzeProjectMock, type Analysis } from './analysis';

const starterText = `Paste GitLab activity here, for example:
- Open issues and blockers
- Merge request notes
- CI failure logs
- Release or sprint status`;

type AnalysisSource = 'gemini' | 'mock';

type AnalyzeResponse = {
  analysis?: Analysis;
  source?: AnalysisSource;
  error?: string;
};

function App() {
  const [projectText, setProjectText] = useState('');
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis>(() => analyzeProjectMock(''));
  const [analysisSource, setAnalysisSource] = useState<AnalysisSource>('mock');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
          <label htmlFor="project-context">GitLab project context</label>
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
            <h2>{analysisSource === 'gemini' ? 'Gemini Analysis' : 'Mock Analysis'}</h2>
            {hasAnalyzed ? <span className={`source-pill source-${analysisSource}`}>{analysisSource}</span> : null}
          </div>
          {isLoading ? <p className="status-message">Analyzing pasted project context...</p> : null}
          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
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
