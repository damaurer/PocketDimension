import { expect, test } from '@playwright/test';

test('protected pages redirect to the login page', async ({ page }) => {
	await page.goto('/account');
	await expect(page).toHaveURL('/');
	await expect(page.locator('#email_or_name_input')).toBeVisible();
});

test('wrong credentials show an error', async ({ page }) => {
	await page.goto('/');
	await page.fill('#email_or_name_input', 'admin');
	await page.fill('#password_input', 'not-the-password');
	await page.getByRole('button', { name: /login/i }).click();
	await expect(page.locator('.error')).toContainText('not correct');
});

test('admin can log in and log out', async ({ page }) => {
	await page.goto('/');
	await page.fill('#email_or_name_input', 'admin');
	await page.fill('#password_input', 'playwright-password');
	await page.getByRole('button', { name: /login/i }).click();
	await expect(page).toHaveURL('/servers');

	await page.goto('/account');
	await page.getByRole('button', { name: /logout/i }).click();
	await expect(page).toHaveURL('/');

	await page.goto('/account');
	await expect(page).toHaveURL('/');
});

test('game catalog lists the built-in games', async ({ page }) => {
	await page.goto('/');
	await page.fill('#email_or_name_input', 'admin');
	await page.fill('#password_input', 'playwright-password');
	await page.getByRole('button', { name: /login/i }).click();
	await expect(page).toHaveURL('/servers');

	await page.goto('/games');
	await expect(page.getByRole('heading', { name: 'Minecraft: Java Edition' })).toBeVisible();
	await page
		.getByRole('link', { name: /create server/i })
		.first()
		.click();
	await expect(page.locator('#server_name')).toBeVisible();
});

test('admin pulls new games from the online catalog, disabled', async ({ page }) => {
	await page.goto('/');
	await page.fill('#email_or_name_input', 'admin');
	await page.fill('#password_input', 'playwright-password');
	await page.getByRole('button', { name: /login/i }).click();
	await expect(page).toHaveURL('/servers');

	await page.goto('/games');
	await page.getByRole('button', { name: /update catalog/i }).click();
	const card = page.locator('article', {
		has: page.getByRole('heading', { name: 'Community Test Game' })
	});
	await expect(card).toBeVisible();
	await expect(card.getByText('Disabled')).toBeVisible();
	await expect(card.getByRole('link', { name: /create server/i })).toHaveCount(0);
	await expect(page.getByText(/Catalog checked/)).toBeVisible();
});
