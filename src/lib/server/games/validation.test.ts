import { games as gamedigGames } from 'gamedig';
import { describe, expect, it } from 'vitest';
import {
	allocatePortOffset,
	isValidImage,
	parseEnvDefinition,
	parsePorts,
	parseVolumes,
	portKey,
	validateServerEnv,
	validateTemplate
} from './validation';
import { BUILTIN_TEMPLATES } from './catalog';

describe('template parsing', () => {
	it('parses ports', () => {
		expect(parsePorts('25565/tcp Game\n\n2457/udp')).toEqual({
			value: [
				{ container: 25565, protocol: 'tcp', label: 'Game' },
				{ container: 2457, protocol: 'udp', label: undefined }
			]
		});
		expect(parsePorts('25565').error).toBeDefined();
		expect(parsePorts('70000/tcp').error).toBeDefined();
		expect(parsePorts('80/tcp\n80/tcp').error).toBeDefined();
	});

	it('only accepts absolute container paths', () => {
		expect(parseVolumes('/data\n/opt/valheim').value).toHaveLength(2);
		expect(parseVolumes('data').error).toBeDefined();
		expect(parseVolumes('/').error).toBeDefined();
		expect(parseVolumes('/data/../etc').error).toBeDefined();
		expect(parseVolumes('/var/run/docker.sock:/x').error).toBeDefined();
	});

	it('validates image references', () => {
		expect(isValidImage('itzg/minecraft-server:latest')).toBe(true);
		expect(isValidImage('ghcr.io/owner/image:1.2')).toBe(true);
		expect(isValidImage('registry.local:5000/game@sha256:' + 'a'.repeat(64))).toBe(true);
		expect(isValidImage('nginx; rm -rf /')).toBe(false);
		expect(isValidImage('UPPER/case')).toBe(false);
	});

	it('validates variable definitions', () => {
		expect(parseEnvDefinition('[{"key":"A","options":["x","y"],"required":true}]').value).toEqual([
			{ key: 'A', label: 'A', required: true, options: ['x', 'y'] }
		]);
		expect(parseEnvDefinition('{"key":"A"}').error).toBeDefined();
		expect(parseEnvDefinition('[{"key":"A B"}]').error).toBeDefined();
		expect(parseEnvDefinition('[{"key":"A"},{"key":"A"}]').error).toBeDefined();
		expect(parseEnvDefinition('not json').error).toBeDefined();
	});

	it('validates a whole template', () => {
		const base = {
			slug: 'my-game',
			name: 'My Game',
			description: '',
			image: 'nginx:alpine',
			ports: '80/tcp Web',
			env: '',
			volumes: '/data',
			memoryMb: '',
			queryType: '',
			queryPort: '',
			docsUrl: '',
			thumbnailUrl: ''
		};
		expect(validateTemplate(base).value?.ports).toHaveLength(1);
		expect(validateTemplate({ ...base, slug: 'My Game' }).error).toBeDefined();
		expect(
			validateTemplate({ ...base, queryType: 'minecraft', queryPort: '3' }).error
		).toBeDefined();
		expect(
			validateTemplate({ ...base, queryType: 'minecraft', queryPort: '0' }).value?.query
		).toEqual({ type: 'minecraft', port: 0 });
		expect(
			validateTemplate({ ...base, queryType: 'nosuchgame', queryPort: '0' }).error
		).toBeDefined();
		expect(validateTemplate({ ...base, docsUrl: 'javascript:alert(1)' }).error).toBeDefined();
		expect(validateTemplate({ ...base, memoryMb: '10' }).error).toBeDefined();
		expect(
			validateTemplate({ ...base, thumbnailUrl: 'https://example.com/a.jpg' }).value?.thumbnailUrl
		).toBe('https://example.com/a.jpg');
		expect(validateTemplate({ ...base, thumbnailUrl: 'http://example.com/a.jpg' }).error).toBe(
			'Thumbnail must be an https URL.'
		);
		expect(
			validateTemplate({ ...base, thumbnailUrl: 'https://u:p@example.com/' }).error
		).toBeDefined();
	});

	it('ships the catalog games and they pass validation', () => {
		expect(BUILTIN_TEMPLATES.map((t) => t.slug)).toContain('minecraft-java');
		expect(BUILTIN_TEMPLATES.length).toBeGreaterThanOrEqual(10);
		for (const template of BUILTIN_TEMPLATES) {
			expect(isValidImage(template.image), template.slug).toBe(true);
			for (const volume of template.volumes) {
				expect(parseVolumes(volume.container).error, template.slug).toBeUndefined();
			}
			expect(parseEnvDefinition(JSON.stringify(template.env)).error, template.slug).toBeUndefined();
			if (template.query) {
				expect(template.ports[template.query.port], template.slug).toBeDefined();
				expect(Object.hasOwn(gamedigGames, template.query.type), template.slug).toBe(true);
			}
		}
	});
});

describe('validateServerEnv', () => {
	const definitions = [
		{ key: 'EULA', label: 'EULA', options: ['TRUE'], required: true },
		{ key: 'NAME', label: 'Name', default: 'Server' },
		{ key: 'PASS', label: 'Password', secret: true }
	];

	it('applies defaults and drops empty optional values', () => {
		expect(validateServerEnv(definitions, { EULA: 'TRUE' })).toEqual({
			value: { EULA: 'TRUE', NAME: 'Server' }
		});
	});

	it('rejects missing, invalid and multi-line values', () => {
		expect(validateServerEnv(definitions, {}).error).toBeDefined();
		expect(validateServerEnv(definitions, { EULA: 'FALSE' }).error).toBeDefined();
		expect(validateServerEnv(definitions, { EULA: 'TRUE', PASS: 'a\nB=c' }).error).toBeDefined();
	});

	it('ignores variables the template does not define', () => {
		expect(
			validateServerEnv(definitions, { EULA: 'TRUE', LD_PRELOAD: 'x' }).value
		).not.toHaveProperty('LD_PRELOAD');
	});
});

describe('allocatePortOffset', () => {
	const valheim = [
		{ container: 2456, protocol: 'udp' as const },
		{ container: 2457, protocol: 'udp' as const }
	];

	it('prefers the default ports', () => {
		expect(allocatePortOffset(valheim, new Set())).toBe(0);
	});

	it('moves all ports together when one is taken', () => {
		expect(allocatePortOffset(valheim, new Set([portKey(2457, 'udp')]))).toBe(10);
	});

	it('treats tcp and udp separately', () => {
		expect(allocatePortOffset(valheim, new Set([portKey(2456, 'tcp')]))).toBe(0);
	});

	it('gives up when no offset fits', () => {
		const used = new Set([portKey(65530, 'tcp')]);
		expect(allocatePortOffset([{ container: 65530, protocol: 'tcp' }], used)).toBeUndefined();
	});
});
