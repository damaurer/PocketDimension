import sqlite3 from 'sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '#lib/server/config.ts';

type Params = Record<string, string | number | null> | (string | number | null)[];

/**
 * Small promise wrapper around sqlite3. All queries go through bound
 * parameters; never build SQL from user input.
 */
export class Database {
	constructor(private db: sqlite3.Database) {}

	get<T>(sql: string, params: Params = []): Promise<T | undefined> {
		return new Promise((resolve, reject) => {
			this.db.get(sql, params, (err: Error | null, row: T | undefined) =>
				err ? reject(err) : resolve(row)
			);
		});
	}

	all<T>(sql: string, params: Params = []): Promise<T[]> {
		return new Promise((resolve, reject) => {
			this.db.all(sql, params, (err: Error | null, rows: T[]) =>
				err ? reject(err) : resolve(rows)
			);
		});
	}

	run(sql: string, params: Params = []): Promise<{ lastID: number; changes: number }> {
		return new Promise((resolve, reject) => {
			this.db.run(sql, params, function (this: sqlite3.RunResult, err: Error | null) {
				if (err) reject(err);
				else resolve({ lastID: this.lastID, changes: this.changes });
			});
		});
	}

	exec(sql: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.db.exec(sql, (err: Error | null) => (err ? reject(err) : resolve()));
		});
	}

	async transaction<T>(work: () => Promise<T>): Promise<T> {
		await this.exec('BEGIN IMMEDIATE');
		try {
			const result = await work();
			await this.exec('COMMIT');
			return result;
		} catch (e) {
			await this.exec('ROLLBACK');
			throw e;
		}
	}
}

async function migrate(database: Database) {
	await database.exec(readFileSync(config.schemaPath, 'utf8'));

	const columns = await database.all<{ name: string }>('PRAGMA table_info("User")');
	if (!columns.some((c) => c.name === 'sessionVersion')) {
		await database.exec(
			'ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0'
		);
	}
}

let connection: Promise<Database> | undefined;

export function connectDatabaseClient(): Promise<Database> {
	connection ??= (async () => {
		mkdirSync(dirname(config.databasePath), { recursive: true });
		const raw = new sqlite3.Database(config.databasePath);
		const database = new Database(raw);
		await database.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
		await migrate(database);
		return database;
	})();

	connection.catch(() => (connection = undefined));
	return connection;
}
