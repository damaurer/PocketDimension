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
	'project-zomboid': 'Zombie-Survival.',
	'minecraft-bedrock':
		'Für Spieler auf Konsole, Handy, Tablet und Windows. Lädt den Server beim ersten Start herunter. Mit dem Erstellen akzeptierst du die Minecraft-EULA.',
	'7-days-to-die':
		'Zombie-Survival mit Basenbau. Lädt beim ersten Start etwa 15 GB herunter. Servername und Passwort stehen in serverfiles/sdtdserver.xml.',
	enshrouded:
		'Survival und Crafting in einer Nebelwelt. Spieler treten mit dem Rollen-Passwort bei. Lädt den Server beim ersten Start herunter und braucht viel Arbeitsspeicher.',
	'v-rising':
		'Vampir-Survival. Der erste Start kann bis zu 10 Minuten dauern. Passwort und weitere Einstellungen stehen in persistentdata/Settings/ServerHostSettings.json.',
	'team-fortress-2':
		'Klassenbasierter Team-Shooter. Braucht ein Game Server Login Token (App-ID 440) von steamcommunity.com/dev/managegameservers. Lädt den Server beim ersten Start herunter.',
	'ark-survival-evolved':
		'Dinosaurier-Survival. Lädt beim ersten Start etwa 20 GB herunter, das dauert eine Weile. Nicht ARK: Survival Ascended.',
	'sons-of-the-forest':
		'Koop-Horror-Survival. Lädt den Server beim ersten Start herunter. Name, Passwort und weitere Einstellungen stehen in userdata/dedicatedserver.cfg.',
	necesse:
		'Sandbox-Abenteuer von oben mit Siedlungen. Beim ersten Start wird eine neue Welt erstellt.',
	openttd:
		'Open-Source-Transport-Tycoon. Startet ein neues Spiel oder setzt den letzten Autosave fort.'
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
		'Game ID (15–28 Buchstaben und Ziffern, leer = erzeugen)',
	'Check Xbox Live accounts': 'Xbox-Live-Konten prüfen',
	'Game mode': 'Spielmodus',
	'Game branch': 'Spielversion (Branch)',
	'Time zone': 'Zeitzone',
	'Start mode (1 start, 3 update and start)': 'Startmodus (1 starten, 3 aktualisieren und starten)',
	'Max players (1-16)': 'Maximale Spieler (1–16)',
	'Player role name': 'Name der Spielerrolle',
	'Players may build in bases': 'Spieler dürfen in Basen bauen',
	'Players may extend bases': 'Spieler dürfen Basen erweitern',
	'Players may open chests': 'Spieler dürfen Truhen öffnen',
	'Update check (cron, empty = only on start)': 'Update-Prüfung (Cron, leer = nur beim Start)',
	'Start map': 'Startkarte',
	Map: 'Karte',
	'Update on every start': 'Bei jedem Start aktualisieren',
	'Skip network test': 'Netzwerktest überspringen',
	'Owner (player name)': 'Besitzer (Spielername)',
	'Pause when nobody is online (0 no, 1 yes)': 'Pausieren, wenn niemand online ist (0 nein, 1 ja)',
	'Start with (false new game, last-autosave continue)':
		'Starten mit (false neues Spiel, last-autosave fortsetzen)'
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
