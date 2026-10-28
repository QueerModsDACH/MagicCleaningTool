# Magic Cleaning Tool – Bedienungsanleitung

Das Magic Cleaning Tool unterstützt Moderationsaktionen auf Twitch. Es kann Namen aus den bereitgestellten Listen oder aus einer manuellen Eingabe übernehmen und diese anschließend zur Bearbeitung anzeigen.

> **Wichtig:** Prüfe vor einer Sammelaktion, ob der richtige Twitch-Kanal geöffnet ist und ob die geladene Liste zur gewünschten Aktion passt. Bann- und Entbannaktionen können viele Konten betreffen.

## 1. Tool öffnen und bedienen

1. Öffne Twitch und gehe in den Moderatorenbereich eines Kanals, den du moderieren darfst.
2. Klicke auf das Aktivierungssymbol des Magic Cleaning Tools.
3. Das Tool öffnet sich. Der aktuell erkannte Kanal wird im Informationsbereich angezeigt.
4. Du kannst das Fenster an einer freien Stelle ziehen, um es zu verschieben.
5. Über die Schaltfläche zum Minimieren blendest du das Tool aus. Über das Aktivierungssymbol kannst du es erneut öffnen.

Das Tool benötigt einen aktiven Moderationskontext. Wenn der Kontext verloren geht oder du den Kanal wechselst, werden laufende Sammelaktionen abgebrochen.

## 2. Listenübersicht

In der Listenübersicht findest du die verfügbaren Listenbuttons. Klicke auf einen Button, um die zugehörige Liste zu laden.

Nach dem Laden werden die Namen geprüft und – sofern sie noch bearbeitet werden müssen – in die Aktionsansicht übernommen. Je nach Liste handelt es sich um eine Bann- oder Entbannliste.

Nicht verfügbare Platzhalter-Buttons sind deaktiviert und können nicht verwendet werden.

Die Farben der Listenbuttons zeigen den gespeicherten Prüf- und Bearbeitungsstatus an:

| Farbe | Bedeutung |
|---|---|
| Grau | Noch nicht geprüft oder kein bekannter Status |
| Blau | Die Liste ist leer |
| Rot | Noch keine Einträge verarbeitet oder die Liste ist offen |
| Orange | Die Liste wurde teilweise verarbeitet |
| Grün | Die Liste ist vollständig verarbeitet |
| Violett | Beim Prüfen der Liste ist ein Fehler aufgetreten |

Zeige mit dem Mauszeiger auf einen Listenbutton, um zusätzliche Statusinformationen wie den Bearbeitungsstand und den Zeitpunkt der letzten Prüfung zu sehen.

## 3. Namen manuell hinzufügen

Du kannst Namen auch selbst eingeben:

1. Öffne die Listenübersicht.
2. Füge in das Textfeld einen Twitch-Benutzernamen pro Zeile ein.
3. Klicke auf **„Benutzername(n) Hinzufügen“**.
4. Die gültigen Namen werden in die Aktionsansicht übernommen.

Ungültige Einträge werden ignoriert. Benutzernamen müssen aus Buchstaben, Zahlen und Unterstrichen bestehen.

## 4. Banngrund festlegen

Im Feld **„Banngrund“** kannst du vor dem Start einen eigenen Banngrund eingeben. Wenn du keinen eigenen Grund einträgst, wird der für die jeweilige Liste vorgesehene Standardgrund verwendet.

Ein eigener Banngrund gilt für die Bannaktion. Bei Entbannaktionen wird kein Banngrund verwendet.

## 5. Aktionsansicht und einzelne Aktionen

In der Aktionsansicht siehst du die Namen, die für die ausgewählte Liste noch anstehen.

Für jeden Namen gibt es Aktionen:

- **Viewer-Card öffnen:** Öffnet die Twitch-Viewer-Card des Benutzers.
- **Aus Liste entfernen:** Entfernt den Namen aus der aktuellen Warteschlange.
- **ban:** Startet die Bannaktion für diesen einzelnen Namen.
- **unban:** Startet die Entbannaktion für diesen einzelnen Namen.
- **Benutzername:** Öffnet den Link zur Benutzeransicht.

Bei Bannaktionen werden Benutzer aus den eingebundenen Whitelists nicht gebannt. Sie werden übersprungen und im Status entsprechend berücksichtigt.

## 6. Sammelaktionen starten

Für eine geladene Bannliste ist **„Alle bannen“** die passende Sammelaktion. Für eine geladene Entbannliste ist **„Alle entbannen“** die passende Sammelaktion.

1. Prüfe den angezeigten Kanal und die Liste.
2. Prüfe bei einer Bannliste auch den Banngrund.
3. Klicke auf die passende Schaltfläche:
   - **Alle bannen** für eine Bannliste
   - **Alle entbannen** für eine Entbannliste
