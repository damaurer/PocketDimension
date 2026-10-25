/**
 * Translated texts for the built-in games. Descriptions are matched by slug and
 * only used for built-in templates; setting labels are matched by their
 * English text, so admin templates with the same labels profit too.
 */
type Language = 'de' | 'es' | 'tl';

export const DESCRIPTIONS: Record<Language, Record<string, string>> = {
	de: {
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
			'Open-Source-Transport-Tycoon. Startet ein neues Spiel oder setzt den letzten Autosave fort.',
		openra:
			'Open-Source-Neuauflage von Command & Conquer: Alarmstufe Rot, Tiberian Dawn und Dune 2000. Spieler brauchen den kostenlosen OpenRA-Client von openra.net und treten über „Direkt verbinden“ bei.'
	},
	es: {
		'minecraft-java':
			'Vanilla, Paper, Fabric, Forge y más. Descarga el servidor en el primer inicio. Al crear el servidor aceptas el EULA de Minecraft.',
		valheim: 'Supervivencia vikinga. La contraseña del servidor necesita al menos 5 caracteres.',
		terraria: 'Servidor de Terraria vanilla. En el primer inicio se crea un mundo nuevo.',
		factorio: 'Construcción de fábricas. En el primer inicio se crea una partida nueva.',
		'counter-strike-2':
			'Necesita un Game Server Login Token de steamcommunity.com/dev/managegameservers. Descarga unos 60 GB en el primer inicio.',
		palworld: 'Juego de supervivencia y captura de criaturas.',
		satisfactory:
			'Construcción de fábricas en 3D. El primer jugador reclama el servidor dentro del juego.',
		rust: 'Juego de supervivencia. Descarga el servidor en cada inicio.',
		'core-keeper':
			'Sandbox de minería. Los jugadores se unen con el Game ID del registro del servidor; no hace falta abrir puertos.',
		'project-zomboid': 'Supervivencia zombi.',
		'minecraft-bedrock':
			'Para jugadores en consola, móvil, tableta y Windows. Descarga el servidor en el primer inicio. Al crear el servidor aceptas el EULA de Minecraft.',
		'7-days-to-die':
			'Supervivencia zombi con construcción de bases. Descarga unos 15 GB en el primer inicio. El nombre y la contraseña del servidor están en serverfiles/sdtdserver.xml.',
		enshrouded:
			'Supervivencia y crafteo en un mundo cubierto de niebla. Los jugadores se unen con la contraseña de rol. Descarga el servidor en el primer inicio y necesita mucha memoria.',
		'v-rising':
			'Supervivencia vampírica. El primer inicio puede tardar hasta 10 minutos. La contraseña y otros ajustes están en persistentdata/Settings/ServerHostSettings.json.',
		'team-fortress-2':
			'Shooter por equipos basado en clases. Necesita un Game Server Login Token (app ID 440) de steamcommunity.com/dev/managegameservers. Descarga el servidor en el primer inicio.',
		'ark-survival-evolved':
			'Supervivencia con dinosaurios. Descarga unos 20 GB en el primer inicio, lo que tarda un rato. No es ARK: Survival Ascended.',
		'sons-of-the-forest':
			'Supervivencia de terror cooperativa. Descarga el servidor en el primer inicio. El nombre, la contraseña y otros ajustes están en userdata/dedicatedserver.cfg.',
		necesse:
			'Aventura sandbox vista desde arriba con asentamientos. En el primer inicio se crea un mundo nuevo.',
		openttd:
			'Transport tycoon de código abierto. Empieza una partida nueva o continúa el último autoguardado.',
		openra:
			'Remake de código abierto de Command & Conquer: Red Alert, Tiberian Dawn y Dune 2000. Los jugadores necesitan el cliente gratuito de OpenRA de openra.net y se unen con «Conexión directa».'
	},
	tl: {
		'minecraft-java':
			'Vanilla, Paper, Fabric, Forge at iba pa. Dina-download ang server sa unang start. Sa paggawa ng server, tinatanggap mo ang Minecraft EULA.',
		valheim: 'Viking survival. Kailangan ng hindi bababa sa 5 character ang password ng server.',
		terraria: 'Vanilla na Terraria server. Gagawa ng bagong mundo sa unang start.',
		factorio: 'Pagtatayo ng pabrika. Gagawa ng bagong save sa unang start.',
		'counter-strike-2':
			'Kailangan ng Game Server Login Token mula sa steamcommunity.com/dev/managegameservers. Magda-download ng mga 60 GB sa unang start.',
		palworld: 'Survival game na nangongolekta ng mga nilalang.',
		satisfactory:
			'Pagtatayo ng pabrika sa 3D. Ang unang player ang mag-a-angkin ng server sa loob ng laro.',
		rust: 'Survival game. Dina-download ang server sa bawat start.',
		'core-keeper':
			'Mining sandbox. Sumasali ang mga player gamit ang Game ID mula sa log ng server; hindi kailangang magbukas ng port.',
		'project-zomboid': 'Zombie survival.',
		'minecraft-bedrock':
			'Para sa mga player sa console, phone, tablet at Windows. Dina-download ang server sa unang start. Sa paggawa ng server, tinatanggap mo ang Minecraft EULA.',
		'7-days-to-die':
			'Zombie survival na may pagtatayo ng base. Magda-download ng mga 15 GB sa unang start. Nasa serverfiles/sdtdserver.xml ang pangalan at password ng server.',
		enshrouded:
			'Survival at crafting sa mundong balot ng hamog. Sumasali ang mga player gamit ang role password. Dina-download ang server sa unang start at kailangan ng maraming memory.',
		'v-rising':
			'Vampire survival. Puwedeng umabot ng 10 minuto ang unang start. Nasa persistentdata/Settings/ServerHostSettings.json ang password at iba pang setting.',
		'team-fortress-2':
			'Class-based na team shooter. Kailangan ng Game Server Login Token (app ID 440) mula sa steamcommunity.com/dev/managegameservers. Dina-download ang server sa unang start.',
		'ark-survival-evolved':
			'Dinosaur survival. Magda-download ng mga 20 GB sa unang start, kaya matatagalan. Hindi ito ARK: Survival Ascended.',
		'sons-of-the-forest':
			'Co-op na horror survival. Dina-download ang server sa unang start. Nasa userdata/dedicatedserver.cfg ang pangalan, password at iba pang setting.',
		necesse:
			'Top-down na sandbox adventure na may mga pamayanan. Gagawa ng bagong mundo sa unang start.',
		openttd:
			'Open-source na transport tycoon. Magsisimula ng bagong laro o itutuloy ang huling autosave.',
		openra:
			'Open-source na remake ng Command & Conquer: Red Alert, Tiberian Dawn at Dune 2000. Kailangan ng mga player ang libreng OpenRA client mula sa openra.net at sumasali sila gamit ang Direct Connect.'
	}
};

