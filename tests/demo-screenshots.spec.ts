import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test('captures DevFlow Agent demo screenshots', async ({ page }) => {
  mkdirSync('screenshots', { recursive: true });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'DevFlow Agent' })).toBeVisible();

  await page.screenshot({ path: 'screenshots/landing-demo.png', fullPage: true });

  await page.getByRole('button', { name: 'Load sample GitLab data' }).click();
  await expect(page.getByLabel('GitLab project context')).toHaveValue(/Project: DevFlow Agent MVP/);

  await page.getByRole('button', { name: 'Analyze Project' }).click();
  await expect(page.getByRole('heading', { name: 'Daily Standup Summary' })).toBeVisible({ timeout: 15_000 });

  await page.screenshot({ path: 'screenshots/analysis-result.png', fullPage: true });
});
