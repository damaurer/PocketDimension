import sqlite3 from 'sqlite3';
import * as fs from 'fs';

const isDev = process.env.NODE_ENV === 'development';
const sqliteDb = isDev ? sqlite3.verbose() : sqlite3;
const SCHEMA = fs.readFileSync('src/lib/server/database/migration/initial.sql', 'utf8');

let client;

export const connectDatabaseClient = () => {
	if (client) {
		return client;
	}
	client = new sqliteDb.Database('shared/PocketDimension/PocketDimension.db', (err) => {
		if (err) {
			console.error(err.message);
			return
		}
		console.log('Connected to the database.');
	});

	if (isDev) {
		// client.on('trace', (sql: string) => console.log(sql));
		client.on('error', (err: string) => console.error(err));
	}

	client.exec(SCHEMA);

	return client
};