4. Während der Sammelaktion wird der Fortschritt im Statusbereich angezeigt.

Die jeweils unpassende Sammelaktion ist im normalen Ablauf deaktiviert. Starte keine Sammelaktion, wenn du nicht sicher bist, welche Namen sich in der Warteschlange befinden.

### Sammelaktion abbrechen

Während eine Sammelaktion läuft, erscheint die Schaltfläche **„Abbrechen“**. Damit werden nach Möglichkeit keine weiteren Namen bearbeitet.

Ein Abbruch macht bereits ausgeführte Bann- oder Entbannaktionen nicht rückgängig. Prüfe deshalb die erledigten Aktionen bei Bedarf separat.

## 7. Status und Fortschritt verstehen

Der Statusbereich zeigt unter anderem:

- wie viele Namen geladen wurden;
- wie viele davon verarbeitet wurden;
- wie viele noch offen sind;
- eine geschätzte verbleibende Dauer;
- den verwendeten Banngrund bei Bannaktionen.

Ein Benutzer, der bereits im gewünschten Zustand ist, muss nicht erneut bearbeitet werden. Ein bereits gebannter Benutzer wird bei einer Bannaktion beispielsweise übersprungen; ein bereits entbannter Benutzer entsprechend bei einer Entbannaktion.

## 8. Quick Checks

Das Tool kann den Bearbeitungsstand der verfügbaren Listen prüfen. Die automatische Prüfung ist standardmäßig aktiviert.

Über **„Qc Auto“** beziehungsweise **„Qc Aus“** kannst du die automatischen Quick Checks umschalten:

- **Qc Auto:** Automatische Prüfungen sind eingeschaltet.
- **Qc Aus:** Automatische Prüfungen sind ausgeschaltet.

Die Prüfung aktualisiert die Statusfarben und zeigt, wie viele Einträge der jeweiligen Liste bereits als bearbeitet gespeichert sind.

## 9. Daten exportieren und importieren

Die Schaltflächen **export** und **import** befinden sich in der Listenübersicht in der rechten Aktionsgruppe.

### Daten exportieren

Klicke auf **export**, um die gespeicherten Tool-Daten als JSON-Datei herunterzuladen. Verwende den Export regelmäßig als Sicherung, besonders bevor du Daten importierst oder den Browser wechselst.

### Daten importieren

1. Klicke auf **import**.
2. Wähle eine JSON-Exportdatei des Magic Cleaning Tools aus.
3. Wähle im Dialog den Importmodus:
   - **M – Merge:** Die importierten Daten werden mit den vorhandenen Daten zusammengeführt.
   - **R – Replace:** Die bisher gespeicherten Tool-Daten werden durch die Daten aus der Datei ersetzt.
4. Bestätige den Import.

> **Achtung:** Bei **Replace** werden die vorhandenen gespeicherten Tool-Daten ersetzt. Erstelle vorher einen Export, wenn du die bisherigen Daten behalten möchtest. Bei **Merge** werden Listenwerte zusammengeführt; andere importierte Werte können vorhandene Werte ersetzen.

## 10. Weitere Schaltflächen

- **Mod-Menü ein-/ausblenden:** Steuert die Sichtbarkeit des zusätzlichen Menüs mit gespeicherten Mod-Kanälen.
- **Zurück:** Wechselt zwischen der Aktionsansicht und der Listenübersicht.
- **Externe Werkzeuge:** Die Symbolbuttons öffnen verknüpfte Moderations- und Statistikwerkzeuge in einem neuen Tab.

## 11. Wenn etwas nicht funktioniert

- **Das Tool lässt sich nicht öffnen:** Prüfe, ob dein Userscript-Manager aktiviert ist und ob du dich in einem Moderationskontext befindest.
- **Eine Liste lädt nicht:** Prüfe deine Internetverbindung und lade die Liste erneut. Bei einem Fehler werden keine Namen aus der fehlgeschlagenen Anfrage übernommen.
- **Eine Sammelaktion startet nicht:** Prüfe, ob Namen in der Warteschlange stehen, ob die passende Sammelschaltfläche verwendet wird und ob der Moderationskontext noch aktiv ist.
- **Ein Listenbutton zeigt einen Fehlerstatus:** Die externe Liste konnte möglicherweise nicht geladen oder geprüft werden. Versuche es später erneut.
- **Daten fehlen nach einem Browserwechsel:** Importiere eine zuvor exportierte JSON-Datei.

Bei anhaltenden Problemen kannst du einen Fehlerbericht über die [GitHub-Issue-Seite](https://github.com/QueerModsDACH/MagicCleaningTool/issues) erstellen. Beschreibe dabei möglichst genau, welche Schritte zum Problem geführt haben.
