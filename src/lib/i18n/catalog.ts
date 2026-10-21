/**
 * German texts for the built-in games. Descriptions are matched by slug and
 * only used for built-in templates; setting labels are matched by their
 * English text, so admin templates with the same labels profit too.
 */
const DESCRIPTIONS_DE: Record<string, string> = {
	'minecraft-java':
		'Vanilla, Paper, Fabric, Forge und mehr. Lädt den Server beim ersten Start herunter. Mit dem Erstellen akzeptierst du die Minecraft-EULA.',
	valheim: 'Wikinger-Survival. Das Serverpasswort braucht mindestens 5 Zeichen.',
	terraria: 'Vanilla-Terraria-Server. Beim ersten Start wird eine neue Welt erstellt.',
	factorio: 'Fabrikbau. Beim ersten Start wird ein neuer Spielstand angelegt.',
	'counter-strike-2':
		'Braucht ein Game Server Login Token von steamcommunity.com/dev/managegameservers. Lädt beim ersten Start etwa 60 GB herunter.',
	palworld: 'Survival-Spiel mit Kreaturen zum Sammeln.',
	satisfactory: 'Fabrikbau in 3D. Der erste Spieler übernimmt den Server im Spiel.',
	rust: 'Survival-Spiel. Lädt den Server bei jedem Start herunter.',
	'core-keeper':
		'Mining-Sandbox. Spieler treten mit der Game ID aus dem Serverlog bei; es müssen keine Ports geöffnet werden.',
	'project-zomboid': 'Zombie-Survival.'
};

const LABELS_DE: Record<string, string> = {
	'Accept the Minecraft EULA': 'Minecraft-EULA akzeptieren',
	'Server type': 'Servertyp',
	'Minecraft version': 'Minecraft-Version',
	'Java memory': 'Java-Arbeitsspeicher',
	'Message of the day': 'Nachricht des Tages',
	Difficulty: 'Schwierigkeit',
	'Max players': 'Maximale Spieler',
	'Check accounts with Mojang': 'Konten bei Mojang prüfen',
	'Server name': 'Servername',
	'World name': 'Weltname',
	'Server password': 'Serverpasswort',
	'Server password (min. 5 characters)': 'Serverpasswort (mind. 5 Zeichen)',
	'List in server browser': 'Im Serverbrowser anzeigen',
	'World size (1 small, 2 medium, 3 large)': 'Weltgröße (1 klein, 2 mittel, 3 groß)',
	'Difficulty (0 normal, 1 expert, 2 master, 3 journey)':
		'Schwierigkeit (0 normal, 1 Experte, 2 Meister, 3 Reise)',
	'Game Server Login Token': 'Game Server Login Token',
	'RCON password': 'RCON-Passwort',
	'Admin password': 'Admin-Passwort',
	'Admin password (letters and digits)': 'Admin-Passwort (Buchstaben und Ziffern)',
	'List in community servers': 'In Community-Servern anzeigen',
	'World size': 'Weltgröße',
	'Map seed': 'Karten-Seed',
	'Game ID (15-28 letters and digits, empty = generate)':
		'Game ID (15–28 Buchstaben und Ziffern, leer = erzeugen)'
};

export function gameDescription(
	locale: string,
	template: { slug: string; builtin?: boolean; description: string }
): string {
	return (
		(locale === 'de' && template.builtin && DESCRIPTIONS_DE[template.slug]) || template.description
	);
}

export function settingLabel(locale: string, label: string): string {
	return (locale === 'de' && LABELS_DE[label]) || label;
}
