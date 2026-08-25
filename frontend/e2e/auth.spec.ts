import { test, expect } from '@playwright/test';
import { createTestUser, registerUser, loginUser, registerAndLandOnHome } from './helpers';

test('un nuovo utente può registrarsi ed effettua automaticamente l\'accesso', async ({ page }) => {
  const user = createTestUser();

  await registerUser(page, user);

  await expect(page).toHaveURL('/');
  await expect(page.getByText(user.username)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Accedi' })).toHaveCount(0);
});

test('il login con credenziali errate mostra un messaggio di errore', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('utente-che-non-esiste');
  await page.getByRole('textbox', { name: 'Password' }).fill('passwordSbagliata123');
  await page.getByRole('button', { name: 'Accedi' }).click();

  await expect(page.getByText('Username o password non corretti.')).toBeVisible();
  await expect(page).toHaveURL('/login');
});

test('il logout riporta l\'utente allo stato non autenticato', async ({ page }) => {
  const user = await registerAndLandOnHome(page);

  await page.getByRole('button', { name: 'Esci' }).click();

  // logout() in HomeComponent navigates straight to /login, it doesn't
  // just clear state and stay on home.
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('button', { name: 'Accedi' })).toBeVisible();

  // Login again with the same credentials to confirm the account was
  // actually persisted server-side, not just held in local state.
  await loginUser(page, user);
  await expect(page.getByText(user.username)).toBeVisible();
});