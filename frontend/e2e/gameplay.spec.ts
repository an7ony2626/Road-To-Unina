import { test, expect } from '@playwright/test';
import { registerAndLandOnHome, startCustomGame, startRandomGame } from './helpers';

test.beforeEach(async ({ page }) => {
  await registerAndLandOnHome(page);
});

// "Napoli" links to "Italia" from its very first paragraph (infobox
// "Stato"), so this pair gives a deterministic one-click win without
// relying on a mocked article — the app has no mocking layer by design.
test('completare una sfida seguendo un link valido mostra la schermata di traguardo raggiunto', async ({ page }) => {
  await startCustomGame(page, 'Napoli', 'Italia');

  await page
    .locator('app-wiki-article a')
    .filter({ hasText: /^Italia$/ })
    .first()
    .click();

  await expect(page.getByRole('heading', { name: 'Traguardo raggiunto' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Torna alla home' })).toBeVisible();
});

test('abbandonare una partita in corso riporta alla home', async ({ page }) => {
  await startRandomGame(page);

  await page.getByRole('button', { name: 'Arrenditi' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Pronto per una sfida?' })).toBeVisible();
});