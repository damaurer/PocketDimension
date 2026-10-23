import type {
	GameTemplateInput,
	Protocol,
	TemplateEnv,
	TemplatePort,
	TemplateQuery,
	TemplateVolume
} from '#lib/games/types.ts';
import { games as gamedigGames } from 'gamedig';

type Result<T> = { value: T; error?: undefined } | { value?: undefined; error: string };

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ENV_KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;
// [registry[:port]/]name[/name...][:tag][@sha256:digest]
const IMAGE =
	/^(?:(?:localhost|[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)(?::[0-9]+)?\/)?[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*(?::[\w][\w.-]{0,127})?(?:@sha256:[a-f0-9]{64})?$/;
const CONTAINER_PATH = /^\/[A-Za-z0-9._/-]*$/;
const ENV_VALUE_MAX = 512;

export function isValidImage(image: string): boolean {
	return image.length <= 255 && IMAGE.test(image);
}

/** Parses lines like `25565/tcp Game` into ports. */
export function parsePorts(text: string): Result<TemplatePort[]> {
	const ports: TemplatePort[] = [];
	for (const raw of text.split('\n')) {
		const line = raw.trim();
		if (!line) continue;
		const match = /^(\d{1,5})\/(tcp|udp)(?:\s+(.{1,40}))?$/.exec(line);
		if (!match) return { error: `Invalid port line "${line}". Use e.g. "25565/tcp Game".` };
		const container = Number(match[1]);
		if (container < 1 || container > 65535) return { error: `Port ${container} is out of range.` };
		ports.push({ container, protocol: match[2] as Protocol, label: match[3]?.trim() || undefined });
	}
	const keys = ports.map((p) => `${p.container}/${p.protocol}`);
	if (new Set(keys).size !== keys.length) return { error: 'Ports must be unique.' };
	if (ports.length > 20) return { error: 'At most 20 ports are allowed.' };
	return { value: ports };
}

export function formatPorts(ports: TemplatePort[]): string {
	return ports.map((p) => `${p.container}/${p.protocol}${p.label ? ` ${p.label}` : ''}`).join('\n');
}

/** Parses one absolute container path per line. Only named volumes are created, never host paths. */
export function parseVolumes(text: string): Result<TemplateVolume[]> {
	const volumes: TemplateVolume[] = [];
	for (const raw of text.split('\n')) {
		const path = raw.trim();
		if (!path) continue;
		if (!CONTAINER_PATH.test(path) || path === '/' || path.split('/').includes('..')) {
			return { error: `Invalid container path "${path}".` };
		}
		volumes.push({ container: path });
	}
	if (volumes.length > 10) return { error: 'At most 10 volumes are allowed.' };
	return { value: volumes };
}

export function formatVolumes(volumes: TemplateVolume[]): string {
	return volumes.map((v) => v.container).join('\n');
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const optionalString = (value: unknown) => value === undefined || typeof value === 'string';

/** Validates the env definition of a template (JSON array of TemplateEnv). */
export function parseEnvDefinition(json: string): Result<TemplateEnv[]> {
	let data: unknown;
	try {
		data = json.trim() ? JSON.parse(json) : [];
	} catch {
		return { error: 'Variables must be valid JSON.' };
	}
	if (!Array.isArray(data)) return { error: 'Variables must be a JSON array.' };
	if (data.length > 50) return { error: 'At most 50 variables are allowed.' };

	const env: TemplateEnv[] = [];
	for (const item of data) {
		if (!isRecord(item) || typeof item.key !== 'string' || !ENV_KEY.test(item.key)) {
			return { error: 'Every variable needs a "key" like SERVER_NAME.' };
		}
		if (
			!optionalString(item.label) ||
			!optionalString(item.default) ||
			!optionalString(item.help) ||
			(item.options !== undefined &&
				(!Array.isArray(item.options) || !item.options.every((o) => typeof o === 'string')))
		) {
			return { error: `Variable ${item.key} has invalid fields.` };
		}
		env.push({
			key: item.key,
			label: (item.label as string | undefined) || item.key,
			default: item.default as string | undefined,
			required: item.required === true || undefined,
			secret: item.secret === true || undefined,
			options: item.options as string[] | undefined,
			help: item.help as string | undefined
		});
	}
	const keys = env.map((e) => e.key);
	if (new Set(keys).size !== keys.length) return { error: 'Variable keys must be unique.' };
	return { value: env };
}

export function validateTemplate(input: {
	slug: string;
	name: string;
	description: string;
	image: string;
	ports: string;
	env: string;
	volumes: string;
	memoryMb: string;
	queryType: string;
	queryPort: string;
	docsUrl: string;
	thumbnailUrl: string;
}): Result<GameTemplateInput> {
	if (!SLUG.test(input.slug) || input.slug.length > 40) {
		return { error: 'Slug may only contain lowercase letters, digits and dashes.' };
	}
	if (input.name.length < 2 || input.name.length > 80) {
		return { error: 'Name must have 2 to 80 characters.' };
	}
	if (input.description.length > 1000) return { error: 'Description is too long.' };
	if (!isValidImage(input.image)) return { error: 'Invalid Docker image reference.' };

	const ports = parsePorts(input.ports);
	if (ports.error !== undefined) return ports;
	const env = parseEnvDefinition(input.env);
	if (env.error !== undefined) return env;
	const volumes = parseVolumes(input.volumes);
	if (volumes.error !== undefined) return volumes;

	let memoryMb: number | null = null;
	if (input.memoryMb) {
		memoryMb = Number(input.memoryMb);
		if (!Number.isInteger(memoryMb) || memoryMb < 64 || memoryMb > 262144) {
			return { error: 'Memory limit must be between 64 and 262144 MB.' };
		}
	}

	let query: TemplateQuery | null = null;
	if (input.queryType) {
		const port = Number(input.queryPort || 0);
		if (!/^[a-z0-9]+$/.test(input.queryType) || !Number.isInteger(port) || !ports.value[port]) {
			return {
				error: 'Query type must be a GameDig id and the query port an index into the ports.'
			};
		}
		if (!Object.hasOwn(gamedigGames, input.queryType)) {
			return { error: `"${input.queryType}" is not a game GameDig knows.` };
		}
		query = { type: input.queryType, port };
	}

	let docsUrl: string | null = null;
	if (input.docsUrl) {
		try {
			const url = new URL(input.docsUrl);
			if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error();
			docsUrl = url.toString();
		} catch {
			return { error: 'Documentation link must be an http(s) URL.' };
		}
	}

	let thumbnailUrl: string | null = null;
	if (input.thumbnailUrl) {
		try {
			const url = new URL(input.thumbnailUrl);
			if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
			thumbnailUrl = url.toString();
		} catch {
			return { error: 'Thumbnail must be an https URL.' };
		}
		if (thumbnailUrl.length > 500) return { error: 'Thumbnail URL is too long.' };
	}

	return {
		value: {
			slug: input.slug,
			name: input.name,
			description: input.description,
			image: input.image,
			ports: ports.value,
			env: env.value,
			volumes: volumes.value,
			memoryMb,
			query,
			docsUrl,
			thumbnailUrl
		}
	};
}

/** Checks the values a user entered for a template's variables. */
export function validateServerEnv(
	definitions: TemplateEnv[],
	values: Record<string, string>
): Result<Record<string, string>> {
	const env: Record<string, string> = {};
	for (const definition of definitions) {
		const value = (values[definition.key] ?? '').trim() || definition.default || '';

		if (definition.required && !value) {
			return { error: `${definition.label} is required.` };
		}
		if (!value) continue;
		if (value.length > ENV_VALUE_MAX || /[\r\n\0]/.test(value)) {
			return { error: `${definition.label} is not a valid value.` };
		}
		if (definition.options && !definition.options.includes(value)) {
			return { error: `${definition.label} must be one of ${definition.options.join(', ')}.` };
		}
		env[definition.key] = value;
	}
	return { value: env };
}

export const portKey = (port: number, protocol: Protocol) => `${port}/${protocol}`;

/**
 * Finds an offset so that every template port, shifted by the offset, is free
 * on the host. Ports keep their relative spacing (Valheim needs game and query
 * port next to each other). Offset 0 (the game's default ports) is preferred.
 */
export function allocatePortOffset(
	ports: TemplatePort[],
	used: Set<string>,
	step = 10,
	maxOffset = 20000
): number | undefined {
	for (let offset = 0; offset <= maxOffset; offset += step) {
		const fits = ports.every((p) => {
			const host = p.container + offset;
			return host <= 65535 && !used.has(portKey(host, p.protocol));
		});
		if (fits) return offset;
	}
	return undefined;
}
