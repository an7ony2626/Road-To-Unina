import { test, expect } from '@playwright/test';

test('un utente non autenticato che apre /game/:id viene reindirizzato al login', async ({ page }) => {
  await page.goto('/game/1');

  await expect(page).toHaveURL('/login');
});