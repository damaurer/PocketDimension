import { formString } from '#lib/server/security/validation.ts';
import { formatPorts, formatVolumes, validateTemplate } from '#lib/server/games/validation.ts';
import type { GameTemplate } from '#lib/games/types.ts';

const FIELDS = [
	'slug',
	'name',
	'description',
	'image',
	'ports',
	'env',
	'volumes',
	'memoryMb',
	'queryType',
	'queryPort',
	'docsUrl',
	'thumbnailUrl'
] as const;

export type TemplateFormValues = Record<(typeof FIELDS)[number], string>;

const RESERVED_SLUGS = new Set(['new']);

export function readTemplateForm(data: FormData) {
	const values = Object.fromEntries(
		FIELDS.map((field) => [field, formString(data, field)])
	) as TemplateFormValues;
	values.slug = values.slug.toLowerCase();

	if (RESERVED_SLUGS.has(values.slug)) {
		return { values, error: `The slug "${values.slug}" is reserved.` };
	}
	const result = validateTemplate(values);
	return { values, ...result };
}

export function templateToForm(template: GameTemplate): TemplateFormValues {
	return {
		slug: template.slug,
		name: template.name,
		description: template.description,
		image: template.image,
		ports: formatPorts(template.ports),
		env: JSON.stringify(template.env, null, 2),
		volumes: formatVolumes(template.volumes),
		memoryMb: template.memoryMb ? String(template.memoryMb) : '',
		queryType: template.query?.type ?? '',
		queryPort: template.query ? String(template.query.port) : '',
		docsUrl: template.docsUrl ?? '',
		thumbnailUrl: template.thumbnailUrl ?? ''
	};
}

export const EMPTY_TEMPLATE_FORM: TemplateFormValues = {
	slug: '',
	name: '',
	description: '',
	image: '',
	ports: '',
	env: '[\n  { "key": "SERVER_NAME", "label": "Server name", "default": "My server" }\n]',
	volumes: '',
	memoryMb: '',
	queryType: '',
	queryPort: '',
	docsUrl: '',
	thumbnailUrl: ''
};
