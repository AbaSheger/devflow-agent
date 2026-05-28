const GITLAB_API_BASE_URL = 'https://gitlab.com/api/v4';
const MAX_ITEMS = 5;

function parseProjectPath(projectUrlOrPath) {
  const value = String(projectUrlOrPath ?? '').trim();

  if (!value) {
    throw new Error('Enter a public GitLab project URL or namespace/project path.');
  }

  let path = value;

  try {
    const parsedUrl = new URL(value);

    if (parsedUrl.hostname !== 'gitlab.com') {
      throw new Error('Only public gitlab.com project URLs are supported in this demo.');
    }

    path = parsedUrl.pathname;
  } catch (error) {
    if (error instanceof TypeError) {
      path = value;
    } else {
      throw error;
    }
  }

  const cleanedPath = path
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .split('/-/')[0]
    .replace(/\.git$/i, '');

  if (!cleanedPath || cleanedPath.split('/').filter(Boolean).length < 2) {
    throw new Error('Use a GitLab project path like group/project or a public gitlab.com project URL.');
  }

  return cleanedPath;
}

async function fetchGitLabJson(path) {
  const response = await fetch(`${GITLAB_API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'DevFlow-Agent-Hackathon-Demo',
    },
  });

  if (!response.ok) {
    const error = new Error(`GitLab API request failed with status ${response.status}.`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function fetchOptionalGitLabJson(path) {
  try {
    return await fetchGitLabJson(path);
  } catch {
    return [];
  }
}

function listNames(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return 'none listed';
  }

  return values.map((value) => value?.name || value?.username || String(value)).filter(Boolean).join(', ') || 'none listed';
}

function formatProject(project) {
  return [
    `Project: ${project.name_with_namespace ?? project.path_with_namespace}`,
    `GitLab path: ${project.path_with_namespace}`,
    project.description ? `Description: ${project.description}` : 'Description: none provided',
    `Default branch: ${project.default_branch ?? 'unknown'}`,
    `Visibility: ${project.visibility ?? 'unknown'}`,
    `Open issues count: ${project.open_issues_count ?? 'unknown'}`,
    `Last activity: ${project.last_activity_at ?? 'unknown'}`,
  ].join('\n');
}

function formatIssues(issues) {
  if (!issues.length) {
    return 'Issues:\n- No public open issues returned by the GitLab API.';
  }

  return [
    'Issues:',
    ...issues.map((issue) =>
      [
        `- #${issue.iid} ${issue.title}`,
        `  State: ${issue.state ?? 'unknown'}`,
        `  Labels: ${Array.isArray(issue.labels) && issue.labels.length ? issue.labels.join(', ') : 'none'}`,
        `  Assignees: ${listNames(issue.assignees)}`,
        `  Updated: ${issue.updated_at ?? 'unknown'}`,
      ].join('\n'),
    ),
  ].join('\n');
}

function formatMergeRequests(mergeRequests) {
  if (!mergeRequests.length) {
    return 'Merge requests:\n- No public merge requests returned by the GitLab API.';
  }

  return [
    'Merge requests:',
    ...mergeRequests.map((mergeRequest) =>
      [
        `- !${mergeRequest.iid} ${mergeRequest.title}`,
        `  State: ${mergeRequest.state ?? 'unknown'}`,
        `  Author: ${mergeRequest.author?.name ?? mergeRequest.author?.username ?? 'unknown'}`,
        `  Reviewers: ${listNames(mergeRequest.reviewers)}`,
        `  Draft: ${mergeRequest.draft ? 'yes' : 'no'}`,
        `  Updated: ${mergeRequest.updated_at ?? 'unknown'}`,
      ].join('\n'),
    ),
  ].join('\n');
}

function formatPipelines(pipelines) {
  if (!pipelines.length) {
    return 'CI pipelines:\n- No public pipelines returned by the GitLab API.';
  }

  return [
    'CI pipelines:',
    ...pipelines.map((pipeline) =>
      [
        `- Pipeline #${pipeline.id}`,
        `  Status: ${pipeline.status ?? 'unknown'}`,
        `  Ref: ${pipeline.ref ?? 'unknown'}`,
        `  Source: ${pipeline.source ?? 'unknown'}`,
        `  Updated: ${pipeline.updated_at ?? pipeline.created_at ?? 'unknown'}`,
      ].join('\n'),
    ),
  ].join('\n');
}

function buildContext(project, issues, mergeRequests, pipelines) {
  return [
    'Public GitLab API import',
    'Source: gitlab.com public API, no authentication used.',
    '',
    formatProject(project),
    '',
    formatIssues(issues),
    '',
    formatMergeRequests(mergeRequests),
    '',
    formatPipelines(pipelines),
  ].join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const projectPath = parseProjectPath(req.body?.projectUrlOrPath);
    const encodedProjectPath = encodeURIComponent(projectPath);

    const project = await fetchGitLabJson(`/projects/${encodedProjectPath}`);
    const [issues, mergeRequests, pipelines] = await Promise.all([
      fetchOptionalGitLabJson(`/projects/${encodedProjectPath}/issues?state=opened&order_by=updated_at&sort=desc&per_page=${MAX_ITEMS}`),
      fetchOptionalGitLabJson(`/projects/${encodedProjectPath}/merge_requests?state=opened&order_by=updated_at&sort=desc&per_page=${MAX_ITEMS}`),
      fetchOptionalGitLabJson(`/projects/${encodedProjectPath}/pipelines?order_by=updated_at&sort=desc&per_page=${MAX_ITEMS}`),
    ]);

    return res.status(200).json({
      context: buildContext(project, issues, mergeRequests, pipelines),
      projectPath,
    });
  } catch (error) {
    const status = error?.status === 404 ? 404 : 400;
    const message =
      error?.status === 404
        ? 'Public GitLab project not found or not accessible without authentication. You can still load sample data or paste exported GitLab context.'
        : error?.status
          ? `GitLab API request failed with status ${error.status}. You can still load sample data or paste exported GitLab context.`
        : error instanceof Error
          ? error.message
          : 'Unable to import public GitLab context. You can still load sample data or paste exported GitLab context.';

    return res.status(status).json({ error: message });
  }
}
