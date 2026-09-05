// ==UserScript==
// @name Magic Cleaning Tool
// @description Ein Tool, das die Moderation auf Twitch erleichtert
// @namespace Magic Cleaning Tool ...for a little better World
// @version 1.9.6.3
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

// ############################################################################
// ##### USERSCRIPT-KOPF UND METADATEN #####
// ############################################################################

(function () {
    'use strict';

    function processStoredModChannels() {
        const storedModChannels = JSON.parse(
            localStorage.getItem('myModChannels')
        );
    }

    processStoredModChannels();
})();

(function () {
    // ############################################################################
    // ##### EXTERNE BIBLIOTHEKEN LADEN #####
    // ############################################################################

    // jQuery für draggable Fenster und weitere DOM-Funktionen laden
    const jqueryScript = document.createElement('script');
    jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
    document.head.appendChild(jqueryScript);

    // jQuery UI für draggable Elemente laden
    const jqueryUiScript = document.createElement('script');
    jqueryUiScript.src = 'https://code.jquery.com/ui/1.13.0/jquery-ui.min.js';
    document.head.appendChild(jqueryUiScript);

    // ############################################################################
    // ##### ALLGEMEINE ANWENDUNGSKONFIGURATION #####
    // ############################################################################

    // Versionsnummer des Tools
    const toolVersion = '1.9.6.3';

    // Allgemeine Text- und Aktionsvariablen
    let currentBanReason;
    const defaultBanReason = 'Ban by QMD list';

    // URL zur Quelle der Bannlisten
    const banListsUrl =
        'https://github.com/QueerModsDACH/Listen';

    // Log-Präfix für die Browser-Konsole
    const logPrefix = '[QMD_MCT_1]';

    const browserStoragePrefix = '_QMD_';

    // ############################################################################
    // ##### TEXTE DER LISTEN- UND AKTIONSBUTTONS #####
    // ############################################################################

    // Werbe- und Botlisten
    const advertisingListButtonText = ' advertising';
    const followBotListButtonText = ' follow_bots';
    const viewerBotsListButtonText = ' viewer_bots';
    const spamBotsListButtonText = ' spam_bots';
    const pornBotListButtonText = ' porn_bots';

    // Verdächtige Benutzer und Trolle
    const suspectListButtonText = ' suspect';
    const trollListButtonText1 = ' hate_trolls_2';
    const trollListButtonText2 = ' hate_trolls_3';

    // Sicherheits- und TOS-Listen
    const securityListButtonText = ' security_list';
    const flirtyMadListButtonText = ' mad_tos';

    // Unban- und Informationsbutton
    const unbanListButtonText = ' UNBAN';
    const infoButtonText = 'info';

    // ############################################################################
    // ##### LAUFZEITSTATUS UND BENUTZERLISTEN #####
    // ############################################################################

    // Allgemeiner Status der Benutzeroberfläche
    let footerReplacementText = 'none';
    let isPaused = false;

    // Interne Listen während der Laufzeit
    const queuedUsers = new Set();
    const ignoredUsers = new Set();
    const processedUsers = new Set();

    // Aktuell aktive Twitch-Seite beziehungsweise Kanal
    let activeChannelName;

    // ############################################################################
    // ##### DESIGN- UND THEME-EINSTELLUNGEN #####
    // ############################################################################

    // Bild für den Aktivierungsbutton
    const activationButtonImage =
        'https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/pix/activate.png';

    // Alternative Theme-Farben
    // const princessThemeColor = '#FF1493';
    const princessThemeColor = '#2F9C0B';

    // const normalThemeColor = '#34AE0C';
    // const normalThemeColor = '#EC007F';
    const normalThemeColor = '#9146FF';

    let currentThemeTextColor = normalThemeColor;

    // Text für die Versionsprüfung
    const currentVersionText = 'die Version ist aktuell ツ';

    // ############################################################################
    // ##### VERZÖGERUNGEN FÜR TWITCH-AKTIONEN #####
    // ############################################################################

    // Allgemeine Delay-Funktion
    const delay = (milliseconds) =>
        new Promise((resolve) => setTimeout(resolve, milliseconds));

    // Zentrale Delay-Werte in Millisekunden
    //
    // Hinweis:
    // Werte unter 125 ms sollten vermieden werden, da Twitch-Aktionen
    // dadurch möglicherweise zu schnell hintereinander ausgeführt werden
    // und ein Shadow-Ban-Risiko entstehen kann.

    const BAN_ACTION_DELAY_MS = 130;
    const UNBAN_ACTION_DELAY_MS = 130;
    const PAUSE_CHECK_DELAY_MS = 1000;

    // ############################################################################
    // ##### AKTUELLEN KANAL AUS DER URL ERMITTELN #####
    // ############################################################################

    const urlParts = document.location.href.split('/');

    if (urlParts[urlParts.length - 1] === 'home') {
        activeChannelName = urlParts[urlParts.length - 2];
    } else {
        activeChannelName = urlParts[urlParts.length - 1];
    }

    console.log('Aktiver Kanal:', activeChannelName);

    // ############################################################################
    // ##### LOCALSTORAGE-SCHLÜSSEL FÜR BANN- UND UNBANLISTEN #####
    // ############################################################################

    // Für jeden Twitch-Kanal werden eigene Listen verwendet
    const banListStorageKey =
        `${browserStoragePrefix}${activeChannelName}_banlist`;

    const unbanListStorageKey =
        `${browserStoragePrefix}${activeChannelName}_unbanlist`;

    // ############################################################################
    // ##### GESPEICHERTE BANN- UND UNBANLISTEN LADEN #####
    // ############################################################################

    let bannedUsers = JSON.parse(
        localStorage.getItem(banListStorageKey)
    ) || [];

    let unbannedUsers = JSON.parse(
        localStorage.getItem(unbanListStorageKey)
    ) || [];

    // ############################################################################
    // ##### GESPEICHERTE MOD-KANÄLE LADEN #####
    // ############################################################################

    const modChannels = new Set();

    const modChannelsStorageKey = 'myModChannels';

    let storedModChannels = JSON.parse(
        localStorage.getItem(modChannelsStorageKey)
    ) || [];

    // ############################################################################
    // ##### CORS-KONFIGURATION FÜR DEN IMPORT VON GITHUB-LISTEN #####
    // ############################################################################

    //
    // Diese Konfiguration wird benötigt, damit externe Bannlisten
    // von GitHub importiert werden können.
    //
    // Hintergrundinformationen:
    // https://portswigger.net/web-security/cors

    const corsConfiguration = {
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
    // ##### CORS-KONFIGURATION SPEICHERN #####
    // ############################################################################

    if (typeof GM_setValue === 'function') {
        GM_setValue(
            'QMD_corsDisable',
            JSON.stringify(corsConfiguration)
        );
    } else {
        localStorage.setItem(
            'QMD_corsDisable',
            JSON.stringify(corsConfiguration)
        );
    }

    // ############################################################################
    // ##### GM_ADDSTYLE-FALLBACK DEFINIEREN #####
    // ############################################################################

    //
    // Falls die Userscript-Umgebung GM_addStyle nicht bereitstellt,
    // wird eine einfache Ersatzfunktion verwendet.

    if (typeof GM_addStyle === 'undefined') {
        window.GM_addStyle = (cssText) => {
            const styleElement = document.createElement('style');
            styleElement.textContent = cssText;
            document.head.appendChild(styleElement);
        };
    }

    // ############################################################################
    // ##### HTML-STRUKTUR UND STYLES DES MOD-TOOLS #####
    // ############################################################################

    // ============================================================================
    // ##### FRONTEND: HTML-GRUNDAUFBAU #####
    // ============================================================================

    const toolHtml = /*html*/ `
        <div id="raidhammer" class="raidhammer">
            <!-- ====================================================================
            ##### CSS: HAUPTFENSTER UND ALLGEMEINE DARSTELLUNG #####
            ==================================================================== -->

            <style>
                /* --------------------------------------------------------------------
                Hauptfenster
                -------------------------------------------------------------------- */

                .raidhammer {
                    z-index: 99999999;
                    position: absolute;
                    top: 250px;
                    left: 350px;
                    min-width: 525px;
                    padding: 5px;
                    background-color: var(--color-background-base);
                    color: var(--color-text-base);
                    border: var(--border-width-default)
                        solid var(--color-border-base);
                    box-shadow: var(--shadow-elevation-2);
                    cursor: move;
                }

                /* --------------------------------------------------------------------
                Verschiebbarer Fensterbereich
                -------------------------------------------------------------------- */

                .raidhammer .handle {
                    cursor: move;
                    user-select: none;
                }

                /* --------------------------------------------------------------------
                SVG- und Textfarben
                -------------------------------------------------------------------- */

                .raidhammer .svg {
                    color: "${currentThemeTextColor}";
                }

                .raidhammer h6 {
                    color: var(--color-hinted-grey-7);
                }

                .raidhammer h6 button {
                    height: auto;
                    background: none;
                }

                /* --------------------------------------------------------------------
                Kopfbereich und Logo
                -------------------------------------------------------------------- */

                .raidhammer .header {
                    display: flex;
                }

                .raidhammer .logo {
                    min-height: 30px;
                    line-height: 30px;
                    font-weight: var(--font-weight-semibold);
                    --color: var(--color-text-link);
                }

                /* --------------------------------------------------------------------
                Benutzerliste
                -------------------------------------------------------------------- */

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

                /* --------------------------------------------------------------------
                Allgemeine Buttons
                -------------------------------------------------------------------- */

                .raidhammer button {
                    min-width: 30px;
                    height: var(--button-size-default);
                    margin: 1px;
                    padding: 0 0.5em;
                    border-radius: var(--border-radius-medium);
                    background-color:
                        var(--color-background-button-secondary-default);
                    color: var(--color-text-button-secondary);
                    font-size: var(--button-text-default);
                    font-weight: var(--font-weight-semibold);
                    text-align: center;
                }

                /* --------------------------------------------------------------------
                Ban- und Unban-Buttons
                -------------------------------------------------------------------- */

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

                /* --------------------------------------------------------------------
                Importbereich
                -------------------------------------------------------------------- */

                .raidhammer .import {
                    min-height: 20px;
                    padding: 3px;
                    background: var(--color-background-body);
                    border: var(--border-width-default)
                        solid var(--color-border-base);
                }

                .raidhammer textarea {
                    width: 100%;
                    min-height: 8em;
                    padding: 0.5em;
                    background: var(--color-background-base);
                    color: var(--color-text-base);
                    font-size: 10pt;
                }

                /* --------------------------------------------------------------------
                Fußbereich
                -------------------------------------------------------------------- */

                .raidhammer .footer {
                    font-size: 7pt;
                    text-align: center;
                }
            </style>

            <!-- ====================================================================
            ##### HTML: KOPFBEREICH #####
            ==================================================================== -->

            <div class="header">
                <span style="flex-grow: 0;"></span>

                <span
                    class="handle"
                    style="flex-grow: 0;"
                ></span>

                <!-- Optionaler Zauberstab-Button -->
                <button
                    class="princess"
                    style="display: none;"
                >
                    <img
                        src="https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/pix/magicwand.png"
                        title="Für die Prinzessinnen unter uns"
                        alt="Zauberstab"
                        width="20"
                        height="20"
                    >
                </button>

                <span style="flex-grow: 1;"></span>

                <!-- Repository-Link und Tool-Titel -->
                <h5
                    id="header"
                    class="logo"
                >
                    <a
                        href="https://github.com/QueerModsDACH/MagicCleaningTool"
                        target="_blank"
                        rel="noopener noreferrer"
                        style="color: ${currentThemeTextColor};"
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

                <br>

                <span style="flex-grow: 1;"></span>

                <!-- Fenster schließen beziehungsweise minimieren -->
                <button class="closeBtn">
                    _
                </button>
            </div>

            <!-- ====================================================================
            ##### HTML: IMPORTBEREICH #####
            ==================================================================== -->

            <div
                id="import"
                class="import"
                style="display: none;"
            >
                <!-- Benutzer manuell importieren -->
                <textarea
                    id="textfield"
                    placeholder="Ein Benutzername pro Zeile"
                ></textarea>

                <!-- Ban-Grund und Import-Button -->
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
                        Hinzufügen ➕
                    </button>
                </div>

                <!-- Vordefinierte Listen: Kategorie 1 -->
                <div style="text-align: center;">
                    <button
                        id="Button_Suspect"
                        class="Button_Suspect"
                        style="width: 32%;"
                        title="Importiert die suspect-Liste"
                    >
                        ${suspectListButtonText}
                    </button>

                    <button
                        id="mdgBtnTrolls1"
                        class="mdgBtnTrolls1"
                        style="width: 33%;"
                        title="Importiert die hate_troll-Liste 2"
                    >
                        ${trollListButtonText1}
                    </button>

                    <button
                        id="mdgBtnTrolls2"
                        class="mdgBtnTrolls2"
                        style="width: 32%;"
                        title="Importiert die hate_troll-Liste 3"
                    >
                        ${trollListButtonText2}
                    </button>
                </div>

                <!-- Vordefinierte Listen: Kategorie 2 -->
                <div style="text-align: center;">
                    <button
                        id="mdgBtnSec"
                        class="mdgBtnSec"
                        style="width: 32%;"
                        title="Importiert die security_ban-Liste"
                    >
                        ${securityListButtonText}
                    </button>

                    <button
                        id="mdgBtnViewerBots"
                        class="mdgBtnViewerBots"
                        style="width: 33%;"
                        title="Importiert die viewerbot-Liste"
                    >
                        ${viewerBotsListButtonText}
                    </button>

                    <button
                        id="mdgBtnPornBot"
                        class="mdgBtnPornBot"
                        style="width: 32%;"
                        title="Importiert die porn_bots-Liste"
                    >
                        ${pornBotListButtonText}
                    </button>
                </div>

                <!-- Vordefinierte Listen: Kategorie 3 -->
                <div style="text-align: center;">
                    <button
                        id="mdgBtnFlirtyMad"
                        class="mdgBtnFlirtyMad"
                        style="width: 32%;"
                        title="Importiert die mad_tos-Liste"
                    >
                        ${flirtyMadListButtonText}
                    </button>

                    <button
                        id="mdgBtnFollowBot"
                        class="mdgBtnFollowBot"
                        style="width: 33%;"
                        title="Importiert die follow_bots-Liste"
                    >
                        ${followBotListButtonText}
                    </button>

                    <button
                        id="mdgBtnUnban"
                        class="mdgBtnUnban"
                        style="width: 32%; color: #34ae0c;"
                        title="Importiert die unban-Liste"
                    >
                        ${unbanListButtonText}
                    </button>
                </div>

                <!-- Vordefinierte Listen: Kategorie 4 -->
                <div style="text-align: center;">
                    <button
                        id="mdgBtnAdvertising"
                        class="mdgBtnAdvertising"
                        style="width: 32%;"
                        title="Importiert die advertising-Liste"
                    >
                        ${advertisingListButtonText}
                    </button>

                    <button
                        id="mdgBtnSpamBots"
                        class="mdgBtnSpamBots"
                        style="width: 33%;"
                        title="Importiert die spam_bots-Liste"
                    >
                        ${spamBotsListButtonText}
                    </button>

                    <button
                        id="qmd"
                        class="qmd"
                        style="width: 32%;"
                        title="QueerModsDACH"
                    >
                        ${infoButtonText}
                    </button>
                </div>
            </div>

            <!-- ====================================================================
            ##### HTML: HAUPTBEREICH UND BENUTZERLISTE #####
            ==================================================================== -->

            <div class="body">
                <!-- Dynamisch erzeugte Liste -->
                <div class="list"></div>

                <!-- Aktionsleiste -->
                <div
                    style="display: flex; margin: 5px;"
                >
                    <span style="flex-grow: 2;"></span>

                    <div
                        id="buttons"
                        class="buttons"
                    >
                        <!-- Ansichten -->
                        <button
                            class="back"
                            title="Zurück"
                        >
                            ⬅
                        </button>

                        <!-- Cache und externe Werkzeuge -->
                        <button
                            class="clearBannedUsers"
                            title="Gespeicherte gebannte Benutzer löschen"
                        >
                            ban-cache leeren 🗑
                        </button>

                        <button
                            class="MooBot"
                            title="Öffnet Moobot"
                            onclick="window.open('https://moo.bot/', '_blank')"
                        >
                            <img
                                src="https://moo.bot/favicon.ico"
                                height="17px"
                                style="position: relative; top: 1px;"
                            >
                        </button>

                        <button
                            class="NightBot"
                            title="Öffnet Nightbot"
                            onclick="window.open('https://nightbot.tv/dashboard', '_blank')"
                        >
                            <img
                                src="https://logodix.com/logo/1909538.png"
                                height="17px"
                                style="position: relative; top: 1px;"
                            >
                        </button>

                        <button
                            class="comanderRoot"
                            title="Öffnet ComanderRoot"
                            onclick="window.open('https://twitch-tools.rootonline.de', '_blank')"
                        >
                            🤖
                        </button>

                        <button
                            class="sLabs"
                            title="Öffnet Streamlabs"
                            onclick="window.open('https://streamlabs.com/dashboard', '_blank')"
                        >
                            <img
                                src="https://cdn.streamlabs.com/static/imgs/streamlabs-logos/app-icon/streamlabs-app-icon.png"
                                height="17px"
                                style="position: relative; top: 1px;"
                            >
                        </button>

                        <button
                            class="sElements"
                            title="Öffnet Streamelements"
                            onclick="window.open('https://streamelements.com/dashboard', '_blank')"
                        >
                            <img
                                src="https://avatars.githubusercontent.com/u/16977512?s=17&v=4"
                                style="position: relative; top: 1px;"
                            >
                        </button>

                        <!-- Kanalstatistiken und Moderationswerkzeuge -->
                        <button
                            class="chatstats"
                            title="Öffnet SullyGnome-Kanalstatistiken"
                            onclick="window.open('https://sullygnome.com/channel/${activeChannelName}', '_blank')"
                        >
                            📈
                        </button>

                        <button
                            class="modLogger"
                            title="Öffnet ModLogger für den aktuellen Kanal"
                            onclick="window.open('https://jvpeek.github.io/twitchmodlogger/?channel=${activeChannelName}', '_blank')"
                        >
                            🗄
                        </button>

                        <button
                            class="chatDeepStats"
                            title="Öffnet ChatStats für den aktuellen Kanal"
                            onclick="window.open('https://echtkpvl.github.io/echt-twitch/chat-stats.html?channel=${activeChannelName}', '_blank')"
                        >
                            🩻
                        </button>

                        <!-- Listenaktionen -->
                        <button
                            class="pause"
                            id="pause"
                            title="Pause/Play"
                        >
                            ⏸
                        </button>

                        <button
                            class="modChannels"
                            title="Alle als Mod-Kanal hinzufügen"
                        >
                            ⚔
                        </button>

                        <button
                            class="ignoreAll"
                            title="Liste leeren"
                        >
                            🗑
                        </button>

                        <button
                            class="unbanAll"
                            title="Alle auf der Liste entbannen"
                        >
                            ⚕
                        </button>

                        <button
                            class="banAll"
                            title="Alle auf der Liste bannen"
                        >
                            👹
                        </button>
                    </div>
                </div>
            </div>

            <!-- ====================================================================
            ##### HTML: FOOTER #####
            ==================================================================== -->

            <div
                id="footer"
                class="footer"
            >
                <a
                    href="https://github.com/QueerModsDACH/Listen"
                    target="_blank"
                    style="color: ${currentThemeTextColor};"
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
                    ${currentVersionText}
                </a>

                &nbsp;-&nbsp;&nbsp;
                ${toolVersion}
            </div>
        </div>
    `;

    // ############################################################################
    // ##### JAVASCRIPT: TOOLFENSTER IN DIE SEITE EINFÜGEN #####
    // ############################################################################

    document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(toolContainer);
    });

    // ############################################################################
    // ##### JAVASCRIPT: PAUSE-FUNKTION #####
    // ############################################################################

    function pauseBanAll() {
        isPaused = !isPaused;

        const pauseButton = document.getElementById('pause');

        if (!pauseButton) {
            return;
        }

        if (isPaused) {
            pauseButton.value = 'unpause';
            pauseButton.textContent = 'Unpause';
        } else {
            pauseButton.value = 'pause';
            pauseButton.textContent = 'Pause';
        }
    }

    // ############################################################################
    // ##### JAVASCRIPT: MODAL UND TOOL-CONTAINER ERSTELLEN #####
    // ############################################################################

    const toolContainer = document.createElement('div');
    toolContainer.style.display = 'none';
    toolContainer.innerHTML = toolHtml;

    const importTextarea = toolContainer.querySelector('textarea');

    // ############################################################################
    // ##### JAVASCRIPT: ALLGEMEINER IMPORT VON LISTEN #####
    // ############################################################################

    function importListGeneric(
        listUrl,
        buttonId,
        defaultButtonText,
        footerText,
        footerHref,
        useUnban = false,
        listBanReason = defaultBanReason
    ) {
        queuedUsers.clear();

        const importedUsers = [];
        const banReasonInput = document.getElementById('banReason');

        // ------------------------------------------------------------------------
        // ##### BAN-GRUND DER AKTUELLEN LISTE SETZEN #####
        // ------------------------------------------------------------------------

        if (
            !useUnban &&
            banReasonInput &&
            banReasonInput.value.trim() === ''
        ) {
            banReasonInput.value = listBanReason;
        }

        // ------------------------------------------------------------------------
        // ##### LISTE VOM SERVER LADEN #####
        // ------------------------------------------------------------------------

        fetch(listUrl)
            .then((response) => response.text())
            .then((listText) => {
                importedUsers.push(
                    ...listText
                        .split('\n')
                        .filter(Boolean)
                );

                // ---------------------------------------------------------------
                // ##### BENUTZER ALS BAN ODER UNBAN VERARBEITEN #####
                // ---------------------------------------------------------------

                if (useUnban) {
                    importedUsers.forEach((username) => {
                        checkIfUserIsAlreadyUnbanned(
                            username.replace(/\r/g, ''),
                            buttonId
                        );
                    });
                } else {
                    importedUsers.forEach((username) => {
                        checkIfUserIsAlreadyBanned(
                            username.replace(/\r/g, ''),
                            buttonId
                        );
                    });
                }

                // ---------------------------------------------------------------
                // ##### LISTE AKTUALISIEREN #####
                // ---------------------------------------------------------------

                if (buttonId === 'mdgBtnAdvertising') {
                    renderUserList();
                }

                importTextarea.value = '';
                insertTextIntoTextarea(Array.from(queuedUsers));

                if (queuedUsers.size !== 0) {
                    toggleImportView();
                    renderUserList();
                }
            });

        // ------------------------------------------------------------------------
        // ##### FOOTER-TEXT AKTUALISIEREN #####
        // ------------------------------------------------------------------------

        document.getElementById('replaceFooter').innerHTML =
            footerText;

        document.getElementById('replaceFooter').href =
            footerHref;

        // ------------------------------------------------------------------------
        // ##### BUTTON-TEXT ZURÜCKSETZEN #####
        // ------------------------------------------------------------------------

        function resetImportButtonText() {
            document.getElementById(buttonId).innerHTML =
                defaultButtonText;
        }

        setTimeout(resetImportButtonText, 5000);
    }

    // ############################################################################
    // ##### JAVASCRIPT: AKTIVIERUNGSBUTTON #####
    // ############################################################################

    const activationButton = document.createElement('button');

    activationButton.innerHTML = `
        <img
            src="${activationButtonImage}"
            alt="Aktivieren"
            width="25"
            height="25"
        >
    `;

    activationButton.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        height: var(--button-size-default);
        width: var(--button-size-default);
        border-radius: var(--border-radius-medium);
        background-color:
            var(--color-background-button-text-default);
        color: var(--color-fill-button-icon);
    `;

    activationButton.setAttribute('id', 'hammer');
    activationButton.setAttribute(
        'title',
        'Magic Cleaning Tool'
    );
    activationButton.onclick = toggleTool;

    let isToolEnabled;
    let watchdogInterval;

    // ############################################################################
    // ##### JAVASCRIPT: AKTIVIERUNGSBUTTON IM TWITCH-MENÜ #####
    // ############################################################################

    function appendActivationButton() {
        const modViewButton = document.querySelector(
            '[data-test-selector="mod-view-link"]'
        );

        if (modViewButton) {
            const twitchNavigationBar =
                modViewButton.parentElement
                    .parentElement
                    .parentElement;

            if (
                twitchNavigationBar &&
                !twitchNavigationBar.contains(activationButton)
            ) {
                console.log(
                    logPrefix,
                    'Mod tools available. Adding button...'
                );

                twitchNavigationBar.insertBefore(
                    activationButton,
                    twitchNavigationBar.firstChild
                );

                document.body.appendChild(toolContainer);
                $('.raidhammer').draggable();
            }
        } else if (
            document.location
                .toString()
                .includes('/moderator/')
        ) {
            const chatSendButton = document.querySelector(
                '[data-a-target="chat-send-button"]'
            );

            if (!chatSendButton) {
                return;
            }

            const twitchNavigationBar =
                chatSendButton.parentElement
                    .parentElement
                    .parentElement;

            if (
                twitchNavigationBar &&
                !twitchNavigationBar.contains(activationButton)
            ) {
                console.log(
                    logPrefix,
                    'Mod tools available. Adding button...'
                );

                twitchNavigationBar.insertBefore(
                    activationButton,
                    twitchNavigationBar.firstChild
                );

                document.body.appendChild(toolContainer);
                $('.raidhammer').draggable();
            }
        } else {
            if (isToolEnabled) {
                console.log(
                    logPrefix,
                    'Mod tools not found. Stopped chatWatchdog!'
                );

                watchdogInterval = false;
                isToolEnabled = false;
                hideTool();
            }
        }
    }

    setInterval(
        appendActivationButton,
        5000
    );

    // ############################################################################
    // ##### JAVASCRIPT: EVENTHANDLER FÜR DAS TOOLFENSTER #####
    // ############################################################################

    toolContainer.querySelector('.ignoreAll').onclick = ignoreAllUsers;
    toolContainer.querySelector('.banAll').onclick = banAllUsers;
    toolContainer.querySelector('.closeBtn').onclick = hideTool;
    toolContainer.querySelector('.modChannels').onclick = addAllModChannels;
    toolContainer.querySelector('.unbanAll').onclick = unbanAllUsers;
    toolContainer.querySelector('.back').onclick = toggleBackView;
    toolContainer.querySelector('.pause').onclick = togglePause;
    toolContainer.querySelector('.princess').onclick = toggleTheme;
    toolContainer.querySelector('.qmd').onclick = openQueerModsDach;
    toolContainer.querySelector('.import button.mdgBtnUnban').onclick = importUnbanList;
    toolContainer.querySelector('.import button.Button_Suspect').onclick = importSuspectList;
    toolContainer.querySelector('.import button.mdgBtnTrolls1').onclick = importTrollList1;
    toolContainer.querySelector('.import button.mdgBtnTrolls2').onclick = importTrollList2;
    toolContainer.querySelector('.import button.mdgBtnSec').onclick = importSecurityList;
    toolContainer.querySelector('.import button.mdgBtnViewerBots').onclick = importViewerBotsList;
    toolContainer.querySelector('.import button.mdgBtnFlirtyMad').onclick = importFlirtyMadList;
    toolContainer.querySelector('.import button.mdgBtnFollowBot').onclick = importFollowBotList;
    toolContainer.querySelector('.import button.mdgBtnAdvertising').onclick = importAdvertisingList;
    toolContainer.querySelector('.import button.mdgBtnSpamBots').onclick = importSpamBotsList;
    toolContainer.querySelector('.import button.mdgBtnPornBot').onclick = importPornBotList;
    toolContainer.querySelector('.import button.importBtn').onclick = importManualList;
    toolContainer.querySelector('.clearBannedUsers').onclick = clearBannedUsers;

    // ############################################################################
    // ##### JAVASCRIPT: DELEGIERTE EVENTHANDLER #####
    // ############################################################################

    toolContainer.addEventListener('click', (clickEvent) => {
        const clickedElement = clickEvent.target;

        if (clickedElement.matches('.ignore')) {
            ignoreUser(clickedElement.dataset.user);
        }

        if (clickedElement.matches('.ban')) {
            banUser(clickedElement.dataset.user);
        }

        if (clickedElement.matches('.unban')) {
            unbanUser(clickedElement.dataset.user);
        }

        if (clickedElement.matches('.accountage')) {
            requestAccountAge(clickedElement.dataset.user);
        }

        if (clickedElement.matches('.toggleImport')) {
            toggleImportView();
        }

        if (clickedElement.matches('.start')) {
            toggleImportView();
        }

        if (clickedElement.matches('.removeModChannel')) {
            removeModChannel(clickedElement.dataset.user);
        }

        if (clickedElement.matches('.addModChannels')) {
            addModChannel(clickedElement.dataset.user);
        }
    });

    // ############################################################################
    // ##### JAVASCRIPT: GESPEICHERTE BANNLISTE LÖSCHEN #####
    // ############################################################################

    //
    // Damit wird die gespeicherte Bannliste des aktuell geöffneten Kanals
    // gelöscht. Der übrige Browser-Cache sowie die gespeicherten Entbannlisten
    // und Mod-Kanäle bleiben unangetastet.

    function clearBannedUsers() {
        localStorage.removeItem(banListStorageKey);
        bannedUsers.length = 0;
        renderUserList();
    }

    // ############################################################################
    // ##### JAVASCRIPT: QUEER MODS DACH ÖFFNEN #####
    // ############################################################################

    function openQueerModsDach() {
        window.open(
            'https://github.com/QueerModsDACH/'
        );
    }

    // ############################################################################
    // ##### BENUTZEROBERFLÄCHE UND FENSTERSTEUERUNG #####
    // ############################################################################

    // Function toggleTheme
    function toggleTheme() {
        let headerHtml =
            document.getElementById('header').innerHTML;

        let footerHtml =
            document.getElementById('footer').innerHTML;

        let activationButtonHtml =
            document.getElementById('hammer').innerHTML;

        // Test actually color in use is our green
        if (
            headerHtml.match('#9146FF') &&
            footerHtml.match('#9146FF') &&
            activationButtonHtml.match('#9146FF')
        ) {
            console.log(
                logPrefix,
                "huh? I'm a princess now!"
            );

            headerHtml = headerHtml.replace(
                /#9146FF/g,
                princessThemeColor
            );

            footerHtml = footerHtml.replace(
                /#9146FF/g,
                princessThemeColor
            );

            activationButtonHtml = activationButtonHtml.replace(
                /#9146FF/g,
                princessThemeColor
            );

            document.getElementById('header').innerHTML =
                headerHtml;

            document.getElementById('footer').innerHTML =
                footerHtml;

            document.getElementById('hammer').innerHTML =
                activationButtonHtml;
        } else {
            console.log(
                logPrefix,
                "Muh? I'm no longer a princess :-/"
            );

            headerHtml = headerHtml.replace(
                /#2F9C0B/g,
                normalThemeColor
            );

            footerHtml = footerHtml.replace(
                /#2F9C0B/g,
                normalThemeColor
            );

            activationButtonHtml = activationButtonHtml.replace(
                /#2F9C0B/g,
                normalThemeColor
            );

            document.getElementById('header').innerHTML =
                headerHtml;

            document.getElementById('footer').innerHTML =
                footerHtml;

            document.getElementById('hammer').innerHTML =
                activationButtonHtml;
        }
    }

    // ############################################################################
    // ##### BENUTZEROBERFLÄCHE UND FENSTERSTEUERUNG #####
    // ############################################################################

    // Function toggle pause/play
    function togglePause() {
        const pauseButton =
            document.getElementById('pause');

        if (!pauseButton) {
            return;
        }

        isPaused = !isPaused;

        if (isPaused) {
            pauseButton.value = 'play';
            pauseButton.textContent = '▶';
            pauseButton.title = 'Fortsetzen';
        } else {
            pauseButton.value = 'pause';
            pauseButton.textContent = '⏸';
            pauseButton.title = 'Pausieren';
        }
    }

    // Function show Bann-Hammer window
    function showTool() {
        console.log(logPrefix, 'Show');

        toolContainer.style.display = '';
        $('.raidhammer').draggable();
        renderUserList();
    }

    // Function hide Bann-Hammer window
    function hideTool() {
        console.log(logPrefix, 'Hide');
        toolContainer.style.display = 'none';
    }

    // Function checking new versions
    function toggleTool() {
        function checkForNewVersion() {
            fetch(
                'https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/MagicCleaningTool.user.js'
            )
                .then((response) => response.text())
                .then((scriptText) => {
                    const versionRegex = /@version\s+(\d.*)/;
                    const versionMatch =
                        versionRegex.exec(scriptText);

                    if (!versionMatch) {
                        return;
                    }

                    const newVersion = versionMatch[1];

                    if (toolVersion < newVersion) {
                        document.getElementById('manoooo').innerHTML =
                            ' Update verfügbar 🚨';
                    } else {
                        document.getElementById('manoooo').innerHTML =
                            'die Version ist aktuell ツ';
                    }
                });
        }

        if (toolContainer.style.display !== 'none') {
            hideTool();
        } else {
            showTool();
        }

        checkForNewVersion();
    }

    // Function toggle import
    function toggleImportView() {
        document.getElementById('textfield').value = '';

        const importSection =
            toolContainer.querySelector('.import');

        const mainBody =
            toolContainer.querySelector('.body');

        if (importSection.style.display !== 'none') {
            importSection.style.display = 'none';
            mainBody.style.display = '';
        } else {
            importSection.style.display = '';
            mainBody.style.display = 'none';

            toolContainer
                .querySelector('.import textarea')
                .focus();
        }
    }

    // Function toggle back
    function toggleBackView() {
        queuedUsers.clear();

        document.getElementById('textfield').value = '';

        const mainBody =
            toolContainer.querySelector('.body');

        insertTextIntoTextarea('');

        const importSection =
            toolContainer.querySelector('.import');

        if (importSection.style.display !== 'none') {
            importSection.style.display = 'none';
            mainBody.style.display = '';
        } else {
            importSection.style.display = '';
            mainBody.style.display = 'none';

            toolContainer
                .querySelector('.import textarea')
                .focus();
        }

        document.getElementById('replaceFooter').innerHTML =
            'Alle Bannlisten anzeigen';

        document.getElementById('replaceFooter').href =
            'https://github.com/QueerModsDACH/Listen';
    }

    // ############################################################################
    // ##### BENUTZERSTATUS UND LISTENAKTIONEN #####
    // ############################################################################

    // Function to verify a user is already banned/unbanned in a channel
    function checkIfUserIsAlreadyBanned(username, buttonId) {
        if (!bannedUsers.includes(username)) {
            queuedUsers.add(username);
        } else {
            document.getElementById(buttonId).innerHTML =
                'already banned';

            console.log(
                logPrefix,
                username + ' already banned ' + activeChannelName
            );
        }
    }

    function checkIfUserIsAlreadyUnbanned(username, buttonId) {
        if (!unbannedUsers.includes(username)) {
            queuedUsers.add(username);
        } else {
            document.getElementById(buttonId).innerHTML =
                'already unbanned';

            console.log(
                logPrefix,
                username +
                    ' already unbanned in ' +
                    activeChannelName
            );
        }
    }

    // ############################################################################
    // ##### IMPORT UND EINGABEVERARBEITUNG #####
    // ############################################################################

    // Function to import the list
    function importManualList() {
        const manualImportTextarea =
            toolContainer.querySelector('.import textarea');

        const importedLines = manualImportTextarea.value
            .split(/\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        for (const username of importedLines) {
            if (/^[\w_]+$/.test(username)) {
                queuedUsers.add(username);
            }
        }

        manualImportTextarea.value = '';
        toggleImportView();
        renderUserList();
    }

    // Function to insert list into textarea
    function insertTextIntoTextarea(text) {
        document.getElementById('textfield').value = text;
    }

    // Import functions using the generic importer
    function importSuspectList() {
        importListGeneric(
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/suspect.txt',
            'Button_Suspect',
            suspectListButtonText,
            "Geladene Liste 'suspect.txt' anzeigen",
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/suspect.txt',
            false,
            'suspect (QMD-List)'
        );
    }

    function importTrollList1() {
        importListGeneric(
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/hate_troll_list_2.txt',
            'mdgBtnTrolls1',
            trollListButtonText1,
            "Geladene Liste 'hate_troll_list_h_m.txt' anzeigen",
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/hate_troll_list_2.txt'
        );
    }

    function importTrollList2() {
        importListGeneric(
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/hate_troll_list_3.txt',
            'mdgBtnTrolls2',
            trollListButtonText2,
            "Geladene Liste 'hate_troll_list_n_z.txt' anzeigen",
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/hate_troll_list_3.txt'
        );
    }

    function importSecurityList() {
        importListGeneric(
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/security_ban_list.txt',
            'mdgBtnSec',
            securityListButtonText,
            "Geladene Liste 'security_ban_list.txt' anzeigen",
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/security_ban_list.txt'
        );
    }

    function importUnbanList() {
        importListGeneric(
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/unbanlist.txt',
            'mdgBtnUnban',
            unbanListButtonText,
            'Geladene Liste unbanlist.txt anzeigen',
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/unbanlist.txt',
            true
        );
    }

    function importViewerBotsList() {
        importListGeneric(
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/viewer_bot_list.txt',
            'mdgBtnViewerBots',
            viewerBotsListButtonText,
            "Geladene Liste 'viewer_bot_list.txt' anzeigen",
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/viewer_bot_list.txt'
        );
    }

    function importFlirtyMadList() {
        importListGeneric(
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/mad_tos_list.txt',
            'mdgBtnFlirtyMad',
            flirtyMadListButtonText,
            "Geladene Liste 'mad_tos_list.txt' anzeigen",
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/mad_tos_list.txt'
        );
    }

    function importFollowBotList() {
        importListGeneric(
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/follower_bot_list.txt',
            'mdgBtnFollowBot',
            followBotListButtonText,
            "Geladene Liste 'follower_bot_list.txt' anzeigen",
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/follower_bot_list.txt'
        );
    }

    function importAdvertisingList() {
        importListGeneric(
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/seller_advertising_list.txt',
            'mdgBtnAdvertising',
            advertisingListButtonText,
            "Geladene Liste 'seller_advertising_list.txt' anzeigen",
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/seller_advertising_list.txt'
        );
    }

    function importSpamBotsList() {
        importListGeneric(
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/spam_bot_list.txt',
            'mdgBtnSpamBots',
            spamBotsListButtonText,
            "Geladene Liste 'spam_bot_list.txt' anzeigen",
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/spam_bot_list.txt'
        );
    }

    function importPornBotList() {
        importListGeneric(
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/porn_bot_acc_list.txt',
            'mdgBtnPornBot',
            pornBotListButtonText,
            "Geladene Liste 'porn_bot_acc_list.txt' anzeigen",
            'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/porn_bot_acc_list.txt'
        );
    }

    // ############################################################################
    // ##### EINZEL- UND MASSENAKTIONEN #####
    // ############################################################################

    // Functions to ban/unban/ignore/accountage

    function ignoreAllUsers() {
        console.log(
            logPrefix,
            'Ignoring all...',
            queuedUsers
        );

        for (const username of queuedUsers) {
            ignoreUser(username);
        }
    }

    async function banAllUsers() {
        console.log(
            logPrefix,
            'Banning all...',
            queuedUsers
        );

        for (const username of queuedUsers) {
            if (isPaused) {
                while (isPaused) {
                    // await delay(1000);
                    await delay(PAUSE_CHECK_DELAY_MS);
                }
            }

            banUser(username);

            // await delay(125);
            await delay(BAN_ACTION_DELAY_MS);
        }
    }

    async function unbanAllUsers() {
        console.log(
            logPrefix,
            'Unbanning all...',
            queuedUsers
        );

        for (const username of queuedUsers) {
            if (isPaused) {
                while (isPaused) {
                    // await delay(1000);
                    await delay(PAUSE_CHECK_DELAY_MS);
                }
            }

            unbanUser(username);

            // await delay(125);
            await delay(UNBAN_ACTION_DELAY_MS);
        }
    }

    // Function to set Mod-Channels
    async function addAllModChannels() {
        console.log(
            logPrefix,
            'Add Mod-Channels...',
            queuedUsers
        );

        for (const username of queuedUsers) {
            if (isPaused) {
                while (isPaused) {
                    await delay(PAUSE_CHECK_DELAY_MS);
                }
            }

            addModChannel(username);
            await delay(100);
        }
    }

    // Function send !accountage user into chat, to trigger Streamelements Bot
    function requestAccountAge(username) {
        console.log(
            logPrefix,
            'send !accountage',
            username
        );

        sendChatMessage('!accountage ' + username);
    }

    // Function to remove User from action list
    function ignoreUser(username) {
        console.log(
            logPrefix,
            'Ignore user:',
            username
        );

        queuedUsers.delete(username);
        ignoredUsers.add(username);

        renderUserList();
    }

    // Function to unban a user
    function unbanUser(username) {
        console.log(
            logPrefix,
            'Unban user:',
            username
        );

        queuedUsers.delete(username);
        processedUsers.add(username);

        unbannedUsers.push(username);

        sendChatMessage('/unban ' + username);

        localStorage.setItem(
            unbanListStorageKey,
            JSON.stringify(unbannedUsers)
        );

        localStorage.setItem(
            banListStorageKey,
            JSON.stringify(
                JSON.parse(
                    localStorage.getItem(banListStorageKey)
                ).filter(
                    (storedUsername) =>
                        storedUsername !== username
                )
            )
        );

        renderUserList();
    }

    // Function to remove channels from ModChannels
    function removeModChannel(username) {
        console.log(
            logPrefix,
            'Remove User from ModChannels:',
            username
        );

        queuedUsers.delete(username);
        processedUsers.add(username);

        localStorage.setItem(
            modChannelsStorageKey,
            JSON.stringify(
                JSON.parse(
                    localStorage.getItem(modChannelsStorageKey)
                ).filter(
                    (storedChannel) =>
                        storedChannel !== username
                )
            )
        );

        renderUserList();
    }

    // Function to ban a user
    function banUser(username) {
        const banReason =
            document.getElementById('banReason').value;

        queuedUsers.delete(username);
        processedUsers.add(username);

        bannedUsers.push(username);

        localStorage.setItem(
            banListStorageKey,
            JSON.stringify(bannedUsers)
        );

        sendChatMessage(
            '/ban ' +
                username +
                ' ' +
                banReason
        );

        renderUserList();
    }

    // Function add channel to Mod-Channels
    function addModChannel(channelName) {
        if (!storedModChannels.includes(channelName)) {
            console.log(
                logPrefix,
                channelName +
                    ' zu ModChannels hinzugefügt'
            );

            queuedUsers.delete(channelName);
            processedUsers.add(channelName);

            storedModChannels.push(channelName);

            localStorage.setItem(
                modChannelsStorageKey,
                JSON.stringify(storedModChannels)
            );

            renderUserList();
        } else {
            console.log(
                logPrefix,
                'Benutzer ' +
                    channelName +
                    ' ist bereits in den ModChannels.'
            );
        }
    }

    // ############################################################################
    // ##### NACHRICHTEN AN DEN TWITCH-CHAT SENDEN #####
    // ############################################################################

    function sendChatMessage(message) {
        try {
            sendMessageUsingTextarea(message);
        } catch (error) {
            sendMessageUsingSlateEditor(message);
        }
    }

    function sendMessageUsingTextarea(message) {
        const chatTextarea = document.querySelector(
            "[data-a-target='chat-input']"
        );

        const nativeTextareaValueSetter =
            Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                'value'
            ).set;

        nativeTextareaValueSetter.call(
            chatTextarea,
            message
        );

        const inputEvent = new Event(
            'input',
            {
                bubbles: true
            }
        );

        chatTextarea.dispatchEvent(inputEvent);

        document
            .querySelector(
                "[data-a-target='chat-send-button']"
            )
            .click();
    }

    function sendMessageUsingSlateEditor(message) {
        function injectInputIntoEditor(
            editorElement,
            inputData
        ) {
            [
                'keydown',
                'beforeinput'
            ].forEach((eventType) => {
                const inputEventData = {
                    altKey: false,
                    charCode: 0,
                    ctrlKey: false,
                    metaKey: false,
                    shiftKey: false,
                    which: '',
                    keyCode: '',
                    data: inputData,
                    inputType: 'insertText',
                    key: inputData
                };

                editorElement.dispatchEvent(
                    new InputEvent(
                        eventType,
                        inputEventData
                    )
                );
            });
        }

        function triggerKeyboardEvent(
            editorElement,
            keyCode
        ) {
            const keyboardEvent =
                document.createEventObject
                    ? document.createEventObject()
                    : document.createEvent('Events');

            if (keyboardEvent.initEvent) {
                keyboardEvent.initEvent(
                    'keydown',
                    true,
                    true
                );
            }

            keyboardEvent.keyCode = keyCode;
            keyboardEvent.which = keyCode;

            editorElement.dispatchEvent
                ? editorElement.dispatchEvent(
                    keyboardEvent
                )
                : editorElement.fireEvent(
                    'onkeydown',
                    keyboardEvent
                );
        }

        const slateEditor = document.querySelector(
            '[data-slate-editor="true"]'
        );

        slateEditor.focus();

        injectInputIntoEditor(
            slateEditor,
            message
        );

        triggerKeyboardEvent(
            slateEditor,
            13
        );
    }

    // ############################################################################
    // ##### LISTENANZEIGE UND RENDERING #####
    // ############################################################################

    function renderUserList() {
        toolContainer.querySelector('.ignoreAll').style.display = queuedUsers.size ? '' : 'none';
        toolContainer.querySelector('.banAll').style.display = queuedUsers.size ? '' : 'none';
        toolContainer.querySelector('.back').style.display = queuedUsers.size ? '' : 'none';
        toolContainer.querySelector('.pause').style.display = queuedUsers.size ? '' : 'none';
        toolContainer.querySelector('.modChannels').style.display = queuedUsers.size ? '' : 'none';
        toolContainer.querySelector('.unbanAll').style.display = queuedUsers.size ? '' : 'none';

        const renderUserListItem = (username) => `
            <li>
                <button
                    class="accountage"
                    data-user="${username}"
                    title="Schreibt ''!accountage ${username}'' in den Chat"
                >
                    ?
                </button>

                <button
                    class="ignore"
                    data-user="${username}"
                    title="Benutzer aus Liste entfernen"
                >
                </button>
                ❌

                <button
                    class="unban"
                    data-user="${username}"
                    title="Benutzer entbannen"
                >
                    Unban
                </button>

                <button
                    class="ban"
                    data-user="${username}"
                    title="Benutzer bannen"
                >
                    Ban
                </button>

                <button
                    class="addModChannels"
                    data-user="${username}"
                    title="Kanal als Mod-Kanal hinzufügen"
                >
                </button>
                ➕⚔

                <button
                    class="removeModChannel"
                    data-user="${username}"
                    title="Kanal als Mod-Kanal entfernen"
                >
                </button>
                ➖⚔

                <span>
                    <a
                        href="https://twitch-tools.rootonline.de/followinglist_viewer.php?username=${username}"
                        title="Dieser User folgt....(Weiterleitung zu comanderroot)"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        ${username}
                    </a>
                </span>
            </li>
        `;

        const listContent = queuedUsers.size
            ? [...queuedUsers]
                .map((username) =>
                    renderUserListItem(username)
                )
                .join('')
            : `
                <div
                    id="empty"
                    class="empty"
                >
                    <img
                        class="toggleImport"
                        src="https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/pix/Logo_1920x400.png"
                        title="Start Magic Cleaning Tool"
                        width="370px"
                        style="
                            cursor: pointer;
                            max-height: 80px;
                            min-height: 80px;
                        "
                    >
                </div>
            `;

        toolContainer.querySelector('.list').innerHTML = `
            <ul>
                ${listContent}
            </ul>
        `;
    }
})();

// ############################################################################
// ##### MOD-MENU #####
// ############################################################################

function modMenu() {
    'use strict';

    // modMenu() wird weiter unten jede Sekunde aufgerufen.
    // Diese Sperre sorgt dafür, dass nur eine einzige Mod-Menü-Instanz mit ihrem eigenen Button und Timer aktiv bleibt.

    if (window.__QMD_MOD_MENU_INITIALIZED__) {
        return;
    }

    window.__QMD_MOD_MENU_INITIALIZED__ = true;

    // Verwendet den vorhandenen Schlüssel aus dem Script.
    // Falls modChannelsStorageKey nicht existiert, wird der alte Schlüssel myModChannels verwendet.

    const modChannelsStorageKey =
        typeof QMD_LocalStorageModChannels !== 'undefined'
            ? QMD_LocalStorageModChannels
            : 'myModChannels';

    // Liest die gespeicherten Mod-Kanäle aus dem localStorage.
    function processStoredModChannels() {
        const storedValue = localStorage.getItem(
            modChannelsStorageKey
        );

        try {
            const parsedChannels = storedValue
                ? JSON.parse(storedValue)
                : [];

            return Array.isArray(parsedChannels)
                ? parsedChannels
                : [];
        } catch (error) {
            console.error(
                '[QMD_MCT_1]',
                'Ungültige Daten in den ModChannels:',
                error
            );

            return [];
        }
    }

    // Sortiert die Kanäle alphabetisch und speichert die sortierte Liste dauerhaft im localStorage.
    function sortAndStoreModChannels(channelNames) {
        const uniqueChannelNames = [
            ...new Set(
                channelNames
                    .filter((channelName) => {
                        return (
                            typeof channelName === 'string' &&
                            channelName.trim().length > 0
                        );
                    })
                    .map((channelName) => {
                        return channelName
                            .trim()
                            .toLowerCase();
                    })
            )
        ];

        uniqueChannelNames.sort(
            (firstChannel, secondChannel) => {
                return firstChannel.localeCompare(
                    secondChannel,
                    'de',
                    {
                        sensitivity: 'base'
                    }
                );
            }
        );

        localStorage.setItem(
            modChannelsStorageKey,
            JSON.stringify(uniqueChannelNames)
        );

        // Falls QMD_modChannelStore an anderer Stelle verwendet wird, halten wir es ebenfalls aktuell.
        if (
            typeof QMD_modChannelStore !== 'undefined' &&
            Array.isArray(QMD_modChannelStore)
        ) {
            QMD_modChannelStore.length = 0;
            QMD_modChannelStore.push(
                ...uniqueChannelNames
            );
        }

        return uniqueChannelNames;
    }

    // ############################################################################
    // ##### MOD-ANSICHT UND MOD-BERECHTIGUNGEN #####
    // ############################################################################

    // Sucht Twitchs Mod-View-Link per Selektor.
    function getModViewButton() {
        return document.querySelector(
            [
                '[data-test-selector="mod-view-link"]',
                '[data-a-target="mod-view-link"]'
            ].join(', ')
        );
    }

    // Ermittelt den Kanalnamen aus dem Mod-View-Link.
    // z.B.: https://www.twitch.tv/moderator/channelname

    function getChannelFromModViewLink() {
        const modViewButton = getModViewButton();

        if (!modViewButton) {
            return null;
        }

        // Je nach Twitch-Version kann das Ziel im href, data-href oder in einem Kind-Element stehen.
        const possibleChannelUrl =
            modViewButton.href ||
            modViewButton.getAttribute('href') ||
            modViewButton.getAttribute('data-href');

        if (!possibleChannelUrl) {
            return null;
        }

        try {
            const channelUrl = new URL(
                possibleChannelUrl,
                window.location.origin
            );

            const channelMatch =
                channelUrl.pathname.match(
                    /^\/moderator\/([^/]+)/
                );

            if (!channelMatch) {
                return null;
            }

            return decodeURIComponent(
                channelMatch[1]
            ).toLowerCase();
        } catch (error) {
            console.error(
                '[QMD_MCT_1]',
                'Kanalname aus dem Mod-Link konnte nicht gelesen werden:',
                error
            );

            return null;
        }
    }

    // Ermittelt den Kanalnamen direkt aus der Mod-URL.
    // z.B.: /moderator/channelname

    function getChannelFromModeratorUrl() {
        const channelMatch =
            window.location.pathname.match(
                /^\/moderator\/([^/]+)/
            );

        if (!channelMatch) {
            return null;
        }

        return decodeURIComponent(
            channelMatch[1]
        ).toLowerCase();
    }

    // ############################################################################
    // ##### MOD-KANÄLE AUTOMATISCH SPEICHERN #####
    // ############################################################################

    //
    // Speichert den aktuell moderierten Kanal automatisch.
    // In der normalen Kanalansicht muss Twitchs Mod-View-Link vorhanden sein.
    // In der Mod-Ansicht wird zusätzlich ein Chat-Element geprüft.

    function addCurrentModChannel() {
        const modViewButton =
            getModViewButton();

        const chatSendButton = document.querySelector(
            '[data-a-target="chat-send-button"]'
        );

        const isModeratorPage =
            window.location.pathname.includes(
                '/moderator/'
            );

        let currentChannelName = null;

        // Normale Twitch-Kanalansicht
        if (modViewButton) {
            currentChannelName =
                getChannelFromModViewLink();
        }

        // Twitch-Mod-Ansicht
        if (
            !currentChannelName &&
            isModeratorPage &&
            chatSendButton
        ) {
            currentChannelName =
                getChannelFromModeratorUrl();
        }

        // Ohne eindeutige Mod-Berechtigung wird nichts gespeichert.
        if (!currentChannelName) {
            return;
        }

        const storedChannelNames =
            processStoredModChannels();

        // Kanal bereits vorhanden:
        // Trotzdem sicherstellen, dass die Liste alphabetisch sortiert ist.
        if (
            storedChannelNames.includes(
                currentChannelName
            )
        ) {
            sortAndStoreModChannels(
                storedChannelNames
            );

            return;
        }

        // Neuen Kanal hinzufügen und alphabetisch speichern.
        storedChannelNames.push(
            currentChannelName
        );

        const sortedChannelNames =
            sortAndStoreModChannels(
                storedChannelNames
            );

        console.log(
            '[QMD_MCT_1]',
            currentChannelName +
                ' wurde automatisch zu den ModChannels hinzugefügt'
        );

        // Dropdown-Liste sofort aktualisieren, falls das Menü bereits erstellt wurde.
        if (
            typeof window.refreshQMDModMenu ===
            'function'
        ) {
            window.refreshQMDModMenu(
                sortedChannelNames
            );
        }
    }

    // ############################################################################
    // ##### MOD-KANAL-DROPDOWN ERSTELLEN #####
    // ############################################################################

    // Erstellt das Dropdown-Menü.
    // Der Button wird hier nur erzeugt.
    // Das tatsächliche Einfügen neben dem Twitch-Logo passiert weiter unten in appendModMenuButton().

    function createDropdownMenu() {
        // Verhindert, dass mehrere sichtbare Menüs gleichzeitig erstellt werden.
        if (document.getElementById('modMenu')) {
            return;
        }

        const referenceButton =
            document.querySelector(
                '[data-a-target="home-link"]'
            );

        // Twitch rendert den Header teilweise verzögert.
        // Beim nächsten Aufruf von modMenu() wird erneut versucht,
        // das Menü zu erstellen.

        if (
            !referenceButton ||
            !referenceButton.parentElement
        ) {
            return;
        }

        const dropdownContainer =
            referenceButton.parentElement;

        dropdownContainer.style.position =
            'relative';

        dropdownContainer.style.display =
            'flex';

        dropdownContainer.style.alignItems =
            'center';

        // Button mit dem Mod-Schwert erstellen.
        const dropdownButton =
            document.createElement('button');

        dropdownButton.id = 'modMenu';
        dropdownButton.type = 'button';
        dropdownButton.title = 'Mod-Channels';

        dropdownButton.innerHTML = `
            <img
                src="https://static-cdn.jtvnw.net/mod-view-image-assets/modview-sword.svg"
                width="35"
                height="35"
                alt="Mod-Channels"
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

        // Dropdown-Liste erstellen.
        const dropdownList =
            document.createElement('ul');

        dropdownList.style.cssText = `
            display: none;
            position: absolute;
            top: 40px;
            left: 40px;
            z-index: 99999999;
            min-width: 180px;
            max-height: 70vh;
            overflow-y: auto;
            margin: 0;
            padding: 8px;
            list-style: none;
            background-color: #000;
        `;

        // Baut den Inhalt der Liste neu auf.
        function renderDropdownList() {
            dropdownList.replaceChildren();

            const channelNames =
                sortAndStoreModChannels(
                    processStoredModChannels()
                );

            if (channelNames.length === 0) {
                const emptyListItem =
                    document.createElement('li');

                const instructionLink =
                    document.createElement('a');

                instructionLink.innerText =
                    'Bitte lies die Anleitung hier';

                instructionLink.href =
                    'https://github.com/QueerModsDACH/MagicCleaningTool/tree/main/Instructions';

                instructionLink.target =
                    '_blank';

                instructionLink.rel =
                    'noopener noreferrer';

                instructionLink.title =
                    'Anleitung lesen';

                emptyListItem.appendChild(
                    instructionLink
                );

                dropdownList.appendChild(
                    emptyListItem
                );

                return;
            }

            // Die Kanäle werden alphabetisch ausgegeben.
            channelNames.forEach((channelName) => {
                const channelListItem =
                    document.createElement('li');

                const channelLink =
                    document.createElement('a');

                channelLink.innerText =
                    channelName;

                channelLink.href =
                    'https://twitch.tv/moderator/' +
                    encodeURIComponent(channelName);

                channelLink.target =
                    '_blank';

                channelLink.rel =
                    'noopener noreferrer';

                channelLink.title =
                    'Mod-View für den Kanal ' +
                    channelName +
                    ' öffnen';

                channelLink.style.display =
                    'block';

                channelLink.style.padding =
                    '4px 8px';

                channelLink.style.whiteSpace =
                    'nowrap';

                channelListItem.appendChild(
                    channelLink
                );

                dropdownList.appendChild(
                    channelListItem
                );
            });
        }

        // Liste beim Erstellen erstmalig aufbauen.
        renderDropdownList();

        // Globale Aktualisierungsfunktion für addCurrentModChannel().
        window.refreshQMDModMenu =
            renderDropdownList;

        // Klick auf das Schwert öffnet oder schließt die Liste.
        dropdownButton.addEventListener(
            'click',
            (clickEvent) => {
                clickEvent.stopPropagation();

                if (
                    dropdownList.style.display ===
                    'none'
                ) {
                    dropdownList.style.display =
                        'block';
                } else {
                    dropdownList.style.display =
                        'none';
                }
            }
        );

        // Klick außerhalb des Menüs schließt die Liste.
        document.addEventListener(
            'click',
            (clickEvent) => {
                if (
                    !dropdownContainer.contains(
                        clickEvent.target
                    )
                ) {
                    dropdownList.style.display =
                        'none';
                }
            }
        );

        // ############################################################################
        // ##### MOD-KANAL-BUTTON IM TWITCH-HEADER #####
        // ############################################################################

        //
        // Fügt den Button – wie in deiner alten Version –
        // nur dann neben dem Twitch-Logo ein,
        // wenn eine Moderationsberechtigung erkannt wurde.

        function appendModMenuButton() {
            // Das ist die ursprüngliche Erkennung aus deiner alten funktionierenden Version.
            const primaryModButton =
                document.querySelector(
                    '[data-test-selector="mod-view-link"]'
                );

            // Fallback für mögliche Twitch-Änderungen.
            const alternativeModButton =
                document.querySelector(
                    '[data-a-target="mod-view-link"]'
                );

            const chatSendButton =
                document.querySelector(
                    '[data-a-target="chat-send-button"]'
                );

            const isModeratorPage =
                window.location.pathname.includes(
                    '/moderator/'
                );

            // Mod-Rechte gelten als vorhanden, wenn:
            // 1. der Twitch-Mod-View-Link existiert oder
            // 2. die Mod-Ansicht geöffnet ist und der Chat-Button vorhanden ist.

            const areModToolsAvailable =
                Boolean(primaryModButton) ||
                Boolean(alternativeModButton) ||
                (
                    isModeratorPage &&
                    Boolean(chatSendButton)
                );

            // Auf nicht moderierten Seiten wird der Button aus dem Header entfernt.
            if (!areModToolsAvailable) {
                dropdownButton.remove();
                dropdownList.remove();

                return;
            }

            // Erst bei bestätigten Mod-Rechten wird der aktuelle Kanal gespeichert.
            addCurrentModChannel();

            // Twitch-Logo beziehungsweise Home-Link suchen.
            const twitchLogo =
                document.querySelector(
                    '[data-a-target="home-link"]'
                );

            if (
                !twitchLogo ||
                !twitchLogo.parentElement
            ) {
                return;
            }

            const logoContainer =
                twitchLogo.parentElement;

            logoContainer.style.display =
                'flex';

            logoContainer.style.alignItems =
                'center';

            logoContainer.style.position =
                'relative';

            // Button direkt rechts neben dem Twitch-Logo einfügen –
            // wie in der alten Version.
            if (
                !logoContainer.contains(
                    dropdownButton
                )
            ) {
                logoContainer.insertBefore(
                    dropdownButton,
                    twitchLogo.nextSibling
                );
            }

            // Dropdown in denselben Container einfügen.
            if (
                !logoContainer.contains(
                    dropdownList
                )
            ) {
                logoContainer.appendChild(
                    dropdownList
                );
            }
        }

        // Twitch ist eine Single-Page-Anwendung.
        // Die Mod-Rechte und der Header können sich jederzeit
        // durch Navigation oder Nachladen ändern.

        setInterval(
            appendModMenuButton,
            1000
        );

        // Sofortiger erster Prüfdurchlauf.
        appendModMenuButton();
    }

    // Menü erstellen.
    // Wenn der Twitch-Header noch nicht vorhanden ist,
    // wird beim nächsten globalen Durchlauf erneut versucht,
    // das Menü zu erstellen.

    createDropdownMenu();

    // CSS für die Animation nur einmal hinzufügen.
    if (
        !document.getElementById(
            'mod-menu-style'
        )
    ) {
        const menuAnimationStyle =
            document.createElement('style');

        menuAnimationStyle.id =
            'mod-menu-style';

        menuAnimationStyle.textContent = `
            @keyframes pulse {
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
                animation: pulse 2s infinite;
            }
        `;

        document.head.appendChild(
            menuAnimationStyle
        );
    }
}

// ############################################################################
// ##### STARTUP UND DAUERHAFTE TWITCH-PRÜFUNG #####
// ############################################################################

// Twitch lädt die Oberfläche dynamisch.
// Deshalb wird nicht nur wenige Sekunden lang geprüft,
// sondern dauerhaft in kurzen Abständen.

(function () {
    const modMenuCheckIntervalMs = 1000;

    // Sofortiger erster Durchlauf
    modMenu();

    // Wiederholte Prüfung wegen Twitch-SPA und dynamischem Rendering
    setInterval(
        modMenu,
        modMenuCheckIntervalMs
    );
})();
