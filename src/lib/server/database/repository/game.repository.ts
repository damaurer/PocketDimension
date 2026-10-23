import type { Database } from '#lib/server/database/client.ts';
import type { CatalogEntry } from '#lib/server/games/catalogEntry.ts';
import type {
	GameTemplate,
	GameTemplateInput,
	ServerStatus,
	TemplateQuery
} from '#lib/games/types.ts';

interface TemplateRow {
	id: number;
	slug: string;
	name: string;
	description: string;
	image: string;
	ports: string;
	env: string;
	volumes: string;
	memoryMb: number | null;
	query: string | null;
	docsUrl: string | null;
	thumbnailUrl: string | null;
	builtin: number;
	catalogVersion: number | null;
	enabled: number;
}

export interface GameServerRecord {
	id: number;
	name: string;
	ownerId: number;
	ownerName: string | null;
	templateId: number;
	containerId: string | null;
	portOffset: number;
	env: Record<string, string>;
	status: ServerStatus;
	statusMessage: string | null;
	createdAt: string;
}

interface ServerRow extends Omit<GameServerRecord, 'env'> {
	env: string;
}

function toTemplate(row: TemplateRow): GameTemplate {
	return {
		id: row.id,
		slug: row.slug,
		name: row.name,
		description: row.description,
		image: row.image,
		ports: JSON.parse(row.ports),
		env: JSON.parse(row.env),
		volumes: JSON.parse(row.volumes),
		memoryMb: row.memoryMb,
		query: row.query ? (JSON.parse(row.query) as TemplateQuery) : null,
		docsUrl: row.docsUrl,
		thumbnailUrl: row.thumbnailUrl,
		builtin: row.builtin === 1,
		catalogVersion: row.catalogVersion,
		enabled: row.enabled === 1
	};
}

function toServer(row: ServerRow): GameServerRecord {
	return { ...row, env: JSON.parse(row.env) };
}

function templateParams(t: GameTemplateInput) {
	return [
		t.name,
		t.description,
		t.image,
		JSON.stringify(t.ports),
		JSON.stringify(t.env),
		JSON.stringify(t.volumes),
		t.memoryMb ?? null,
		t.query ? JSON.stringify(t.query) : null,
		t.docsUrl ?? null,
		t.thumbnailUrl ?? null
	];
}

export interface Thumbnail {
	contentType: string;
	data: Buffer;
}

export interface CatalogSyncCounts {
	added: string[];
	updated: string[];
	/** Slugs used by an own template of this instance. */
	skipped: string[];
}

const SELECT_SERVER = `
	SELECT GameServer.*, User.name AS ownerName
	FROM GameServer
	LEFT JOIN User ON User.id = GameServer.ownerId`;

export class GameRepository {
	constructor(private db: Database) {}

	async listTemplates(includeDisabled: boolean): Promise<GameTemplate[]> {
		const rows = await this.db.all<TemplateRow>(
			`SELECT * FROM GameTemplate ${includeDisabled ? '' : 'WHERE enabled = 1'} ORDER BY name COLLATE NOCASE`
		);
		return rows.map(toTemplate);
	}

	async findTemplateBySlug(slug: string): Promise<GameTemplate | undefined> {
		const row = await this.db.get<TemplateRow>('SELECT * FROM GameTemplate WHERE slug = ?', [slug]);
		return row && toTemplate(row);
	}

	async findTemplateById(id: number): Promise<GameTemplate | undefined> {
		const row = await this.db.get<TemplateRow>('SELECT * FROM GameTemplate WHERE id = ?', [id]);
		return row && toTemplate(row);
	}

