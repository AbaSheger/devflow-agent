export type Analysis = {
  blockers: string[];
  risks: string[];
  nextActions: string[];
  standupSummary: string;
};

export type ActionPack = {
  standupMessage: string;
  mergeRequestComment: string;
  issueTriageChecklist: string;
  ciFailureActionPlan: string;
};

export function createActionPack(analysis: Analysis): ActionPack {
  const checklistItems = [...analysis.blockers, ...analysis.risks, ...analysis.nextActions];

  return {
    standupMessage: analysis.standupSummary,
    mergeRequestComment: [
      '## Project update',
      '',
      `**Current blockers**\n${analysis.blockers.map((item) => `- ${item}`).join('\n')}`,
      '',
      `**Risks**\n${analysis.risks.map((item) => `- ${item}`).join('\n')}`,
      '',
      `**Recommended next actions**\n${analysis.nextActions.map((item) => `- ${item}`).join('\n')}`,
    ].join('\n'),
    issueTriageChecklist: checklistItems.map((item) => `- [ ] ${item}`).join('\n'),
    ciFailureActionPlan: analysis.nextActions.map((item, index) => `${index + 1}. ${item}`).join('\n'),
  };
}

export function analyzeProjectMock(input: string): Analysis {
  const normalizedInput = input.toLowerCase();
  const hasCiFailure = /ci|pipeline|test|failed|failure|build/.test(normalizedInput);
  const hasReviewSignal = /merge request|mr|review|approval/.test(normalizedInput);
  const hasBlockerSignal = /blocker|blocked|waiting|dependency|cannot/.test(normalizedInput);

  // Mock/demo fallback logic. Keep this available when Gemini is unavailable.
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
