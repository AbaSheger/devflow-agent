import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const isLocalScreenshot = process.env.LOCAL_SCREENSHOT === 'true';

test('captures DevFlow Agent demo screenshots', async ({ page }) => {
  mkdirSync('screenshots', { recursive: true });

  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'DevFlow Agent' })).toBeVisible();

  await page.screenshot({ path: 'screenshots/01-landing.png', fullPage: true });

  await page.getByRole('button', { name: 'Load sample GitLab data' }).click();
  await expect(page.getByLabel('GitLab project context')).toHaveValue(/Project: DevFlow Agent MVP/);
  await page.screenshot({ path: 'screenshots/02-sample-data-loaded.png', fullPage: true });

  await page.getByRole('button', { name: 'Analyze Project' }).click();
  const expectedAnalysisHeading = isLocalScreenshot ? /^(Gemini|Mock) Analysis$/ : 'Gemini Analysis';
  const analysisHeading = page.getByRole('heading', { name: expectedAnalysisHeading });
  await expect(analysisHeading).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole('heading', { name: 'Daily Standup Summary' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Action Pack' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'GitLab MR comment draft' })).toBeVisible();
  console.log(`Screenshot analysis source: ${await analysisHeading.textContent()}`);
  await page.screenshot({ path: 'screenshots/03-analysis-result.png', fullPage: true });

  if (!isLocalScreenshot) {
    await page.getByLabel('GitLab project URL or ID').fill('https://gitlab.com/gitlab-org/gitlab-runner');
    await page.getByRole('button', { name: 'Import public GitLab context' }).click();
    await expect(page.getByText('Public GitLab API import loaded into the project context field.')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByLabel('GitLab project context')).toHaveValue(/gitlab-org\/gitlab-runner/i);
    await page.screenshot({ path: 'screenshots/04-public-gitlab-import.png', fullPage: true });
  }
});
