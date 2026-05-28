const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const MAX_GEMINI_CONTEXT_CHARS = 12000;
const MAX_GEMINI_OUTPUT_TOKENS = 512;
const GEMINI_QUOTA_FALLBACK_MESSAGE = 'Gemini quota/rate limit reached, showing local fallback analysis.';

function buildFallbackAnalysis(input) {
  const normalizedInput = input.toLowerCase();
  const hasCiFailure = /ci|pipeline|test|failed|failure|build/.test(normalizedInput);
  const hasReviewSignal = /merge request|mr|review|approval/.test(normalizedInput);
  const hasBlockerSignal = /blocker|blocked|waiting|dependency|cannot/.test(normalizedInput);

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

function fallbackResponse(res, input, message, statusCode = 200) {
  return res.status(statusCode).json({
    analysis: buildFallbackAnalysis(input),
    source: 'mock',
    error: message,
  });
}

function normalizeAnalysis(value) {
  return {
    blockers: Array.isArray(value?.blockers) ? value.blockers.map(String) : [],
    risks: Array.isArray(value?.risks) ? value.risks.map(String) : [],
    nextActions: Array.isArray(value?.nextActions) ? value.nextActions.map(String) : [],
    standupSummary: typeof value?.standupSummary === 'string' ? value.standupSummary : '',
  };
}

function stripMarkdownCodeFence(text) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function extractFirstJsonObject(text) {
  const start = text.indexOf('{');

  if (start === -1) {
    return text;
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = start; index < text.length; index += 1) {
    const character = text[index];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (character === '\\') {
      isEscaped = true;
      continue;
    }

    if (character === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;

      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return text.slice(start);
}

function parseGeminiAnalysis(text) {
  const jsonText = extractFirstJsonObject(stripMarkdownCodeFence(text));
  const parsed = JSON.parse(jsonText);

  if (
    !Array.isArray(parsed?.blockers) ||
    !Array.isArray(parsed?.risks) ||
    !Array.isArray(parsed?.nextActions) ||
    typeof parsed?.standupSummary !== 'string'
  ) {
    throw new Error('Gemini response JSON did not match the expected analysis shape.');
  }

  return normalizeAnalysis(parsed);
}

function hasUsableAnalysis(analysis) {
  return (
    analysis.blockers.length > 0 ||
    analysis.risks.length > 0 ||
    analysis.nextActions.length > 0 ||
    analysis.standupSummary.trim().length > 0
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const context = typeof req.body?.context === 'string' ? req.body.context : '';

  if (!context.trim()) {
    return fallbackResponse(res, context, 'No project context was provided.');
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return fallbackResponse(res, context, 'GEMINI_API_KEY is not configured. Returned mock analysis instead.');
  }

  const trimmedContext =
    context.length > MAX_GEMINI_CONTEXT_CHARS
      ? `${context.slice(0, MAX_GEMINI_CONTEXT_CHARS)}\n\n[Context trimmed before Gemini analysis for demo reliability.]`
      : context;

  const prompt = [
    'Analyze the pasted GitLab project context for a developer standup.',
    'Return only valid JSON. Do not include markdown code fences, comments, explanations, or extra text.',
    'Use this exact JSON shape:',
    '{"blockers": string[], "risks": string[], "nextActions": string[], "standupSummary": string}',
    'Use at most 3 concise strings in each array.',
    'Keep standupSummary to one concise sentence.',
    'Keep items concise, practical, and grounded only in the provided context.',
    'Do not claim live GitLab access.',
    '',
    'Project context:',
    trimmedContext,
  ].join('\n');

  try {
    // TODO: Connect Google Cloud Agent Builder here when orchestration is added.
    // TODO: Replace pasted context with live GitLab MCP project context when that integration is added.
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: MAX_GEMINI_OUTPUT_TOKENS,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              blockers: { type: 'ARRAY', items: { type: 'STRING' } },
              risks: { type: 'ARRAY', items: { type: 'STRING' } },
              nextActions: { type: 'ARRAY', items: { type: 'STRING' } },
              standupSummary: { type: 'STRING' },
            },
            required: ['blockers', 'risks', 'nextActions', 'standupSummary'],
            propertyOrdering: ['blockers', 'risks', 'nextActions', 'standupSummary'],
          },
        },
      }),
    });

    if (!geminiResponse.ok) {
      if (geminiResponse.status === 429) {
        return fallbackResponse(res, context, GEMINI_QUOTA_FALLBACK_MESSAGE);
      }

      return fallbackResponse(res, context, `Gemini request failed with status ${geminiResponse.status}. Returned mock analysis instead.`);
    }

    const data = await geminiResponse.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim() ?? '';
    const analysis = parseGeminiAnalysis(text);

    if (!hasUsableAnalysis(analysis)) {
      return fallbackResponse(res, context, 'Gemini returned an empty analysis. Returned mock analysis instead.');
    }

    return res.status(200).json({ analysis, source: 'gemini' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Gemini error.';
    return fallbackResponse(res, context, `Gemini analysis failed: ${message}. Returned mock analysis instead.`);
  }
}
