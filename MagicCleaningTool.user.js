// ==UserScript==
// @name         Magic Cleaning Tool
// @description  Ein Tool, das die Moderation auf Twitch erleichtert
// @namespace    Magic Cleaning Tool …for a little better World
// @version      1.9.7.71
// @match        *://www.twitch.tv/*
// @run-at       document-idle
// @author       QueerModsDACH - The original code is from victornpb - Inspired by Bann-Hammer (by RaidHammer)
// @homepageURL  https://github.com/QueerModsDACH/MagicCleaningTool
// @supportURL   https://github.com/QueerModsDACH/MagicCleaningTool/issues
// @license      MIT
// ==/UserScript==
/* jshint esversion: 8 */
(function () {
    'use strict';
    // ############################################################################
    // ##### ALLGEMEINE ANWENDUNGSKONFIGURATION ###################################
    const myVersion = '1.9.7.71';
    const LOGPREFIX = '[QMD_MCT]\u25B6 ';
    const BROWSER_STORAGE_PREFIX = '_QMD_';
    const MOD_MENU_VISIBILITY_STORAGE_KEY = 'visibility_of_mod_menu';
    const defaultBanReason = 'Ban by QMD list';
    const urlBannlisten = 'https://github.com/QueerModsDACH/Listen';
    const WHITELISTED_BOTS_URL = 'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/WHITELISTED_bots.txt';
    const WHITELISTED_USER_URL = 'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/WHITELISTED_user.txt';
    let whitelistPromise = null;
    let whitelistUsers = new Set();
    // ############################################################################
    // ##### ZENTRALE KONFIGURATION DER LISTENBUTTONS #############################
    // Anzahl der Listenbuttons pro Zeile.
    const LIST_BUTTONS_PER_ROW = 4;
    // Maximale Anzahl sichtbarer Einträge im Listenfenster. Die vollständige queueList bleibt trotzdem erhalten.
    const MAX_VISIBLE_LIST_ITEMS = 250;
    // Gemeinsame Basis-URL aller externen Listen.
    const Listen_rawURL =
        'https://raw.githubusercontent.com/QueerModsDACH/Listen/refs/heads/main/';
    // ----------------------------------------------------------------------------
    // Button 01
    const Button_01_IdClass = 'Button_01';
    const Button_01_Text = 'follow bot\n( QMD-List )';
    const Button_01_BanReason = 'follow bot (QMD-List)';
    const Button_01_ListSaveSuffix = '_follow_bot_List';
    const Button_01_AltText = 'Importiert die follow_bot-Liste';
    const Button_01_FileName = 'follow_bot.txt';
    const Button_01_URL = `${Listen_rawURL}${Button_01_FileName}`;
    const Button_01_Action = 'ban';
    // Button 02
    const Button_02_IdClass = 'Button_02';
    const Button_02_Text = 'hostile Troll\n( QMD-List )';
    const Button_02_BanReason = 'hostile Troll (QMD-List)';
    const Button_02_ListSaveSuffix = '_hostile_Troll_List';
    const Button_02_AltText = 'Importiert die hostile-Troll-Liste';
    const Button_02_FileName = 'hostile_troll.txt';
    const Button_02_URL = `${Listen_rawURL}${Button_02_FileName}`;
    const Button_02_Action = 'ban';
    // Button 03
    const Button_03_IdClass = 'Button_03';
    const Button_03_Text = 'unsorted Troll\n( QMD-List )';
    const Button_03_BanReason = 'unsorted Troll (QMD-List)';
    const Button_03_ListSaveSuffix = '_unsorted';
    const Button_03_AltText = 'Importiert die unsorted-Liste';
    const Button_03_FileName = 'unsorted.txt';
    const Button_03_URL = `${Listen_rawURL}${Button_03_FileName}`;
    const Button_03_Action = 'ban';
    // Button 04
    const Button_04_IdClass = 'Button_04';
    const Button_04_Text = 'suspect\n( QMD-List )';
    const Button_04_BanReason = 'suspect (QMD-List)';
    const Button_04_ListSaveSuffix = '_Suspect_List';
    const Button_04_AltText = 'Importiert die Suspect-Liste';
    const Button_04_FileName = 'suspect.txt';
    const Button_04_URL = `${Listen_rawURL}${Button_04_FileName}`;
    const Button_04_Action = 'ban';
    // Button 05
    const Button_05_IdClass = 'Button_05';
    const Button_05_Text = '5B2Z Bots (a-m)\n…list currently being compiled…';
    const Button_05_BanReason = '5B2Z-Bot Account created on 5 May 2024 (QMD-List)';
    const Button_05_ListSaveSuffix = '_5B2Z_20240505_completely';
    const Button_05_AltText = 'Importiert die 5B2Z-Liste (Bots, die alle am 05.05.2024 erstellt wurden)';
    const Button_05_FileName = 'API_5B2Z_20240505_completely.txt';
    const Button_05_URL = `${Listen_rawURL}${Button_05_FileName}`;
    const Button_05_Action = 'ban';
    // Button 06
    const Button_06_IdClass = 'Button_06';
    const Button_06_Text = 'placeholder 06';
    const Button_06_BanReason = defaultBanReason;
    const Button_06_ListSaveSuffix = '_List06';
    const Button_06_AltText = 'Importiert die 06-Liste';
    const Button_06_FileName = 'list06.txt';
    const Button_06_URL = `${Listen_rawURL}${Button_06_FileName}`;
    const Button_06_Action = 'ban';
    // Button 07
    const Button_07_IdClass = 'Button_07';
    const Button_07_Text = 'placeholder 07';
    const Button_07_BanReason = defaultBanReason;
    const Button_07_ListSaveSuffix = '_List07';
    const Button_07_AltText = 'Importiert die 07-Liste';
    const Button_07_FileName = 'list07.txt';
    const Button_07_URL = `${Listen_rawURL}${Button_07_FileName}`;
    const Button_07_Action = 'ban';
    // Button 08
    const Button_08_IdClass = 'Button_08';
    const Button_08_Text = 'well known bots\n( from ti list )';
    const Button_08_BanReason = 'LIST well known bots (QMD-List)';
    const Button_08_ListSaveSuffix = '_LIST_well_known_bots';
    const Button_08_AltText = 'Importiert die LIST_well_known_bots-Liste';
    const Button_08_FileName = 'LIST_well_known_ti_bots.txt';
    const Button_08_URL = `${Listen_rawURL}${Button_08_FileName}`;
    const Button_08_Action = 'ban';
    // Button 09
    const Button_09_IdClass = 'Button_09';
    const Button_09_Text = 'follower bot\n( from isds list )';
    const Button_09_BanReason = 'LIST follower bot (QMD-List)';
    const Button_09_ListSaveSuffix = '_LIST_follower_bot';
    const Button_09_AltText = 'Importiert die LIST_follower_bot-Liste';
    const Button_09_FileName = 'LIST_follower_bot.txt';
    const Button_09_URL = `${Listen_rawURL}${Button_09_FileName}`;
    const Button_09_Action = 'ban';
    // Button 10
    const Button_10_IdClass = 'Button_10';
    const Button_10_Text = 'troll\n( from isds list )';
    const Button_10_BanReason = 'LIST troll (QMD-List)';
    const Button_10_ListSaveSuffix = '_LIST_troll';
    const Button_10_AltText = 'Importiert die LIST_troll-Liste';
    const Button_10_FileName = 'LIST_troll.txt';
    const Button_10_URL = `${Listen_rawURL}${Button_10_FileName}`;
    const Button_10_Action = 'ban';
    // Button 11
    const Button_11_IdClass = 'Button_11';
    const Button_11_Text = 'viewer bot\n( from isds list )';
    const Button_11_BanReason = 'LIST viewer bot (QMD-List)';
    const Button_11_ListSaveSuffix = '_LIST_viewer_bot';
    const Button_11_AltText = 'Importiert die LIST_viewer_bot-Liste';
    const Button_11_FileName = 'LIST_viewer_bot.txt';
    const Button_11_URL = `${Listen_rawURL}${Button_11_FileName}`;
    const Button_11_Action = 'ban';
    // Button 12
    const Button_12_IdClass = 'Button_12';
    const Button_12_Text = 'unwanted bots\n( from isds list )';
    const Button_12_BanReason = 'LIST unwanted bots (QMD-List)';
    const Button_12_ListSaveSuffix = '_LIST_unwanted_bots';
    const Button_12_AltText = 'Importiert die LIST_mad_tos_porn_seller_spam_bot-Liste';
    const Button_12_FileName = 'LIST_mad_tos_porn_seller_spam_bot.txt';
    const Button_12_URL = `${Listen_rawURL}${Button_12_FileName}`;
    const Button_12_Action = 'ban';
    // Button 13
    const Button_13_IdClass = 'Button_13';
    const Button_13_Text = '/monitor\n …function coming soon…';
    const Button_13_BanReason = 'MONITOR-List (QMD-List)';
    const Button_13_ListSaveSuffix = '_MONITOR_List';
    const Button_13_AltText = 'Importiert die MONITOR-Liste';
    const Button_13_FileName = 'monitor.txt';
    const Button_13_URL = `${Listen_rawURL}${Button_13_FileName}`;
    // TODO: Diese Aktion soll später zu "monitor" geändert werden.
    const Button_13_Action = 'ban';
    // Button 14
    const Button_14_IdClass = 'Button_14';
    const Button_14_Text = 'UNBAN …';
    const Button_14_BanReason = 'UNBAN-List (QMD-UNBAN-List)';
    const Button_14_ListSaveSuffix = '_UNBAN_List';
    const Button_14_AltText = 'Importiert die UNBAN-Liste';
    const Button_14_FileName = 'UNBANLIST.txt';
    const Button_14_URL = `${Listen_rawURL}${Button_14_FileName}`;
    const Button_14_Action = 'unban';
    // Button 15
    const Button_15_IdClass = 'Button_15';
    const Button_15_Text = 'UNBAN\nWhitelisted User';
    const Button_15_BanReason = 'Whitelisted User (QMD-UNBAN-List)';
    const Button_15_ListSaveSuffix = '_WHITELISTED_user';
    const Button_15_AltText = 'Importiert die UNBAN-Liste für Whitelisted User';
    const Button_15_FileName = 'WHITELISTED_user.txt';
    const Button_15_URL = `${Listen_rawURL}${Button_15_FileName}`;
    const Button_15_Action = 'unban';
    // Button 16
    const Button_16_IdClass = 'Button_16';
    const Button_16_Text = 'UNBAN\nWhitelisted Bots';
    const Button_16_BanReason = 'Whitelisted Bots (QMD-UNBAN-List)';
    const Button_16_ListSaveSuffix = '_WHITELISTED_bots';
    const Button_16_AltText = 'Importiert die UNBAN-Liste für Whitelisted Bots';
    const Button_16_FileName = 'WHITELISTED_bots.txt';
    const Button_16_URL = `${Listen_rawURL}${Button_16_FileName}`;
    const Button_16_Action = 'unban';
    // Zentrale Zusammenfassung aller Listenbutton-Konfigurationen.
    const LIST_BUTTONS = [
        { number: '01', saveSuffix: Button_01_ListSaveSuffix, id: Button_01_IdClass, className: Button_01_IdClass, text: Button_01_Text, altText: Button_01_AltText,
            fileName: Button_01_FileName, url: Button_01_URL, banReason: Button_01_BanReason, action: Button_01_Action, placeholder: false },
        { number: '02', saveSuffix: Button_02_ListSaveSuffix, id: Button_02_IdClass, className: Button_02_IdClass, text: Button_02_Text, altText: Button_02_AltText,
            fileName: Button_02_FileName, url: Button_02_URL, banReason: Button_02_BanReason, action: Button_02_Action, placeholder: false },
        { number: '03', saveSuffix: Button_03_ListSaveSuffix, id: Button_03_IdClass, className: Button_03_IdClass, text: Button_03_Text, altText: Button_03_AltText,
            fileName: Button_03_FileName, url: Button_03_URL, banReason: Button_03_BanReason, action: Button_03_Action, placeholder: false },
        { number: '04', saveSuffix: Button_04_ListSaveSuffix, id: Button_04_IdClass, className: Button_04_IdClass, text: Button_04_Text, altText: Button_04_AltText,
            fileName: Button_04_FileName, url: Button_04_URL, banReason: Button_04_BanReason, action: Button_04_Action, placeholder: false },
        { number: '05', saveSuffix: Button_05_ListSaveSuffix, id: Button_05_IdClass, className: Button_05_IdClass, text: Button_05_Text, altText: Button_05_AltText,
            fileName: Button_05_FileName, url: Button_05_URL, banReason: Button_05_BanReason, action: Button_05_Action, placeholder: false },
        { number: '06', saveSuffix: Button_06_ListSaveSuffix, id: Button_06_IdClass, className: Button_06_IdClass, text: Button_06_Text, altText: Button_06_AltText,
            fileName: Button_06_FileName, url: Button_06_URL, banReason: Button_06_BanReason, action: Button_06_Action, placeholder: true },
        { number: '07', saveSuffix: Button_07_ListSaveSuffix, id: Button_07_IdClass, className: Button_07_IdClass, text: Button_07_Text, altText: Button_07_AltText,
            fileName: Button_07_FileName, url: Button_07_URL, banReason: Button_07_BanReason, action: Button_07_Action, placeholder: true },
        { number: '08', saveSuffix: Button_08_ListSaveSuffix, id: Button_08_IdClass, className: Button_08_IdClass, text: Button_08_Text, altText: Button_08_AltText,
            fileName: Button_08_FileName, url: Button_08_URL, banReason: Button_08_BanReason, action: Button_08_Action, placeholder: false },
        { number: '09', saveSuffix: Button_09_ListSaveSuffix, id: Button_09_IdClass, className: Button_09_IdClass, text: Button_09_Text, altText: Button_09_AltText,
            fileName: Button_09_FileName, url: Button_09_URL, banReason: Button_09_BanReason, action: Button_09_Action, placeholder: false },
        { number: '10', saveSuffix: Button_10_ListSaveSuffix, id: Button_10_IdClass, className: Button_10_IdClass, text: Button_10_Text, altText: Button_10_AltText,
            fileName: Button_10_FileName, url: Button_10_URL, banReason: Button_10_BanReason, action: Button_10_Action, placeholder: false },
        { number: '11', saveSuffix: Button_11_ListSaveSuffix, id: Button_11_IdClass, className: Button_11_IdClass, text: Button_11_Text, altText: Button_11_AltText,
            fileName: Button_11_FileName, url: Button_11_URL, banReason: Button_11_BanReason, action: Button_11_Action, placeholder: false },
        { number: '12', saveSuffix: Button_12_ListSaveSuffix, id: Button_12_IdClass, className: Button_12_IdClass, text: Button_12_Text, altText: Button_12_AltText,
            fileName: Button_12_FileName, url: Button_12_URL, banReason: Button_12_BanReason, action: Button_12_Action, placeholder: false },
        { number: '13', saveSuffix: Button_13_ListSaveSuffix, id: Button_13_IdClass, className: Button_13_IdClass, text: Button_13_Text, altText: Button_13_AltText,
            fileName: Button_13_FileName, url: Button_13_URL, banReason: Button_13_BanReason, action: Button_13_Action, placeholder: true },
        { number: '14', saveSuffix: Button_14_ListSaveSuffix, id: Button_14_IdClass, className: Button_14_IdClass, text: Button_14_Text, altText: Button_14_AltText,
            fileName: Button_14_FileName, url: Button_14_URL, banReason: Button_14_BanReason, action: Button_14_Action, placeholder: true },
        { number: '15', saveSuffix: Button_15_ListSaveSuffix, id: Button_15_IdClass, className: Button_15_IdClass, text: Button_15_Text, altText: Button_15_AltText,
            fileName: Button_15_FileName, url: Button_15_URL, banReason: Button_15_BanReason, action: Button_15_Action, placeholder: false },
        { number: '16', saveSuffix: Button_16_ListSaveSuffix, id: Button_16_IdClass, className: Button_16_IdClass, text: Button_16_Text, altText: Button_16_AltText,
            fileName: Button_16_FileName, url: Button_16_URL, banReason: Button_16_BanReason, action: Button_16_Action, placeholder: false }
    ];
    // Laufzeitstatus der Listenaktionen.
    const listPauseStates = new Map();
    const pausedActionResumes = new Map();
    const listRunningActions = new Map();
    const queueList = new Set();
    let activeListAction = null;
    const queueListSources = new Map();
    // Fügt gültige Benutzernamen zur aktuellen Warteschlange hinzu.
    function addUsersToQueue(
        users,
        listSuffix = null,
        shouldRender = true
    ) {
        for (const user of users) {
            const normalizedUser = normalizeUser(user);
            if (!isValidUsername(normalizedUser)) {
                console.warn(LOGPREFIX, `Ungültiger Benutzername wurde ignoriert: ${normalizedUser}`);
                continue;
            }
            queueList.add(normalizedUser);
            if (listSuffix) {
                if (!queueListSources.has(normalizedUser)) {
                    queueListSources.set(
                        normalizedUser,
                        new Set()
                    );
                }
                queueListSources
                    .get(normalizedUser)
                    .add(listSuffix);
            }
        }
        if (shouldRender) {
            renderList();
        }
    }
    const ignoredList = new Set();
    const bannedList = new Set();
    // Aktuell moderierbarer Twitch-Kanal. Der Wert wird nach der Definition der Moderationsprüfung gesetzt.
    let activeChannel = '';
    // Anzeigename des aktuell moderierten Kanals mit ursprünglicher Groß-/Kleinschreibung.
    let activeChannelDisplay = '';
    // Bilder für die Benutzeroberfläche.
    const activateImage = 'https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/pix/activate.png';
    const modMenuOnImage = 'https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/pix/modmenu_on.png';
    const modMenuOffImage = 'https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/pix/modmenu_off.png';
    const themeNormal = '#9146FF';
    const themeTextColor = themeNormal;
    const updateText = 'die Version ist aktuell ツ';
    // Der gespeicherte Sichtbarkeitszustand wird standardmäßig auf "sichtbar" gesetzt.
    let isModMenuVisible = readStorageValue(
        MOD_MENU_VISIBILITY_STORAGE_KEY,
        true
    );
    // ############################################################################
    // ##### VERZÖGERUNGEN FÜR TWITCH-AKTIONEN ####################################
    const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));
    function getListPauseKey(listInfo = activeListInfo) {
        if (!listInfo) {
            return null;
        }
        const channel =
            listInfo.channel ||
            activeChannel ||
            '';
        const listIdentifier =
            listInfo.listSuffix ||
            listInfo.fileName ||
            'manual';
        return [
            channel,
            listInfo.action || 'ban',
            listIdentifier
        ].join('|');
    }
    function isListPaused(pauseKey) {
        return Boolean(
            pauseKey &&
            listPauseStates.get(pauseKey) === true
        );
    }

    function isListActionRunning(pauseKey) {
        return Boolean(
            pauseKey &&
            listRunningActions.get(pauseKey) === true
        );
    }
    function updatePauseButton() {
        const button = d.querySelector('.pause');
        if (!button) {
            return;
        }
        const pauseKey = getListPauseKey();
        const actionRunning = isListActionRunning(pauseKey);
        const listPaused = isListPaused(pauseKey);
        button.disabled = !actionRunning;
        button.setAttribute(
            'aria-disabled',
            String(!actionRunning)
        );
        if (!actionRunning) {
            button.value = 'pause';
            button.textContent = '\u23F8';
            button.title = 'Keine laufende Aktion';
            button.setAttribute(
                'aria-label',
                'Keine laufende Aktion'
            );
            button.classList.remove(
                'is-paused'
            );
            return;
        }
        if (listPaused) {
            button.value = 'play';
            button.textContent = '\u25B6';
            button.title = 'Fortsetzen';
            button.setAttribute(
                'aria-label',
                'Aktionen fortsetzen'
            );
            button.classList.add('is-paused');
        } else {
            button.value = 'pause';
            button.textContent = '\u23F8';
            button.title = 'Pausieren';
            button.setAttribute(
                'aria-label',
                'Aktionen pausieren'
            );
            button.classList.remove(
                'is-paused'
            );
        }
    }
    function waitForActionResume(pauseKey) {
        if (!isListPaused(pauseKey)) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            pausedActionResumes.set(
                pauseKey,
                resolve
            );
        });
    }
    function setListPauseState(
        pauseKey,
        shouldPause
    ) {
        if (!pauseKey) {
            return;
        }
        listPauseStates.set(
            pauseKey,
            shouldPause
        );
        if (!shouldPause) {
            const resumeAction = pausedActionResumes.get(pauseKey);
            if (resumeAction) {
                pausedActionResumes.delete(
                    pauseKey
                );
                resumeAction();
            }
        }
    }
    // Führt einen Fetch-Aufruf mit einem Zeitlimit aus.
    async function fetchWithTimeout(
        url,
        options = {},
        timeout = 10000
    ) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(
            () => controller.abort(),
            timeout
        );
        try {
            return await fetch(url, {
                ...options,
                signal: controller.signal
            });
        } finally {
            window.clearTimeout(timeoutId);
        }
    }
    // Zentrale Verzögerungswerte in Millisekunden.
    // Werte unter 125 ms sollten vermieden werden, da Twitch-Aktionen dadurch möglicherweise zu schnell nacheinander ausgeführt werden.
    const DELAY_BAN_ACTION = 130;
    const DELAY_UNBAN_ACTION = 130;
    // ############################################################################
    // ##### LOCALSTORAGE-HILFSFUNKTIONEN #########################################
    function storageKey(key) {
        return `${BROWSER_STORAGE_PREFIX}${key}`;
    }
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
            console.error(LOGPREFIX, `Ungültige Daten im Speicher-Schlüssel "${storageKey(key)}":`, error);
            return [];
        }
    }
    function writeStorageList(key, list) {
        try {
            const storageKeyName = storageKey(key);
            const newValue = JSON.stringify(list);
            const oldValue =
                localStorage.getItem(
                    storageKeyName
                );
            if (oldValue === newValue) {
                return true;
            }
            localStorage.setItem(
                storageKeyName,
                newValue
            );
            return true;
        } catch (error) {
            console.error(LOGPREFIX, `Konnte Liste "${storageKey(key)}" nicht speichern:`, error);
            return false;
        }
    }
    function readStorageValue(key, fallback = null) {
        try {
            const value = localStorage.getItem(storageKey(key));
            if (value === null) {
                return fallback;
            }
            return JSON.parse(value);
        } catch (error) {
            console.error(LOGPREFIX, `Ungültiger Speicherwert für "${storageKey(key)}":`, error);
            return fallback;
        }
    }
    function writeStorageValue(key, value) {
        try {
            localStorage.setItem(
                storageKey(key),
                JSON.stringify(value)
            );
            return true;
        } catch (error) {
            console.error(LOGPREFIX, `Konnte Speicherwert "${storageKey(key)}" nicht speichern:`, error);
            return false;
        }
    }
    // Vereinheitlicht Benutzernamen ausschließlich für Vergleiche.
    function normalizeUser(user) {
        return String(user ?? '')
            .trim()
            .toLowerCase();
    }
    // Prüft, ob ein Benutzername dem erwarteten Twitch-Format entspricht.
    function isValidUsername(user) {
        const normalizedUser = normalizeUser(user);
        return /^[a-z0-9_]{1,25}$/.test(normalizedUser);
    }
    // Wandelt einen Text oder ein Array in eine bereinigte Benutzerliste um.
    function parseUserList(value) {
        const lines = Array.isArray(value)
            ? value
            : String(value ?? '').split(/\r?\n/);
        return [
            ...new Set(
                lines
                    .map(normalizeUser)
                    .filter(isValidUsername)
            )
        ];
    }
    // Normalisiert und bereinigt eine gespeicherte Benutzerliste.
    function normalizeUserList(list) {
        if (!Array.isArray(list)) {
            return [];
        }
        return [
            ...new Set(
                list
                    .map(normalizeUser)
                    .filter(isValidUsername)
            )
        ];
    }
    function getListActionStorageName(action) {
        return action === 'unban'
            ? 'unbanlist'
            : 'banlist';
    }
    function getListStorageKey(
        channel,
        action,
        listSuffix,
        extraSuffix = ''
    ) {
        const actionStorageName =
            getListActionStorageName(action);
        return `${channel}_${actionStorageName}${listSuffix}${extraSuffix}`;
    }
    function addUserToListStorage(
        channel,
        action,
        listSuffix,
        user,
        extraSuffix = ''
    ) {
        const normalizedUser = normalizeUser(user);
        if (!channel || !isValidUsername(normalizedUser)) {
            return false;
        }
        const storageKeyName = getListStorageKey(
            channel,
            action,
            listSuffix,
            extraSuffix
        );
        const storedUsers = normalizeUserList(
            readStorageValue(storageKeyName, [])
        );
        if (!storedUsers.includes(normalizedUser)) {
            storedUsers.push(normalizedUser);
        }
        return writeStorageValue(
            storageKeyName,
            storedUsers
        );
    }
    function getListStatusStorageKey(
        channel,
        listConfig
    ) {
        return getListStorageKey(
            channel,
            listConfig.action,
            listConfig.saveSuffix,
            '_status'
        );
    }
    function getListProcessedStorageKey(
        channel,
        listConfig
    ) {
        if (listConfig.action === 'unban') {
            return `${channel}_unbanlist`;
        }
        return getListStorageKey(
            channel,
            'ban',
            listConfig.saveSuffix
        );
    }
    function getListSkippedStorageKey(
        channel,
        listConfig
    ) {
        return getListStorageKey(
            channel,
            listConfig.action,
            listConfig.saveSuffix,
            '_skipped'
        );
    }
    // Ermittelt die CSS-Klasse für den Bearbeitungsstatus einer Liste.
    function getListStatusClass(status) {
        if (!status) {
            return 'qmd-status-unknown';
        }
        if (status.status === 'error') {
            return 'qmd-status-error';
        }
        if (status.status === 'empty') {
            return 'qmd-status-empty';
        }
        if (status.percentage >= 100) {
            return 'qmd-status-complete';
        }
        if (status.percentage > 0) {
            return 'qmd-status-partial';
        }
        return 'qmd-status-open';
    }
    // Formatiert einen gespeicherten Zeitstempel für die Anzeige.
    function formatListStatusDate(value) {
        if (!value) {
            return 'noch nicht geprüft';
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return 'unbekannter Zeitpunkt';
        }
        return date.toLocaleString(
            'de-DE',
            {
                dateStyle: 'short',
                timeStyle: 'short'
            }
        );
    }
    // Erzeugt die Beschreibung des Bearbeitungsstatus einer Liste.
    function getListStatusDescription(status) {
        if (!status) {
            return 'Noch nicht geprüft';
        }
        if (status.status === 'unknown') {
            return 'Noch nicht geprüft';
        }
        if (status.status === 'error') {
            return `Fehler: ${
                status.error ||
                'Liste konnte nicht geprüft werden'
            }`;
        }
        if (status.status === 'empty') {
            return [
                'Liste ist leer',
                `Zuletzt geprüft: ${
                    formatListStatusDate(status.checkedAt)
                }`
            ].join(' · ');
        }
        const processed = Number(status.processed) || 0;
        const total = Number(status.total) || 0;
        const remaining = Number(status.remaining) || 0;
        const percentage = Number(status.percentage) || 0;
        return [
            `${processed.toLocaleString('de-DE')} von`,
            `${total.toLocaleString('de-DE')} bearbeitet`,
            `(${percentage.toFixed(1).replace('.', ',')} %)`,
            `${remaining.toLocaleString('de-DE')} offen`,
            `Zuletzt geprüft: ${
                formatListStatusDate(status.checkedAt)
            }`
        ].join(' ');
    }
    // Überträgt den gespeicherten Listenstatus auf den jeweiligen Button.
    function applyListStatusToButton(listConfig, status) {
        const button = d.querySelector(
            `#${listConfig.id}`
        );
        if (!button) {
            return;
        }
        const statusClasses = [
            'qmd-list-status',
            'qmd-status-unknown',
            'qmd-status-empty',
            'qmd-status-open',
            'qmd-status-partial',
            'qmd-status-complete',
            'qmd-status-error'
        ];
        button.classList.remove(...statusClasses);
        button.classList.add(
            'qmd-list-status',
            getListStatusClass(status)
        );
        const description =
            getListStatusDescription(status);
        const baseTitle = listConfig.placeholder
            ? `${listConfig.altText} – noch nicht verfügbar`
            : listConfig.altText;
        button.title =
            `${baseTitle}\n${description}`;
        button.setAttribute(
            'aria-label',
            `${listConfig.text} – ${description}`
        );
    }
    // Stellt die gespeicherten Statusinformationen aller Listen wieder her.
    function restoreListStatuses() {
        if (!activeChannel) {
            return;
        }
        LIST_BUTTONS.forEach((listConfig) => {
            if (listConfig.placeholder) {
                return;
            }
            const status = readStorageValue(
                getListStatusStorageKey(
                    activeChannel,
                    listConfig
                ),
                null
            );
            applyListStatusToButton(
                listConfig,
                status
            );
        });
    }
    // Prüft eine einzelne externe Liste auf ihren Bearbeitungsstand.
    async function checkSingleListStatus(
        listConfig,
        channel
    ) {
        const checkedAt = new Date().toISOString();
        try {
            const response = await fetchWithTimeout(
                listConfig.url,
                {
                    cache: 'no-store'
                }
            );
            if (!response.ok) {
                throw new Error(
                    `HTTP-Fehler ${response.status}`
                );
            }
            const sourceText = await response.text();
            const sourceUsers = new Set(
                parseUserList(sourceText)
            );
            const processedUsers = new Set(
                normalizeUserList(
                    readStorageValue(
                        getListProcessedStorageKey(
                            channel,
                            listConfig
                        ),
                        []
                    )
                )
            );
            const skippedUsers = new Set(
                listConfig.action === 'ban'
                    ? normalizeUserList(
                        readStorageValue(
                            getListSkippedStorageKey(
                                channel,
                                listConfig
                            ),
                            []
                        )
                    )
                    : []
            );
            const completedUsers = new Set([
                ...processedUsers,
                ...skippedUsers
            ]);
            const total = sourceUsers.size;
            const processed = [...sourceUsers].filter(
                (user) => completedUsers.has(user)
            ).length;
            const remaining = Math.max(
                0,
                total - processed
            );
            const percentage = total === 0
                ? 100
                : (processed / total) * 100;
            const status = {
                status: total === 0
                    ? 'empty'
                    : percentage >= 100
                        ? 'complete'
                        : percentage > 0
                            ? 'partial'
                            : 'open',
                total,
                processed,
                remaining,
                percentage,
                action: listConfig.action,
                listSuffix: listConfig.saveSuffix,
                fileName: listConfig.fileName,
                checkedAt
            };
            writeStorageValue(
                getListStatusStorageKey(
                    channel,
                    listConfig
                ),
                status
            );
            return {
                listConfig,
                status
            };
        } catch (error) {
            console.error(LOGPREFIX, `Quick check für ${listConfig.fileName} fehlgeschlagen:`, error);
            const status = {
                status: 'error',
                total: 0,
                processed: 0,
                remaining: 0,
                percentage: 0,
                action: listConfig.action,
                listSuffix: listConfig.saveSuffix,
                fileName: listConfig.fileName,
                checkedAt,
                error: error.message
            };
            writeStorageValue(
                getListStatusStorageKey(
                    channel,
                    listConfig
                ),
                status
            );
            return {
                listConfig,
                status
            };
        }
    }
    // Prüft den Bearbeitungsstand aller verfügbaren externen Listen.
    async function quickCheckLists() {
        const button = d.querySelector('.quickCheck');
        if (!button || button.disabled) {
            return;
        }
        if (!activeChannel) {
            console.warn(LOGPREFIX, 'Quick check blockiert: Kein aktiver Kanal.');
            return;
        }
        const activeLists = LIST_BUTTONS.filter(
            (listConfig) => !listConfig.placeholder
        );
        if (activeLists.length === 0) {
            return;
        }
        const originalText = button.textContent;
        button.disabled = true;
        button.classList.add('is-checking');
        button.textContent = 'Prüfe …';
        button.setAttribute('aria-busy', 'true');
        try {
            const checkedChannel = activeChannel;
            const results = await Promise.all(
                activeLists.map(
                    (listConfig) =>
                        checkSingleListStatus(
                            listConfig,
                            checkedChannel
                        )
                )
            );
            if (activeChannel !== checkedChannel) {
                return;
            }
            results.forEach(
                ({ listConfig, status }) => {
                    applyListStatusToButton(
                        listConfig,
                        status
                    );
                }
            );
        } finally {
            button.disabled = false;
            button.classList.remove('is-checking');
            button.textContent = originalText;
            button.removeAttribute('aria-busy');
        }
    }
    // ############################################################################
    // ##### AKTUELLEN KANAL AUS DER URL ERMITTELN ###############################
    function getActiveChannel() {
        const pathParts = window.location.pathname
            .split('/')
            .map((part) => part.trim())
            .filter(Boolean);
        if (pathParts.length === 0) {
            return '';
        }
        const firstPart = pathParts[0].toLowerCase();
        // Nur echte Kanal- beziehungsweise Moderator-URLs akzeptieren.
        if (firstPart === 'moderator') {
            return (pathParts[1] || '').toLowerCase();
        }
        if (firstPart === 'home') {
            return '';
        }
        // Bekannte Twitch-Systemseiten sind keine Kanäle.
        const nonChannelRoutes = new Set([
            'about', 'clip', 'directory', 'downloads', 'friends', 'following', 'inventory', 'jobs', 'login', 'logout',
            'notifications', 'p', 'search', 'settings', 'subscriptions', 'turbo', 'user', 'users', 'videos', 'wallet', 'whispers'
        ]);
        if (nonChannelRoutes.has(firstPart)) {
            return '';
        }
        // Bei einer normalen Twitch-Kanal-URL ist der erste Pfadteil der Kanal.
        return firstPart;
    }
    // Ermittelt den Kanal aus einem Twitch-Moderatorenlink.
    function getChannelFromModeratorUrl() {
        const match = window.location.pathname.match(
            /^\/moderator\/([^/]+)/i
        );
        if (!match) {
            return null;
        }
        try {
            return decodeURIComponent(match[1]).toLowerCase();
        } catch (error) {
            console.error(LOGPREFIX, 'Kanalname aus der Moderator-URL konnte nicht dekodiert werden:', error);
            return null;
        }
    }
    // Ermittelt den Kanal aus dem von Twitch bereitgestellten Mod-View-Link.
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
            const match = url.pathname.match(
                /^\/moderator\/([^/]+)/i
            );
            return match
                ? decodeURIComponent(match[1]).toLowerCase()
                : null;
        } catch (error) {
            console.error(LOGPREFIX, 'Kanalname aus dem Mod-Link konnte nicht gelesen werden:', error);
            return null;
        }
    }
    // Erkennt den aktuell moderierten Kanal anhand der vorhandenen Twitch-Elemente.
    function getModeratedChannel() {
        const activeChannelOnPage = getActiveChannel();
        const moderatorChannel = getChannelFromModeratorUrl();
        const chatButton = document.querySelector(
            '[data-a-target="chat-send-button"]'
        );
        // Der Moderator-View ist die zuverlässigste Erkennung.
        if (moderatorChannel && chatButton) {
            return moderatorChannel;
        }
        // Auf normalen Kanal-Seiten darf nur dann moderiert werden, wenn Twitch ausdrücklich einen passenden Mod-View-Link anbietet.
        const modViewChannel = getChannelFromModViewLink();
        if (
            activeChannelOnPage &&
            modViewChannel &&
            modViewChannel === activeChannelOnPage &&
            chatButton
        ) {
            return activeChannelOnPage;
        }
        return '';
    }
    function isCurrentChannelModerated() {
        const moderatedChannel = getModeratedChannel();
        return Boolean(
            moderatedChannel &&
            moderatedChannel === activeChannel
        );
    }
    // Ermittelt den Kanalnamen für die Anzeige mit ursprünglicher Groß-/Kleinschreibung.
    function getDisplayChannelName(
        channel = activeChannel
    ) {
        const normalizedChannel = normalizeUser(channel);
        if (!normalizedChannel) {
            return '';
        }
        // Diese Elemente enthalten normalerweise die sichtbare Schreibweise aus dem Twitch-Header.
        const preferredSelectors = [
            '[data-a-target="channel-header-title"]',
            '[data-a-target="channel-name"]',
            '[data-a-target="streamer-card-title"]',
            'h1',
            'h2'
        ];
        for (const selector of preferredSelectors) {
            const elements =
                document.querySelectorAll(
                    selector
                );
            for (const element of elements) {
                const text =
                    element.textContent.trim();
                if (
                    text &&
                    normalizeUser(text) ===
                    normalizedChannel
                ) {
                    return text;
                }
            }
        }
        // Fallback: passende Links und sonstige Twitch-Elemente. Eine Schreibweise mit Großbuchstaben wird dabei bevorzugt.
        const fallbackSelectors = [
            'a[href]',
            '[data-a-target]'
        ];
        let lowercaseFallback = '';
        for (const selector of fallbackSelectors) {
            const elements =
                document.querySelectorAll(
                    selector
                );
            for (const element of elements) {
                const text = element.textContent.trim();
                if (
                    !text ||
                    normalizeUser(text) !==
                    normalizedChannel
                ) {
                    continue;
                }
                if (
                    text !==
                    normalizeUser(text)
                ) {
                    return text;
                }
                if (!lowercaseFallback) {
                    lowercaseFallback = text;
                }
            }
        }
        // Nur wenn Twitch keine sichtbare Mischschreibweise liefert, wird die Kleinschreibweise verwendet.
        return lowercaseFallback || normalizedChannel;
    }
    activeChannel = getModeratedChannel();
    activeChannelDisplay = getDisplayChannelName();
    console.log(LOGPREFIX, 'Aktiv moderierbarer Kanal:', activeChannel || '(kein moderierbarer Kanal)');
    // ############################################################################
    // ##### LOCALSTORAGE-SCHLÜSSEL FÜR BANN- UND UNBANLISTEN ####################
    let QMD_bannedUsersStore = [];
    let QMD_unbannedUsersStore = [];
    // Informationen zur aktuell geladenen externen Liste.
    let activeListInfo = null;
    // Dauer der zuletzt ausgeführten Bann-/Unbann-Aktionen. Die letzten zehn Werte werden für die Schätzung verwendet.
    const ACTION_DURATION_SAMPLE_SIZE = 10;
    let actionDurationSamples = [];
    // Lädt Bann- und Unbannlisten nur für einen moderierbaren Kanal.
    if (activeChannel) {
        QMD_bannedUsersStore = normalizeUserList(
            readStorageValue(
                `${activeChannel}_banlist`,
                []
            )
        );
        QMD_unbannedUsersStore = normalizeUserList(
            readStorageValue(
                `${activeChannel}_unbanlist`,
                []
            )
        );
        // Bereits vorhandene beziehungsweise benötigte Schlüssel normalisieren.
        writeStorageValue(
            `${activeChannel}_banlist`,
            QMD_bannedUsersStore
        );
        writeStorageValue(
            `${activeChannel}_unbanlist`,
            QMD_unbannedUsersStore
        );
    }
    // Gespeicherte Mod-Kanäle laden.
    let QMD_modChannelStore =
        readStorageList('myModChannels');
    // ############################################################################
    // ##### HTML-HILFSFUNKTIONEN FÜR DIE LISTENBUTTONS ##########################
    // Erzeugt einen einzelnen Listenbutton aus der zentralen Konfiguration.
    function createListButtonHtml(
        listConfig,
        width = '32%'
    ) {
        const disabledAttributes = listConfig.placeholder
            ? 'disabled aria-disabled="true"'
            : '';
        const title = listConfig.placeholder
            ? `${listConfig.altText} – noch nicht verfügbar`
            : listConfig.altText;
        return `
            <button
                id="${listConfig.id}"
                class="${listConfig.className}"
                type="button"
                style="width: ${width};"
                title="${title}"
                aria-label="${title}"
                data-list-number="${listConfig.number}"
                ${disabledAttributes}
            >${listConfig.text}</button>
        `;
    }
    // Erzeugt alle Listenbuttons mit der vorgegebenen Anzahl pro Zeile.
    function createAllListButtonsHtml() {
        const rows = [];
        const buttonWidth =
            `${(100 / LIST_BUTTONS_PER_ROW) - 1}%`;
        for (
            let index = 0;
            index < LIST_BUTTONS.length;
            index += LIST_BUTTONS_PER_ROW
        ) {
            const rowButtons = [];
            for (
                let offset = 0;
                offset < LIST_BUTTONS_PER_ROW;
                offset++
            ) {
                const button =
                    LIST_BUTTONS[index + offset];
                if (button) {
                    rowButtons.push(
                        createListButtonHtml(
                            button,
                            buttonWidth
                        )
                    );
                }
            }
            rows.push(`
                <div class="list-button-row">
                    ${rowButtons.join('')}
                </div>
            `);
        }
        return rows.join('');
    }
    const listButtonsHtml =
        createAllListButtonsHtml();
    // ############################################################################
    // ##### HTML-STRUKTUR UND STYLES DES MOD-TOOLS ##############################
    const html = /* html */ `
        <div id="magicMorningStar" class="magicMorningStar">
            <style>
                .magicMorningStar {z-index: 99999999; position: absolute; top: 250px; left: 350px; width: 900px; min-width: 820px;
                    max-width: calc(100vw - 24px); box-sizing: border-box; padding: 8px;
                    background-color: var(--color-background-base); color: var(--color-text-base);
                    border: var(--border-width-default) solid var(--color-border-base);
                    box-shadow: var(--shadow-elevation-2); cursor: move;
                }
                .magicMorningStar .handle { cursor: move; user-select: none; }
                .magicMorningStar .svg { color: ${themeTextColor}; }
                .magicMorningStar h6 { color: var(--color-hinted-grey-7); }
                .magicMorningStar h6 button { height: auto; background: none; }
                .magicMorningStar .header { display: flex; align-items: center; }
                .magicMorningStar .logo { min-height: 30px; line-height: 30px; font-weight: var(--font-weight-semibold); --color: var(--color-text-link); }
                .magicMorningStar .info-bar {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    margin: 4px 0 8px;
                    padding: 4px 8px 6px;
                    box-sizing: border-box;
                    border-bottom: 1px solid var(--color-border-base);
                    text-align: center;
                }
                .magicMorningStar .channel-name {
                    color: ${themeTextColor};
                    font-size: 20px;
                    font-weight: var(--font-weight-semibold);
                    line-height: 1.3;
                    letter-spacing: 0.2px;
                }
                .magicMorningStar #loadedList {
                    color: var(--color-text-base);
                    font-size: 9pt;
                    line-height: 1.4;
                }
                .magicMorningStar .list { min-height: 8em; max-height: 350px; padding: 8px; margin: 4px 0; overflow-y: auto;
                    background-color: var(--color-background-body); color: var(--color-text-base);
                    border: var(--border-width-default) solid var(--color-border-base);
                    border-radius: var(--border-radius-medium); box-sizing: border-box;
                }
                .magicMorningStar .list span { display: inline-block; font-weight: var(--font-weight-semibold); color: var(--color-text-base); }
                .magicMorningStar .empty { padding: 2em; color: var(--color-text-base); text-align: center; opacity: 0.85; }
                .magicMorningStar button { min-width: 30px; height: var(--button-size-default); margin: 1px; padding: 0 0.5em;
                    border-radius: var(--border-radius-medium); background-color: var(--color-background-button-secondary-default);
                    color: var(--color-text-button-secondary); font-size: var(--button-text-default);
                    font-weight: var(--font-weight-semibold); text-align: center;
                }
                .magicMorningStar button:disabled { opacity: 0.45; cursor: not-allowed; filter: grayscale(70%); }
                .magicMorningStar button.ban,
                .magicMorningStar button.banAll { background: #f44336; color: var(--color-text-button-primary); }
                .magicMorningStar button.ban { min-width: 60px; }
                .magicMorningStar button.banAll { min-width: 40px; }
                .magicMorningStar button.unban,
                .magicMorningStar button.unbanAll { background: #34ae0c; color: var(--color-text-button-primary); }
                .magicMorningStar button.unban { min-width: 60px; }
                .magicMorningStar button.unbanAll { min-width: 40px; }
                /* Aktionszeile mit drei festen Bereichen */
                .magicMorningStar .action-bar { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
                    align-items: center; width: 100%; padding: 10px 0; margin: 5px 0; gap: 8px;
                }
                /* Linke, mittlere und rechte Buttongruppe */
                .magicMorningStar .action-group { display: flex; align-items: center; min-width: 0; gap: 4px; }
                .magicMorningStar .action-group-left { justify-content: flex-start; }
                .magicMorningStar .action-group-center { justify-content: center; }
                .magicMorningStar .action-group-right { justify-content: flex-end; }
                /* Einheitliche Buttonbreiten innerhalb der Aktionszeile */
                .magicMorningStar .action-bar button { flex: 0 0 auto; min-height: 32px; white-space: nowrap; }
                /* Neutrale Navigation */
                .magicMorningStar .action-bar .back { min-width: 78px; background: #5f6368; color: #ffffff; }
                .magicMorningStar .action-bar .quickCheck { min-width: 96px; background: #2878b5; color: #ffffff; }
                .magicMorningStar .action-bar .quickCheck.is-checking { background: #6c757d; cursor: wait; }
                .magicMorningStar .list-button-row button.qmd-list-status { border: 2px solid rgba(255, 255, 255, 0.55);
                    transition: background-color 160ms ease, border-color 160ms ease, filter 160ms ease; }
                .magicMorningStar .list-button-row button.qmd-status-unknown { background: #6c757d !important; color: #ffffff !important; }
                .magicMorningStar .list-button-row button.qmd-status-empty { background: #2878b5 !important; color: #ffffff !important; }
                .magicMorningStar .list-button-row button.qmd-status-open { background: #c0392b !important; color: #ffffff !important; }
                .magicMorningStar .list-button-row button.qmd-status-partial { background: #d99000 !important; color: #ffffff !important; }
                .magicMorningStar .list-button-row button.qmd-status-complete { background: #218838 !important; color: #ffffff !important; }
                .magicMorningStar .list-button-row button.qmd-status-error { background: #5b3f8c !important; color: #ffffff !important; }
                /* Cache und externe Werkzeuge */
                .magicMorningStar .action-bar .commanderRoot { min-width: 58px; background: #2878b5; color: #ffffff; }
                .magicMorningStar .action-bar .chatstats,
                .magicMorningStar .action-bar .modLogger,
                .magicMorningStar .action-bar .chatDeepStats { min-width: 48px; background: #2878b5; color: #ffffff; }
                /* Listenaktionen */
                .magicMorningStar .action-bar .pause { min-width: 48px; background: #d99a00; color: #ffffff; }
                .magicMorningStar .action-bar .pause.is-paused { background: #b77900; }
                .magicMorningStar .action-bar .unbanAll { min-width: 48px; background: #34ae0c; color: #ffffff; }
                .magicMorningStar .action-bar .banAll { min-width: 48px; background: #f44336; color: #ffffff; }
                /* Einheitliches Hover-Verhalten */
                .magicMorningStar .action-bar button:not(:disabled):hover { filter: brightness(1.12); transform: translateY(-1px); }
                .magicMorningStar .action-bar button:not(:disabled):active { filter: brightness(0.95); transform: translateY(0); }
                .magicMorningStar .import { min-height: 20px; padding: 3px; background: var(--color-background-body);
                    border: var(--border-width-default) solid var(--color-border-base); }
                .magicMorningStar textarea { width: 100%; min-height: 8em; padding: 0.5em; background: var(--color-background-base);
                    color: var(--color-text-base); font-size: 10pt; }
                .magicMorningStar .footer { display: block; width: 100%; margin-top: 6px; padding-top: 4px;
                    border-top: 1px solid var(--color-border-base); font-size: 7pt; line-height: 1.4; text-align: center; }
                .magicMorningStar .list-status { display: none; width: 100%; margin-top: 2px; margin-bottom: 6px; padding: 0 8px;
                    box-sizing: border-box; font-size: 9pt; line-height: 1.45; text-align: center; white-space: pre-line; }
                .magicMorningStar .list-limit-info { padding: 12px; color: var(--color-hinted-grey-7);
                    text-align: center; font-size: 0.9em; line-height: 1.4; }
                .magicMorningStar .list-status.incomplete { color: #ff9a9a; }
                .magicMorningStar .list-status.complete { color: #9be7a1; }
                .magicMorningStar .list-status.paused { color: #f4d35e; }
                .magicMorningStar .list-button-row { display: flex; justify-content: center; align-items: center; }
                .magicMorningStar .list-button-row button { box-sizing: border-box; overflow: visible; text-overflow: clip; white-space: pre-line;
                    min-height: 40px; height: auto; padding: 4px 4px; font-size: 12px; line-height: 1.2; text-align: center;
                }
            </style>

            <div class="header">
                <span class="handle"></span>
                <!-- Umschalter für die Sichtbarkeit des Mod-Menüs -->
                <button class="modMenuToggle" type="button" title="Mod-Menü ein- oder ausblenden" aria-label="Mod-Menü ein- oder ausblenden" style="display: inline-flex;" >
                    <img class="modMenuToggleImage" src="${isModMenuVisible ? modMenuOnImage : modMenuOffImage}"
                        title="Mod-Menü ein- oder ausblenden" alt="Mod-Menü" width="32" height="32" >
                </button>
                <span style="flex-grow: 1;"></span>
                <!-- Repository-Link und Tool-Titel -->
                <h5 id="header" class="logo">
                    <a href="https://github.com/QueerModsDACH/MagicCleaningTool" target="_blank" rel="noopener noreferrer"
                        style="color: ${themeTextColor};" title="Zum QueerModsDACH Repository"
                    >
                        Magic Cleaning Tool&nbsp;&nbsp;
                        <img src="${activateImage}" alt="Repository öffnen"
                            width="18" height="18" style="vertical-align: middle;"
                        >
                        &nbsp;&nbsp;for a little better World
                    </a>
                </h5>
                <span style="flex-grow: 1;"></span>
                <!-- Fenster schließen beziehungsweise minimieren -->
                <button class="closeBtn" type="button" title="Tool minimieren" aria-label="Tool minimieren" >
                    <img src="https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/pix/minimieren.png" alt="Tool minimieren"
                        width="18" height="18"
                    >
                </button>
            </div>

            <!-- Informationsbereich unterhalb des Headers -->
            <div class="info-bar" aria-live="polite">
                <div id="channelName" class="channel-name"></div>
                <a
                    id="loadedList"
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="display: none;"
                    title="Geladene Liste anzeigen"
                ></a>
            </div>

            <!-- Importbereich -->
            <div id="import" class="import" style="display: none;">
                <textarea id="textfield" placeholder="für separaten bann, hier ein Benutzername pro Zeile einfügen" ></textarea>
                <div style="text-align: right;">
                    <button class="importBtn" type="button" title="Benutzer zur Liste hinzufügen"
                        style="width: 32%; font-size: 12px; margin-right: 16px; margin-bottom: 16px;" >
                        &#8627; Benutzername(n) Hinzufügen
                    </button>
                </div>
                <!-- Zentral erzeugte Listenbuttons 01 bis 16 -->
                ${listButtonsHtml}

                <div style=" display: flex; align-items: center; gap: 8px; margin-left: 16px; margin-top: 16px; text-align: left; font-size: 12px;" >
                    <label for="banReason">Banngrund:</label>
                    <input type="text" id="banReason" style="width: 66%;"
                        placeholder=" Hier OPTIONAL einen eigenen Bann-Grund angeben"
                    >
                </div>
            </div>

            <!-- Hauptbereich und Benutzerliste -->
            <div class="body">
                <div class="list"></div>
            </div>
            <!-- Aktionszeile -->
            <div id="buttons" class="action-bar">

                <!-- Linke Gruppe: Navigation -->
                <div class="action-group action-group-left">
                    <button class="back" type="button" title="Zurück" aria-label="Zurück" >
                        &#8592; zurück
                    </button>
                    <button class="quickCheck" type="button" title="Bearbeitungsstand aller Listen prüfen" aria-label="Bearbeitungsstand aller Listen prüfen" >
                        &#9432; Quick check
                    </button>
                </div>

                <!-- Mittlere Gruppe: externe Werkzeuge -->
                <div class="action-group action-group-center">
                    <button class="commanderRoot" type="button" title="Öffnet CommanderRoot" aria-label="CommanderRoot öffnen" >
                        <img src="https://twitch-tools.rootonline.de/favicon.ico" alt="" width="24" height="24" aria-hidden="true">
                    </button>
                    <button class="chatstats" type="button" title="Öffnet SullyGnome-Kanalstatistiken" aria-label="SullyGnome-Kanalstatistiken öffnen" >
                        <img src="https://sullygnome.com/favicon.ico" alt="" width="24" height="24" aria-hidden="true">
                    </button>
                    <button class="modLogger" type="button" title="Öffnet ModLogger für den aktuellen Kanal" aria-label="ModLogger öffnen" >
                        &#9783;
                    </button>
                    <button class="chatDeepStats" type="button" title="Öffnet ChatStats für den aktuellen Kanal" aria-label="ChatStats öffnen" >
                        &#128200;
                    </button>
                </div>

                <!-- Rechte Gruppe: Listenaktionen -->
                <div class="action-group action-group-right">
                    <button class="pause" id="pause" type="button" title="Pause/Play" aria-label="Pause oder Fortsetzen" >
                        &#9208; &#9655;
                    </button>
                    <button class="unbanAll" type="button" title="Alle auf der Liste entbannen" aria-label="Alle auf der Liste entbannen" >
                        &#128519;
                    </button>
                    <button class="banAll" type="button" title="Alle auf der Liste bannen" aria-label="Alle auf der Liste bannen" >
                        &#128121;
                    </button>
                </div>

            </div>
            <!-- Status der aktuell geladenen Liste -->
            <div id="listStatus" class="list-status" aria-live="polite"
            ></div>
            <!-- Footer mit Versionsnummer -->
            <div id="footer" class="footer">
                <a id="manupdate"
                    href="https://github.com/QueerModsDACH/MagicCleaningTool/raw/main/MagicCleaningTool.user.js"
                    title="Aktuelle Version installieren"
                >
                    ${updateText}
                </a>
                &nbsp;-&nbsp;
                ${myVersion}
            </div>
        </div>
    `;
    // ############################################################################
    // ##### JAVASCRIPT: MODAL UND TOOL-CONTAINER ERSTELLEN #######################
    const d = document.createElement('div');
    d.style.display = 'none';
    d.innerHTML = html;
    // Fügt das Tool auch dann ein, wenn document-idle bereits nach DOMContentLoaded ausgeführt wurde.
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
    // Aktivierungsbutton für das Twitch-Menü.
    const activateBtn = document.createElement('button');
    activateBtn.innerHTML = `
        <img src="${activateImage}" alt="Aktivieren" width="25" height="25" >
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
    activateBtn.id = 'morningStar';
    activateBtn.title = 'Magic Cleaning Tool';
    let enabled = false;
    // ############################################################################
    // ##### HILFSFUNKTION FÜR DRAGGABLE ##########################################
    // Macht das Tool verschiebbar und verhindert doppelte Event-Registrierungen.
    function makeToolDraggable() {
        const tool = d.querySelector('.magicMorningStar');
        if (!tool) {
            return;
        }
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
        // Diese Elemente müssen weiterhin normal anklickbar bleiben.
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
                const toolRect =
                    tool.getBoundingClientRect();
                isDragging = true;
                startPointerX = event.clientX;
                startPointerY = event.clientY;
                startLeft = toolRect.left;
                startTop = toolRect.top;
                // Verhindert einen Sprung beim ersten Verschieben.
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
    // ##### BENUTZERSTATUS UND LISTENAKTIONEN ####################################
    // Prüft, ob ein Benutzer bereits gebannt wurde.
    function userAlreadyBanned(
        user,
        buttonId,
        listSuffix,
        shouldRender = true
    ) {
        const normalizedUser = normalizeUser(user);
        if (!isValidUsername(normalizedUser)) {
            return;
        }
        if (!QMD_bannedUsersStore.includes(normalizedUser)) {
            addUsersToQueue(
                [normalizedUser],
                listSuffix,
                false
            );
        } else {
            const button = d.querySelector(
                `#${buttonId}`
            );
            if (button) {
                button.textContent = 'already banned';
            }
            console.log(LOGPREFIX, `${normalizedUser} already banned in ${activeChannel}`);
        }
        if (shouldRender) {
            renderList();
        }
    }
    // Prüft, ob ein Benutzer bereits entbannt wurde.
    function userAlreadyUnBanned(
        user,
        buttonId,
        shouldRender = true
    ) {
        const normalizedUser = normalizeUser(user);
        if (!isValidUsername(normalizedUser)) {
            return;
        }
        if (!QMD_unbannedUsersStore.includes(normalizedUser)) {
            queueList.add(normalizedUser);
        } else {
            const button = d.querySelector(
                `#${buttonId}`
            );
            if (button) {
                button.textContent = 'already unbanned';
            }
            console.log(LOGPREFIX, `${normalizedUser} already unbanned in ${activeChannel}`);
        }
        if (shouldRender) {
            renderList();
        }
    }
    // Aktualisiert den Kanalnamen im Informationsbereich.
    function updateChannelInfo() {
        const channelElement = d.querySelector('#channelName');
        if (!channelElement) {
            return;
        }
        channelElement.textContent =
            activeChannelDisplay ||
            activeChannel ||
            'Kein moderierbarer Kanal';
    }
    // ############################################################################
    // ##### BENUTZEROBERFLÄCHE UND FENSTERSTEUERUNG #############################
    function show() {
        const moderatedChannel = getModeratedChannel();
        if (!moderatedChannel) {
            console.warn(LOGPREFIX, 'Tool konnte nicht geöffnet werden: Kein moderierbarer Kanal aktiv.');
            hide();
            return;
        }
        activeChannel = moderatedChannel;
        activeChannelDisplay = getDisplayChannelName();
        console.log(LOGPREFIX, `Tool für moderierten Kanal ${activeChannel} geöffnet.`);
        appendToolToDocument();
        d.style.display = '';
        enabled = true;
        updateChannelInfo();
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
        if (!textField || !importDiv || !body) {
            return;
        }
        textField.value = '';
        if (importDiv.style.display !== 'none') {
            importDiv.style.display = 'none';
            body.style.display = '';
        } else {
            importDiv.style.display = '';
            body.style.display = 'none';
            textField.focus();
        }
        renderList();
    }
    function toggleBack() {
        queueList.clear();
        queueListSources.clear();
        activeListAction = null;
        activeListInfo = null;
        actionDurationSamples = [];
        updateListStatus();
        d.querySelector('#textfield').value = '';
        const body = d.querySelector('.body');
        const importDiv = d.querySelector('.import');
        insertText('');
        const banReasonInput = d.querySelector('#banReason');
        if (banReasonInput && banReasonInput.dataset.reasonSource === 'list') {
            banReasonInput.value = '';
            banReasonInput.dataset.reasonSource = 'empty';
        }
        if (importDiv.style.display !== 'none') {
            importDiv.style.display = 'none';
            body.style.display = '';
        } else {
            importDiv.style.display = '';
            body.style.display = 'none';
            d.querySelector('.import textarea').focus();
        }
        const loadedList = d.querySelector('#loadedList');
        if (loadedList) {
            loadedList.textContent = '';
            loadedList.removeAttribute('href');
            loadedList.style.display = 'none';
        }
        renderList();
    }
    function togglePause() {
        const pauseKey = getListPauseKey();
        if (
            !pauseKey ||
            !isListActionRunning(pauseKey)
        ) {
            return;
        }
        const shouldPause = !isListPaused(pauseKey);
        setListPauseState(
            pauseKey,
            shouldPause
        );
        updatePauseButton();
        updateListStatus();
    }
    // ############################################################################
    // ##### MOD-MENÜ-SICHTBARKEIT ###############################################
    // Aktualisiert das Bild und die Beschriftung des Umschalters.
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
    // Wendet den gespeicherten Sichtbarkeitszustand auf das Mod-Menü an.
    function applyModMenuVisibility() {
        const state = window.__QMD_MOD_MENU_STATE__;
        if (!state) {
            return;
        }
        const displayValue = isModMenuVisible
            ? ''
            : 'none';
        if (state.dropdownButton) {
            state.dropdownButton.style.display =
                displayValue;
        }
        // Die Liste wird bei ausgeblendetem Mod-Menü geschlossen.
        if (state.dropdownList && !isModMenuVisible) {
            state.dropdownList.style.display = 'none';
        }
        updateModMenuToggleImage();
    }
    // Schaltet das Mod-Menü um und speichert den neuen Zustand.
    function toggleModMenuVisibility() {
        isModMenuVisible = !isModMenuVisible;
        writeStorageValue(
            MOD_MENU_VISIBILITY_STORAGE_KEY,
            isModMenuVisible
        );
        applyModMenuVisibility();
        console.log(LOGPREFIX, `Mod-Menü ist jetzt ${ isModMenuVisible ? 'sichtbar' : 'verborgen' }.`);
    }
    // ############################################################################
    // ##### VERSIONS- UND EXTERNE FUNKTIONEN #####################################
    function parseVersion(version) {
        return String(version)
            .trim()
            .split('.')
            .map((part) => {
                const number = Number.parseInt(part, 10);
                return Number.isFinite(number)
                    ? number
                    : 0;
            });
    }
    function compareVersions(
        firstVersion,
        secondVersion
    ) {
        const first = parseVersion(firstVersion);
        const second = parseVersion(secondVersion);
        const length = Math.max(
            first.length,
            second.length
        );
        for (
            let index = 0;
            index < length;
            index++
        ) {
            const firstPart = first[index] ?? 0;
            const secondPart = second[index] ?? 0;
            if (firstPart > secondPart) {
                return 1;
            }
            if (firstPart < secondPart) {
                return -1;
            }
        }
        return 0;
    }
    // Prüft die aktuelle Version gegen die Version im Repository.
    async function checkVersion() {
        const versionElement =
            d.querySelector('#manupdate');
        if (!versionElement) {
            return;
        }
        try {
            const response = await fetchWithTimeout(
                'https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/MagicCleaningTool.user.js',
                {
                    cache: 'no-store'
                }
            );
            if (!response.ok) {
                throw new Error(
                    `HTTP-Fehler ${response.status}`
                );
            }
            const versionText = await response.text();
            const match = versionText.match(
                /^[ \t]*\/\/[ \t]*@version[ \t]+([0-9]+(?:\.[0-9]+)*)[ \t]*$/m
            );
            if (!match) {
                versionElement.textContent = updateText;
                return;
            }
            const newVersion = match[1];
            const versionComparison = compareVersions(
                myVersion,
                newVersion
            );
            if (versionComparison < 0) {
                versionElement.textContent =
                    `Update verfügbar: ${newVersion}`;
            } else {
                versionElement.textContent = updateText;
            }
        } catch (error) {
            console.error(LOGPREFIX, 'Versionsprüfung fehlgeschlagen:', error);
            versionElement.textContent = updateText;
        }
    }
    function openExternal(url) {
        window.open(
            url,
            '_blank',
            'noopener,noreferrer'
        );
    }
    // ############################################################################
    // ##### BUTTON-EVENTS EINRICHTEN ############################################
    function setupButtonEvents() {
        d.querySelector('.banAll').onclick = banAll;
        d.querySelector('.closeBtn').onclick = hide;
        d.querySelector('.unbanAll').onclick = unbanAll;
        d.querySelector('.back').onclick = toggleBack;
        d.querySelector('.pause').onclick = togglePause;
        d.querySelector('.quickCheck').onclick = quickCheckLists;
        d.querySelector('.modMenuToggle').onclick = toggleModMenuVisibility;
        d.querySelector('.importBtn').onclick = importList;
        d.querySelector('.commanderRoot').onclick = () => openExternal('https://twitch-tools.rootonline.de');
        d.querySelector('.chatstats').onclick = () => openExternal(`https://sullygnome.com/channel/${encodeURIComponent(activeChannel)}`);
        d.querySelector('.modLogger').onclick = () => openExternal(`https://jvpeek.github.io/twitchmodlogger/?channel=${encodeURIComponent(activeChannel)}`);
        d.querySelector('.chatDeepStats').onclick = () => openExternal(`https://echtkpvl.github.io/echt-twitch/chat-stats.html?channel=${encodeURIComponent(activeChannel)}`);
        // Verbindet alle verfügbaren Listenbuttons zentral mit ihrem Import.
        LIST_BUTTONS.forEach((listConfig) => {
            const button = d.querySelector(
                `#${listConfig.id}`
            );
            if (!button || listConfig.placeholder) {
                return;
            }
            button.onclick = () =>
                importListByNumber(listConfig.number);
        });
        // Der Aktivierungsbutton wird mit der Toggle-Funktion verbunden.
        activateBtn.onclick = toggle;
        // Verarbeitet die dynamisch erzeugten Listenaktionen.
        d.addEventListener('click', (event) => {
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
            if (target.matches('.usercard')) {
                usercard(target.dataset.user);
            }
            // Das Startbanner öffnet die Auswahl der Bannlisten.
            if (
                target.matches('.toggleImport, .start')
            ) {
                toggleImport();
            }
            if (target.matches('.removeModChannel')) {
                removeModChannel(target.dataset.user);
            }
            if (target.matches('.addModChannels')) {
                addModChannel(target.dataset.user);
            }
        });
    }
    setupButtonEvents();
    restoreListStatuses();
    // Markiert manuell eingegebene Banngründe als benutzerdefiniert.
    const banReasonInput = d.querySelector('#banReason');
    if (
        banReasonInput &&
        banReasonInput.dataset.reasonListenerAttached !== 'true'
    ) {
        banReasonInput.dataset.reasonSource = 'empty';
        banReasonInput.addEventListener(
            'input',
            () => {
                banReasonInput.dataset.reasonSource = 'custom';
            }
        );
        banReasonInput.dataset.reasonListenerAttached = 'true';
    }
    // ############################################################################
    // ##### IMPORT UND EINGABEVERARBEITUNG #######################################
    function insertText(value) {
        d.querySelector('#textfield').value =
            Array.isArray(value)
                ? value.join('\n')
                : value;
    }
    // Übernimmt Benutzer aus der manuellen Eingabe in die Warteschlange.
    function importList() {
        activeListAction = 'ban';
        const importTextarea =
            d.querySelector('.import textarea');
        if (!importTextarea) {
            return;
        }
        const users = parseUserList(
            importTextarea.value
        );
        if (users.length === 0) {
            return;
        }
        activeListInfo = {
            fileName: 'Manuelle Eingabe',
            listSuffix: 'manual',
            action: 'ban',
            channel: activeChannel,
            banReason: getEffectiveBanReason(
                defaultBanReason
            ),
            users: new Set(users),
            skippedUsers: new Set()
        };
        for (const user of users) {
            addUsersToQueue([user]);
        }
        importTextarea.value = '';
        toggleImport();
        renderList();
    }
    // Ermittelt eine Listen-Konfiguration anhand ihrer Nummer.
    function getListConfig(number) {
        return LIST_BUTTONS.find(
            (listConfig) =>
                listConfig.number ===
                String(number).padStart(2, '0')
        );
    }
    // Zentrale Importfunktion für alle Listen.
    function importListByNumber(number) {
        const listConfig = getListConfig(number);
        if (!listConfig) {
            console.error(LOGPREFIX, `Keine Konfiguration für Liste ${number} gefunden.`);
            return;
        }
        if (listConfig.placeholder) {
            console.warn(LOGPREFIX, `Liste ${listConfig.number} ist nur ein Platzhalter.`);
            return;
        }
        importMDGGeneric(listConfig);
    }
    // Allgemeine Importfunktion für externe Listen.
    function importMDGGeneric(listConfig) {
        const {
            url,
            id: buttonId,
            text: defaultButtonText,
            fileName,
            action = 'ban',
            banReason: listBanReason = defaultBanReason,
            saveSuffix: listSuffix
        } = listConfig;
        if (activeChannel) {
            const oldStatus = readStorageValue(
                getListStatusStorageKey(
                    activeChannel,
                    listConfig
                ),
                null
            );
            if (oldStatus) {
                oldStatus.status = 'unknown';
                oldStatus.checkedAt = null;
                writeStorageValue(
                    getListStatusStorageKey(
                        activeChannel,
                        listConfig
                    ),
                    oldStatus
                );
                applyListStatusToButton(
                    listConfig,
                    oldStatus
                );
            }
        }
        const loadedListText = `Geladene Liste '${fileName}' anzeigen`;
        const loadedListHref = url;
        if (!isCurrentChannelModerated()) {
            console.warn(LOGPREFIX, 'Listenimport blockiert: Kein moderierbarer Kanal aktiv.');
            return;
        }
        const normalizedAction =
            action === 'unban'
                ? 'unban'
                : 'ban';
        activeListAction = normalizedAction;
        queueList.clear();
        queueListSources.clear();
        actionDurationSamples = [];
        activeListInfo = null;
        updateListStatus();
        updateBulkActionButtons();
        const usersToProcess = [];
        const banReasonInput = d.querySelector('#banReason');
        const currentBanReason = banReasonInput?.value.trim() || '';
        const reasonWasAutomaticallyFilled = banReasonInput?.dataset.reasonSource === 'list';
        const shouldUseListReason = !currentBanReason || reasonWasAutomaticallyFilled;
        if (
            normalizedAction === 'ban' &&
            banReasonInput &&
            shouldUseListReason
        ) {
            banReasonInput.value = listBanReason;
            banReasonInput.dataset.reasonSource = 'list';
        }
        const effectiveBanReason =
            normalizedAction === 'ban'
                ? (
                    banReasonInput?.value.trim() ||
                    listBanReason ||
                    defaultBanReason
                )
                    .replace(/[\r\n]+/g, ' ')
                    .slice(0, 500)
                : '';
        const sourceButton = d.querySelector( `#${buttonId}` );
        if (sourceButton) {
            sourceButton.disabled = true;
            sourceButton.setAttribute(
                'aria-busy',
                'true'
            );
            sourceButton.textContent = 'Lade …';
        }
        fetchWithTimeout(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        `HTTP-Fehler ${response.status}`
                    );
                }
                return response.text();
            })
            .then((data) => {
                const parsedUsers = parseUserList(data);
                activeListInfo = {
                    fileName,
                    listSuffix,
                    action: normalizedAction,
                    channel: activeChannel,
                    banReason: effectiveBanReason,
                    users: new Set(parsedUsers),
                    skippedUsers: new Set()
                };
                usersToProcess.push(...parsedUsers);
                if (!isCurrentChannelModerated()) {
                    console.warn(LOGPREFIX, 'Listenimport wegen eines Kanalwechsels verworfen.');
                    activeListAction = null;
                    usersToProcess.length = 0;
                    queueList.clear();
                    queueListSources.clear();
                    updateBulkActionButtons();
                    renderList();
                    if (sourceButton) {
                        sourceButton.disabled = false;
                        sourceButton.removeAttribute(
                            'aria-busy'
                        );
                        sourceButton.textContent =
                            defaultButtonText;
                    }
                    return;
                }
                for (const name of usersToProcess) {
                    if (normalizedAction === 'unban') {
                        userAlreadyUnBanned(
                            name,
                            buttonId,
                            false
                        );
                    } else {
                        userAlreadyBanned(
                            name,
                            buttonId,
                            listSuffix,
                            false
                        );
                    }
                }
                const textField = d.querySelector('#textfield');
                if (textField) {
                    textField.value = '';
                }
                insertText(Array.from(queueList));
                updateListStatus();
                renderList();
                if (queueList.size !== 0) {
                    toggleImport();
                    renderList();
                } else {
                    renderList();
                }
                if (sourceButton) {
                    sourceButton.disabled = false;
                    sourceButton.removeAttribute(
                        'aria-busy'
                    );
                    sourceButton.textContent =
                        defaultButtonText;
                }
            })
            .catch((error) => {
                console.error(LOGPREFIX, `Liste konnte nicht geladen werden: ${url}`, error);
                activeListAction = null;
                queueList.clear();
                queueListSources.clear();
                activeListInfo = null;
                actionDurationSamples = [];
                updateListStatus();
                const textField = d.querySelector('#textfield');
                if (textField) {
                    textField.value = '';
                }
                updateBulkActionButtons();
                renderList();
                if (sourceButton) {
                    sourceButton.disabled = false;
                    sourceButton.removeAttribute(
                        'aria-busy'
                    );
                    sourceButton.textContent =
                        defaultButtonText;
                }
            });
        const loadedList = d.querySelector('#loadedList');
        if (loadedList) {
            loadedList.textContent = loadedListText;
            loadedList.href = loadedListHref;
            loadedList.style.display = 'inline-block';
        }
    }
    // ############################################################################
    // ##### WHITELIST LADEN UND PRÜFEN ###########################################
    // Lädt beide Whitelists und führt sie in einem Set zusammen.
    async function loadWhitelist() {
        if (whitelistPromise) {
            return whitelistPromise;
        }
        const parseWhitelist = (data) =>
            data
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(
                    (line) =>
                        line &&
                        !line.startsWith('#')
                )
                .map(normalizeUser)
                .filter(isValidUsername);
        const fetchWhitelist = async (url) => {
            const response = await fetchWithTimeout(url);
            if (!response.ok) {
                throw new Error(
                    `HTTP-Fehler ${response.status} beim Laden von ${url}`
                );
            }
            return response.text();
        };
        // Beide Whitelist-Dateien parallel laden.
        whitelistPromise = Promise.all([
            fetchWhitelist(WHITELISTED_BOTS_URL),
            fetchWhitelist(WHITELISTED_USER_URL)
        ])
            .then(([botsData, userData]) => {
                const botWhitelist = parseWhitelist(botsData);
                const userWhitelist = parseWhitelist(userData);
                // Beide Whitelists in einem gemeinsamen Set zusammenführen.
                whitelistUsers = new Set([
                    ...botWhitelist,
                    ...userWhitelist
                ]);
                console.log(LOGPREFIX, `${whitelistUsers.size} Benutzer aus beiden Whitelists geladen.`);
                return whitelistUsers;
            })
            .catch((error) => {
                console.error(LOGPREFIX, 'Whitelists konnten nicht geladen werden:', error);
                // Beim nächsten Versuch erneut laden.
                whitelistPromise = null;
                throw error;
            });
        return whitelistPromise;
    }
    async function isUserWhitelisted(user) {
        const whitelist = await loadWhitelist();
        const normalizedUser = normalizeUser(user);
        return whitelist.has(normalizedUser);
    }
    // ############################################################################
    // ##### EINZEL- UND MASSENAKTIONEN ###########################################
    async function banAll() {
        if (!isCurrentChannelModerated()) {
            console.warn(LOGPREFIX, 'Ban All blockiert: Kein moderierbarer Kanal aktiv.');
            return;
        }
        if (activeListAction === 'unban') {
            console.warn(LOGPREFIX, 'Ban All wurde für eine Unban-Liste blockiert.');
            return;
        }
        const actionPauseKey = getListPauseKey(activeListInfo);
        if (
            !actionPauseKey ||
            isListActionRunning(actionPauseKey)
        ) {
            return;
        }
        listRunningActions.set(
            actionPauseKey,
            true
        );
        updatePauseButton();
        console.log(LOGPREFIX, 'Banning all...', queueList);
        try {
            for (const user of [...queueList]) {
                await waitForActionResume(
                    actionPauseKey
                );
                if (!isCurrentChannelModerated()) {
                    console.warn(LOGPREFIX, 'Ban All wegen eines Kanalwechsels abgebrochen.');
                    break;
                }
                const actionStartedAt = performance.now();
                const wasBanned = await banItem(user);
                if (wasBanned) {
                    await delay(
                        DELAY_BAN_ACTION
                    );
                    const actionDuration = performance.now() - actionStartedAt;
                    addActionDurationSample(
                        actionDuration
                    );
                    updateListStatus();
                }
            }
        } finally {
            listRunningActions.delete(
                actionPauseKey
            );
            setListPauseState(
                actionPauseKey,
                false
            );
            updatePauseButton();
            updateListStatus();
        }
    }
    async function unbanAll() {
        if (!isCurrentChannelModerated()) {
            console.warn(LOGPREFIX, 'Unban All blockiert: Kein moderierbarer Kanal aktiv.');
            return;
        }
        if (activeListAction === 'ban') {
            console.warn(LOGPREFIX, 'Unban All wurde für eine Bannliste blockiert.');
            return;
        }
        const actionPauseKey = getListPauseKey(activeListInfo);
        if (
            !actionPauseKey ||
            isListActionRunning(actionPauseKey)
        ) {
            return;
        }
        listRunningActions.set(
            actionPauseKey,
            true
        );
        updatePauseButton();
        console.log(LOGPREFIX, 'Unbanning all...', queueList);
        try {
            for (const user of [...queueList]) {
                await waitForActionResume(
                    actionPauseKey
                );
                if (!isCurrentChannelModerated()) {
                    console.warn(LOGPREFIX, 'Unban All wegen eines Kanalwechsels abgebrochen.');
                    break;
                }
                const actionStartedAt = performance.now();
                const wasUnbanned = await unbanItem(user);
                if (wasUnbanned) {
                    await delay(
                        DELAY_UNBAN_ACTION
                    );
                    const actionDuration = performance.now() - actionStartedAt;
                    addActionDurationSample(
                        actionDuration
                    );
                    updateListStatus();
                }
            }
        } finally {
            listRunningActions.delete(
                actionPauseKey
            );
            setListPauseState(
                actionPauseKey,
                false
            );
            updatePauseButton();
            updateListStatus();
        }
    }
    function usercard(user) {
        const normalizedUser = normalizeUser(user);
        if (
            !activeChannel ||
            !isValidUsername(normalizedUser)
        ) {
            console.warn(LOGPREFIX, 'Usercard konnte nicht geöffnet werden:', normalizedUser);
            return;
        }
        const usercardUrl = `https://www.twitch.tv/popout/${encodeURIComponent(activeChannel)}/viewercard/${encodeURIComponent(normalizedUser)}`;
        console.log(LOGPREFIX, 'Öffne Usercard:', usercardUrl);
        openExternal(usercardUrl);
    }
    function ignoreItem(user) {
        const normalizedUser = normalizeUser(user);
        console.log(LOGPREFIX, 'Ignore user:', normalizedUser);
        queueList.delete(normalizedUser);
        queueListSources.delete(normalizedUser);
        ignoredList.add(normalizedUser);
        if (
            activeListInfo &&
            activeListInfo.users.has(normalizedUser)
        ) {
            activeListInfo.skippedUsers.add(
                normalizedUser
            );
        }
        renderList();
    }
    function unbanItem(user) {
        if (!isCurrentChannelModerated()) {
            console.warn(LOGPREFIX, 'Unban blockiert: Der aktuelle Kanal ist nicht moderierbar.');
            return false;
        }
        const actionChannel = activeChannel;
        const normalizedUser = normalizeUser(user);
        if (!isValidUsername(normalizedUser)) {
            console.warn(LOGPREFIX, `Ungültiger Benutzername für Unban ignoriert: ${normalizedUser}`);
            return false;
        }
        console.log(LOGPREFIX, 'Unban user:', normalizedUser);
        try {
            sendMessage(`/unban ${normalizedUser}`);
        } catch (error) {
            console.error(LOGPREFIX, `Unban-Befehl für ${normalizedUser} konnte nicht gesendet werden:`, error);
            return false;
        }
        if (
            !actionChannel ||
            activeChannel !== actionChannel ||
            getModeratedChannel() !== actionChannel
        ) {
            console.warn(LOGPREFIX, `Unban von ${normalizedUser} wurde wegen eines Kanalwechsels nicht gespeichert.`);
            return false;
        }
        queueList.delete(normalizedUser);
        queueListSources.delete(normalizedUser);
        if (
            !QMD_unbannedUsersStore.includes(
                normalizedUser
            )
        ) {
            QMD_unbannedUsersStore.push(
                normalizedUser
            );
        }
        QMD_bannedUsersStore =
            QMD_bannedUsersStore.filter(
                (storedUser) =>
                    storedUser !== normalizedUser
            );
        writeStorageValue(
            `${actionChannel}_unbanlist`,
            QMD_unbannedUsersStore
        );
        writeStorageValue(
            `${actionChannel}_banlist`,
            QMD_bannedUsersStore
        );
        renderList();
        return true;
    }
    function removeModChannel(user) {
        const normalizedUser = normalizeUser(user);
        if (!isValidUsername(normalizedUser)) {
            console.warn(LOGPREFIX, `Ungültiger Mod-Kanal kann nicht entfernt werden: ${normalizedUser}`);
            return;
        }
        console.log(LOGPREFIX, 'Remove User from ModChannels:', normalizedUser);
        queueList.delete(normalizedUser);
        queueListSources.delete(normalizedUser);
        QMD_modChannelStore =
            QMD_modChannelStore.filter(
                (channel) =>
                    normalizeUser(channel) !==
                    normalizedUser
            );
        writeStorageList(
            'myModChannels',
            QMD_modChannelStore
        );
        if (
            typeof window.refreshQMDModMenu ===
            'function'
        ) {
            window.refreshQMDModMenu();
        }
        renderList();
    }
    async function banItem(user) {
        if (!isCurrentChannelModerated()) {
            console.warn( LOGPREFIX, 'Ban blockiert: Der aktuelle Kanal ist nicht moderierbar.' );
            return false;
        }
        const actionChannel = activeChannel;
        const normalizedUser = normalizeUser(user);
        if (!isValidUsername(normalizedUser)) {
            console.warn(LOGPREFIX, `Ungültiger Benutzername ignoriert: ${normalizedUser}`);
            queueList.delete(normalizedUser);
            queueListSources.delete(normalizedUser);
            renderList();
            return false;
        }
        try {
            const whitelisted = await isUserWhitelisted(normalizedUser);
            if (whitelisted) {
                console.log(LOGPREFIX, `${normalizedUser} steht auf der Whitelist und wird nicht gebannt.`);
                const listSuffixes =
                    queueListSources.get(
                        normalizedUser
                    ) || new Set();
                for (const listSuffix of listSuffixes) {
                    addUserToListStorage(
                        actionChannel,
                        'ban',
                        listSuffix,
                        normalizedUser,
                        '_skipped'
                    );
                }
                queueList.delete(normalizedUser);
                queueListSources.delete(normalizedUser);
                if (
                    activeListInfo &&
                    activeListInfo.users.has(
                        normalizedUser
                    )
                ) {
                    activeListInfo.skippedUsers.add(
                        normalizedUser
                    );
                }
                renderList();
                return false;
            }
        } catch (error) {
            console.error(LOGPREFIX, `Ban von ${normalizedUser} wurde abgebrochen, weil die Whitelist nicht geprüft werden konnte.`, error);
            return false;
        }
        const storedBanReason =
            activeListInfo?.action === 'ban'
                ? activeListInfo.banReason
                : '';
        const safeReason = storedBanReason || defaultBanReason;
        try {
            if (
                !actionChannel ||
                activeChannel !== actionChannel ||
                getModeratedChannel() !== actionChannel
            ) {
                console.warn(LOGPREFIX, `Ban von ${normalizedUser} wurde wegen eines Kanalwechsels abgebrochen.`);
                return false;
            }
            sendMessage(
                `/ban ${normalizedUser} ${safeReason}`
            );
        } catch (error) {
            console.error(LOGPREFIX, `Ban-Befehl für ${normalizedUser} konnte nicht gesendet werden:`, error);
            return false;
        }
        if (
            !actionChannel ||
            activeChannel !== actionChannel ||
            getModeratedChannel() !== actionChannel
        ) {
            console.warn(LOGPREFIX, `Ban von ${normalizedUser} wurde nach dem Senden nicht gespeichert, weil der Moderationskanal gewechselt wurde.`);
            return false;
        }
        const listSuffixes =
            queueListSources.get(
                normalizedUser
            ) || new Set();
        queueList.delete(normalizedUser);
        queueListSources.delete(normalizedUser);
        if (
            !QMD_bannedUsersStore.includes(
                normalizedUser
            )
        ) {
            QMD_bannedUsersStore.push(
                normalizedUser
            );
        }
        writeStorageValue(
            `${actionChannel}_banlist`,
            QMD_bannedUsersStore
        );
        for (const listSuffix of listSuffixes) {
            addUserToListStorage(
                actionChannel,
                'ban',
                listSuffix,
                normalizedUser
            );
        }
        renderList();
        return true;
    }

    function addModChannel(user) {
        const displayUser =
            String(user ?? '').trim();
        const normalizedUser = normalizeUser(displayUser);
        if (!isValidUsername(normalizedUser)) {
            console.warn(
                LOGPREFIX,
                `Ungültiger Mod-Kanal wurde ignoriert: ${normalizedUser}`
            );
            return;
        }
        const channelAlreadyStored =
            QMD_modChannelStore.some(
                (channel) =>
                    normalizeUser(channel) ===
                    normalizedUser
            );
        if (!channelAlreadyStored) {
            console.log(LOGPREFIX, `${displayUser} zu ModChannels hinzugefügt`);
            queueList.delete(normalizedUser);
            QMD_modChannelStore.push(displayUser);
            QMD_modChannelStore =
                sortAndStoreModChannels(
                    QMD_modChannelStore
                );
            if (
                typeof window.refreshQMDModMenu ===
                'function'
            ) {
                window.refreshQMDModMenu();
            }
            renderList();
        } else {
            console.log(LOGPREFIX, `Benutzer ${normalizedUser} ist bereits in den ModChannels.`);
        }
    }
    // ############################################################################
    // ##### NACHRICHTEN AN DEN TWITCH-CHAT SENDEN ###############################
    function sendMessage(message) {
        if (!isCurrentChannelModerated()) {
            throw new Error(
                'Moderationsaktion blockiert: Der aktuelle Kanal ist nicht moderierbar.'
            );
        }
        sendMessageSlate(message);
    }
    // Sendet eine Nachricht über den Slate-Editor von Twitch.
    function sendMessageSlate(message) {
        const normalizedMessage = String(message ?? '').trim();
        if (!normalizedMessage) {
            throw new Error(
                'Leere Chat-Nachricht wurde blockiert.'
            );
        }
        const editor = document.querySelector(
            '[data-slate-editor="true"]'
        );
        if (
            !(editor instanceof HTMLElement) ||
            editor.getAttribute('contenteditable') !== 'true'
        ) {
            throw new Error(
                'Keine aktive Chat-Eingabe gefunden.'
            );
        }
        editor.focus();
        if (
            typeof InputEvent === 'undefined' ||
            typeof KeyboardEvent === 'undefined'
        ) {
            throw new Error(
                'Der Browser unterstützt die benötigten Chat-Events nicht.'
            );
        }
        editor.dispatchEvent(
            new InputEvent(
                'beforeinput',
                {
                    bubbles: true,
                    data: normalizedMessage,
                    inputType: 'insertText'
                }
            )
        );
        editor.dispatchEvent(
            new InputEvent(
                'input',
                {
                    bubbles: true,
                    data: normalizedMessage,
                    inputType: 'insertText'
                }
            )
        );
        editor.dispatchEvent(
            new KeyboardEvent(
                'keydown',
                {
                    bubbles: true,
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13
                }
            )
        );
    }
    // Aktiviert oder deaktiviert die Sammelbuttons abhängig vom aktuellen Modus.
    function updateBulkActionButtons() {
        const banAllButton = d.querySelector('.banAll');
        const unbanAllButton = d.querySelector('.unbanAll');
        const hasQueueItems = queueList.size > 0;
        if (banAllButton) {
            const shouldDisable =
                !hasQueueItems ||
                activeListAction === 'unban';
            banAllButton.disabled = shouldDisable;
            banAllButton.setAttribute(
                'aria-disabled',
                String(shouldDisable)
            );
            banAllButton.title =
                activeListAction === 'unban'
                    ? 'Für eine Unban-Liste deaktiviert'
                    : 'Alle auf der Liste bannen';
        }
        if (unbanAllButton) {
            const shouldDisable =
                !hasQueueItems ||
                activeListAction === 'ban';
            unbanAllButton.disabled = shouldDisable;
            unbanAllButton.setAttribute(
                'aria-disabled',
                String(shouldDisable)
            );
            unbanAllButton.title =
                activeListAction === 'ban'
                    ? 'Für eine Bannliste deaktiviert'
                    : 'Alle auf der Liste entbannen';
        }
    }
    // Ermittelt den wirksamen Banngrund für eine Aktion.
    function getEffectiveBanReason(
        fallbackReason = defaultBanReason
    ) {
        const banReasonInput = d.querySelector('#banReason');
        const enteredReason = banReasonInput?.value.trim();
        const reason =
            enteredReason ||
            fallbackReason ||
            defaultBanReason;
        return reason
            .replace(/[\r\n]+/g, ' ')
            .slice(0, 500);
    }
    // ############################################################################
    // ##### HILFSFUNKTIONEN FÜR DIE ZEITBERECHNUNG ###############################
    function formatEstimatedDuration(milliseconds) {
        if (
            !Number.isFinite(milliseconds) ||
            milliseconds <= 0
        ) {
            return 'weniger als 1 Minute';
        }
        const totalSeconds = Math.max( 1, Math.ceil(milliseconds / 1000) );
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor( (totalSeconds % 3600) / 60 );
        const seconds = totalSeconds % 60;
        const parts = [];
        if (hours > 0) {
            parts.push(
                `${hours} ${
                    hours === 1 ? 'Stunde' : 'Stunden'
                }`
            );
        }
        if (minutes > 0) {
            parts.push(
                `${minutes} ${
                    minutes === 1 ? 'Minute' : 'Minuten'
                }`
            );
        }
        // Sekunden nur bei einer geschätzten Dauer unter einer Minute anzeigen.
        if (
            hours === 0 &&
            minutes === 0 &&
            seconds > 0
        ) {
            parts.push(
                `${seconds} ${
                    seconds === 1 ? 'Sekunde' : 'Sekunden'
                }`
            );
        }
        return parts.join(' ');
    }
    function getAverageActionDuration() {
        if (actionDurationSamples.length === 0) {
            // Konservativer Anfangswert, bis echte Messwerte vorliegen.
            return 600;
        }
        const totalDuration =
            actionDurationSamples.reduce(
                (sum, duration) =>
                    sum + duration,
                0
            );
        return totalDuration /
            actionDurationSamples.length;
    }
    function addActionDurationSample(duration) {
        if (
            !Number.isFinite(duration) ||
            duration <= 0
        ) {
            return;
        }
        actionDurationSamples.push(duration);
        if (
            actionDurationSamples.length >
            ACTION_DURATION_SAMPLE_SIZE
        ) {
            actionDurationSamples.shift();
        }
    }
    // Aktualisiert die Statusanzeige der aktuell geladenen Liste.
    function updateListStatus() {
        const statusElement = d.querySelector('#listStatus');
        if (!statusElement) {
            return;
        }
        if (
            !activeListInfo ||
            !activeListInfo.users ||
            activeListInfo.users.size === 0
        ) {
            statusElement.textContent = '';
            statusElement.className = 'list-status';
            statusElement.style.display = 'none';
            return;
        }
        const listUsers = activeListInfo.users;
        const processedStore =
            activeListInfo.action === 'unban'
                ? QMD_unbannedUsersStore
                : QMD_bannedUsersStore;
        const processedUsers =
            [...listUsers].filter(
                (user) =>
                    processedStore.includes(user)
            );
        const skippedUsers =
            [...listUsers].filter(
                (user) =>
                    activeListInfo.skippedUsers.has(user)
            );
        const totalCount = listUsers.size;
        const processedCount = processedUsers.length;
        const skippedCount = skippedUsers.length;
        const remainingCount = Math.max(
            0,
            totalCount - processedCount - skippedCount
        );
        const actionWord =
            activeListInfo.action === 'unban'
                ? 'entbannt'
                : 'gebannt';
        const actionVerb =
            activeListInfo.action === 'unban'
                ? 'entbannt'
                : 'gebannt';
        const channelName =
            activeListInfo.channel ||
            activeChannel ||
            'aktuellen Kanal';
        const reasonText =
            activeListInfo.action === 'unban'
                ? 'Bei dieser Liste wird kein Banngrund angewandt.'
                : `Es wird bei jedem Bann der Grund: \u25B6 ${
                    activeListInfo.banReason ||
                    defaultBanReason
                } \u25C0 hinterlegt.`;
        // Erstellt den sichtbaren Status- und Fortschrittstext.
        let statusText =
            `Es wurden ${totalCount.toLocaleString('de-DE')} Namen geladen, davon sind ${processedCount.toLocaleString('de-DE')} Namen bei \u25B6 ${channelName} \u25C0 ${actionWord}.`;
        let progressText = '';
        if (skippedCount > 0) {
            progressText +=
                `Übersprungen: ${skippedCount.toLocaleString('de-DE')}. `;
        }
        if (remainingCount > 0) {
            const estimatedDuration = remainingCount * getAverageActionDuration();
            progressText +=
                `Verbleibend: ${remainingCount.toLocaleString('de-DE')} … `;
            progressText +=
                `Voraussichtliche Dauer: ca. ${
                    formatEstimatedDuration(
                        estimatedDuration
                    )
                }.`;
        } else {
            progressText +=
                'Liste vollständig abgearbeitet.';
        }
        statusText += `\n${progressText}`;
        statusText += `\n${reasonText}`;
        statusElement.textContent = statusText;
        statusElement.className =
            `list-status ${
                remainingCount === 0
                    ? 'complete'
                    : 'incomplete'
            }`;
        const activePauseKey = getListPauseKey(activeListInfo);
        if (
            isListPaused(activePauseKey) &&
            remainingCount > 0
        ) {
            statusElement.classList.remove(
                'incomplete'
            );
            statusElement.classList.add('paused');
            statusElement.textContent +=
                ' Status: pausiert.';
        }
        statusElement.style.display = 'block';
    }
    // ############################################################################
    // ##### LISTENANZEIGE UND RENDERING ##########################################
    function renderList() {
        updateListStatus();
        const importDiv = d.querySelector('.import');
        const backButton = d.querySelector('.back');
        const listElement = d.querySelector('.list');
        if (!listElement) {
            return;
        }
        const isSelectionView = importDiv && importDiv.style.display !== 'none';
        const quickCheckButton = d.querySelector('.quickCheck');
        const hasActiveList = queueList.size > 0 || Boolean(activeListInfo);
        const buttonsToToggle = [
            '.banAll',
            '.pause',
            '.unbanAll'
        ];
        buttonsToToggle.forEach((selector) => {
            const button = d.querySelector(selector);
            if (!button) {
                return;
            }
            button.style.display =
                queueList.size > 0
                    ? ''
                    : 'none';
        });
        const navigationDisplay =
            isSelectionView || hasActiveList
                ? ''
                : 'none';
        if (backButton) {
            backButton.style.display =
                navigationDisplay;
        }
        if (quickCheckButton) {
            quickCheckButton.style.display =
                isSelectionView && !hasActiveList
                    ? ''
                    : 'none';
        }
        updateBulkActionButtons();
        updatePauseButton();
        const allItems = Array.from(queueList);
        const visibleItems = allItems.slice(
            0,
            MAX_VISIBLE_LIST_ITEMS
        );
        const hiddenItemCount = Math.max(
            0,
            allItems.length - visibleItems.length
        );
        const renderItem = (item) => `
            <li>
                <button class="usercard" data-user="${escapeHtml(item)}" title="Öffnet die Viewer-Card von ${escapeHtml(item)}" aria-label="Viewer-Card von ${escapeHtml(item)} öffnen" >
                    ?
                </button>
                <button class="ignore" data-user="${escapeHtml(item)}" title="Benutzer aus Liste entfernen" >
                    ❌
                </button>
                <button class="unban" data-user="${escapeHtml(item)}" title="Benutzer entbannen" >
                    unban
                </button>
                <button class="ban" data-user="${escapeHtml(item)}" title="Benutzer bannen" >
                    ban
                </button>
                <span>
                    <a href="https://twitch-tools.rootonline.de/followinglist_viewer.php?username=${encodeURIComponent(item)}"
                        title="Dieser User folgt … Weiterleitung zu CommanderRoot" target="_blank" rel="noopener noreferrer" >
                        ${escapeHtml(item)}
                    </a>
                </span>
            </li>
        `;
        let inner = '';
        if (visibleItems.length > 0) {
            inner = visibleItems
                .map(renderItem)
                .join('');
            if (hiddenItemCount > 0) {
                inner += `
                    <li class="list-limit-info">
                        ${hiddenItemCount.toLocaleString('de-DE')}
                        weitere Namen sind geladen, werden aber nicht gleichzeitig angezeigt. <br>
                        Verwende „Alle bannen“ für die vollständige Liste.
                    </li>
                `;
            }
        } else {
            inner = `
                <div id="empty" class="empty">
                    <img class="toggleImport" src="https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/pix/Queermodsdach_Banner_1920x960.png"
                        title="Start Magic Cleaning Tool" alt="Magic Cleaning Tool starten" width="580" style="cursor: pointer; max-height: 270px; min-height: 270px" >
                </div>
            `;
        }
        listElement.innerHTML = `
            <ul>${inner}</ul>
        `;
    }
    // Escaped HTML verhindert die direkte Interpretation von Benutzereingaben.
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    // ############################################################################
    // ##### MOD-MENÜ ############################################################
    function sortAndStoreModChannels(channels) {
        const uniqueChannels = [];
        const storedChannels = readStorageList('myModChannels');
        const storedDisplayNames = new Map();
        for (const storedChannel of storedChannels) {
            const displayChannel = String(storedChannel ?? '').trim();
            const normalizedChannel = normalizeUser(displayChannel);
            if (
                !isValidUsername(normalizedChannel) ||
                storedDisplayNames.has(normalizedChannel)
            ) {
                continue;
            }
            storedDisplayNames.set(
                normalizedChannel,
                displayChannel
            );
        }
        for (const channel of channels) {
            const displayChannel = String(channel ?? '').trim();
            const normalizedChannel = normalizeUser(displayChannel);
            if (!isValidUsername(normalizedChannel)) {
                continue;
            }
            if (
                uniqueChannels.some(
                    (storedChannel) =>
                        normalizeUser(storedChannel) ===
                        normalizedChannel
                )
            ) {
                continue;
            }
            const stableDisplayChannel =
                storedDisplayNames.get(
                    normalizedChannel
                ) || displayChannel;
            uniqueChannels.push(
                stableDisplayChannel
            );
        }
        uniqueChannels.sort(
            (first, second) =>
                first.localeCompare(
                    second,
                    'de',
                    { sensitivity: 'base' }
                )
        );
        const oldValue = JSON.stringify(storedChannels);
        const newValue = JSON.stringify(uniqueChannels);
        if (oldValue !== newValue) {
            writeStorageList(
                'myModChannels',
                uniqueChannels
            );
        }
        QMD_modChannelStore =
            uniqueChannels;
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
    // Speichert den aktuell moderierten Kanal automatisch.
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
        // Im Twitch-Mod-View gibt es möglicherweise keinen klassischen Mod-Link.
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
        const normalizedCurrentChannel = normalizeUser(currentChannel);
        const storedChannels = processStoredModChannels();
        const existingChannelIndex =
            storedChannels.findIndex(
                (storedChannel) =>
                    normalizeUser(storedChannel) ===
                    normalizedCurrentChannel
            );
        if (existingChannelIndex === -1) {
            const displayChannel =
                getDisplayChannelName(
                    normalizedCurrentChannel
                ) || normalizedCurrentChannel;
            storedChannels.push(
                displayChannel
            );
            console.log(LOGPREFIX, `${displayChannel} wurde automatisch zu den ModChannels hinzugefügt`);
            const sortedChannels =
                sortAndStoreModChannels(
                    storedChannels
                );
            if (
                typeof window.refreshQMDModMenu ===
                'function'
            ) {
                window.refreshQMDModMenu(
                    sortedChannels
                );
            }
        }
    }
    // Erstellt und verwaltet das Dropdown-Menü mit gespeicherten Mod-Kanälen.
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
            return Boolean(
                getModeratedChannel()
            );
        }
        function renderDropdownList(channels = null) {
            if (!state.dropdownList) {
                return;
            }
            state.dropdownList.replaceChildren();
            const storedChannels =
                channels ||
                processStoredModChannels();
            if (storedChannels.length === 0) {
                const listItem = document.createElement('li');
                const linkItem = document.createElement('a');
                linkItem.innerText = 'Bitte lies die Anleitung hier';
                linkItem.href = 'https://github.com/QueerModsDACH/MagicCleaningTool/tree/main/Instructions';
                linkItem.target = '_blank';
                linkItem.rel = 'noopener noreferrer';
                linkItem.title = 'Anleitung lesen';
                listItem.appendChild(linkItem);
                state.dropdownList.appendChild(listItem);
                return;
            }
            storedChannels.forEach((channel) => {
                const listItem = document.createElement('li');
                const linkItem = document.createElement('a');
                linkItem.innerText = channel;
                linkItem.href = `https://twitch.tv/moderator/${encodeURIComponent(channel)}`;
                linkItem.target = '_blank';
                linkItem.rel = 'noopener noreferrer';
                linkItem.title = `Mod-View für den Kanal ${channel}`;
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
            const logoContainer = referenceButton.parentElement;
            logoContainer.style.position = 'relative';
            logoContainer.style.display = 'flex';
            logoContainer.style.alignItems = 'center';
            const dropdownButton = document.createElement('button');
            dropdownButton.id = 'modMenu';
            dropdownButton.type = 'button';
            dropdownButton.title = 'Mod-Kanäle';
            dropdownButton.setAttribute(
                'aria-label',
                'Mod-Kanäle öffnen'
            );
            dropdownButton.innerHTML = `
                <img src="https://raw.githubusercontent.com/QueerModsDACH/MagicCleaningTool/main/pix/modmenu_axt.png"
                    width="25" height="25" alt="Mod-Kanäle" >
            `;
            dropdownButton.style.cssText = `
                width: 25px; height: 25px; padding: 0; margin-left: 8px; margin-top: 12px; display: inline-flex;
                align-items: center; justify-content: center; border: none; color: #9146FF; background-color: transparent; cursor: pointer;
            `;
            const dropdownList =
                document.createElement('ul');
            dropdownList.style.cssText = `
                display: none; position: absolute; top: 38px; left: 38px; z-index: 99999999;
                min-width: 180px; max-height: 70vh; overflow-y: auto; margin: 0; padding: 8px;
                list-style: none; background-color: #000; border: 1px solid #9146FF; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
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
            dropdownList.addEventListener(
                'click',
                (event) => {
                    const selectedLink = event.target.closest('a');
                    if (selectedLink) {
                        dropdownList.style.display = 'none';
                    }
                }
            );
            if (!state.documentClickHandler) {
                state.documentClickHandler = (event) => {
                    const clickedInsideMenu =
                        (
                            state.logoContainer &&
                            state.logoContainer.contains( event.target )
                        ) ||
                        (
                            state.dropdownButton &&
                            state.dropdownButton.contains( event.target )
                        ) ||
                        (
                            state.dropdownList &&
                            state.dropdownList.contains( event.target )
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
            window.refreshQMDModMenu = (
                channels = null
            ) => {
                renderDropdownList(channels);
                applyModMenuVisibility();
            };
            return true;
        }
        function appendModMenuButton() {
            const menuCreated = createDropdownMenu();
            if (!menuCreated) {
                return;
            }
            const modToolsAvailable = hasModeratorTools();
            // Auf nicht moderierten Seiten werden Button und Liste entfernt.
            if (!modToolsAvailable) {
                if (
                    state.dropdownButton && state.dropdownButton.isConnected
                ) {
                    state.dropdownButton.remove();
                }
                if (
                    state.dropdownList && state.dropdownList.isConnected
                ) {
                    state.dropdownList.remove();
                }
                return;
            }
            // Der aktuelle Mod-Kanal wird vor dem Rendern gespeichert.
            addCurrentModChannel();
            const twitchLogo = getHomeLink();
            if (
                !twitchLogo ||
                !twitchLogo.parentElement
            ) {
                return;
            }
            const logoContainer = twitchLogo.parentElement;
            state.logoContainer = logoContainer;
            logoContainer.style.position = 'relative';
            logoContainer.style.display = 'flex';
            logoContainer.style.alignItems = 'center';
            // Button direkt neben dem Twitch-Logo einfügen.
            if (
                !logoContainer.contains( state.dropdownButton )
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
    function appendActivatorBtn() {
        const moderatedChannel = getModeratedChannel();
        // Ohne nachweisbaren Moderationskontext wird der Button nicht angezeigt.
        if (!moderatedChannel) {
            if (enabled) {
                console.log(LOGPREFIX, 'Moderationskontext nicht mehr vorhanden. Tool wird ausgeblendet.');
                enabled = false;
                hide();
            }
            return;
        }
        const modBtn = document.querySelector( '[data-test-selector="mod-view-link"], [data-a-target="mod-view-link"]' );
        let anchorElement = modBtn;
        // Im Twitch-Mod-View gibt es möglicherweise keinen klassischen Mod-Link.
        if (!anchorElement) {
            anchorElement = document.querySelector(
                '[data-a-target="chat-send-button"]'
            );
        }
        if (!anchorElement) {
            return;
        }
        const twitchBar =
            anchorElement.parentElement &&
            anchorElement.parentElement.parentElement &&
            anchorElement.parentElement.parentElement.parentElement;
        if (
            twitchBar &&
            !twitchBar.contains(activateBtn)
        ) {
            console.log(LOGPREFIX, `Moderationswerkzeuge für ${moderatedChannel} erkannt.`);
            twitchBar.insertBefore(
                activateBtn,
                twitchBar.firstChild
            );
            appendToolToDocument();
            makeToolDraggable();
        }
    }
    let lastKnownChannel =
        getModeratedChannel();
    // Reagiert auf Änderungen des aktuellen Moderationskanals.
    function refreshActiveChannel() {
        const detectedChannel = getModeratedChannel();
        if (detectedChannel === lastKnownChannel) {
            return;
        }
        console.log(LOGPREFIX, `Moderationskontext geändert: ${lastKnownChannel || '(kein Kanal)'} → ${detectedChannel || '(kein moderierbarer Kanal)'}`);
        lastKnownChannel = detectedChannel;
        activeChannel = detectedChannel;
        activeChannelDisplay = getDisplayChannelName();
        updateChannelInfo();
        restoreListStatuses();
        queueList.clear();
        queueListSources.clear();
        ignoredList.clear();
        bannedList.clear();
        activeListAction = null;
        activeListInfo = null;
        actionDurationSamples = [];
        QMD_bannedUsersStore = [];
        QMD_unbannedUsersStore = [];
        if (activeChannel) {
            QMD_bannedUsersStore =
                normalizeUserList(
                    readStorageValue(
                        `${activeChannel}_banlist`,
                        []
                    )
                );
            QMD_unbannedUsersStore =
                normalizeUserList(
                    readStorageValue(
                        `${activeChannel}_unbanlist`,
                        []
                    )
                );
        } else {
            // Beim Verlassen des Mod-Kontexts darf das Tool nichts anzeigen und keine Aktionen mehr ausführen.
            hide();
        }
        updateListStatus();
        renderList();
        updateBulkActionButtons();
    }
    // ############################################################################
    // ##### STARTUP UND DAUERHAFTE TWITCH-PRÜFUNG ###############################
    // Twitch rendert Header und Mod-Ansicht dynamisch. Deshalb werden die relevanten Elemente dauerhaft geprüft.
    const twitchWatchdogTimer = window.setInterval(
        () => {
            try {
                refreshActiveChannel();
                appendActivatorBtn();
                modMenu();
            } catch (error) {
                console.error(LOGPREFIX, 'Fehler im Twitch-Watchdog:', error);
            }
        },
        1000
    );
    // Initiale Anzeige der Benutzerliste.
    renderList();
    // Initiales Bild des Mod-Menü-Umschalters.
    updateModMenuToggleImage();
})();
