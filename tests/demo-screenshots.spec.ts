import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test('captures DevFlow Agent demo screenshots', async ({ page }) => {
  mkdirSync('screenshots', { recursive: true });

  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'DevFlow Agent' })).toBeVisible();

  await page.screenshot({ path: 'screenshots/01-landing.png', fullPage: true });

  await page.getByRole('button', { name: 'Load sample GitLab data' }).click();
  await expect(page.getByLabel('GitLab project context')).toHaveValue(/Project: DevFlow Agent MVP/);
  await page.screenshot({ path: 'screenshots/02-sample-data-loaded.png', fullPage: true });

  await page.getByRole('button', { name: 'Analyze Project' }).click();

  let analysisSource = 'Gemini';

  try {
    await expect(page.getByRole('heading', { name: 'Gemini Analysis' })).toBeVisible({ timeout: 45_000 });
  } catch {
    await expect(page.getByRole('heading', { name: 'Mock Analysis' })).toBeVisible({ timeout: 15_000 });
    analysisSource = 'Mock';
    console.warn('Warning: screenshot flow captured Mock Analysis instead of Gemini Analysis.');
  }

  await expect(page.getByRole('heading', { name: 'Daily Standup Summary' })).toBeVisible();
  console.log(`Screenshot analysis source: ${analysisSource}`);
  await page.screenshot({ path: 'screenshots/03-analysis-result.png', fullPage: true });
});