export const LABELS: Record<Language, Record<string, string>> = {
	de: {
		// ports
		Game: 'Spiel',
		'Game (TCP)': 'Spiel (TCP)',
		'Game (UDP)': 'Spiel (UDP)',
		'Game 2': 'Spiel 2',
		Query: 'Abfrage',
		RCON: 'RCON',
		SourceTV: 'SourceTV',
		API: 'API',
		'Blob sync': 'Blob-Sync',
		Direct: 'Direkt',
		'Reliable messaging': 'Zuverlässige Nachrichten',
		// settings
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
		'Start mode (1 start, 3 update and start)':
			'Startmodus (1 starten, 3 aktualisieren und starten)',
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
		'Pause when nobody is online (0 no, 1 yes)':
			'Pausieren, wenn niemand online ist (0 nein, 1 ja)',
		'Start with (false new game, last-autosave continue)':
			'Starten mit (false neues Spiel, last-autosave fortsetzen)',
		'Game (ra Red Alert, cnc Tiberian Dawn, d2k Dune 2000)':
			'Spiel (ra Alarmstufe Rot, cnc Tiberian Dawn, d2k Dune 2000)'
	},
	es: {
		// ports
		Game: 'Juego',
		'Game (TCP)': 'Juego (TCP)',
		'Game (UDP)': 'Juego (UDP)',
		'Game 2': 'Juego 2',
		Query: 'Consulta',
		RCON: 'RCON',
		SourceTV: 'SourceTV',
		API: 'API',
		'Blob sync': 'Sincronización de blobs',
		Direct: 'Directo',
		'Reliable messaging': 'Mensajería fiable',
		// settings
		'Accept the Minecraft EULA': 'Aceptar el EULA de Minecraft',
		'Server type': 'Tipo de servidor',
		'Minecraft version': 'Versión de Minecraft',
		'Java memory': 'Memoria de Java',
		'Message of the day': 'Mensaje del día',
		Difficulty: 'Dificultad',
		'Max players': 'Jugadores máximos',
		'Check accounts with Mojang': 'Comprobar cuentas con Mojang',
		'Server name': 'Nombre del servidor',
		'World name': 'Nombre del mundo',
		'Server password': 'Contraseña del servidor',
		'Server password (min. 5 characters)': 'Contraseña del servidor (mín. 5 caracteres)',
		'List in server browser': 'Mostrar en el buscador de servidores',
		'World size (1 small, 2 medium, 3 large)': 'Tamaño del mundo (1 pequeño, 2 mediano, 3 grande)',
		'Difficulty (0 normal, 1 expert, 2 master, 3 journey)':
			'Dificultad (0 normal, 1 experto, 2 maestro, 3 viaje)',
		'Game Server Login Token': 'Game Server Login Token',
		'RCON password': 'Contraseña RCON',
		'Admin password': 'Contraseña de administrador',
		'Admin password (letters and digits)': 'Contraseña de administrador (letras y dígitos)',
		'List in community servers': 'Mostrar en servidores de la comunidad',
		'World size': 'Tamaño del mundo',
		'Map seed': 'Semilla del mapa',
		'Game ID (15-28 letters and digits, empty = generate)':
			'Game ID (15–28 letras y dígitos, vacío = generar)',
		'Check Xbox Live accounts': 'Comprobar cuentas de Xbox Live',
		'Game mode': 'Modo de juego',
		'Game branch': 'Rama del juego',
		'Time zone': 'Zona horaria',
		'Start mode (1 start, 3 update and start)':
			'Modo de inicio (1 iniciar, 3 actualizar e iniciar)',
		'Max players (1-16)': 'Jugadores máximos (1–16)',
		'Player role name': 'Nombre del rol de jugador',
		'Players may build in bases': 'Los jugadores pueden construir en bases',
		'Players may extend bases': 'Los jugadores pueden ampliar bases',
		'Players may open chests': 'Los jugadores pueden abrir cofres',
		'Update check (cron, empty = only on start)':
			'Buscar actualizaciones (cron, vacío = solo al iniciar)',
		'Start map': 'Mapa inicial',
		Map: 'Mapa',
		'Update on every start': 'Actualizar en cada inicio',
		'Skip network test': 'Omitir la prueba de red',
		'Owner (player name)': 'Propietario (nombre del jugador)',
		'Pause when nobody is online (0 no, 1 yes)':
			'Pausar cuando no hay nadie conectado (0 no, 1 sí)',
		'Start with (false new game, last-autosave continue)':
			'Empezar con (false partida nueva, last-autosave continuar)',
		'Game (ra Red Alert, cnc Tiberian Dawn, d2k Dune 2000)':
			'Juego (ra Red Alert, cnc Tiberian Dawn, d2k Dune 2000)'
	},
	tl: {
		// ports
		Game: 'Laro',
		'Game (TCP)': 'Laro (TCP)',
		'Game (UDP)': 'Laro (UDP)',
		'Game 2': 'Laro 2',
		Query: 'Query',
		RCON: 'RCON',
		SourceTV: 'SourceTV',
		API: 'API',
		'Blob sync': 'Blob sync',
		Direct: 'Direkta',
		'Reliable messaging': 'Maaasahang messaging',
		// settings
		'Accept the Minecraft EULA': 'Tanggapin ang Minecraft EULA',
		'Server type': 'Uri ng server',
		'Minecraft version': 'Bersyon ng Minecraft',
		'Java memory': 'Memory ng Java',
		'Message of the day': 'Mensahe ng araw',
		Difficulty: 'Hirap',
		'Max players': 'Pinakamaraming player',
		'Check accounts with Mojang': 'I-check ang mga account sa Mojang',
		'Server name': 'Pangalan ng server',
		'World name': 'Pangalan ng mundo',
		'Server password': 'Password ng server',
		'Server password (min. 5 characters)': 'Password ng server (min. 5 character)',
		'List in server browser': 'Ipakita sa server browser',
		'World size (1 small, 2 medium, 3 large)': 'Laki ng mundo (1 maliit, 2 katamtaman, 3 malaki)',
		'Difficulty (0 normal, 1 expert, 2 master, 3 journey)':
			'Hirap (0 normal, 1 expert, 2 master, 3 journey)',
		'Game Server Login Token': 'Game Server Login Token',
		'RCON password': 'Password ng RCON',
		'Admin password': 'Password ng admin',
		'Admin password (letters and digits)': 'Password ng admin (titik at numero)',
		'List in community servers': 'Ipakita sa community servers',
		'World size': 'Laki ng mundo',
		'Map seed': 'Seed ng mapa',
		'Game ID (15-28 letters and digits, empty = generate)':
			'Game ID (15–28 titik at numero, walang laman = gagawa)',
		'Check Xbox Live accounts': 'I-check ang mga Xbox Live account',
		'Game mode': 'Game mode',
		'Game branch': 'Branch ng laro',
		'Time zone': 'Time zone',
		'Start mode (1 start, 3 update and start)': 'Start mode (1 start, 3 update at start)',
		'Max players (1-16)': 'Pinakamaraming player (1–16)',
		'Player role name': 'Pangalan ng role ng player',
		'Players may build in bases': 'Puwedeng magtayo ang mga player sa base',
		'Players may extend bases': 'Puwedeng palakihin ng mga player ang base',
		'Players may open chests': 'Puwedeng magbukas ng chest ang mga player',
		'Update check (cron, empty = only on start)':
			'Pag-check ng update (cron, walang laman = sa start lang)',
		'Start map': 'Panimulang mapa',
		Map: 'Mapa',
		'Update on every start': 'Mag-update sa bawat start',
		'Skip network test': 'Laktawan ang network test',
		'Owner (player name)': 'May-ari (pangalan ng player)',
		'Pause when nobody is online (0 no, 1 yes)': 'I-pause kapag walang online (0 hindi, 1 oo)',
		'Start with (false new game, last-autosave continue)':
			'Simulan sa (false bagong laro, last-autosave ituloy)',
		'Game (ra Red Alert, cnc Tiberian Dawn, d2k Dune 2000)':
			'Laro (ra Red Alert, cnc Tiberian Dawn, d2k Dune 2000)'
	}
};

function isLanguage(locale: string): locale is Language {
	return locale in DESCRIPTIONS;
}

export function gameDescription(
	locale: string,
	template: { slug: string; builtin?: boolean; description: string }
): string {
	return (
		(isLanguage(locale) && template.builtin && DESCRIPTIONS[locale][template.slug]) ||
		template.description
	);
}

export function settingLabel(locale: string, label: string): string {
	return (isLanguage(locale) && LABELS[locale][label]) || label;
}