	async createTemplate(template: GameTemplateInput, builtin = false): Promise<number> {
		const { lastID } = await this.db.run(
			`INSERT INTO GameTemplate (name, description, image, ports, env, volumes, memoryMb, query, docsUrl, thumbnailUrl, slug, builtin)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[...templateParams(template), template.slug, builtin ? 1 : 0]
		);
		return lastID;
	}

	async updateTemplate(id: number, template: GameTemplateInput): Promise<void> {
		await this.db.run(
			`UPDATE GameTemplate
			 SET name = ?, description = ?, image = ?, ports = ?, env = ?, volumes = ?, memoryMb = ?,
			     query = ?, docsUrl = ?, thumbnailUrl = ?, slug = ?, updatedAt = CURRENT_TIMESTAMP
			 WHERE id = ?`,
			[...templateParams(template), template.slug, id]
		);
	}

	async setTemplateEnabled(id: number, enabled: boolean): Promise<void> {
		await this.db.run('UPDATE GameTemplate SET enabled = ? WHERE id = ?', [enabled ? 1 : 0, id]);
	}

	async deleteTemplate(id: number): Promise<void> {
		await this.db.run('DELETE FROM GameTemplate WHERE id = ? AND builtin = 0', [id]);
	}

	/**
	 * Inserts new catalog games and updates the ones that came from the catalog
	 * when the entry is at least as new; keeps the enabled flag. Own templates
	 * with the same slug are left alone and reported as skipped.
	 */
	async syncCatalog(
		entries: CatalogEntry[],
		options: { enableNew: boolean }
	): Promise<CatalogSyncCounts> {
		const counts: CatalogSyncCounts = { added: [], updated: [], skipped: [] };
		for (const { version, ...template } of entries) {
			const existing = await this.findTemplateBySlug(template.slug);
			if (!existing) {
				const id = await this.createTemplate(template, true);
				await this.db.run('UPDATE GameTemplate SET catalogVersion = ?, enabled = ? WHERE id = ?', [
					version,
					options.enableNew ? 1 : 0,
					id
				]);
				counts.added.push(template.slug);
			} else if (!existing.builtin) {
				counts.skipped.push(template.slug);
			} else if (version >= (existing.catalogVersion ?? 0)) {
				await this.updateTemplate(existing.id, template);
				await this.db.run('UPDATE GameTemplate SET catalogVersion = ? WHERE id = ?', [
					version,
					existing.id
				]);
				if (version > (existing.catalogVersion ?? 0)) counts.updated.push(template.slug);
			}
		}
		return counts;
	}

	async findThumbnail(url: string): Promise<Thumbnail | undefined> {
		return this.db.get<Thumbnail>('SELECT contentType, data FROM GameThumbnail WHERE url = ?', [
			url
		]);
	}

	/** Stores a downloaded thumbnail and drops the ones no game uses anymore. */
	async saveThumbnail(url: string, thumbnail: Thumbnail): Promise<void> {
		await this.db.run(
			'INSERT OR REPLACE INTO GameThumbnail (url, contentType, data) VALUES (?, ?, ?)',
			[url, thumbnail.contentType, thumbnail.data]
		);
		await this.db.run(
			`DELETE FROM GameThumbnail
			 WHERE url NOT IN (SELECT thumbnailUrl FROM GameTemplate WHERE thumbnailUrl IS NOT NULL)`
		);
	}

	async countServersUsingTemplate(templateId: number): Promise<number> {
		const row = await this.db.get<{ count: number }>(
			'SELECT COUNT(*) AS count FROM GameServer WHERE templateId = ?',
			[templateId]
		);
		return row?.count ?? 0;
	}

	async listServers(ownerId?: number): Promise<GameServerRecord[]> {
		const rows =
			ownerId === undefined
				? await this.db.all<ServerRow>(`${SELECT_SERVER} ORDER BY GameServer.id`)
				: await this.db.all<ServerRow>(
						`${SELECT_SERVER} WHERE GameServer.ownerId = ? ORDER BY GameServer.id`,
						[ownerId]
					);
		return rows.map(toServer);
	}

	async listServersWithStatus(status: ServerStatus[]): Promise<GameServerRecord[]> {
		const rows = await this.db.all<ServerRow>(
			`${SELECT_SERVER} WHERE GameServer.status IN (${status.map(() => '?').join(',')})`,
			status
		);
		return rows.map(toServer);
	}

	async findServer(id: number): Promise<GameServerRecord | undefined> {
		const row = await this.db.get<ServerRow>(`${SELECT_SERVER} WHERE GameServer.id = ?`, [id]);
		return row && toServer(row);
	}

	async countServers(ownerId: number): Promise<number> {
		const row = await this.db.get<{ count: number }>(
			'SELECT COUNT(*) AS count FROM GameServer WHERE ownerId = ?',
			[ownerId]
		);
		return row?.count ?? 0;
	}

	async createServer(server: {
		name: string;
		ownerId: number;
		templateId: number;
		portOffset: number;
		env: Record<string, string>;
	}): Promise<number> {
		const { lastID } = await this.db.run(
			`INSERT INTO GameServer (name, ownerId, templateId, portOffset, env, status)
			 VALUES (?, ?, ?, ?, ?, 'pending')`,
			[
				server.name,
				server.ownerId,
				server.templateId,
				server.portOffset,
				JSON.stringify(server.env)
			]
		);
		return lastID;
	}

	async setServerStatus(id: number, status: ServerStatus, message: string | null = null) {
		await this.db.run('UPDATE GameServer SET status = ?, statusMessage = ? WHERE id = ?', [
			status,
			message,
			id
		]);
	}

	async setServerContainer(id: number, containerId: string) {
		await this.db.run('UPDATE GameServer SET containerId = ? WHERE id = ?', [containerId, id]);
	}

	async deleteServer(id: number) {
		await this.db.run('DELETE FROM GameServer WHERE id = ?', [id]);
	}
}
