import { settingLabel } from './catalog';

/**
 * The server answers with English messages. These patterns translate them;
 * a message without a pattern is shown as it is.
 */
const GERMAN: [RegExp, string | ((match: string, ...groups: string[]) => string)][] = [
	// Login
	[/^Email\/name or password is not correct\.$/, 'E-Mail/Name oder Passwort ist nicht korrekt.'],
	[/^Email\/name and password are required\.$/, 'E-Mail/Name und Passwort sind erforderlich.'],
	[
		/^Too many login attempts\. Try again in (\d+) minutes\.$/,
		'Zu viele Anmeldeversuche. Versuche es in $1 Minuten erneut.'
	],
	// Accounts
	[/^Email is required\.$/, 'Die E-Mail ist erforderlich.'],
	[/^Please enter a valid email\.$/, 'Bitte gib eine gültige E-Mail ein.'],
	[/^Password is required\.$/, 'Das Passwort ist erforderlich.'],
	[
		/^Password must be at least (\d+) characters\.$/,
		'Das Passwort muss mindestens $1 Zeichen haben.'
	],
	[/^Password must be at most (\d+) bytes\.$/, 'Das Passwort darf höchstens $1 Bytes haben.'],
	[/^Name is required\.$/, 'Der Name ist erforderlich.'],
	[/^Name has to be at least 2 characters\.$/, 'Der Name muss mindestens 2 Zeichen haben.'],
	[/^Name must be at most (\d+) characters\.$/, 'Der Name darf höchstens $1 Zeichen haben.'],
	[/^Name must not contain "@"\.$/, 'Der Name darf kein „@“ enthalten.'],
	[
		/^Current password is required to change email or password\.$/,
		'Um E-Mail oder Passwort zu ändern, gib dein aktuelles Passwort ein.'
	],
	[/^Account updated\.$/, 'Konto gespeichert.'],
	[/^User created\.$/, 'Benutzer angelegt.'],
	[/^User updated\.$/, 'Benutzer gespeichert.'],
	[/^This email is already in use\.$/, 'Diese E-Mail wird bereits verwendet.'],
	[/^Invalid user\.$/, 'Ungültiger Benutzer.'],
	[/^User not found\.$/, 'Benutzer nicht gefunden.'],
	// Servers
	[/^Server not found\.$/, 'Server nicht gefunden.'],
	[/^Could not start the server\.$/, 'Der Server konnte nicht gestartet werden.'],
	[/^Could not stop the server\.$/, 'Der Server konnte nicht gestoppt werden.'],
	[/^Could not restart the server\.$/, 'Der Server konnte nicht neu gestartet werden.'],
	[/^Could not delete the server\.$/, 'Der Server konnte nicht gelöscht werden.'],
	[
		/^Server name must have 2 to 40 letters, digits or spaces\.$/,
		'Der Servername muss 2 bis 40 Buchstaben, Ziffern oder Leerzeichen haben.'
	],
	[
		/^You can have at most (\d+) servers\. Delete one first\.$/,
		'Du kannst höchstens $1 Server haben. Lösche zuerst einen.'
	],
	[/^No free ports left on this host\.$/, 'Auf diesem Host sind keine Ports mehr frei.'],
	[
		/^Docker is not reachable\. Please try again later\.$/,
		'Docker ist nicht erreichbar. Bitte versuche es später erneut.'
	],
	[/^Docker is not reachable\.$/, 'Docker ist nicht erreichbar.'],
	[/^The container no longer exists\.$/, 'Der Container existiert nicht mehr.'],
	[/^(.+) is required\.$/, (_, label) => `${settingLabel('de', label)} ist erforderlich.`],
	[
		/^(.+) must be one of (.+)\.$/,
		(_, label, values) => `${settingLabel('de', label)} muss einer dieser Werte sein: ${values}.`
	],
	[
		/^(.+) is not a valid value\.$/,
		(_, label) => `${settingLabel('de', label)} hat keinen gültigen Wert.`
	],
	// Game templates
	[/^Template not found\.$/, 'Vorlage nicht gefunden.'],
	[/^A game with this slug already exists\.$/, 'Es gibt bereits ein Spiel mit diesem Kurznamen.'],
	[
		/^Games from the catalog cannot be deleted; disable them instead\.$/,
		'Spiele aus dem Katalog können nicht gelöscht werden; deaktiviere sie stattdessen.'
	],
	[/^Delete the servers of this game first\.$/, 'Lösche zuerst die Server dieses Spiels.'],
	[/^The slug "(.+)" is reserved\.$/, 'Der Kurzname „$1“ ist reserviert.'],
	[
		/^Slug may only contain lowercase letters, digits and dashes\.$/,
		'Der Kurzname darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten.'
	],
	[/^Name must have 2 to 80 characters\.$/, 'Der Name muss 2 bis 80 Zeichen haben.'],
	[/^Description is too long\.$/, 'Die Beschreibung ist zu lang.'],
	[/^Invalid Docker image reference\.$/, 'Ungültiger Name für das Docker-Image.'],
	[
		/^Invalid port line "(.+)"\. Use e\.g\. "25565\/tcp Game"\.$/,
		'Ungültige Portzeile „$1“. Beispiel: „25565/tcp Game“.'
	],
	[/^Port (\d+) is out of range\.$/, 'Port $1 liegt außerhalb des gültigen Bereichs.'],
	[/^Ports must be unique\.$/, 'Jeder Port darf nur einmal vorkommen.'],
	[/^At most (\d+) ports are allowed\.$/, 'Höchstens $1 Ports sind erlaubt.'],
	[/^Invalid container path "(.+)"\.$/, 'Ungültiger Pfad im Container: „$1“.'],
	[/^At most (\d+) volumes are allowed\.$/, 'Höchstens $1 Datenverzeichnisse sind erlaubt.'],
	[/^Variables must be valid JSON\.$/, 'Die Variablen müssen gültiges JSON sein.'],
	[/^Variables must be a JSON array\.$/, 'Die Variablen müssen ein JSON-Array sein.'],
	[/^At most (\d+) variables are allowed\.$/, 'Höchstens $1 Variablen sind erlaubt.'],
	[
		/^Every variable needs a "key" like SERVER_NAME\.$/,
		'Jede Variable braucht einen „key“, z. B. SERVER_NAME.'
	],
	[/^Variable (.+) has invalid fields\.$/, 'Die Variable $1 hat ungültige Felder.'],
	[/^Variable keys must be unique\.$/, 'Jeder Variablenname darf nur einmal vorkommen.'],
	[
		/^Memory limit must be between 64 and 262144 MB\.$/,
		'Das Speicherlimit muss zwischen 64 und 262144 MB liegen.'
	],
	[
		/^Query type must be a GameDig id and the query port an index into the ports\.$/,
		'Der Abfragetyp muss eine GameDig-ID sein und der Abfrage-Port ein Index in der Portliste.'
	],
	[/^"(.+)" is not a game GameDig knows\.$/, 'GameDig kennt kein Spiel „$1“.'],
	[
		/^Documentation link must be an http\(s\) URL\.$/,
		'Der Link zur Dokumentation muss eine http(s)-Adresse sein.'
	],
	[/^Thumbnail must be an https URL\.$/, 'Das Vorschaubild muss eine https-Adresse sein.'],
	[/^Thumbnail URL is too long\.$/, 'Die Adresse des Vorschaubilds ist zu lang.'],
	// Game catalog
	[
		/^Could not update the game catalog: (.+)$/,
		(_, reason) =>
			`Der Spielekatalog konnte nicht aktualisiert werden: ${localizeServerMessage('de', reason)}`
	],
	[
		/^No catalog address is set \(CATALOG_URL\)\.$/,
		'Es ist keine Katalogadresse gesetzt (CATALOG_URL).'
	],
	[/^The catalog answered with HTTP (\d+)\.$/, 'Der Katalog antwortete mit HTTP $1.'],
	[/^The catalog did not answer in time\.$/, 'Der Katalog hat nicht rechtzeitig geantwortet.'],
	[/^The catalog is too large\.$/, 'Der Katalog ist zu groß.'],
	[/^The catalog is not valid JSON\.$/, 'Der Katalog ist kein gültiges JSON.'],
	[/^The catalog has no "games" list\.$/, 'Dem Katalog fehlt die Liste „games“.'],
	[
		/^The catalog uses format (.+); this version of PocketDimension reads format (\d+)\. Update PocketDimension\.$/,
		'Der Katalog nutzt Format $1, diese PocketDimension-Version liest Format $2. Bitte PocketDimension aktualisieren.'
	]
];

export function localizeServerMessage(locale: string, message: string): string {
	if (locale !== 'de') return message;
	for (const [pattern, replacement] of GERMAN) {
		if (pattern.test(message)) {
			return typeof replacement === 'string'
				? message.replace(pattern, replacement)
				: message.replace(pattern, replacement);
		}
	}
	return message;
}
