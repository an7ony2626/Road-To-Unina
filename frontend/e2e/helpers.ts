import { Page, expect } from '@playwright/test';

export interface TestUser {
  username: string;
  email: string;
  password: string;
}

// Each test gets its own throwaway account so tests never collide on
// "you already have a game in progress" or on leaderboard/completed-games
// state left over from a previous run.
export function createTestUser(): TestUser {
  const unique = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
  return {
    username: `e2e${unique}`,
    email: `e2e${unique}@example.com`,
    password: 'password123',
  };
}

export async function registerUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/register');
  await page.getByLabel('Username').fill(user.username);
  await page.getByLabel('Email').fill(user.email);
  await page.getByRole('textbox', { name: 'Password' }).fill(user.password);
  await page.getByRole('button', { name: 'Registrati' }).click();
  await expect(page).toHaveURL('/');
}

export async function loginUser(page: Page, user: Pick<TestUser, 'username' | 'password'>): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Username').fill(user.username);
  await page.getByRole('textbox', { name: 'Password' }).fill(user.password);
  await page.getByRole('button', { name: 'Accedi' }).click();
  await expect(page).toHaveURL('/');
}

// Registers a fresh user and leaves the page on the home screen,
// authenticated. This is the starting point for most gameplay specs.
export async function registerAndLandOnHome(page: Page): Promise<TestUser> {
  const user = createTestUser();
  await registerUser(page, user);
  await expect(page.getByText(user.username)).toBeVisible();
  return user;
}

// Starts a fully-random challenge (both sides via the 🎲 button) from the
// home screen and waits for the game page to finish loading the article.
export async function startRandomGame(page: Page): Promise<void> {
  const pickers = page.locator('app-page-search');
  await pickers.nth(0).getByRole('button', { name: /Random/ }).click();
  await pickers.nth(1).getByRole('button', { name: /Random/ }).click();
  await page.getByRole('button', { name: 'Inizia una nuova sfida' }).click();
  await expect(page).toHaveURL(/\/game\/\d+/);
  await expect(page.getByText('Caricamento pagina…')).toHaveCount(0);
}

// Searches a Wikipedia page inside one of the two page-search widgets
// (identified by their visible label) and selects the exact-match result.
async function pickPage(page: Page, label: 'Pagina di partenza' | 'Pagina di arrivo', title: string): Promise<void> {
  const picker = page.locator('app-page-search').filter({ hasText: label });
  await picker.getByPlaceholder('Cerca una pagina Wikipedia…').fill(title);
  const exactResult = picker.locator('.result-title').filter({ hasText: new RegExp(`^${title}$`) });
  await exactResult.first().click();
}

// Starts a custom challenge between two named, real Wikipedia pages.
export async function startCustomGame(page: Page, startTitle: string, targetTitle: string): Promise<void> {
  await pickPage(page, 'Pagina di partenza', startTitle);
  await pickPage(page, 'Pagina di arrivo', targetTitle);
  await page.getByRole('button', { name: 'Inizia una nuova sfida' }).click();
  await expect(page).toHaveURL(/\/game\/\d+/);
  await expect(page.getByText('Caricamento pagina…')).toHaveCount(0);
}