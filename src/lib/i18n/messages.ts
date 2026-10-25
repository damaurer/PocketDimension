import { settingLabel } from './catalog';

type Language = 'de' | 'es' | 'tl';
type Replacement = string | ((match: string, ...groups: string[]) => string);

/**
 * The server answers with English messages. Each rule matches one of them and
 * says how to write it in the other languages; a message without a rule is
 * shown as it is.
 */
const RULES: [RegExp, Record<Language, Replacement>][] = [
	// Login
	[
		/^Email\/name or password is not correct\.$/,
		{
			de: 'E-Mail/Name oder Passwort ist nicht korrekt.',
			es: 'El correo/nombre o la contraseña no son correctos.',
			tl: 'Mali ang email/pangalan o password.'
		}
	],
	[
		/^Email\/name and password are required\.$/,
		{
			de: 'E-Mail/Name und Passwort sind erforderlich.',
			es: 'El correo/nombre y la contraseña son obligatorios.',
			tl: 'Kailangan ang email/pangalan at password.'
		}
	],
	[
		/^Too many login attempts\. Try again in (\d+) minutes\.$/,
		{
			de: 'Zu viele Anmeldeversuche. Versuche es in $1 Minuten erneut.',
			es: 'Demasiados intentos de inicio de sesión. Inténtalo de nuevo en $1 minutos.',
			tl: 'Masyadong maraming pagsubok mag-login. Subukan ulit pagkalipas ng $1 minuto.'
		}
	],
	[
		/^Login with a password is turned off\.$/,
		{
			de: 'Die Anmeldung mit Passwort ist ausgeschaltet.',
			es: 'El inicio de sesión con contraseña está desactivado.',
			tl: 'Naka-off ang pag-login gamit ang password.'
		}
	],
	// Single sign-on
	[
		/^Single sign-on failed\. Please try again\.$/,
		{
			de: 'Die Anmeldung über den Anmeldedienst ist fehlgeschlagen. Bitte versuche es erneut.',
			es: 'El inicio de sesión único falló. Inténtalo de nuevo.',
			tl: 'Pumalya ang single sign-on. Subukan ulit.'
		}
	],
	[
		/^Your single sign-on account has no email address\.$/,
		{
			de: 'Dein Konto beim Anmeldedienst hat keine E-Mail-Adresse.',
			es: 'Tu cuenta de inicio de sesión único no tiene correo.',
			tl: 'Walang email address ang iyong single sign-on account.'
		}
	],
	[
		/^An account with this email already exists\. Verify your email at the sign-on provider or ask your administrator\.$/,
		{
			de: 'Es gibt schon ein Konto mit dieser E-Mail. Bestätige deine E-Mail beim Anmeldedienst oder frag deinen Administrator.',
			es: 'Ya existe una cuenta con este correo. Verifica tu correo en el proveedor de inicio de sesión o pregunta a tu administrador.',
			tl: 'May account na gamit ang email na ito. I-verify ang iyong email sa sign-on provider o magtanong sa iyong administrator.'
		}
	],
	[
		/^There is no account for you here\. Ask your administrator\.$/,
		{
			de: 'Hier gibt es kein Konto für dich. Frag deinen Administrator.',
			es: 'Aquí no hay una cuenta para ti. Pregunta a tu administrador.',
			tl: 'Wala kang account dito. Magtanong sa iyong administrator.'
		}
	],
	[
		/^Too many login attempts\. Try again later\.$/,
		{
			de: 'Zu viele Anmeldeversuche. Versuche es später erneut.',
			es: 'Demasiados intentos de inicio de sesión. Inténtalo más tarde.',
			tl: 'Masyadong maraming pagsubok mag-login. Subukan ulit mamaya.'
		}
	],
	// Accounts
	[
		/^Email is required\.$/,
		{
			de: 'Die E-Mail ist erforderlich.',
			es: 'El correo es obligatorio.',
			tl: 'Kailangan ang email.'
		}
	],
	[
		/^Please enter a valid email\.$/,
		{
			de: 'Bitte gib eine gültige E-Mail ein.',
			es: 'Introduce un correo válido.',
			tl: 'Maglagay ng tamang email.'
		}
	],
	[
		/^Password is required\.$/,
		{
			de: 'Das Passwort ist erforderlich.',
			es: 'La contraseña es obligatoria.',
			tl: 'Kailangan ang password.'
		}
	],
	[
		/^Password must be at least (\d+) characters\.$/,
		{
			de: 'Das Passwort muss mindestens $1 Zeichen haben.',
			es: 'La contraseña debe tener al menos $1 caracteres.',
			tl: 'Dapat may hindi bababa sa $1 character ang password.'
		}
	],
	[
		/^Password must be at most (\d+) bytes\.$/,
		{
			de: 'Das Passwort darf höchstens $1 Bytes haben.',
			es: 'La contraseña puede tener como máximo $1 bytes.',
			tl: 'Hanggang $1 byte lang ang password.'
		}
	],
	[
		/^Name is required\.$/,
		{
			de: 'Der Name ist erforderlich.',
			es: 'El nombre es obligatorio.',
			tl: 'Kailangan ang pangalan.'
		}
	],
	[
		/^Name has to be at least 2 characters\.$/,
		{
			de: 'Der Name muss mindestens 2 Zeichen haben.',
			es: 'El nombre debe tener al menos 2 caracteres.',
			tl: 'Dapat may hindi bababa sa 2 character ang pangalan.'
		}
	],
	[
		/^Name must be at most (\d+) characters\.$/,
		{
			de: 'Der Name darf höchstens $1 Zeichen haben.',
			es: 'El nombre puede tener como máximo $1 caracteres.',
			tl: 'Hanggang $1 character lang ang pangalan.'
		}
	],
	[
		/^Name must not contain "@"\.$/,
		{
			de: 'Der Name darf kein „@“ enthalten.',
			es: 'El nombre no puede contener «@».',
			tl: 'Hindi puwedeng may "@" ang pangalan.'
		}
	],
	[
		/^Current password is required to change email or password\.$/,
		{
			de: 'Um E-Mail oder Passwort zu ändern, gib dein aktuelles Passwort ein.',
			es: 'Para cambiar el correo o la contraseña, introduce tu contraseña actual.',
			tl: 'Ilagay ang kasalukuyang password para mapalitan ang email o password.'
		}
	],
	[
		/^Account updated\.$/,
		{ de: 'Konto gespeichert.', es: 'Cuenta guardada.', tl: 'Na-save ang account.' }
	],
	[/^User created\.$/, { de: 'Benutzer angelegt.', es: 'Usuario creado.', tl: 'Nagawa ang user.' }],
	[
		/^User updated\.$/,
		{ de: 'Benutzer gespeichert.', es: 'Usuario guardado.', tl: 'Na-save ang user.' }
	],
	[
		/^This email is already in use\.$/,
		{
			de: 'Diese E-Mail wird bereits verwendet.',
			es: 'Este correo ya está en uso.',
			tl: 'Ginagamit na ang email na ito.'
		}
	],
	[
		/^Invalid user\.$/,
		{ de: 'Ungültiger Benutzer.', es: 'Usuario no válido.', tl: 'Hindi wastong user.' }
	],
	[
		/^User not found\.$/,
		{
			de: 'Benutzer nicht gefunden.',
			es: 'Usuario no encontrado.',
			tl: 'Hindi nahanap ang user.'
		}
	],
	// Servers
	[
		/^Server not found\.$/,
		{
			de: 'Server nicht gefunden.',
			es: 'Servidor no encontrado.',
			tl: 'Hindi nahanap ang server.'
		}
	],
	[
		/^Could not start the server\.$/,
		{
			de: 'Der Server konnte nicht gestartet werden.',
			es: 'No se pudo iniciar el servidor.',
			tl: 'Hindi masimulan ang server.'
		}
	],
	[
		/^Could not stop the server\.$/,
		{
			de: 'Der Server konnte nicht gestoppt werden.',
			es: 'No se pudo detener el servidor.',
			tl: 'Hindi maihinto ang server.'
		}
	],
	[
		/^Could not restart the server\.$/,
		{
			de: 'Der Server konnte nicht neu gestartet werden.',
			es: 'No se pudo reiniciar el servidor.',
			tl: 'Hindi ma-restart ang server.'
		}
	],
	[
		/^Could not delete the server\.$/,
		{
			de: 'Der Server konnte nicht gelöscht werden.',
			es: 'No se pudo eliminar el servidor.',
			tl: 'Hindi mabura ang server.'
		}
	],
	[
		/^Server name must have 2 to 40 letters, digits or spaces\.$/,
		{
			de: 'Der Servername muss 2 bis 40 Buchstaben, Ziffern oder Leerzeichen haben.',
			es: 'El nombre del servidor debe tener de 2 a 40 letras, dígitos o espacios.',
			tl: 'Dapat 2 hanggang 40 titik, numero o espasyo ang pangalan ng server.'
		}
	],
	[
		/^You can have at most (\d+) servers\. Delete one first\.$/,
		{
			de: 'Du kannst höchstens $1 Server haben. Lösche zuerst einen.',
			es: 'Puedes tener como máximo $1 servidores. Elimina uno primero.',
			tl: 'Hanggang $1 server lang ang puwede mong magkaroon. Magbura muna ng isa.'
		}
	],
	[
		/^No free ports left on this host\.$/,
		{
			de: 'Auf diesem Host sind keine Ports mehr frei.',
			es: 'No quedan puertos libres en este equipo.',
			tl: 'Wala nang bakanteng port sa host na ito.'
		}
	],
	[
		/^Docker is not reachable\. Please try again later\.$/,
		{
			de: 'Docker ist nicht erreichbar. Bitte versuche es später erneut.',
			es: 'Docker no está disponible. Inténtalo de nuevo más tarde.',
			tl: 'Hindi maabot ang Docker. Subukan ulit mamaya.'
		}
	],
	[
		/^Docker is not reachable\.$/,
		{
			de: 'Docker ist nicht erreichbar.',
			es: 'Docker no está disponible.',
			tl: 'Hindi maabot ang Docker.'
		}
	],
	[
		/^The container no longer exists\.$/,
		{
			de: 'Der Container existiert nicht mehr.',
			es: 'El contenedor ya no existe.',
			tl: 'Wala na ang container.'
		}
	],
	[
		/^(.+) is required\.$/,
		{
			de: (_, label) => `${settingLabel('de', label)} ist erforderlich.`,
			es: (_, label) => `El campo «${settingLabel('es', label)}» es obligatorio.`,
			tl: (_, label) => `Kailangan ang ${settingLabel('tl', label)}.`
		}
	],
	[
		/^(.+) must be one of (.+)\.$/,
		{
			de: (_, label, values) =>
				`${settingLabel('de', label)} muss einer dieser Werte sein: ${values}.`,
			es: (_, label, values) =>
				`El campo «${settingLabel('es', label)}» debe tener uno de estos valores: ${values}.`,
			tl: (_, label, values) =>
				`Ang ${settingLabel('tl', label)} ay dapat isa sa mga ito: ${values}.`
		}
	],
	[
		/^(.+) is not a valid value\.$/,
		{
			de: (_, label) => `${settingLabel('de', label)} hat keinen gültigen Wert.`,
			es: (_, label) => `El campo «${settingLabel('es', label)}» no tiene un valor válido.`,
			tl: (_, label) => `Hindi wasto ang halaga ng ${settingLabel('tl', label)}.`
		}
	],
	// Game templates
	[
		/^Template not found\.$/,
		{
			de: 'Vorlage nicht gefunden.',
			es: 'Plantilla no encontrada.',
			tl: 'Hindi nahanap ang template.'
		}
	],
	[
		/^A game with this slug already exists\.$/,
		{
			de: 'Es gibt bereits ein Spiel mit diesem Kurznamen.',
			es: 'Ya existe un juego con este nombre corto.',
			tl: 'May laro nang may ganitong maikling pangalan.'
		}
	],
	[
		/^Games from the catalog cannot be deleted; disable them instead\.$/,
		{
			de: 'Spiele aus dem Katalog können nicht gelöscht werden; deaktiviere sie stattdessen.',
			es: 'Los juegos del catálogo no se pueden eliminar; desactívalos en su lugar.',
			tl: 'Hindi mabubura ang mga laro mula sa catalog; i-disable na lang ang mga ito.'
		}
	],
	[
		/^Delete the servers of this game first\.$/,
		{
			de: 'Lösche zuerst die Server dieses Spiels.',
			es: 'Elimina primero los servidores de este juego.',
			tl: 'Burahin muna ang mga server ng larong ito.'
		}
	],
	[
		/^The slug "(.+)" is reserved\.$/,
		{
			de: 'Der Kurzname „$1“ ist reserviert.',
			es: 'El nombre corto «$1» está reservado.',
			tl: 'Nakareserba ang maikling pangalang "$1".'
		}
	],
	[
		/^Slug may only contain lowercase letters, digits and dashes\.$/,
		{
			de: 'Der Kurzname darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten.',
			es: 'El nombre corto solo puede contener minúsculas, dígitos y guiones.',
			tl: 'Maliliit na titik, numero at gitling lang ang puwede sa maikling pangalan.'
		}
	],
	[
		/^Name must have 2 to 80 characters\.$/,
		{
			de: 'Der Name muss 2 bis 80 Zeichen haben.',
			es: 'El nombre debe tener de 2 a 80 caracteres.',
			tl: 'Dapat 2 hanggang 80 character ang pangalan.'
		}
	],
	[
		/^Description is too long\.$/,
		{
			de: 'Die Beschreibung ist zu lang.',
			es: 'La descripción es demasiado larga.',
			tl: 'Masyadong mahaba ang paglalarawan.'
		}
	],
	[
		/^Invalid Docker image reference\.$/,
		{
			de: 'Ungültiger Name für das Docker-Image.',
			es: 'Nombre de imagen Docker no válido.',
			tl: 'Hindi wastong pangalan ng Docker image.'
		}
	],
	[
		/^Invalid port line "(.+)"\. Use e\.g\. "25565\/tcp Game"\.$/,
		{
			de: 'Ungültige Portzeile „$1“. Beispiel: „25565/tcp Game“.',
			es: 'Línea de puerto no válida «$1». Ejemplo: «25565/tcp Game».',
			tl: 'Hindi wastong linya ng port "$1". Halimbawa: "25565/tcp Game".'
		}
	],
	[
		/^Port (\d+) is out of range\.$/,
		{
			de: 'Port $1 liegt außerhalb des gültigen Bereichs.',
			es: 'El puerto $1 está fuera de rango.',
			tl: 'Wala sa pinapayagang saklaw ang port $1.'
		}
	],
	[
		/^Ports must be unique\.$/,
		{
			de: 'Jeder Port darf nur einmal vorkommen.',
			es: 'Cada puerto solo puede aparecer una vez.',
			tl: 'Isang beses lang puwedeng lumabas ang bawat port.'
		}
	],
	[
		/^At most (\d+) ports are allowed\.$/,
		{
			de: 'Höchstens $1 Ports sind erlaubt.',
			es: 'Se permiten como máximo $1 puertos.',
			tl: 'Hanggang $1 port lang ang pinapayagan.'
		}
	],
	[
		/^Invalid container path "(.+)"\.$/,
		{
			de: 'Ungültiger Pfad im Container: „$1“.',
			es: 'Ruta del contenedor no válida: «$1».',
			tl: 'Hindi wastong path sa container: "$1".'
		}
	],
	[
		/^At most (\d+) volumes are allowed\.$/,
		{
			de: 'Höchstens $1 Datenverzeichnisse sind erlaubt.',
			es: 'Se permiten como máximo $1 directorios de datos.',
			tl: 'Hanggang $1 data directory lang ang pinapayagan.'
		}
	],
	[
		/^Variables must be valid JSON\.$/,
		{
			de: 'Die Variablen müssen gültiges JSON sein.',
			es: 'Las variables deben ser JSON válido.',
			tl: 'Dapat wastong JSON ang mga variable.'
		}
	],
	[
		/^Variables must be a JSON array\.$/,
		{
			de: 'Die Variablen müssen ein JSON-Array sein.',
			es: 'Las variables deben ser un array JSON.',
			tl: 'Dapat JSON array ang mga variable.'
		}
	],
	[
		/^At most (\d+) variables are allowed\.$/,
		{
			de: 'Höchstens $1 Variablen sind erlaubt.',
			es: 'Se permiten como máximo $1 variables.',
			tl: 'Hanggang $1 variable lang ang pinapayagan.'
		}
	],
	[
		/^Every variable needs a "key" like SERVER_NAME\.$/,
		{
			de: 'Jede Variable braucht einen „key“, z. B. SERVER_NAME.',
			es: 'Cada variable necesita una «key», por ejemplo SERVER_NAME.',
			tl: 'Kailangan ng bawat variable ng "key", halimbawa SERVER_NAME.'
		}
	],
	[
		/^Variable (.+) has invalid fields\.$/,
		{
			de: 'Die Variable $1 hat ungültige Felder.',
			es: 'La variable $1 tiene campos no válidos.',
			tl: 'May hindi wastong field ang variable na $1.'
		}
	],
	[
		/^Variable keys must be unique\.$/,
		{
			de: 'Jeder Variablenname darf nur einmal vorkommen.',
			es: 'Cada nombre de variable solo puede aparecer una vez.',
			tl: 'Isang beses lang puwedeng lumabas ang bawat pangalan ng variable.'
		}
	],
	[
		/^Memory limit must be between 64 and 262144 MB\.$/,
		{
			de: 'Das Speicherlimit muss zwischen 64 und 262144 MB liegen.',
			es: 'El límite de memoria debe estar entre 64 y 262144 MB.',
			tl: 'Dapat nasa pagitan ng 64 at 262144 MB ang memory limit.'
		}
	],
	[
		/^Query type must be a GameDig id and the query port an index into the ports\.$/,
		{
			de: 'Der Abfragetyp muss eine GameDig-ID sein und der Abfrage-Port ein Index in der Portliste.',
			es: 'El tipo de consulta debe ser un id de GameDig y el puerto de consulta una posición en la lista de puertos.',
			tl: 'Dapat GameDig id ang query type at posisyon sa listahan ng port ang query port.'
		}
	],
	[
		/^"(.+)" is not a game GameDig knows\.$/,
		{
			de: 'GameDig kennt kein Spiel „$1“.',
			es: 'GameDig no conoce ningún juego «$1».',
			tl: 'Walang larong "$1" na kilala ng GameDig.'
		}
	],
	[
		/^Documentation link must be an http\(s\) URL\.$/,
		{
			de: 'Der Link zur Dokumentation muss eine http(s)-Adresse sein.',
			es: 'El enlace a la documentación debe ser una dirección http(s).',
			tl: 'Dapat http(s) na address ang link ng dokumentasyon.'
		}
	],
	[
		/^Thumbnail must be an https URL\.$/,
		{
			de: 'Das Vorschaubild muss eine https-Adresse sein.',
			es: 'La miniatura debe ser una dirección https.',
			tl: 'Dapat https na address ang thumbnail.'
		}
	],
	[
		/^Thumbnail URL is too long\.$/,
		{
			de: 'Die Adresse des Vorschaubilds ist zu lang.',
			es: 'La dirección de la miniatura es demasiado larga.',
			tl: 'Masyadong mahaba ang address ng thumbnail.'
		}
	],
	// Game catalog
	[
		/^Could not update the game catalog: (.+)$/,
		{
			de: (_, reason) =>
				`Der Spielekatalog konnte nicht aktualisiert werden: ${localizeServerMessage('de', reason)}`,
			es: (_, reason) =>
				`No se pudo actualizar el catálogo de juegos: ${localizeServerMessage('es', reason)}`,
			tl: (_, reason) =>
				`Hindi ma-update ang catalog ng mga laro: ${localizeServerMessage('tl', reason)}`
		}
	],
	[
		/^No catalog address is set \(CATALOG_URL\)\.$/,
		{
			de: 'Es ist keine Katalogadresse gesetzt (CATALOG_URL).',
			es: 'No hay ninguna dirección de catálogo configurada (CATALOG_URL).',
			tl: 'Walang nakatakdang address ng catalog (CATALOG_URL).'
		}
	],
	[
		/^The catalog answered with HTTP (\d+)\.$/,
		{
			de: 'Der Katalog antwortete mit HTTP $1.',
			es: 'El catálogo respondió con HTTP $1.',
			tl: 'Sumagot ang catalog ng HTTP $1.'
		}
	],
	[
		/^The catalog did not answer in time\.$/,
		{
			de: 'Der Katalog hat nicht rechtzeitig geantwortet.',
			es: 'El catálogo no respondió a tiempo.',
			tl: 'Hindi sumagot ang catalog sa takdang oras.'
		}
	],
	[
		/^The catalog is too large\.$/,
		{
			de: 'Der Katalog ist zu groß.',
			es: 'El catálogo es demasiado grande.',
			tl: 'Masyadong malaki ang catalog.'
		}
	],
	[
		/^The catalog is not valid JSON\.$/,
		{
			de: 'Der Katalog ist kein gültiges JSON.',
			es: 'El catálogo no es JSON válido.',
			tl: 'Hindi wastong JSON ang catalog.'
		}
	],
	[
		/^The catalog has no "games" list\.$/,
		{
			de: 'Dem Katalog fehlt die Liste „games“.',
			es: 'Al catálogo le falta la lista «games».',
			tl: 'Walang listahang "games" ang catalog.'
		}
	],
	[
		/^The catalog uses format (.+); this version of PocketDimension reads format (\d+)\. Update PocketDimension\.$/,
		{
			de: 'Der Katalog nutzt Format $1, diese PocketDimension-Version liest Format $2. Bitte PocketDimension aktualisieren.',
			es: 'El catálogo usa el formato $1; esta versión de PocketDimension lee el formato $2. Actualiza PocketDimension.',
			tl: 'Format $1 ang gamit ng catalog; format $2 ang nababasa ng bersyong ito ng PocketDimension. I-update ang PocketDimension.'
		}
	]
];

function isLanguage(locale: string): locale is Language {
	return locale === 'de' || locale === 'es' || locale === 'tl';
}

export function localizeServerMessage(locale: string, message: string): string {
	if (!isLanguage(locale)) return message;
	for (const [pattern, translations] of RULES) {
		if (pattern.test(message)) {
			const replacement = translations[locale];
			return typeof replacement === 'string'
				? message.replace(pattern, replacement)
				: message.replace(pattern, replacement);
		}
	}
	return message;
}
