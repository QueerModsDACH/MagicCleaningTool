// ==UserScript==
// @name Magic Cleaning Tool
// @description Ein Tool, das die Moderation auf Twitch erleichtert
// @namespace Magic Cleaning Tool ...for a little better World
// @version 1.9.6.107
// @match *://www.twitch.tv/*
// @run-at document-idle
// @author QueerModsDACH - The original code is from victornpb - Inspired by Bann-Hammer (by RaidHammer)
// @homepageURL https://github.com/QueerModsDACH/MagicCleaningTool
// @supportURL https://github.com/QueerModsDACH/MagicCleaningTool/issues
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_xmlhttpRequest
// @license MIT
// ==/UserScript==

/* jshint esversion: 8 */

(function () {
'use strict';

// ############################################################################
// ##### ALLGEMEINE ANWENDUNGSKONFIGURATION ###################################
// ############################################################################

// Versionsnummer des Tools
const myVersion = '1.9.6.107';

// Log-Präfix für die Browser-Konsole
const LOGPREFIX = '[QMD_MCT_1]';

// Alle lokalen Speicher-Schlüssel müssen diesen Prefix verwenden.
const BROWSER_STORAGE_PREFIX = '_QMD_';

// Speicher-Schlüssel für die Sichtbarkeit des Mod-Menüs
const MOD_MENU_VISIBILITY_STORAGE_KEY =
'visibility_of_mod_menu';

// Allgemeine Text- und Aktionsvariablen
let text;
let banReason;

const defaultBanReason = 'Ban by QMD list';

// URL zur Quelle der Bannlisten
const urlBannlisten =
'https://github.com/QueerModsDACH/Listen';

// Werbe- und Botlisten
const mdgBtnAdvertisingText = ' advertising';
const mdgBtnFollowBotText = ' follow_bots';
const mdgBtnViewerBotsText = ' viewer_bots';
const mdgBtnSpamBotsText = ' spam_bots';
const mdgBtnPornBotText = ' porn_bots';

// Verdächtige Benutzer und Trolle
const Button_Suspect_Text = ' suspect';
const mdgBtnTrollsText1 = ' hate_trolls_2';
const mdgBtnTrollsText2 = ' hate_trolls_3';

// Sicherheits- und TOS-Listen
const mdgBtnSec = ' security_list';
const mdgBtnFlirtyMadText = ' mad_tos';

// Unban- und Informationsbutton
const mdgBtnUnbanText = ' UNBAN';
const Button_Info_Text = 'info';

// Allgemeiner Status der Benutzeroberfläche
let replaceFooter = 'none';
let isPaused = false;

// Interne Listen während der Laufzeit
const queueList = new Set();
const ignoredList = new Set();
const bannedList = new Set();

// Aktuell aktive Twitch-Seite beziehungsweise Kanal
let activeChannel = getActiveChannel();

// Bild für den Aktivierungsbutton
const activateImage =
'https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/pix/activate.png';

// Bilder für den Mod-Menü-Umschalter
const modMenuOnImage =
'https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/pix/modmenu_on.png';

const modMenuOffImage =
'https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/pix/modmenu_off.png';

// Alternative Theme-Farbe
const themeNormal = '#9146FF';
const themeTextColor = themeNormal;

// Text für die Versionsprüfung
const updateText = 'die Version ist aktuell ツ';

// Der gespeicherte Sichtbarkeitszustand wird standardmäßig auf
// "sichtbar" gesetzt.
let isModMenuVisible = readStorageValue(
MOD_MENU_VISIBILITY_STORAGE_KEY,
true
);

// ############################################################################
// ##### VERZÖGERUNGEN FÜR TWITCH-AKTIONEN ####################################
// ############################################################################

// Allgemeine Delay-Funktion
const delay = (time) =>
new Promise((resolve) => setTimeout(resolve, time));

// Zentrale Delay-Werte in Millisekunden
//
// Hinweis:
// Werte unter 125 ms sollten vermieden werden, da Twitch-Aktionen
// dadurch möglicherweise zu schnell hintereinander ausgeführt werden
// und ein Shadow-Ban-Risiko entstehen kann.
const DELAY_BAN_ACTION = 130;
const DELAY_UNBAN_ACTION = 130;
const DELAY_PAUSE_CHECK = 1000;

// ############################################################################
// ##### LOCALSTORAGE-HILFSFUNKTIONEN #########################################
// ############################################################################

// Erstellt einen lokalen Speicher-Schlüssel mit dem zentralen Prefix.
function storageKey(key) {
return `${BROWSER_STORAGE_PREFIX}${key}`;
}

// Liest eine JSON-Liste sicher aus dem localStorage.
function readStorageList(key) {
try {
const value = localStorage.getItem(storageKey(key));

if (!value) {
return [];
}

const parsedValue = JSON.parse(value);

return Array.isArray(parsedValue)
? parsedValue
: [];
} catch (error) {
console.error(
LOGPREFIX,
`Ungültige Daten im Speicher-Schlüssel "${storageKey(key)}":`,
error
);

return [];
}
}

// Speichert eine JSON-Liste mit dem zentralen Prefix.
function writeStorageList(key, list) {
localStorage.setItem(
storageKey(key),
JSON.stringify(list)
);
}

// Liest einen einzelnen JSON-Wert sicher aus dem localStorage.
function readStorageValue(key, fallback = null) {
try {
const value = localStorage.getItem(storageKey(key));

if (value === null) {
return fallback;
}

return JSON.parse(value);
} catch (error) {
console.error(
LOGPREFIX,
`Ungültiger Speicherwert für "${storageKey(key)}":`,
error
);

return fallback;
}
}

// Speichert einen einzelnen JSON-Wert mit dem zentralen Prefix.
function writeStorageValue(key, value) {
localStorage.setItem(
storageKey(key),
JSON.stringify(value)
);
}

// Einmalige Migration des alten Mod-Kanal-Schlüssels.
//
// Die frühere Version verwendete "myModChannels" ohne Prefix.
// Vorhandene Daten werden deshalb einmalig in "_QMD_myModChannels"
// übernommen. Neue Schreibvorgänge verwenden ausschließlich den Prefix.
function migrateLegacyStorage() {
const currentKey = storageKey('myModChannels');
const legacyKey = 'myModChannels';

if (
!localStorage.getItem(currentKey) &&
localStorage.getItem(legacyKey)
) {
try {
const legacyChannels =
JSON.parse(localStorage.getItem(legacyKey));

if (Array.isArray(legacyChannels)) {
writeStorageList(
'myModChannels',
legacyChannels
);
}
} catch (error) {
console.error(
LOGPREFIX,
'Die alten Mod-Kanäle konnten nicht übernommen werden:',
error
);
}
}
}

migrateLegacyStorage();

// ############################################################################
// ##### AKTUELLEN KANAL AUS DER URL ERMITTELN ###############################
// ############################################################################

function getActiveChannel() {
const pathname = window.location.pathname
.replace(/^\/+|\/+$/g, '');

const pathParts = pathname
.split('/')
.filter(Boolean);

if (pathParts.length === 0) {
return '';
}

if (pathParts[0].toLowerCase() === 'home') {
return pathParts[1] || '';
}

if (pathParts[0].toLowerCase() === 'moderator') {
return pathParts[1] || '';
}

return pathParts[pathParts.length - 1] || '';
}

activeChannel = activeChannel.toLowerCase();

console.log(
LOGPREFIX,
'Aktiver Kanal:',
activeChannel
);

// ############################################################################
// ##### LOCALSTORAGE-SCHLÜSSEL FÜR BANN- UND UNBANLISTEN ####################
// ############################################################################

// Für jeden Twitch-Kanal werden eigene Listen verwendet.
const QMD_LocalStorageBanList =
storageKey(`${activeChannel}_banlist`);

const QMD_LocalStorageUnBanList =
storageKey(`${activeChannel}_unbanlist`);

const QMD_LocalStorageModChannels =
storageKey('myModChannels');

// Gespeicherte Bann- und Unbanlisten laden.
let QMD_bannedUsersStore =
readStorageValue(
`${activeChannel}_banlist`,
[]
);

let QMD_unbannedUsersStore =
readStorageValue(
`${activeChannel}_unbanlist`,
[]
);

// Gespeicherte Mod-Kanäle laden.
let QMD_modChannelStore =
readStorageList('myModChannels');

// ############################################################################
// ##### CORS-KONFIGURATION FÜR DEN IMPORT VON GITHUB-LISTEN #################
// ############################################################################

const QMD_corsDisable = {
id: 1,
enabled: true,
name: 'Allow All',
match: '<all_urls>',
action: 'allow',
responseHeaders: [
{
name: 'Access-Control-Allow-Origin',
value: '*'
}
]
};

// ############################################################################
// ##### CORS-KONFIGURATION SPEICHERN ########################################
// ############################################################################

if (typeof GM_setValue === 'function') {
GM_setValue(
storageKey('corsDisable'),
JSON.stringify(QMD_corsDisable)
);
} else {
writeStorageValue(
'corsDisable',
QMD_corsDisable
);
}

// ############################################################################
// ##### GM_ADDSTYLE-FALLBACK DEFINIEREN #####################################
// ############################################################################

if (typeof GM_addStyle === 'undefined') {
window.GM_addStyle = (css) => {
const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);
};
}

// ############################################################################
// ##### EXTERNE BIBLIOTHEKEN LADEN ###########################################
// ############################################################################

function loadExternalLibraries() {
if (!window.jQuery) {
const jqueryScript = document.createElement('script');

jqueryScript.src =
'https://code.jquery.com/jquery-3.6.0.min.js';

jqueryScript.async = true;
document.head.appendChild(jqueryScript);
}

if (!window.jQuery || !window.jQuery.ui) {
const jqueryUIScript = document.createElement('script');

jqueryUIScript.src =
'https://code.jquery.com/ui/1.13.0/jquery-ui.min.js';

jqueryUIScript.async = true;
document.head.appendChild(jqueryUIScript);
}
}

loadExternalLibraries();

// ############################################################################
// ##### HTML-STRUKTUR UND STYLES DES MOD-TOOLS ##############################
// ############################################################################

const html = /* html */ `
<div id="raidhammer" class="raidhammer">
<style>
.raidhammer {
z-index: 99999999;
position: absolute;
top: 250px;
left: 350px;
min-width: 525px;
padding: 5px;
background-color: var(--color-background-base);
color: var(--color-text-base);
border: var(--border-width-default) solid var(--color-border-base);
box-shadow: var(--shadow-elevation-2);
cursor: move;
}

.raidhammer .handle {
cursor: move;
user-select: none;
}

.raidhammer .svg {
color: "${themeTextColor}";
}

.raidhammer h6 {
color: var(--color-hinted-grey-7);
}

.raidhammer h6 button {
height: auto;
background: none;
}

.raidhammer .header {
display: flex;
align-items: center;
}

.raidhammer .logo {
min-height: 30px;
line-height: 30px;
font-weight: var(--font-weight-semibold);
--color: var(--color-text-link);
}

.raidhammer .list {
min-height: 8em;
max-height: 350px;
padding: 8px;
overflow-y: auto;
background: var(--color-background-body);
}

.raidhammer .list span {
font-weight: var(--font-weight-semibold);
}

.raidhammer .empty {
padding: 2em;
text-align: center;
opacity: 0.85;
}

.raidhammer button {
min-width: 30px;
height: var(--button-size-default);
margin: 1px;
padding: 0 0.5em;
border-radius: var(--border-radius-medium);
background-color: var(--color-background-button-secondary-default);
color: var(--color-text-button-secondary);
font-size: var(--button-text-default);
font-weight: var(--font-weight-semibold);
text-align: center;
}

.raidhammer button.ban {
min-width: 60px;
background: #f44336;
color: var(--color-text-button-primary);
}

.raidhammer button.banAll {
min-width: 40px;
background: #f44336;
color: var(--color-text-button-primary);
}

.raidhammer button.unban {
min-width: 60px;
background: #34ae0c;
color: var(--color-text-button-primary);
}

.raidhammer button.unbanAll {
min-width: 40px;
background: #34ae0c;
color: var(--color-text-button-primary);
}

.raidhammer .import {
min-height: 20px;
padding: 3px;
background: var(--color-background-body);
border: var(--border-width-default) solid var(--color-border-base);
}

.raidhammer textarea {
width: 100%;
min-height: 8em;
padding: 0.5em;
background: var(--color-background-base);
color: var(--color-text-base);
font-size: 10pt;
}

.raidhammer .footer {
font-size: 7pt;
text-align: center;
}
</style>

<div class="header">
<span class="handle"></span>

<!-- Umschalter für die Sichtbarkeit des Mod-Menüs -->
<button
class="modMenuToggle"
type="button"
title="Mod-Menü ein- oder ausblenden"
aria-label="Mod-Menü ein- oder ausblenden"
style="display: inline-flex;"
>
<img
class="modMenuToggleImage"
src="${isModMenuVisible ? modMenuOnImage : modMenuOffImage}"
title="Mod-Menü ein- oder ausblenden"
alt="Mod-Menü"
width="20"
height="20"
>
</button>

<span style="flex-grow: 1;"></span>

<!-- Repository-Link und Tool-Titel -->
<h5 id="header" class="logo">
<a
href="https://github.com/QueerModsDACH/MagicCleaningTool"
target="_blank"
rel="noopener noreferrer"
style="color: ${themeTextColor};"
title="Zum QueerModsDACH Repository"
>
Magic Cleaning Tool&nbsp;&nbsp;
<img
src="https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/pix/activate.png"
alt="Repository öffnen"
width="18"
height="18"
style="vertical-align: middle;"
>
&nbsp;&nbsp;for a little better World
</a>
</h5>

<span style="flex-grow: 1;"></span>

<!-- Fenster schließen beziehungsweise minimieren -->
<button class="closeBtn">_</button>
</div>

<!-- Importbereich -->
<div id="import" class="import" style="display: none;">
<textarea
id="textfield"
placeholder="Ein Benutzername pro Zeile"
></textarea>

<div style="text-align: right;">
<input
type="text"
id="banReason"
style="width: 66%;"
placeholder="Hier optional einen eigenen Ban-Grund angeben"
>

<button
class="importBtn"
title="Benutzer zur Liste hinzufügen"
style="width: 32%;"
>
Hinzufügen
</button>
</div>

<div style="text-align: center;">
<button
id="Button_Suspect"
class="Button_Suspect"
style="width: 32%;"
title="Importiert die suspect-Liste"
>
${Button_Suspect_Text}
</button>

<button
id="mdgBtnTrolls1"
class="mdgBtnTrolls1"
style="width: 33%;"
title="Importiert die hate_troll-Liste 2"
>
${mdgBtnTrollsText1}
</button>

<button
id="mdgBtnTrolls2"
class="mdgBtnTrolls2"
style="width: 32%;"
title="Importiert die hate_troll-Liste 3"
>
${mdgBtnTrollsText2}
</button>
</div>

<div style="text-align: center;">
<button
id="mdgBtnSec"
class="mdgBtnSec"
style="width: 32%;"
title="Importiert die security_ban-Liste"
>
${mdgBtnSec}
</button>

<button
id="mdgBtnViewerBots"
class="mdgBtnViewerBots"
style="width: 33%;"
title="Importiert die viewerbot-Liste"
>
${mdgBtnViewerBotsText}
</button>

<button
id="mdgBtnPornBot"
class="mdgBtnPornBot"
style="width: 32%;"
title="Importiert die porn_bots-Liste"
>
${mdgBtnPornBotText}
</button>
</div>

<div style="text-align: center;">
<button
id="mdgBtnFlirtyMad"
class="mdgBtnFlirtyMad"
style="width: 32%;"
title="Importiert die mad_tos-Liste"
>
${mdgBtnFlirtyMadText}
</button>

<button
id="mdgBtnFollowBot"
class="mdgBtnFollowBot"
style="width: 33%;"
title="Importiert die follow_bots-Liste"
>
${mdgBtnFollowBotText}
</button>

<button
id="mdgBtnUnban"
class="mdgBtnUnban"
style="width: 32%; color: #34ae0c;"
title="Importiert die unban-Liste"
>
${mdgBtnUnbanText}
</button>
</div>

<div style="text-align: center;">
<button
id="mdgBtnAdvertising"
class="mdgBtnAdvertising"
style="width: 32%;"
title="Importiert die advertising-Liste"
>
${mdgBtnAdvertisingText}
</button>

<button
id="mdgBtnSpamBots"
class="mdgBtnSpamBots"
style="width: 33%;"
title="Importiert die spam_bots-Liste"
>
${mdgBtnSpamBotsText}
</button>

<button
id="qmd"
class="qmd"
style="width: 32%;"
title="QueerModsDACH"
>
${Button_Info_Text}
</button>
</div>
</div>

<!-- Hauptbereich und Benutzerliste -->
<div class="body">
<div class="list"></div>

<div style="display: flex; margin: 5px;">
<span style="flex-grow: 2;"></span>

<div id="buttons" class="buttons">

<!-- Ansichten -->
<button class="back" title="Zurück">⬅</button>

<!-- Cache und externe Werkzeuge -->
<button
class="clearBannedUsers"
title="Gespeicherte gebannte Benutzer löschen"
>
ban-cache leeren 🗑
</button>

<button class="MooBot" title="Öffnet Moobot">
<img
src="https://moo.bot/favicon.ico"
height="17px"
>
</button>

<button class="NightBot" title="Öffnet Nightbot">
<img
src="https://logodix.com/logo/1909538.png"
height="17px"
>
</button>

<button
class="comanderRoot"
title="Öffnet ComanderRoot"
>
🤖
</button>

<button class="sLabs" title="Öffnet Streamlabs">
<img
src="https://cdn.streamlabs.com/static/imgs/streamlabs-logos/app-icon/streamlabs-app-icon.png"
height="17px"
>
</button>

<button class="sElements" title="Öffnet Streamelements">
<img
src="https://avatars.githubusercontent.com/u/16977512?s=17&v=4"
>
</button>

<!-- Kanalstatistiken und Moderationswerkzeuge -->
<button
class="chatstats"
title="Öffnet SullyGnome-Kanalstatistiken"
>
📈
</button>

<button
class="modLogger"
title="Öffnet ModLogger für den aktuellen Kanal"
>
🗄
</button>

<button
class="chatDeepStats"
title="Öffnet ChatStats für den aktuellen Kanal"
>
🩻
</button>

<!-- Listenaktionen -->
<button class="pause" id="pause" title="Pause/Play">
⏸
</button>

<button
class="modChannels"
title="Alle als Mod-Kanal hinzufügen"
>
⚔
</button>

<button class="ignoreAll" title="Liste leeren">
🗑
</button>

<button
class="unbanAll"
title="Alle auf der Liste entbannen"
>
👹
</button>

<button
class="banAll"
title="Alle auf der Liste bannen"
>
⚔
</button>

</div>
</div>
</div>

<!-- Footer -->
<div id="footer" class="footer">
<a
href="${urlBannlisten}"
target="_blank"
rel="noopener noreferrer"
style="color: ${themeTextColor};"
id="replaceFooter"
title="Zur Liste"
>
MagicCleaningTool Listen
</a>

&nbsp;-&nbsp;

<a
id="manoooo"
href="https://github.com/QueerModsDACH/MagicCleaningTool/raw/main/MagicCleaningTool.user.js"
title="Aktuelle Version installieren"
>
${updateText}
</a>

&nbsp;-&nbsp;&nbsp;
${myVersion}
</div>
</div>
`;

// ############################################################################
// ##### JAVASCRIPT: MODAL UND TOOL-CONTAINER ERSTELLEN #######################
// ############################################################################

const d = document.createElement('div');
d.style.display = 'none';
d.innerHTML = html;

const textarea = d.querySelector('textarea');

// Fügt das Tool auch dann ein, wenn document-idle bereits nach
// DOMContentLoaded ausgeführt wurde.
function appendToolToDocument() {
if (!document.body.contains(d)) {
document.body.appendChild(d);
}
}

if (document.body) {
appendToolToDocument();
} else {
document.addEventListener(
'DOMContentLoaded',
appendToolToDocument,
{ once: true }
);
}

// Aktivierungsbutton für das Twitch-Menü
const activateBtn = document.createElement('button');

activateBtn.innerHTML = `
<img
src="${activateImage}"
alt="Aktivieren"
width="25"
height="25"
>
`;

activateBtn.style.cssText = `
display: inline-flex;
align-items: center;
justify-content: center;
user-select: none;
height: var(--button-size-default);
width: var(--button-size-default);
border-radius: var(--border-radius-medium);
background-color: var(--color-background-button-text-default);
color: var(--color-fill-button-icon);
`;

activateBtn.id = 'hammer';
activateBtn.title = 'Magic Cleaning Tool';

let enabled = false;
let watchdogTimer = null;

// ############################################################################
// ##### HILFSFUNKTION FÜR DRAGGABLE ##########################################
// ############################################################################

function makeToolDraggable() {
const tool = d.querySelector('.raidhammer');

if (!tool) {
return;
}

// Verhindert, dass der Drag-Handler mehrfach registriert wird.
if (tool.dataset.qmdDraggable === 'true') {
return;
}

tool.dataset.qmdDraggable = 'true';
tool.style.touchAction = 'none';

let isDragging = false;
let startPointerX = 0;
let startPointerY = 0;
let startLeft = 0;
let startTop = 0;

// Elemente, bei denen ein normaler Klick weiterhin möglich sein muss.
const isInteractiveElement = (target) => {
return Boolean(
target.closest(
'button, a, input, textarea, select, option, img, .import, .list'
)
);
};

tool.addEventListener(
'pointerdown',
(event) => {
if (event.button !== 0) {
return;
}

if (isInteractiveElement(event.target)) {
return;
}

const toolRect = tool.getBoundingClientRect();

isDragging = true;
startPointerX = event.clientX;
startPointerY = event.clientY;
startLeft = toolRect.left;
startTop = toolRect.top;

// Die Position wird auf die aktuelle Bildschirmposition
// umgestellt, damit beim ersten Verschieben kein Sprung entsteht.
tool.style.left = `${startLeft}px`;
tool.style.top = `${startTop}px`;
tool.style.right = 'auto';
tool.style.bottom = 'auto';

tool.setPointerCapture(event.pointerId);
event.preventDefault();
},
false
);

tool.addEventListener(
'pointermove',
(event) => {
if (!isDragging) {
return;
}

const newLeft =
startLeft + (event.clientX - startPointerX);

const newTop =
startTop + (event.clientY - startPointerY);

tool.style.left = `${newLeft}px`;
tool.style.top = `${newTop}px`;
},
false
);

const stopDragging = (event) => {
if (!isDragging) {
return;
}

isDragging = false;

if (
event.pointerId !== undefined &&
tool.hasPointerCapture(event.pointerId)
) {
tool.releasePointerCapture(event.pointerId);
}
};

tool.addEventListener(
'pointerup',
stopDragging,
false
);

tool.addEventListener(
'pointercancel',
stopDragging,
false
);
}

// ############################################################################
// ##### JAVASCRIPT: PAUSE-FUNKTION ###########################################
// ############################################################################

function pauseBanAll() {
isPaused = !isPaused;

const button = d.querySelector('#pause');

if (!button) {
return;
}

if (isPaused) {
button.value = 'unpause';
button.textContent = 'Unpause';
} else {
button.value = 'pause';
button.textContent = 'Pause';
}
}

// ############################################################################
// ##### BENUTZERSTATUS UND LISTENAKTIONEN ####################################
// ############################################################################

function userAlreadyBanned(user, buttonId) {
if (!QMD_bannedUsersStore.includes(user)) {
queueList.add(user);
} else {
const button = d.querySelector(`#${buttonId}`);

if (button) {
button.innerHTML = 'already banned';
}

console.log(
LOGPREFIX,
`${user} already banned in ${activeChannel}`
);
}
}

function userAlreadyUnBanned(user, buttonId) {
if (!QMD_unbannedUsersStore.includes(user)) {
queueList.add(user);
} else {
const button = d.querySelector(`#${buttonId}`);

if (button) {
button.innerHTML = 'already unbanned';
}

console.log(
LOGPREFIX,
`${user} already unbanned in ${activeChannel}`
);
}
}

// ############################################################################
// ##### BENUTZEROBERFLÄCHE UND FENSTERSTEUERUNG #############################
// ############################################################################

function show() {
console.log(LOGPREFIX, 'Show');

appendToolToDocument();

d.style.display = '';
enabled = true;

makeToolDraggable();
renderList();
}

function hide() {
console.log(LOGPREFIX, 'Hide');

d.style.display = 'none';
enabled = false;
}

function toggle() {
if (d.style.display !== 'none') {
hide();
} else {
show();
}

checkVersion();
}

function toggleImport() {
const textField = d.querySelector('#textfield');
const importDiv = d.querySelector('.import');
const body = d.querySelector('.body');

textField.value = '';

if (importDiv.style.display !== 'none') {
importDiv.style.display = 'none';
body.style.display = '';
} else {
importDiv.style.display = '';
body.style.display = 'none';
textField.focus();
}
}

function toggleBack() {
queueList.clear();

d.querySelector('#textfield').value = '';

const body = d.querySelector('.body');
const importDiv = d.querySelector('.import');

insertText('');

if (importDiv.style.display !== 'none') {
importDiv.style.display = 'none';
body.style.display = '';
} else {
importDiv.style.display = '';
body.style.display = 'none';
d.querySelector('.import textarea').focus();
}

d.querySelector('#replaceFooter').innerHTML =
'Alle Bannlisten anzeigen';

d.querySelector('#replaceFooter').href =
urlBannlisten;
}

function togglePause() {
const button = d.querySelector('#pause');

if (!button) {
return;
}

isPaused = !isPaused;

if (isPaused) {
button.value = 'play';
button.textContent = '▶';
button.title = 'Fortsetzen';
} else {
button.value = 'pause';
button.textContent = '⏸';
button.title = 'Pausieren';
}
}

// ############################################################################
// ##### MOD-MENÜ-SICHTBARKEIT ###############################################
// ############################################################################

// Aktualisiert das Bild des Mod-Menü-Umschalters.
function updateModMenuToggleImage() {
const button = d.querySelector('.modMenuToggle');
const image = d.querySelector('.modMenuToggleImage');

if (!button || !image) {
return;
}

image.src = isModMenuVisible
? modMenuOnImage
: modMenuOffImage;

image.alt = isModMenuVisible
? 'Mod-Menü eingeschaltet'
: 'Mod-Menü ausgeschaltet';

image.title = isModMenuVisible
? 'Mod-Menü ausblenden'
: 'Mod-Menü einblenden';

button.title = image.title;
button.setAttribute(
'aria-label',
image.title
);
}

// Setzt die Sichtbarkeit des eigentlichen Mod-Menüs.
// Die Prüfung auf Moderationsrechte erfolgt weiterhin in modMenu().
function applyModMenuVisibility() {
const state = window.__QMD_MOD_MENU_STATE__;
if (!state) {
return;
}

const displayValue = isModMenuVisible
? ''
: 'none';

if (state.dropdownButton) {
state.dropdownButton.style.display = displayValue;
}

// Die Liste darf hier bei sichtbarem Mod-Menü nicht erneut
// ausgeblendet werden. Sie wird durch den Klick auf den Button
// geöffnet und bleibt anschließend geöffnet, bis außerhalb der
// Liste geklickt oder eine Auswahl angeklickt wird.
if (state.dropdownList && !isModMenuVisible) {
state.dropdownList.style.display = 'none';
}

updateModMenuToggleImage();
}

// Schaltet das Mod-Menü ein beziehungsweise aus und speichert
// den neuen Zustand dauerhaft im Browser.
function toggleModMenuVisibility() {
isModMenuVisible = !isModMenuVisible;

writeStorageValue(
MOD_MENU_VISIBILITY_STORAGE_KEY,
isModMenuVisible
);

applyModMenuVisibility();

console.log(
LOGPREFIX,
`Mod-Menü ist jetzt ${
isModMenuVisible ? 'sichtbar' : 'verborgen'
}.`
);
}

// ############################################################################
// ##### VERSIONS- UND EXTERNE FUNKTIONEN #####################################
// ############################################################################

function checkVersion() {
fetch(
'https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/MagicCleaningTool.user.js'
)
.then((response) => response.text())
.then((versionText) => {
const regex = /@version\s+(\d.*)/;
const match = regex.exec(versionText);

if (!match) {
return;
}

const newVersion = match[1];
const versionElement = d.querySelector('#manoooo');

if (!versionElement) {
return;
}

if (myVersion < newVersion) {
versionElement.innerHTML = 'Update verfügbar 🚨';
} else {
versionElement.innerHTML = updateText;
}
})
.catch((error) => {
console.error(
LOGPREFIX,
'Versionsprüfung fehlgeschlagen:',
error
);
});
}

function openExternal(url) {
window.open(
url,
'_blank',
'noopener,noreferrer'
);
}

function qmd() {
openExternal('https://github.com/QueerModsDACH/');
}

// ############################################################################
// ##### BUTTON-EVENTS EINRICHTEN ############################################
// ############################################################################

function setupButtonEvents() {
d.querySelector('.ignoreAll').onclick = ignoreAll;
d.querySelector('.banAll').onclick = banAll;
d.querySelector('.closeBtn').onclick = hide;
d.querySelector('.modChannels').onclick = addModChannelsAll;
d.querySelector('.unbanAll').onclick = unbanAll;
d.querySelector('.back').onclick = toggleBack;
d.querySelector('.pause').onclick = togglePause;

// Der frühere "princess"-Button ist jetzt der Umschalter
// für die Sichtbarkeit des Mod-Menüs.
d.querySelector('.modMenuToggle').onclick =
toggleModMenuVisibility;

d.querySelector('.qmd').onclick = qmd;
d.querySelector('.importBtn').onclick = importList;

d.querySelector('.clearBannedUsers').onclick =
clearBannedUsers;

d.querySelector('.MooBot').onclick = () =>
openExternal('https://moo.bot/');

d.querySelector('.NightBot').onclick = () =>
openExternal('https://nightbot.tv/dashboard');

d.querySelector('.comanderRoot').onclick = () =>
openExternal('https://twitch-tools.rootonline.de');

d.querySelector('.sLabs').onclick = () =>
openExternal('https://streamlabs.com/dashboard');

d.querySelector('.sElements').onclick = () =>
openExternal('https://streamelements.com/dashboard');

d.querySelector('.chatstats').onclick = () =>
openExternal(
`https://sullygnome.com/channel/${encodeURIComponent(activeChannel)}`
);

d.querySelector('.modLogger').onclick = () =>
openExternal(
`https://jvpeek.github.io/twitchmodlogger/?channel=${encodeURIComponent(activeChannel)}`
);

d.querySelector('.chatDeepStats').onclick = () =>
openExternal(
`https://echtkpvl.github.io/echt-twitch/chat-stats.html?channel=${encodeURIComponent(activeChannel)}`
);

d.addEventListener('click', (event) => {
// Neben Buttons werden auch das Startbanner und andere Elemente
// mit der Klasse "toggleImport" beziehungsweise "start" erkannt.
const target = event.target.closest(
'button, .toggleImport, .start'
);

if (!target) {
return;
}

if (target.matches('.ignore')) {
ignoreItem(target.dataset.user);
}

if (target.matches('.ban')) {
banItem(target.dataset.user);
}

if (target.matches('.unban')) {
unbanItem(target.dataset.user);
}

if (target.matches('.accountage')) {
accountage(target.dataset.user);
}

// Das Startbanner Logo_1920x400.png besitzt die Klasse
// "toggleImport" und öffnet damit wieder die Auswahl
// der Bannlisten.
if (target.matches('.toggleImport, .start')) {
toggleImport();
}

if (target.matches('.removeModChannel')) {
removeModChannel(target.dataset.user);
}

if (target.matches('.addModChannels')) {
addModChannel(target.dataset.user);
}
});

d.querySelector('.Button_Suspect').onclick =
import_Suspect;

d.querySelector('.mdgBtnTrolls1').onclick =
importMDGtrolls1;

d.querySelector('.mdgBtnTrolls2').onclick =
importMDGtrolls2;

d.querySelector('.mdgBtnSec').onclick =
importMDGsec;

d.querySelector('.mdgBtnViewerBots').onclick =
importMDGViewerBots;

d.querySelector('.mdgBtnFlirtyMad').onclick =
importMDGFlirtyMad;

d.querySelector('.mdgBtnFollowBot').onclick =
importMDGFollowBot;

d.querySelector('.mdgBtnAdvertising').onclick =
importMDGAdvertising;

d.querySelector('.mdgBtnSpamBots').onclick =
importMDGSpamBots;

d.querySelector('.mdgBtnPornBot').onclick =
importMDGPorn;

// Der Aktivierungsbutton wird erst hier mit seiner Funktion verbunden,
// damit alle benötigten Funktionen bereits definiert sind.
activateBtn.onclick = toggle;
}

setupButtonEvents();

// ############################################################################
// ##### JAVASCRIPT: GESPEICHERTE BANNLISTE LÖSCHEN ###########################
// ############################################################################

function clearBannedUsers() {
localStorage.removeItem(QMD_LocalStorageBanList);
QMD_bannedUsersStore = [];
renderList();
}

// ############################################################################
// ##### IMPORT UND EINGABEVERARBEITUNG #######################################
// ############################################################################

function insertText(value) {
d.querySelector('#textfield').value =
Array.isArray(value)
? value.join('\n')
: value;
}

function importList() {
const importTextarea =
d.querySelector('.import textarea');

const lines =
importTextarea.value
.split(/\n/)
.map((line) => line.trim())
.filter(Boolean);

for (const line of lines) {
if (/^[\w_]+$/.test(line)) {
queueList.add(line);
}
}

importTextarea.value = '';
toggleImport();
renderList();
}

function importMDGGeneric(
url,
buttonId,
defaultButtonText,
footerText,
footerHref,
useUnban = false,
listBanReason = defaultBanReason
) {
queueList.clear();

const usersToProcess = [];
const banReasonInput = d.querySelector('#banReason');

if (
!useUnban &&
banReasonInput &&
banReasonInput.value.trim() === ''
) {
banReasonInput.value = listBanReason;
}

fetch(url)
.then((response) => response.text())
.then((data) => {
usersToProcess.push(
...data
.split('\n')
.map((name) => name.replace(/\r/g, '').trim())
.filter(Boolean)
);

usersToProcess.forEach((name) => {
if (useUnban) {
userAlreadyUnBanned(name, buttonId);
} else {
userAlreadyBanned(name, buttonId);
}
});

if (buttonId === 'mdgBtnAdvertising') {
renderList();
}

textarea.value = '';
insertText(Array.from(queueList));

if (queueList.size !== 0) {
toggleImport();
renderList();
}
})
.catch((error) => {
console.error(
LOGPREFIX,
`Liste konnte nicht geladen werden: ${url}`,
error
);
});

const footer = d.querySelector('#replaceFooter');

if (footer) {
footer.innerHTML = footerText;
footer.href = footerHref;
}

setTimeout(() => {
const button = d.querySelector(`#${buttonId}`);

if (button) {
button.innerHTML = defaultButtonText;
}
}, 5000);
}

// Importfunktionen mit den jeweiligen Listen.
function import_Suspect() {
importMDGGeneric(
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/suspect.txt',
'Button_Suspect',
Button_Suspect_Text,
"Geladene Liste 'suspect.txt' anzeigen",
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/suspect.txt',
false,
'suspect (QMD-List)'
);
}

function importMDGtrolls1() {
importMDGGeneric(
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/hate_troll_list_2.txt',
'mdgBtnTrolls1',
mdgBtnTrollsText1,
"Geladene Liste 'hate_troll_list_2.txt' anzeigen",
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/hate_troll_list_2.txt'
);
}

function importMDGtrolls2() {
importMDGGeneric(
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/hate_troll_list_3.txt',
'mdgBtnTrolls2',
mdgBtnTrollsText2,
"Geladene Liste 'hate_troll_list_3.txt' anzeigen",
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/hate_troll_list_3.txt'
);
}

function importMDGsec() {
importMDGGeneric(
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/security_ban_list.txt',
'mdgBtnSec',
mdgBtnSec,
"Geladene Liste 'security_ban_list.txt' anzeigen",
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/security_ban_list.txt'
);
}

function importMDGUnban() {
importMDGGeneric(
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/unbanlist.txt',
'mdgBtnUnban',
mdgBtnUnbanText,
'Geladene Liste unbanlist.txt anzeigen',
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/unbanlist.txt',
true
);
}

function importMDGViewerBots() {
importMDGGeneric(
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/viewer_bot_list.txt',
'mdgBtnViewerBots',
mdgBtnViewerBotsText,
'Geladene Liste viewer_bot_list.txt anzeigen',
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/viewer_bot_list.txt'
);
}

function importMDGFlirtyMad() {
importMDGGeneric(
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/mad_tos_list.txt',
'mdgBtnFlirtyMad',
mdgBtnFlirtyMadText,
'Geladene Liste mad_tos_list.txt anzeigen',
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/mad_tos_list.txt'
);
}

function importMDGFollowBot() {
importMDGGeneric(
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/follower_bot_list.txt',
'mdgBtnFollowBot',
mdgBtnFollowBotText,
'Geladene Liste follower_bot_list.txt anzeigen',
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/follower_bot_list.txt'
);
}

function importMDGAdvertising() {
importMDGGeneric(
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/seller_advertising_list.txt',
'mdgBtnAdvertising',
mdgBtnAdvertisingText,
'Geladene Liste seller_advertising_list.txt anzeigen',
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/seller_advertising_list.txt'
);
}

function importMDGSpamBots() {
importMDGGeneric(
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/spam_bot_list.txt',
'mdgBtnSpamBots',
mdgBtnSpamBotsText,
'Geladene Liste spam_bot_list.txt anzeigen',
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/spam_bot_list.txt'
);
}

function importMDGPorn() {
importMDGGeneric(
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/porn_bot_acc_list.txt',
'mdgBtnPornBot',
mdgBtnPornBotText,
'Geladene Liste porn_bot_acc_list.txt anzeigen',
'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/porn_bot_acc_list.txt'
);
}

// ############################################################################
// ##### EINZEL- UND MASSENAKTIONEN ###########################################
// ############################################################################

function ignoreAll() {
console.log(
LOGPREFIX,
'Ignoring all...',
queueList
);

for (const user of [...queueList]) {
ignoreItem(user);
}
}

async function banAll() {
console.log(
LOGPREFIX,
'Banning all...',
queueList
);

for (const user of [...queueList]) {
while (isPaused) {
await delay(DELAY_PAUSE_CHECK);
}

banItem(user);
await delay(DELAY_BAN_ACTION);
}
}

async function unbanAll() {
console.log(
LOGPREFIX,
'Unbanning all...',
queueList
);

for (const user of [...queueList]) {
while (isPaused) {
await delay(DELAY_PAUSE_CHECK);
}

unbanItem(user);
await delay(DELAY_UNBAN_ACTION);
}
}

async function addModChannelsAll() {
console.log(
LOGPREFIX,
'Add Mod-Channels...',
queueList
);

for (const user of [...queueList]) {
while (isPaused) {
await delay(DELAY_PAUSE_CHECK);
}

addModChannels(user);
await delay(DELAY_BAN_ACTION);
}
}

function accountage(user) {
console.log(
LOGPREFIX,
'send !accountage',
user
);

sendMessage(`!accountage ${user}`);
}

function ignoreItem(user) {
console.log(
LOGPREFIX,
'Ignore user:',
user
);

queueList.delete(user);
ignoredList.add(user);
renderList();
}

function unbanItem(user) {
console.log(
LOGPREFIX,
'Unban user:',
user
);

queueList.delete(user);
bannedList.add(user);

if (!QMD_unbannedUsersStore.includes(user)) {
QMD_unbannedUsersStore.push(user);
}

QMD_bannedUsersStore =
QMD_bannedUsersStore.filter(
(storedUser) => storedUser !== user
);

sendMessage(`/unban ${user}`);

writeStorageValue(
`${activeChannel}_unbanlist`,
QMD_unbannedUsersStore
);

writeStorageValue(
`${activeChannel}_banlist`,
QMD_bannedUsersStore
);

renderList();
}

function removeModChannel(user) {
console.log(
LOGPREFIX,
'Remove User from ModChannels:',
user
);

queueList.delete(user);

QMD_modChannelStore =
QMD_modChannelStore.filter(
(channel) => channel !== user
);

writeStorageList(
'myModChannels',
QMD_modChannelStore
);

if (typeof window.refreshQMDModMenu === 'function') {
window.refreshQMDModMenu();
}

renderList();
}

function banItem(user) {
const reason =
d.querySelector('#banReason').value.trim() ||
defaultBanReason;

queueList.delete(user);
bannedList.add(user);

if (!QMD_bannedUsersStore.includes(user)) {
QMD_bannedUsersStore.push(user);
}

sendMessage(`/ban ${user} ${reason}`);

writeStorageValue(
`${activeChannel}_banlist`,
QMD_bannedUsersStore
);

renderList();
}

function addModChannels(user) {
const normalizedUser = user.trim().toLowerCase();

if (!QMD_modChannelStore.includes(normalizedUser)) {
console.log(
LOGPREFIX,
`${normalizedUser} zu ModChannels hinzugefügt`
);

queueList.delete(normalizedUser);
bannedList.add(normalizedUser);
QMD_modChannelStore.push(normalizedUser);

QMD_modChannelStore =
sortAndStoreModChannels(
QMD_modChannelStore
);

if (typeof window.refreshQMDModMenu === 'function') {
window.refreshQMDModMenu();
}

renderList();
} else {
console.log(
LOGPREFIX,
`Benutzer ${normalizedUser} ist bereits in den ModChannels.`
);
}
}

// ############################################################################
// ##### NACHRICHTEN AN DEN TWITCH-CHAT SENDEN ###############################
// ############################################################################

function sendMessage(message) {
try {
sendMessageOld(message);
} catch (error) {
console.warn(
LOGPREFIX,
'Alte Chat-Eingabemethode fehlgeschlagen:',
error
);

sendMessageSlate(message);
}
}

function sendMessageOld(message) {
const chatInput =
document.querySelector(
"[data-a-target='chat-input']"
);

const sendButton =
document.querySelector(
"[data-a-target='chat-send-button']"
);

if (!chatInput || !sendButton) {
throw new Error('Twitch-Chat-Eingabe nicht gefunden.');
}

const nativeValueSetter =
Object.getOwnPropertyDescriptor(
window.HTMLTextAreaElement.prototype,
'value'
).set;

nativeValueSetter.call(chatInput, message);

chatInput.dispatchEvent(
new Event('input', { bubbles: true })
);

sendButton.click();
}

function sendMessageSlate(message) {
const editor =
document.querySelector(
'[data-slate-editor="true"]'
);

if (!editor) {
throw new Error('Slate-Chat-Eingabe nicht gefunden.');
}

editor.focus();

editor.dispatchEvent(
new InputEvent('beforeinput', {
bubbles: true,
data: message,
inputType: 'insertText'
})
);

editor.dispatchEvent(
new InputEvent('input', {
bubbles: true,
data: message,
inputType: 'insertText'
})
);

editor.dispatchEvent(
new KeyboardEvent('keydown', {
bubbles: true,
key: 'Enter',
code: 'Enter',
keyCode: 13,
which: 13
})
);
}

// ############################################################################
// ##### LISTENANZEIGE UND RENDERING #########################################
// ############################################################################

function renderList() {
const buttonsToToggle = [
'.ignoreAll',
'.banAll',
'.back',
'.pause',
'.modChannels',
'.unbanAll'
];

buttonsToToggle.forEach((selector) => {
const button = d.querySelector(selector);

if (button) {
button.style.display =
queueList.size ? '' : 'none';
}
});

const renderItem = (item) => `
<li>
<button
class="accountage"
data-user="${escapeHtml(item)}"
title="Schreibt !accountage ${escapeHtml(item)} in den Chat"
>?</button>

<button
class="ignore"
data-user="${escapeHtml(item)}"
title="Benutzer aus Liste entfernen"
>
❌
</button>

<button
class="unban"
data-user="${escapeHtml(item)}"
title="Benutzer entbannen"
>Unban</button>

<button
class="ban"
data-user="${escapeHtml(item)}"
title="Benutzer bannen"
>Ban</button>

<button
class="addModChannels"
data-user="${escapeHtml(item)}"
title="Kanal als Mod-Kanal hinzufügen"
>
➕⚔
</button>

<button
class="removeModChannel"
data-user="${escapeHtml(item)}"
title="Kanal als Mod-Kanal entfernen"
>
➖⚔
</button>

<span>
<a
href="https://twitch-tools.rootonline.de/followinglist_viewer.php?username=${encodeURIComponent(item)}"
title="Dieser User folgt ... Weiterleitung zu CommanderRoot"
target="_blank"
rel="noopener noreferrer"
>
${escapeHtml(item)}
</a>
</span>
</li>
`;

const inner = queueList.size
? [...queueList].map(renderItem).join('')
: `
<div id="empty" class="empty">
<img
class="toggleImport"
src="https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/pix/Logo_1920x400.png"
title="Start Magic Cleaning Tool"
width="370"
style="cursor: pointer; max-height: 80px; min-height: 80px"
>
</div>
`;

d.querySelector('.list').innerHTML = `
<ul>${inner}</ul>
`;
}

function escapeHtml(value) {
return String(value)
.replaceAll('&', '&amp;')
.replaceAll('<', '&lt;')
.replaceAll('>', '&gt;')
.replaceAll('"', '&quot;')
.replaceAll("'", '&#039;');
}

// ############################################################################
// ##### MOD-MENÜ ############################################################
// ############################################################################

function sortAndStoreModChannels(channels) {
const uniqueChannels = [
...new Set(
channels
.filter(
(channel) =>
typeof channel === 'string' &&
channel.trim().length > 0
)
.map((channel) => channel.trim().toLowerCase())
)
];

uniqueChannels.sort((first, second) =>
first.localeCompare(
second,
'de',
{ sensitivity: 'base' }
)
);

writeStorageList(
'myModChannels',
uniqueChannels
);

QMD_modChannelStore = uniqueChannels;

return uniqueChannels;
}

function processStoredModChannels() {
return readStorageList('myModChannels');
}

function getModViewButton() {
return document.querySelector(
[
'[data-test-selector="mod-view-link"]',
'[data-a-target="mod-view-link"]'
].join(', ')
);
}

function getChannelFromModViewLink() {
const modButton = getModViewButton();

if (!modButton) {
return null;
}

const possibleHref =
modButton.href ||
modButton.getAttribute('href') ||
modButton.getAttribute('data-href');

if (!possibleHref) {
return null;
}

try {
const url = new URL(
possibleHref,
window.location.origin
);

const match =
url.pathname.match(
/^\/moderator\/([^/]+)/i
);

return match
? decodeURIComponent(match[1]).toLowerCase()
: null;
} catch (error) {
console.error(
LOGPREFIX,
'Kanalname aus dem Mod-Link konnte nicht gelesen werden:',
error
);

return null;
}
}

function getChannelFromModeratorUrl() {
const match =
window.location.pathname.match(
/^\/moderator\/([^/]+)/i
);

return match
? decodeURIComponent(match[1]).toLowerCase()
: null;
}

// Speichert den aktuell moderierten Kanal automatisch.
//
// Wichtig:
// Der Kanal wird erst gespeichert, wenn Twitch entweder den Mod-View-Link
// oder in der Mod-Ansicht den Chat-Button bereitstellt. Dadurch wird kein
// normal besuchter Kanal versehentlich als Mod-Kanal gespeichert.
function addCurrentModChannel() {
const modButton = getModViewButton();

const chatButton =
document.querySelector(
'[data-a-target="chat-send-button"]'
);

const isModeratorPage =
window.location.pathname
.toLowerCase()
.includes('/moderator/');

let currentChannel = null;

if (modButton) {
currentChannel =
getChannelFromModViewLink();
}

if (
!currentChannel &&
isModeratorPage &&
chatButton
) {
currentChannel =
getChannelFromModeratorUrl();
}

if (!currentChannel) {
return;
}

const storedChannels =
processStoredModChannels();

if (!storedChannels.includes(currentChannel)) {
storedChannels.push(currentChannel);

const sortedChannels =
sortAndStoreModChannels(storedChannels);

console.log(
LOGPREFIX,
`${currentChannel} wurde automatisch zu den ModChannels hinzugefügt`
);

// Das Dropdown wird sofort aktualisiert.
// Ein Browser-Reload ist nicht erforderlich.
if (typeof window.refreshQMDModMenu === 'function') {
window.refreshQMDModMenu(sortedChannels);
}
} else {
sortAndStoreModChannels(storedChannels);
}
}

function modMenu() {
if (window.__QMD_MOD_MENU_STATE__) {
window.__QMD_MOD_MENU_STATE__.run();
return;
}

const state = {
dropdownButton: null,
dropdownList: null,
logoContainer: null,
documentClickHandler: null,
createAttempts: 0,
run: null
};

window.__QMD_MOD_MENU_STATE__ = state;

function getHomeLink() {
return document.querySelector(
'[data-a-target="home-link"]'
);
}

function hasModeratorTools() {
const modButton =
document.querySelector(
'[data-test-selector="mod-view-link"], [data-a-target="mod-view-link"]'
);

const chatButton =
document.querySelector(
'[data-a-target="chat-send-button"]'
);

const isModeratorPage =
window.location.pathname
.toLowerCase()
.includes('/moderator/');

return Boolean(modButton) ||
(isModeratorPage && Boolean(chatButton));
}

function renderDropdownList(channels = null) {
if (!state.dropdownList) {
return;
}

state.dropdownList.replaceChildren();

const storedChannels =
channels ||
sortAndStoreModChannels(
processStoredModChannels()
);

if (storedChannels.length === 0) {
const listItem = document.createElement('li');
const linkItem = document.createElement('a');

linkItem.innerText =
'Bitte lies die Anleitung hier';

linkItem.href =
'https://github.com/QueerModsDACH/MagicCleaningTool/tree/main/Instructions';

linkItem.target = '_blank';
linkItem.rel = 'noopener noreferrer';
linkItem.title = 'Anleitung lesen';

listItem.appendChild(linkItem);
state.dropdownList.appendChild(listItem);

return;
}

storedChannels.forEach((channel) => {
const listItem =
document.createElement('li');

const linkItem =
document.createElement('a');

linkItem.innerText = channel;
linkItem.href =
`https://twitch.tv/moderator/${encodeURIComponent(channel)}`;

linkItem.target = '_blank';
linkItem.rel = 'noopener noreferrer';

linkItem.title =
`Mod-View für den Kanal ${channel}`;

linkItem.style.display = 'block';
linkItem.style.padding = '4px 8px';
linkItem.style.whiteSpace = 'nowrap';

listItem.appendChild(linkItem);
state.dropdownList.appendChild(listItem);
});
}

function createDropdownMenu() {
const referenceButton = getHomeLink();

// Twitch lädt den Header dynamisch.
// Wenn der Header noch nicht vorhanden ist, wird bei jedem weiteren
// Durchlauf erneut versucht, den Button zu erstellen.
if (
!referenceButton ||
!referenceButton.parentElement
) {
state.createAttempts += 1;
return false;
}

if (
state.dropdownButton &&
state.dropdownList &&
document.contains(state.dropdownButton)
) {
applyModMenuVisibility();
return true;
}

const logoContainer =
referenceButton.parentElement;

logoContainer.style.position = 'relative';
logoContainer.style.display = 'flex';
logoContainer.style.alignItems = 'center';

const dropdownButton =
document.createElement('button');

dropdownButton.id = 'modMenu';
dropdownButton.type = 'button';
dropdownButton.title = 'Mod-Kanäle';
dropdownButton.setAttribute(
'aria-label',
'Mod-Kanäle öffnen'
);

dropdownButton.innerHTML = `
<img
src="https://static-cdn.jtvnw.net/mod-view-image-assets/modview-sword.svg"
width="25"
height="25"
alt="Mod-Kanäle"
>
`;

dropdownButton.style.cssText = `
width: 25px;
height: 25px;
padding: 0;
margin-left: 8px;
margin-top: 12px;
display: inline-flex;
align-items: center;
justify-content: center;
border: none;
color: #9146FF;
background-color: transparent;
cursor: pointer;
`;

const dropdownList =
document.createElement('ul');

dropdownList.style.cssText = `
display: none;
position: absolute;
top: 38px;
left: 38px;
z-index: 99999999;
min-width: 180px;
max-height: 70vh;
overflow-y: auto;
margin: 0;
padding: 8px;
list-style: none;
background-color: #000;
border: 1px solid #9146FF;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
`;

dropdownButton.addEventListener(
'click',
(event) => {
event.stopPropagation();

if (!isModMenuVisible) {
return;
}

dropdownList.style.display =
dropdownList.style.display === 'none'
? 'block'
: 'none';
}
);

// Beim Anklicken einer Kanalauswahl wird die Dropdown-Liste
// geschlossen. Der Link wird weiterhin wie bisher geöffnet.
dropdownList.addEventListener(
'click',
(event) => {
const selectedLink =
event.target.closest('a');

if (selectedLink) {
dropdownList.style.display = 'none';
}
}
);

// Schließt die Mod-Kanal-Liste bei einem Klick außerhalb
// des Buttons beziehungsweise der Liste.
//
// Der Event-Listener wird in der Capture-Phase registriert.
// Dadurch funktioniert das Schließen auch dann, wenn Twitch
// oder ein anderes Element die normale Event-Weitergabe stoppt.
if (!state.documentClickHandler) {
state.documentClickHandler = (event) => {
const clickedInsideMenu =
(
state.logoContainer &&
state.logoContainer.contains(event.target)
) ||
(
state.dropdownButton &&
state.dropdownButton.contains(event.target)
) ||
(
state.dropdownList &&
state.dropdownList.contains(event.target)
);

if (
!clickedInsideMenu &&
state.dropdownList
) {
state.dropdownList.style.display = 'none';
}
};

document.addEventListener(
'click',
state.documentClickHandler,
true
);
}

state.dropdownButton = dropdownButton;
state.dropdownList = dropdownList;
state.logoContainer = logoContainer;

renderDropdownList();
applyModMenuVisibility();

// Globale Funktion für eine sofortige Aktualisierung,
// sobald ein neuer Mod-Kanal gespeichert wurde.
window.refreshQMDModMenu = (
channels = null
) => {
renderDropdownList(channels);
applyModMenuVisibility();
};

return true;
}

function appendModMenuButton() {
const menuCreated =
createDropdownMenu();

if (!menuCreated) {
return;
}

const modToolsAvailable =
hasModeratorTools();

// Auf nicht moderierten Seiten werden Button und Liste entfernt.
// Beim nächsten Durchlauf werden sie bei vorhandenen Mod-Rechten
// wieder eingefügt.
if (!modToolsAvailable) {
if (
state.dropdownButton &&
state.dropdownButton.isConnected
) {
state.dropdownButton.remove();
}

if (
state.dropdownList &&
state.dropdownList.isConnected
) {
state.dropdownList.remove();
}

return;
}

// Der aktuelle Mod-Kanal wird vor dem Rendern der Liste gespeichert.
// Dadurch erscheint er unmittelbar im Dropdown.
addCurrentModChannel();

const twitchLogo = getHomeLink();

if (
!twitchLogo ||
!twitchLogo.parentElement
) {
return;
}

const logoContainer =
twitchLogo.parentElement;

state.logoContainer = logoContainer;

logoContainer.style.position = 'relative';
logoContainer.style.display = 'flex';
logoContainer.style.alignItems = 'center';

// Button direkt neben dem Twitch-Logo einfügen.
if (
!logoContainer.contains(
state.dropdownButton
)
) {
if (twitchLogo.nextSibling) {
logoContainer.insertBefore(
state.dropdownButton,
twitchLogo.nextSibling
);
} else {
logoContainer.appendChild(
state.dropdownButton
);
}
}

// Dropdown-Liste im gleichen Header-Container platzieren.
if (
!logoContainer.contains(
state.dropdownList
)
) {
logoContainer.appendChild(
state.dropdownList
);
}

renderDropdownList();
applyModMenuVisibility();
}

state.run = appendModMenuButton;

// CSS für die Animation nur einmal hinzufügen.
if (!document.getElementById('mod-menu-style')) {
const style = document.createElement('style');

style.id = 'mod-menu-style';

style.textContent = `
@keyframes qmdModMenuPulse {
0% {
transform: scale(1);
}
50% {
transform: scale(1.1);
}
100% {
transform: scale(1);
}
}

#modMenu {
animation: qmdModMenuPulse 2s infinite;
}
`;

document.head.appendChild(style);
}

// Sofortiger erster Durchlauf.
state.run();
}

// ############################################################################
// ##### AKTIVIERUNGSBUTTON IM TWITCH-MENÜ ###################################
// ############################################################################

function appendActivatorBtn() {
const modBtn =
document.querySelector(
'[data-test-selector="mod-view-link"], [data-a-target="mod-view-link"]'
);

if (modBtn) {
const twitchBar =
modBtn.parentElement &&
modBtn.parentElement.parentElement &&
modBtn.parentElement.parentElement.parentElement;

if (
twitchBar &&
!twitchBar.contains(activateBtn)
) {
console.log(
LOGPREFIX,
'Mod tools available. Adding button...'
);

twitchBar.insertBefore(
activateBtn,
twitchBar.firstChild
);

appendToolToDocument();
makeToolDraggable();
}

return;
}

if (
window.location.pathname
.toLowerCase()
.includes('/moderator/')
) {
const chatBtn =
document.querySelector(
'[data-a-target="chat-send-button"]'
);

if (!chatBtn) {
return;
}

const twitchBar =
chatBtn.parentElement &&
chatBtn.parentElement.parentElement &&
chatBtn.parentElement.parentElement.parentElement;

if (
twitchBar &&
!twitchBar.contains(activateBtn)
) {
console.log(
LOGPREFIX,
'Mod tools available. Adding button...'
);

twitchBar.insertBefore(
activateBtn,
twitchBar.firstChild
);

appendToolToDocument();
makeToolDraggable();
}

return;
}

if (enabled) {
console.log(
LOGPREFIX,
'Mod tools not found. Stopped chatWatchdog!'
);

watchdogTimer = null;
enabled = false;
hide();
}
}

// Twitch rendert Header und Mod-Ansicht dynamisch.
// Deshalb werden beide Buttons dauerhaft geprüft.
setInterval(
appendActivatorBtn,
1000
);

// ############################################################################
// ##### STARTUP UND DAUERHAFTE TWITCH-PRÜFUNG ###############################
// ############################################################################

// Der entscheidende Fix:
// modMenu() wird nicht durch eine globale "bereits initialisiert"-Sperre
// beendet, bevor der Twitch-Header geladen wurde. Stattdessen bleibt der
// Prüfzyklus aktiv und erstellt den Button beim ersten vollständig
// verfügbaren Header.
modMenu();

setInterval(
modMenu,
1000
);

// Initiale Anzeige der Benutzerliste.
renderList();

// Initiales Bild des Mod-Menü-Umschalters.
updateModMenuToggleImage();

})();
