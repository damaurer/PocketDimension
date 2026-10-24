import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DESCRIPTIONS, LABELS } from './catalog';

const games = readdirSync('catalog/games')
	.filter((file) => file.endsWith('.json'))
	.map((file) => JSON.parse(readFileSync(`catalog/games/${file}`, 'utf8')));

describe('game texts', () => {
	for (const language of Object.keys(DESCRIPTIONS) as (keyof typeof DESCRIPTIONS)[]) {
		it(`cover every catalog game in ${language}`, () => {
			for (const game of games) {
				expect(DESCRIPTIONS[language][game.slug], game.slug).toBeTruthy();
				for (const variable of game.env) {
					expect(LABELS[language][variable.label], variable.label).toBeTruthy();
				}
				for (const port of game.ports) {
					if (port.label) expect(LABELS[language][port.label], port.label).toBeTruthy();
				}
			}
		});
	}
});
