// ==UserScript==
// @name Magic Cleaning Tool
// @description Ein Tool, das die Moderation auf Twitch erleichtert
// @namespace Magic Cleaning Tool ...for a little better World
// @version 1.9.6.2
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
    // ##### EXTERNE BIBLIOTHEKEN LADEN ###########################################
    // ############################################################################

    // jQuery und jQuery UI werden nur geladen, wenn sie noch nicht vorhanden sind.
    function loadExternalLibraries() {
        if (!window.jQuery) {
            const jqueryScript = document.createElement('script');
            jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
            jqueryScript.onload = loadJqueryUi;
            document.head.appendChild(jqueryScript);
        } else {
            loadJqueryUi();
        }
    }

    function loadJqueryUi() {
        if (window.jQuery && !window.jQuery.ui) {
            const jqueryUiScript = document.createElement('script');
            jqueryUiScript.src = 'https://code.jquery.com/ui/1.13.0/jquery-ui.min.js';
            document.head.appendChild(jqueryUiScript);
        }
    }

    loadExternalLibraries();

    // ############################################################################
    // ##### ALLGEMEINE ANWENDUNGSKONFIGURATION ###################################
    // ############################################################################

    const toolVersion = '1.9.6.2';
    const defaultBanReason = 'Ban by QMD list';

    const banListsUrl =
        'https://github.com/QueerModsDACH/Listen';

    const logPrefix = '[QMD_MCT_1]';

    // Alle LocalStorage-Schlüssel des Tools beginnen mit diesem Prefix.
    const browserStoragePrefix = '_QMD_';

    // ############################################################################
    // ##### TEXTE DER LISTEN- UND AKTIONSBUTTONS ###############################
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
    // ##### LAUFZEITSTATUS UND BENUTZERLISTEN ###################################
    // ############################################################################

    let isPaused = false;
    let activeChannelName = '';

    const queuedUsers = new Set();
    const ignoredUsers = new Set();
    const processedUsers = new Set();

    // ############################################################################
    // ##### DESIGN- UND THEME-EINSTELLUNGEN ######################################
    // ############################################################################

    const activationButtonImage =
        'https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/pix/activate.png';

    const princessThemeColor = '#2F9C0B';
    const normalThemeColor = '#9146FF';

    const currentVersionText = 'die Version ist aktuell ツ';

    // ############################################################################
    // ##### VERZÖGERUNGEN FÜR TWITCH-AKTIONEN ####################################
    // ############################################################################

    const delay = (milliseconds) =>
        new Promise((resolve) => setTimeout(resolve, milliseconds));

    // Werte unter 125 ms sollten vermieden werden.
    const BAN_ACTION_DELAY_MS = 130;
    const UNBAN_ACTION_DELAY_MS = 130;
    const PAUSE_CHECK_DELAY_MS = 1000;
    const MOD_CHANNEL_DELAY_MS = 100;

    // ############################################################################
    // ##### HILFSFUNKTIONEN ######################################################
    // ############################################################################

    function parseStoredArray(storageKey) {
        try {
            const storedValue = localStorage.getItem(storageKey);

            if (!storedValue) {
                return [];
            }

            const parsedValue = JSON.parse(storedValue);

            return Array.isArray(parsedValue) ? parsedValue : [];
        } catch (error) {
            console.error(
                logPrefix,
                'Gespeicherte Daten konnten nicht gelesen werden:',
                storageKey,
                error
            );

            return [];
        }
    }

    function storeArray(storageKey, values) {
        localStorage.setItem(
            storageKey,
            JSON.stringify(Array.from(new Set(values)))
        );
    }

    function getCurrentChannelName() {
        const pathname = window.location.pathname
            .split('/')
            .filter(Boolean);

        if (pathname[0] === 'moderator' && pathname[1]) {
            return decodeURIComponent(pathname[1]).toLowerCase();
        }

        if (pathname[0] && pathname[0] !== 'home') {
            return decodeURIComponent(pathname[0]).toLowerCase();
        }

        return 'unknown';
    }

    activeChannelName = getCurrentChannelName();

    console.log(
        logPrefix,
        'Aktiver Kanal:',
        activeChannelName
    );

    // ############################################################################
    // ##### LOCALSTORAGE-SCHLÜSSEL ##############################################
    // ############################################################################

    // Für jeden Twitch-Kanal werden eigene Listen verwendet.
    const banListStorageKey =
        `${browserStoragePrefix}${activeChannelName}_banlist`;

    const unbanListStorageKey =
        `${browserStoragePrefix}${activeChannelName}_unbanlist`;

    // Die Mod-Kanal-Liste wird ebenfalls mit dem Prefix gespeichert.
    const modChannelsStorageKey =
        `${browserStoragePrefix}myModChannels`;

    let bannedUsers = parseStoredArray(banListStorageKey);
    let unbannedUsers = parseStoredArray(unbanListStorageKey);
    let storedModChannels = parseStoredArray(modChannelsStorageKey);

    // ############################################################################
    // ##### CORS-KONFIGURATION ###################################################
    // ############################################################################

    // Diese Konfiguration wird für den Import externer Listen verwendet.
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

    if (typeof GM_setValue === 'function') {
        GM_setValue(
            `${browserStoragePrefix}corsDisable`,
            JSON.stringify(corsConfiguration)
        );
    } else {
        localStorage.setItem(
            `${browserStoragePrefix}corsDisable`,
            JSON.stringify(corsConfiguration)
        );
    }

    // ############################################################################
    // ##### GM_ADDSTYLE-FALLBACK #################################################
    // ############################################################################

    if (typeof window.GM_addStyle !== 'function') {
        window.GM_addStyle = (cssText) => {
            const styleElement = document.createElement('style');
            styleElement.textContent = cssText;
            document.head.appendChild(styleElement);
        };
    }

    // ############################################################################
    // ##### HTML-STRUKTUR UND STYLES #############################################
    // ############################################################################

    const toolHtml = /* html */ `
        <div id="raidhammer" class="raidhammer">
            <style>
                .raidhammer {
                    z-index: 99999999;
                    position: fixed;
                    top: 250px;
                    left: 350px;
                    min-width: 525px;
                    max-width: calc(100vw - 30px);
                    padding: 5px;
                    background-color: var(--color-background-base, #18181b);
                    color: var(--color-text-base, #efeff1);
                    border: 1px solid var(--color-border-base, #464649);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
                    cursor: move;
                    box-sizing: border-box;
                }

                .raidhammer *,
                .raidhammer *::before,
                .raidhammer *::after {
                    box-sizing: border-box;
                }

                .raidhammer .handle {
                    cursor: move;
                    user-select: none;
                }

                .raidhammer .header {
                    display: flex;
                    align-items: center;
                    min-height: 36px;
                }

                .raidhammer .logo {
                    min-height: 30px;
                    margin: 0;
                    line-height: 30px;
                    font-weight: var(--font-weight-semibold, 600);
                }

                .raidhammer .logo a {
                    color: ${normalThemeColor};
                    text-decoration: none;
                    white-space: nowrap;
                }

                .raidhammer .logo img,
                .raidhammer button img {
                    display: inline-block;
                    width: auto;
                    object-fit: contain;
                    vertical-align: middle;
                }

                .raidhammer .list {
                    min-height: 8em;
                    max-height: 350px;
                    padding: 8px;
                    overflow-y: auto;
                    background: var(--color-background-body, #0e0e10);
                }

                .raidhammer .list ul {
                    margin: 0;
                    padding: 0;
                    list-style: none;
                }

                .raidhammer .list li {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    min-height: 32px;
                }

                .raidhammer .list li span {
                    font-weight: var(--font-weight-semibold, 600);
                }

                .raidhammer .list li a {
                    color: var(--color-text-link, #bf94ff);
                    text-decoration: none;
                }

                .raidhammer .empty {
                    padding: 2em;
                    text-align: center;
                    opacity: 0.85;
                }

                .raidhammer .empty img {
                    display: block;
                    width: min(370px, 100%);
                    height: 80px;
                    object-fit: contain;
                    margin: 0 auto;
                    cursor: pointer;
                }

                .raidhammer button {
                    min-width: 30px;
                    min-height: 30px;
                    margin: 1px;
                    padding: 0 0.5em;
                    border: 0;
                    border-radius: 4px;
                    background-color: var(
                        --color-background-button-secondary-default,
                        #3a3a3d
                    );
                    color: var(
                        --color-text-button-secondary,
                        #efeff1
                    );
                    font-size: 13px;
                    font-weight: 600;
                    text-align: center;
                    cursor: pointer;
                    line-height: 1.2;
                }

                .raidhammer button:hover {
                    filter: brightness(1.2);
                }

                .raidhammer button.ban,
                .raidhammer button.banAll {
                    background: #f44336;
                    color: #ffffff;
                }

                .raidhammer button.unban,
                .raidhammer button.unbanAll {
                    background: #34ae0c;
                    color: #ffffff;
                }

                .raidhammer button.ignore,
                .raidhammer button.addModChannels,
                .raidhammer button.removeModChannel {
                    min-width: 30px;
                    padding: 0 4px;
                }

                .raidhammer .import {
                    min-height: 20px;
                    padding: 3px;
                    background: var(--color-background-body, #0e0e10);
                    border: 1px solid var(--color-border-base, #464649);
                }

                .raidhammer textarea {
                    width: 100%;
                    min-height: 8em;
                    padding: 0.5em;
                    border: 1px solid #555;
                    background: var(--color-background-base, #18181b);
                    color: var(--color-text-base, #efeff1);
                    font-size: 10pt;
                    resize: vertical;
                }

                .raidhammer input[type="text"] {
                    min-height: 30px;
                    padding: 4px 7px;
                    border: 1px solid #555;
                    background: var(--color-background-base, #18181b);
                    color: var(--color-text-base, #efeff1);
                }

                .raidhammer .footer {
                    font-size: 7pt;
                    text-align: center;
                }

                .raidhammer .footer a {
                    color: ${normalThemeColor};
                }
            </style>

            <!-- ====================================================================
            ##### HTML: KOPFBEREICH ################################################
            ===================================================================== -->

            <div class="header">
                <span class="handle" style="flex-grow: 0;"></span>
                <button class="princess" style="display: none;" title="Theme wechseln">
                    <img
                        src="https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/pix/magicwand.png"
                        title="Für die Prinzessinnen unter uns"
                        alt="Zauberstab"
                        width="20"
                        height="20"
                    >
                </button>

                <span style="flex-grow: 1;"></span>

                <h5 id="header" class="logo">
                    <a
                        href="https://github.com/QueerModsDACH/MagicCleaningTool"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Zum QueerModsDACH Repository"
                    >
                        Magic Cleaning Tool&nbsp;&nbsp;
                        <img
                            src="${activationButtonImage}"
                            alt="Repository öffnen"
                            width="18"
                            height="18"
                        >
                        &nbsp;&nbsp;for a little better World
                    </a>
                </h5>

                <span style="flex-grow: 1;"></span>

                <button class="closeBtn" title="Fenster schließen">
                    _
                </button>
            </div>

            <!-- ====================================================================
            ##### HTML: IMPORTBEREICH ##############################################
            ===================================================================== -->

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
                        Hinzufügen ➕
                    </button>
                </div>

                <div style="text-align: center;">
                    <button id="Button_Suspect" class="Button_Suspect" style="width: 32%;">
                        ${suspectListButtonText}
                    </button>

                    <button id="mdgBtnTrolls1" class="mdgBtnTrolls1" style="width: 33%;">
                        ${trollListButtonText1}
                    </button>

                    <button id="mdgBtnTrolls2" class="mdgBtnTrolls2" style="width: 32%;">
                        ${trollListButtonText2}
                    </button>
                </div>

                <div style="text-align: center;">
                    <button id="mdgBtnSec" class="mdgBtnSec" style="width: 32%;">
                        ${securityListButtonText}
                    </button>

                    <button id="mdgBtnViewerBots" class="mdgBtnViewerBots" style="width: 33%;">
                        ${viewerBotsListButtonText}
                    </button>

                    <button id="mdgBtnPornBot" class="mdgBtnPornBot" style="width: 32%;">
                        ${pornBotListButtonText}
                    </button>
                </div>

                <div style="text-align: center;">
                    <button id="mdgBtnFlirtyMad" class="mdgBtnFlirtyMad" style="width: 32%;">
                        ${flirtyMadListButtonText}
                    </button>

                    <button id="mdgBtnFollowBot" class="mdgBtnFollowBot" style="width: 33%;">
                        ${followBotListButtonText}
                    </button>

                    <button
                        id="mdgBtnUnban"
                        class="mdgBtnUnban"
                        style="width: 32%; color: #34ae0c;"
                    >
                        ${unbanListButtonText}
                    </button>
                </div>

                <div style="text-align: center;">
                    <button id="mdgBtnAdvertising" class="mdgBtnAdvertising" style="width: 32%;">
                        ${advertisingListButtonText}
                    </button>

                    <button id="mdgBtnSpamBots" class="mdgBtnSpamBots" style="width: 33%;">
                        ${spamBotsListButtonText}
                    </button>

                    <button id="qmd" class="qmd" style="width: 32%;">
                        ${infoButtonText}
                    </button>
                </div>
            </div>

            <!-- ====================================================================
            ##### HTML: HAUPTBEREICH ###############################################
            ===================================================================== -->

            <div class="body">
                <div class="list"></div>

                <div style="display: flex; margin: 5px;">
                    <span style="flex-grow: 2;"></span>

                    <div id="buttons" class="buttons">
                        <button class="back" title="Zurück">
                            ⬅
                        </button>

                        <button
                            class="clearBannedUsers"
                            title="Gespeicherte gebannte Benutzer löschen"
                        >
                            ban-cache leeren 🗑
                        </button>

                        <button
                            class="MooBot"
                            title="Öffnet Moobot"
                            data-external-url="https://moo.bot/"
                        >
                            <img
                                src="https://moo.bot/favicon.ico"
                                height="17"
                                alt="Moobot"
                            >
                        </button>

                        <button
                            class="NightBot"
                            title="Öffnet Nightbot"
                            data-external-url="https://nightbot.tv/dashboard"
                        >
                            <img
                                src="https://logodix.com/logo/1909538.png"
                                height="17"
                                alt="Nightbot"
                            >
                        </button>

                        <button
                            class="comanderRoot"
                            title="Öffnet ComanderRoot"
                            data-external-url="https://twitch-tools.rootonline.de"
                        >
                            🤖
                        </button>

                        <button
                            class="sLabs"
                            title="Öffnet Streamlabs"
                            data-external-url="https://streamlabs.com/dashboard"
                        >
                            <img
                                src="https://cdn.streamlabs.com/static/imgs/streamlabs-logos/app-icon/streamlabs-app-icon.png"
                                height="17"
                                alt="Streamlabs"
                            >
                        </button>

                        <button
                            class="sElements"
                            title="Öffnet Streamelements"
                            data-external-url="https://streamelements.com/dashboard"
                        >
                            <img
                                src="https://avatars.githubusercontent.com/u/16977512?s=17&v=4"
                                width="17"
                                height="17"
                                alt="Streamelements"
                            >
                        </button>

                        <button
                            class="chatstats"
                            title="Öffnet SullyGnome-Kanalstatistiken"
                            data-external-url="https://sullygnome.com/channel/${activeChannelName}"
                        >
                            📈
                        </button>

                        <button
                            class="modLogger"
                            title="Öffnet ModLogger für den aktuellen Kanal"
                            data-external-url="https://jvpeek.github.io/twitchmodlogger/?channel=${activeChannelName}"
                        >
                            🗄
                        </button>

                        <button
                            class="chatDeepStats"
                            title="Öffnet ChatStats für den aktuellen Kanal"
                            data-external-url="https://echtkpvl.github.io/echt-twitch/chat-stats.html?channel=${activeChannelName}"
                        >
                            🩻
                        </button>

                        <button class="pause" id="pause" title="Pausieren">
                            ⏸
                        </button>

                        <button class="modChannels" title="Alle als Mod-Kanal hinzufügen">
                            ⚔
                        </button>

                        <button class="ignoreAll" title="Liste leeren">
                            🗑
                        </button>

                        <button class="unbanAll" title="Alle auf der Liste entbannen">
                            ⚕
                        </button>

                        <button class="banAll" title="Alle auf der Liste bannen">
                            👹
                        </button>
                    </div>
                </div>
            </div>

            <!-- ====================================================================
            ##### HTML: FOOTER #####################################################
            ===================================================================== -->

            <div id="footer" class="footer">
                <a
                    href="${banListsUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    id="replaceFooter"
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
    // ##### TOOL-CONTAINER ERSTELLEN #############################################
    // ############################################################################

    const toolContainer = document.createElement('div');
    toolContainer.id = 'qmd-tool-container';
    toolContainer.style.display = 'none';
    toolContainer.innerHTML = toolHtml;

    document.body.appendChild(toolContainer);

    const importTextarea = toolContainer.querySelector('#textfield');

    // ############################################################################
    // ##### DRAGGABLE-FUNKTION ###################################################
    // ############################################################################

    function enableDragging() {
        if (
            window.jQuery &&
            window.jQuery.ui &&
            typeof window.jQuery.fn.draggable === 'function'
        ) {
            const toolWindow = window.jQuery(
                toolContainer.querySelector('.raidhammer')
            );

            if (!toolWindow.hasClass('ui-draggable')) {
                toolWindow.draggable({
                    handle: '.header, .handle'
                });
            }
        }
    }

    // ############################################################################
    // ##### ALLGEMEINER IMPORT VON LISTEN ########################################
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
        const banReasonInput =
            toolContainer.querySelector('#banReason');

        if (
            !useUnban &&
            banReasonInput &&
            banReasonInput.value.trim() === ''
        ) {
            banReasonInput.value = listBanReason;
        }

        fetch(listUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        `HTTP ${response.status}: ${response.statusText}`
                    );
                }

                return response.text();
            })
            .then((listText) => {
                importedUsers.push(
                    ...listText
                        .split(/\r?\n/)
                        .map((username) => username.trim())
                        .filter(Boolean)
                );

                importedUsers.forEach((username) => {
                    if (useUnban) {
                        checkIfUserIsAlreadyUnbanned(
                            username,
                            buttonId
                        );
                    } else {
                        checkIfUserIsAlreadyBanned(
                            username,
                            buttonId
                        );
                    }
                });

                importTextarea.value = '';

                insertTextIntoTextarea(
                    Array.from(queuedUsers).join('\n')
                );

                if (queuedUsers.size !== 0) {
                    toggleImportView();
                    renderUserList();
                }
            })
            .catch((error) => {
                console.error(
                    logPrefix,
                    'Liste konnte nicht geladen werden:',
                    error
                );
            });

        const footerLink =
            toolContainer.querySelector('#replaceFooter');

        if (footerLink) {
            footerLink.textContent = footerText;
            footerLink.href = footerHref;
        }

        setTimeout(() => {
            const importButton =
                toolContainer.querySelector(`#${buttonId}`);

            if (importButton) {
                importButton.textContent = defaultButtonText;
            }
        }, 5000);
    }

    // ############################################################################
    // ##### AKTIVIERUNGSBUTTON ###################################################
    // ############################################################################

    const activationButton = document.createElement('button');

    activationButton.type = 'button';
    activationButton.id = 'hammer';
    activationButton.title = 'Magic Cleaning Tool';
    activationButton.setAttribute(
        'aria-label',
        'Magic Cleaning Tool öffnen'
    );

    activationButton.innerHTML = `
        <img
            src="${activationButtonImage}"
            alt="Magic Cleaning Tool"
            width="25"
            height="25"
        >
    `;

    activationButton.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        width: 32px;
        height: 32px;
        padding: 0;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: var(--color-fill-button-icon, #efeff1);
        cursor: pointer;
    `;

    activationButton.addEventListener('click', toggleTool);

    let isToolEnabled = false;

    // ############################################################################
    // ##### AKTIVIERUNGSBUTTON IM TWITCH-MENÜ ####################################
    // ############################################################################

    function appendActivationButton() {
        const modViewButton = document.querySelector(
            '[data-test-selector="mod-view-link"], [data-a-target="mod-view-link"]'
        );

        const chatSendButton = document.querySelector(
            '[data-a-target="chat-send-button"]'
        );

        const isModeratorPage =
            window.location.pathname.includes('/moderator/');

        let twitchNavigationBar = null;

        if (modViewButton) {
            twitchNavigationBar =
                modViewButton.parentElement?.parentElement?.parentElement;
        } else if (isModeratorPage && chatSendButton) {
            twitchNavigationBar =
                chatSendButton.parentElement?.parentElement?.parentElement;
        }

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

            enableDragging();
        }

        if (!modViewButton && !isModeratorPage && isToolEnabled) {
            isToolEnabled = false;
            hideTool();
        }
    }

    setInterval(appendActivationButton, 2000);
    appendActivationButton();

    // ############################################################################
    // ##### EVENTHANDLER DES TOOLS ###############################################
    // ############################################################################

    toolContainer.querySelector('.ignoreAll').onclick =
        ignoreAllUsers;

    toolContainer.querySelector('.banAll').onclick =
        banAllUsers;

    toolContainer.querySelector('.closeBtn').onclick =
        hideTool;

    toolContainer.querySelector('.modChannels').onclick =
        addAllModChannels;

    toolContainer.querySelector('.unbanAll').onclick =
        unbanAllUsers;

    toolContainer.querySelector('.back').onclick =
        toggleBackView;

    toolContainer.querySelector('.pause').onclick =
        togglePause;

    toolContainer.querySelector('.princess').onclick =
        toggleTheme;

    toolContainer.querySelector('.qmd').onclick =
        openQueerModsDach;

    toolContainer.querySelector('.clearBannedUsers').onclick =
        clearBannedUsers;

    toolContainer.querySelector('.importBtn').onclick =
        importManualList;

    toolContainer.querySelector('.Button_Suspect').onclick =
        importSuspectList;

    toolContainer.querySelector('.mdgBtnTrolls1').onclick =
        importTrollList1;

    toolContainer.querySelector('.mdgBtnTrolls2').onclick =
        importTrollList2;

    toolContainer.querySelector('.mdgBtnSec').onclick =
        importSecurityList;

    toolContainer.querySelector('.mdgBtnViewerBots').onclick =
        importViewerBotsList;

    toolContainer.querySelector('.mdgBtnFlirtyMad').onclick =
        importFlirtyMadList;

    toolContainer.querySelector('.mdgBtnFollowBot').onclick =
        importFollowBotList;

    toolContainer.querySelector('.mdgBtnAdvertising').onclick =
        importAdvertisingList;

    toolContainer.querySelector('.mdgBtnSpamBots').onclick =
        importSpamBotsList;

    toolContainer.querySelector('.mdgBtnPornBot').onclick =
        importPornBotList;

    // Externe Werkzeuge über data-external-url öffnen.
    toolContainer.addEventListener('click', (clickEvent) => {
        const externalButton =
            clickEvent.target.closest('[data-external-url]');

        if (externalButton) {
            window.open(
                externalButton.dataset.externalUrl,
                '_blank',
                'noopener,noreferrer'
            );
        }
    });

    // ############################################################################
    // ##### DELEGIERTE EVENTHANDLER ##############################################
    // ############################################################################

    toolContainer.addEventListener('click', (clickEvent) => {
        const clickedElement =
            clickEvent.target.closest('[data-user]');

        if (!clickedElement) {
            return;
        }

        const username = clickedElement.dataset.user;

        if (clickedElement.matches('.ignore')) {
            ignoreUser(username);
        }

        if (clickedElement.matches('.ban')) {
            banUser(username);
        }

        if (clickedElement.matches('.unban')) {
            unbanUser(username);
        }

        if (clickedElement.matches('.accountage')) {
            requestAccountAge(username);
        }

        if (clickedElement.matches('.removeModChannel')) {
            removeModChannel(username);
        }

        if (clickedElement.matches('.addModChannels')) {
            addModChannel(username);
        }
    });

    toolContainer.addEventListener('click', (clickEvent) => {
        if (
            clickEvent.target.matches('.toggleImport')
        ) {
            toggleImportView();
        }
    });

    // ############################################################################
    // ##### GESPEICHERTE BANNLISTE LÖSCHEN #######################################
    // ############################################################################

    function clearBannedUsers() {
        localStorage.removeItem(banListStorageKey);
        bannedUsers = [];
        renderUserList();
    }

    // ############################################################################
    // ##### QUEER MODS DACH ÖFFNEN ###############################################
    // ############################################################################

    function openQueerModsDach() {
        window.open(
            'https://github.com/QueerModsDACH/',
            '_blank',
            'noopener,noreferrer'
        );
    }

    // ############################################################################
    // ##### BENUTZEROBERFLÄCHE UND FENSTERSTEUERUNG ##############################
    // ############################################################################

    function toggleTheme() {
        const headerLink =
            toolContainer.querySelector('#header a');

        const footerLinks =
            toolContainer.querySelectorAll('#footer a');

        const currentColor =
            headerLink.style.color === princessThemeColor
                ? normalThemeColor
                : princessThemeColor;

        headerLink.style.color = currentColor;

        footerLinks.forEach((footerLink) => {
            footerLink.style.color = currentColor;
        });
    }

    function togglePause() {
        const pauseButton =
            toolContainer.querySelector('#pause');

        if (!pauseButton) {
            return;
        }

        isPaused = !isPaused;

        pauseButton.textContent =
            isPaused ? '▶' : '⏸';

        pauseButton.title =
            isPaused ? 'Fortsetzen' : 'Pausieren';
    }

    function showTool() {
        console.log(logPrefix, 'Show');

        toolContainer.style.display = '';
        isToolEnabled = true;

        enableDragging();
        renderUserList();
    }

    function hideTool() {
        console.log(logPrefix, 'Hide');

        toolContainer.style.display = 'none';
        isToolEnabled = false;
    }

    function toggleTool() {
        if (toolContainer.style.display === 'none') {
            showTool();
        } else {
            hideTool();
        }

        checkForNewVersion();
    }

    function checkForNewVersion() {
        fetch(
            'https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/MagicCleaningTool.user.js'
        )
            .then((response) => response.text())
            .then((scriptText) => {
                const versionMatch =
                    /@version\s+([0-9.]+)/.exec(scriptText);

                if (!versionMatch) {
                    return;
                }

                const newestVersion = versionMatch[1];
                const versionLink =
                    toolContainer.querySelector('#manoooo');

                if (!versionLink) {
                    return;
                }

                if (toolVersion < newestVersion) {
                    versionLink.textContent =
                        'Update verfügbar 🚨';
                } else {
                    versionLink.textContent =
                        currentVersionText;
                }
            })
            .catch((error) => {
                console.warn(
                    logPrefix,
                    'Versionsprüfung fehlgeschlagen:',
                    error
                );
            });
    }

    function toggleImportView() {
        const importSection =
            toolContainer.querySelector('.import');

        const mainBody =
            toolContainer.querySelector('.body');

        const isImportVisible =
            importSection.style.display !== 'none';

        if (isImportVisible) {
            importSection.style.display = 'none';
            mainBody.style.display = '';
        } else {
            importSection.style.display = '';
            mainBody.style.display = 'none';

            importTextarea.focus();
        }
    }

    function toggleBackView() {
        queuedUsers.clear();
        importTextarea.value = '';

        const importSection =
            toolContainer.querySelector('.import');

        const mainBody =
            toolContainer.querySelector('.body');

        importSection.style.display = 'none';
        mainBody.style.display = '';

        const footerLink =
            toolContainer.querySelector('#replaceFooter');

        footerLink.textContent =
            'Alle Bannlisten anzeigen';

        footerLink.href = banListsUrl;

        renderUserList();
    }

    // ############################################################################
    // ##### BENUTZERSTATUS UND LISTENAKTIONEN ####################################
    // ############################################################################

    function checkIfUserIsAlreadyBanned(username, buttonId) {
        if (!bannedUsers.includes(username)) {
            queuedUsers.add(username);
        } else {
            const button =
                toolContainer.querySelector(`#${buttonId}`);

            if (button) {
                button.textContent = 'already banned';
            }

            console.log(
                logPrefix,
                username,
                'already banned',
                activeChannelName
            );
        }
    }

    function checkIfUserIsAlreadyUnbanned(username, buttonId) {
        if (!unbannedUsers.includes(username)) {
            queuedUsers.add(username);
        } else {
            const button =
                toolContainer.querySelector(`#${buttonId}`);

            if (button) {
                button.textContent = 'already unbanned';
            }

            console.log(
                logPrefix,
                username,
                'already unbanned in',
                activeChannelName
            );
        }
    }

    // ############################################################################
    // ##### IMPORT UND EINGABEVERARBEITUNG #######################################
    // ############################################################################

    function importManualList() {
        const importedLines =
            importTextarea.value
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean);

        for (const username of importedLines) {
            if (/^[\w_]+$/.test(username)) {
                queuedUsers.add(username);
            }
        }

        importTextarea.value = '';
        toggleImportView();
        renderUserList();
    }

    function insertTextIntoTextarea(text) {
        importTextarea.value = text;
    }

    // ############################################################################
    // ##### IMPORTFUNKTIONEN DER VORDEFINIERTEN LISTEN ###########################
    // ############################################################################

    function importSuspectList() {
        importListGeneric(
            `${banListsUrl}/refs/heads/main/suspect.txt`,
            'Button_Suspect',
            suspectListButtonText,
            "Geladene Liste 'suspect.txt' anzeigen",
            `${banListsUrl}/refs/heads/main/suspect.txt`,
            false,
            'suspect (QMD-List)'
        );
    }

    function importTrollList1() {
        importListGeneric(
            `${banListsUrl}/refs/heads/main/hate_troll_list_2.txt`,
            'mdgBtnTrolls1',
            trollListButtonText1,
            "Geladene Liste 'hate_troll_list_2.txt' anzeigen",
            `${banListsUrl}/refs/heads/main/hate_troll_list_2.txt`
        );
    }

    function importTrollList2() {
        importListGeneric(
            `${banListsUrl}/refs/heads/main/hate_troll_list_3.txt`,
            'mdgBtnTrolls2',
            trollListButtonText2,
            "Geladene Liste 'hate_troll_list_3.txt' anzeigen",
            `${banListsUrl}/refs/heads/main/hate_troll_list_3.txt`
        );
    }

    function importSecurityList() {
        importListGeneric(
            `${banListsUrl}/refs/heads/main/security_ban_list.txt`,
            'mdgBtnSec',
            securityListButtonText,
            "Geladene Liste 'security_ban_list.txt' anzeigen",
            `${banListsUrl}/refs/heads/main/security_ban_list.txt`
        );
    }

    function importUnbanList() {
        importListGeneric(
            `${banListsUrl}/refs/heads/main/unbanlist.txt`,
            'mdgBtnUnban',
            unbanListButtonText,
            'Geladene Liste unbanlist.txt anzeigen',
            `${banListsUrl}/refs/heads/main/unbanlist.txt`,
            true
        );
    }

    function importViewerBotsList() {
        importListGeneric(
            `${banListsUrl}/refs/heads/main/viewer_bot_list.txt`,
            'mdgBtnViewerBots',
            viewerBotsListButtonText,
            "Geladene Liste 'viewer_bot_list.txt' anzeigen",
            `${banListsUrl}/refs/heads/main/viewer_bot_list.txt`
        );
    }

    function importFlirtyMadList() {
        importListGeneric(
            `${banListsUrl}/refs/heads/main/mad_tos_list.txt`,
            'mdgBtnFlirtyMad',
            flirtyMadListButtonText,
            "Geladene Liste 'mad_tos_list.txt' anzeigen",
            `${banListsUrl}/refs/heads/main/mad_tos_list.txt`
        );
    }

    function importFollowBotList() {
        importListGeneric(
            `${banListsUrl}/refs/heads/main/follower_bot_list.txt`,
            'mdgBtnFollowBot',
            followBotListButtonText,
            "Geladene Liste 'follower_bot_list.txt' anzeigen",
            `${banListsUrl}/refs/heads/main/follower_bot_list.txt`
        );
    }

    function importAdvertisingList() {
        importListGeneric(
            `${banListsUrl}/refs/heads/main/seller_advertising_list.txt`,
            'mdgBtnAdvertising',
            advertisingListButtonText,
            "Geladene Liste 'seller_advertising_list.txt' anzeigen",
            `${banListsUrl}/refs/heads/main/seller_advertising_list.txt`
        );
    }

    function importSpamBotsList() {
        importListGeneric(
            `${banListsUrl}/refs/heads/main/spam_bot_list.txt`,
            'mdgBtnSpamBots',
            spamBotsListButtonText,
            "Geladene Liste 'spam_bot_list.txt' anzeigen",
            `${banListsUrl}/refs/heads/main/spam_bot_list.txt`
        );
    }

    function importPornBotList() {
        importListGeneric(
            `${banListsUrl}/refs/heads/main/porn_bot_acc_list.txt`,
            'mdgBtnPornBot',
            pornBotListButtonText,
            "Geladene Liste 'porn_bot_acc_list.txt' anzeigen",
            `${banListsUrl}/refs/heads/main/porn_bot_acc_list.txt`
        );
    }

    // ############################################################################
    // ##### EINZEL- UND MASSENAKTIONEN ###########################################
    // ############################################################################

    function ignoreAllUsers() {
        console.log(
            logPrefix,
            'Ignoring all...',
            queuedUsers
        );

        for (const username of Array.from(queuedUsers)) {
            ignoreUser(username);
        }
    }

    async function banAllUsers() {
        console.log(
            logPrefix,
            'Banning all...',
            queuedUsers
        );

        for (const username of Array.from(queuedUsers)) {
            while (isPaused) {
                await delay(PAUSE_CHECK_DELAY_MS);
            }

            banUser(username);
            await delay(BAN_ACTION_DELAY_MS);
        }
    }

    async function unbanAllUsers() {
        console.log(
            logPrefix,
            'Unbanning all...',
            queuedUsers
        );

        for (const username of Array.from(queuedUsers)) {
            while (isPaused) {
                await delay(PAUSE_CHECK_DELAY_MS);
            }

            unbanUser(username);
            await delay(UNBAN_ACTION_DELAY_MS);
        }
    }

    async function addAllModChannels() {
        console.log(
            logPrefix,
            'Add Mod-Channels...',
            queuedUsers
        );

        for (const username of Array.from(queuedUsers)) {
            while (isPaused) {
                await delay(PAUSE_CHECK_DELAY_MS);
            }

            addModChannel(username);
            await delay(MOD_CHANNEL_DELAY_MS);
        }
    }

    function requestAccountAge(username) {
        console.log(
            logPrefix,
            'send !accountage',
            username
        );

        sendChatMessage(`!accountage ${username}`);
    }

    function ignoreUser(username) {
        queuedUsers.delete(username);
        ignoredUsers.add(username);
        renderUserList();
    }

    function unbanUser(username) {
        queuedUsers.delete(username);
        processedUsers.add(username);

        if (!unbannedUsers.includes(username)) {
            unbannedUsers.push(username);
        }

        bannedUsers = bannedUsers.filter(
            (storedUsername) =>
                storedUsername !== username
        );

        storeArray(
            unbanListStorageKey,
            unbannedUsers
        );

        storeArray(
            banListStorageKey,
            bannedUsers
        );

        sendChatMessage(`/unban ${username}`);
        renderUserList();
    }

    function removeModChannel(username) {
        queuedUsers.delete(username);
        processedUsers.add(username);

        storedModChannels = storedModChannels.filter(
            (storedChannel) =>
                storedChannel !== username
        );

        storeArray(
            modChannelsStorageKey,
            storedModChannels
        );

        renderUserList();
        refreshModMenu();
    }

    function banUser(username) {
        const banReasonInput =
            toolContainer.querySelector('#banReason');

        const banReason =
            banReasonInput?.value.trim() ||
            defaultBanReason;

        queuedUsers.delete(username);
        processedUsers.add(username);

        if (!bannedUsers.includes(username)) {
            bannedUsers.push(username);
        }

        storeArray(
            banListStorageKey,
            bannedUsers
        );

        sendChatMessage(
            `/ban ${username} ${banReason}`
        );

        renderUserList();
    }

    function addModChannel(channelName) {
        channelName = channelName.toLowerCase();

        if (!storedModChannels.includes(channelName)) {
            storedModChannels.push(channelName);

            storedModChannels =
                sortModChannels(storedModChannels);

            storeArray(
                modChannelsStorageKey,
                storedModChannels
            );

            queuedUsers.delete(channelName);
            processedUsers.add(channelName);

            renderUserList();
            refreshModMenu();
        } else {
            console.log(
                logPrefix,
                'Kanal ist bereits in den ModChannels:',
                channelName
            );
        }
    }

    // ############################################################################
    // ##### NACHRICHTEN AN DEN TWITCH-CHAT SENDEN ###############################
    // ############################################################################

    function sendChatMessage(message) {
        try {
            sendMessageUsingTextarea(message);
        } catch (error) {
            console.warn(
                logPrefix,
                'Textarea-Versand fehlgeschlagen. Slate-Fallback wird verwendet.',
                error
            );

            sendMessageUsingSlateEditor(message);
        }
    }

    function sendMessageUsingTextarea(message) {
        const chatTextarea = document.querySelector(
            "[data-a-target='chat-input']"
        );

        const chatSendButton = document.querySelector(
            "[data-a-target='chat-send-button']"
        );

        if (!chatTextarea || !chatSendButton) {
            throw new Error('Twitch-Chat-Textarea oder Senden-Button nicht gefunden.');
        }

        const valueSetter =
            Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                'value'
            ).set;

        valueSetter.call(chatTextarea, message);

        chatTextarea.dispatchEvent(
            new Event('input', {
                bubbles: true
            })
        );

        chatSendButton.click();
    }

    function sendMessageUsingSlateEditor(message) {
        const slateEditor = document.querySelector(
            '[data-slate-editor="true"]'
        );

        if (!slateEditor) {
            throw new Error('Slate-Editor nicht gefunden.');
        }

        slateEditor.focus();

        slateEditor.dispatchEvent(
            new InputEvent('beforeinput', {
                bubbles: true,
                data: message,
                inputType: 'insertText'
            })
        );

        slateEditor.dispatchEvent(
            new InputEvent('input', {
                bubbles: true,
                data: message,
                inputType: 'insertText'
            })
        );

        slateEditor.dispatchEvent(
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
    // ##### LISTENANZEIGE UND RENDERING ##########################################
    // ############################################################################

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function renderUserList() {
        const actionButtons = [
            '.ignoreAll',
            '.banAll',
            '.back',
            '.pause',
            '.modChannels',
            '.unbanAll'
        ];

        actionButtons.forEach((selector) => {
            const button =
                toolContainer.querySelector(selector);

            if (button) {
                button.style.display =
                    queuedUsers.size ? '' : 'none';
            }
        });

        const listElement =
            toolContainer.querySelector('.list');

        if (!listElement) {
            return;
        }

        const listContent = queuedUsers.size
            ? Array.from(queuedUsers)
                .map((username) => {
                    const safeUsername =
                        escapeHtml(username);

                    return `
                        <li>
                            <button
                                class="accountage"
                                data-user="${safeUsername}"
                                title="Schreibt !accountage ${safeUsername} in den Chat"
                            >
                                ?
                            </button>

                            <button
                                class="ignore"
                                data-user="${safeUsername}"
                                title="Benutzer aus Liste entfernen"
                            >
                                ❌
                            </button>

                            <button
                                class="unban"
                                data-user="${safeUsername}"
                                title="Benutzer entbannen"
                            >
                                Unban
                            </button>

                            <button
                                class="ban"
                                data-user="${safeUsername}"
                                title="Benutzer bannen"
                            >
                                Ban
                            </button>

                            <button
                                class="addModChannels"
                                data-user="${safeUsername}"
                                title="Kanal als Mod-Kanal hinzufügen"
                            >
                                ➕⚔
                            </button>

                            <button
                                class="removeModChannel"
                                data-user="${safeUsername}"
                                title="Kanal als Mod-Kanal entfernen"
                            >
                                ➖⚔
                            </button>

                            <span>
                                <a
                                    href="https://twitch-tools.rootonline.de/followinglist_viewer.php?username=${encodeURIComponent(username)}"
                                    title="Dieser User folgt..."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    ${safeUsername}
                                </a>
                            </span>
                        </li>
                    `;
                })
                .join('')
            : `
                <div id="empty" class="empty">
                    <img
                        class="toggleImport"
                        src="https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/pix/Logo_1920x400.png"
                        title="Magic Cleaning Tool starten"
                        alt="Magic Cleaning Tool"
                    >
                </div>
            `;

        listElement.innerHTML = `
            <ul>
                ${listContent}
            </ul>
        `;
    }

    // ############################################################################
    // ##### MOD-KANAL-LISTE #####################################################
    // ############################################################################

    function sortModChannels(channelNames) {
        return Array.from(
            new Set(
                channelNames
                    .filter(
                        (channelName) =>
                            typeof channelName === 'string' &&
                            channelName.trim()
                    )
                    .map((channelName) =>
                        channelName.trim().toLowerCase()
                    )
            )
        ).sort((firstChannel, secondChannel) =>
            firstChannel.localeCompare(
                secondChannel,
                'de',
                {
                    sensitivity: 'base'
                }
            )
        );
    }

    function saveModChannels() {
        storedModChannels =
            sortModChannels(storedModChannels);

        storeArray(
            modChannelsStorageKey,
            storedModChannels
        );

        return storedModChannels;
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
        const modViewButton =
            getModViewButton();

        if (!modViewButton) {
            return null;
        }

        const possibleHref =
            modViewButton.href ||
            modViewButton.getAttribute('href') ||
            modViewButton.getAttribute('data-href');

        if (!possibleHref) {
            return null;
        }

        try {
            const channelUrl =
                new URL(
                    possibleHref,
                    window.location.origin
                );

            const channelMatch =
                channelUrl.pathname.match(
                    /^\/moderator\/([^/]+)/
                );

            return channelMatch
                ? decodeURIComponent(channelMatch[1]).toLowerCase()
                : null;
        } catch (error) {
            console.error(
                logPrefix,
                'Kanalname konnte nicht aus dem Mod-Link gelesen werden:',
                error
            );

            return null;
        }
    }

    function getChannelFromModeratorUrl() {
        const channelMatch =
            window.location.pathname.match(
                /^\/moderator\/([^/]+)/
            );

        return channelMatch
            ? decodeURIComponent(channelMatch[1]).toLowerCase()
            : null;
    }

    function addCurrentModChannel() {
        const modViewButton =
            getModViewButton();

        const chatSendButton =
            document.querySelector(
                '[data-a-target="chat-send-button"]'
            );

        const isModeratorPage =
            window.location.pathname.includes('/moderator/');

        let currentChannelName = null;

        if (modViewButton) {
            currentChannelName =
                getChannelFromModViewLink();
        }

        if (
            !currentChannelName &&
            isModeratorPage &&
            chatSendButton
        ) {
            currentChannelName =
                getChannelFromModeratorUrl();
        }

        if (!currentChannelName) {
            return;
        }

        if (!storedModChannels.includes(currentChannelName)) {
            storedModChannels.push(currentChannelName);
            saveModChannels();
        } else {
            saveModChannels();
        }

        refreshModMenu();
    }

    // ############################################################################
    // ##### MOD-KANAL-DROPDOWN ###################################################
    // ############################################################################

    let modMenuButton = null;
    let modMenuList = null;

    function createModMenuElements() {
        if (modMenuButton && modMenuList) {
            return;
        }

        modMenuButton = document.createElement('button');
        modMenuButton.id = 'modMenu';
        modMenuButton.type = 'button';
        modMenuButton.title = 'Gespeicherte Mod-Kanäle';
        modMenuButton.setAttribute(
            'aria-label',
            'Gespeicherte Mod-Kanäle öffnen'
        );

        modMenuButton.innerHTML = `
            <img
                src="https://static-cdn.jtvnw.net/mod-view-image-assets/modview-sword.svg"
                width="22"
                height="22"
                alt="Mod-Kanäle"
            >
            <span class="qmd-mod-menu-fallback">⚔</span>
        `;

        modMenuButton.style.cssText = `
            display: inline-flex;
            align-items: center;
            justify-content: center;
            position: relative;
            width: 32px;
            height: 32px;
            margin-left: 6px;
            padding: 0;
            border: 0;
            border-radius: 4px;
            background: transparent;
            color: #9146FF;
            cursor: pointer;
        `;

        const fallbackIcon =
            modMenuButton.querySelector(
                '.qmd-mod-menu-fallback'
            );

        fallbackIcon.style.cssText = `
            display: none;
            position: absolute;
            font-size: 20px;
        `;

        const swordImage =
            modMenuButton.querySelector('img');

        swordImage.addEventListener('error', () => {
            swordImage.style.display = 'none';
            fallbackIcon.style.display = 'inline';
        });

        modMenuList = document.createElement('ul');
        modMenuList.id = 'qmdModChannelList';

        modMenuList.style.cssText = `
            display: none;
            position: absolute;
            top: 38px;
            left: 0;
            z-index: 99999999;
            min-width: 210px;
            max-width: 320px;
            max-height: 70vh;
            overflow-y: auto;
            margin: 0;
            padding: 8px;
            border: 1px solid #444;
            border-radius: 4px;
            background: #18181b;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            list-style: none;
        `;

        modMenuButton.addEventListener('click', (clickEvent) => {
            clickEvent.stopPropagation();

            modMenuList.style.display =
                modMenuList.style.display === 'block'
                    ? 'none'
                    : 'block';
        });

        document.addEventListener('click', (clickEvent) => {
            if (
                !modMenuButton.contains(clickEvent.target) &&
                !modMenuList.contains(clickEvent.target)
            ) {
                modMenuList.style.display = 'none';
            }
        });
    }

    function renderModMenuList() {
        if (!modMenuList) {
            return;
        }

        modMenuList.replaceChildren();

        storedModChannels =
            sortModChannels(
                parseStoredArray(modChannelsStorageKey)
            );

        if (!storedModChannels.length) {
            const emptyItem =
                document.createElement('li');

            emptyItem.textContent =
                'Noch keine Mod-Kanäle gespeichert.';

            emptyItem.style.cssText = `
                padding: 6px 8px;
                color: #adadb8;
                white-space: nowrap;
            `;

            modMenuList.appendChild(emptyItem);
            return;
        }

        storedModChannels.forEach((channelName) => {
            const listItem =
                document.createElement('li');

            const channelLink =
                document.createElement('a');

            channelLink.textContent = channelName;
            channelLink.href =
                `https://www.twitch.tv/moderator/${encodeURIComponent(channelName)}`;
            channelLink.target = '_blank';
            channelLink.rel = 'noopener noreferrer';
            channelLink.title =
                `Mod-Ansicht für ${channelName} öffnen`;

            channelLink.style.cssText = `
                display: block;
                padding: 5px 8px;
                color: #bf94ff;
                white-space: nowrap;
                text-decoration: none;
            `;

            listItem.appendChild(channelLink);
            modMenuList.appendChild(listItem);
        });
    }

    function refreshModMenu() {
        renderModMenuList();
    }

    function appendModMenuButton() {
        createModMenuElements();

        const primaryModButton =
            document.querySelector(
                '[data-test-selector="mod-view-link"]'
            );

        const alternativeModButton =
            document.querySelector(
                '[data-a-target="mod-view-link"]'
            );

        const chatSendButton =
            document.querySelector(
                '[data-a-target="chat-send-button"]'
            );

        const isModeratorPage =
            window.location.pathname.includes('/moderator/');

        const modToolsAvailable =
            Boolean(primaryModButton) ||
            Boolean(alternativeModButton) ||
            (
                isModeratorPage &&
                Boolean(chatSendButton)
            );

        const homeLink =
            document.querySelector(
                '[data-a-target="home-link"]'
            );

        if (
            !modToolsAvailable ||
            !homeLink ||
            !homeLink.parentElement
        ) {
            if (modMenuButton?.parentElement) {
                modMenuButton.remove();
            }

            if (modMenuList?.parentElement) {
                modMenuList.remove();
            }

            return;
        }

        addCurrentModChannel();

        const logoContainer =
            homeLink.parentElement;

        logoContainer.style.position = 'relative';
        logoContainer.style.display = 'flex';
        logoContainer.style.alignItems = 'center';

        if (!logoContainer.contains(modMenuButton)) {
            logoContainer.appendChild(modMenuButton);
        }

        if (!logoContainer.contains(modMenuList)) {
            logoContainer.appendChild(modMenuList);
        }

        renderModMenuList();
    }

    setInterval(appendModMenuButton, 1000);
    appendModMenuButton();

    // ############################################################################
    // ##### STARTUP ##############################################################
    // ############################################################################

    renderUserList();
    enableDragging();

    console.log(
        logPrefix,
        'Magic Cleaning Tool',
        toolVersion,
        'erfolgreich geladen.'
    );
})();
