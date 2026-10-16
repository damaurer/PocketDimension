import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && node server.js',
		port: 4173,
		env: {
			PORT: '4173',
			NODE_ENV: 'production',
			SECRET_JWT_KEY: 'playwright-secret-that-is-long-enough-for-tests',
			DB_PATH: 'test-results/db/pocketdimension.db',
			DB_ADMIN_USER: 'admin',
			DB_ADMIN_EMAIL: 'admin@example.com',
			DB_ADMIN_PASSWORD: 'playwright-password'
		}
	},
	use: {
		baseURL: 'http://localhost:4173',
		launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined }
	},
	testDir: 'tests',
	testMatch: /(.+\.)?(test|spec)\.[jt]s/
});
