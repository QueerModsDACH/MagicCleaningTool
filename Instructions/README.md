# Magic Cleaning Tool – Zusätzliche Hinweise

Diese Seite ergänzt die [Installationsanleitung](../Installationsanleitung.md) und die [Bedienungsanleitung](../Bedienungsanleitung.md). Sie enthält zusätzliche Hinweise zur sicheren Nutzung, zur Datenspeicherung und zum Mod-Menü.

## Sicher mit Sammelaktionen arbeiten

Prüfe vor einer Sammelaktion immer den angezeigten Kanal und die geladene Liste. Vermeide es, gleichzeitig in mehreren Twitch-Tabs Sammelaktionen zu starten: So lässt sich leichter der Überblick verlieren, welche Aktionen in welchem Kanal laufen.

Das Tool führt Moderationsaktionen über das Chat-Eingabefeld von Twitch aus. Vermeide es, während einer Sammelaktion in dieses Feld zu klicken oder dort Nachrichten zu schreiben. Wenn Twitch oder das Tool unerwartet reagiert, brich die Aktion möglichst ab und prüfe den Kanal, die Warteschlange und den tatsächlichen Moderationsstatus.

Ein Abbruch macht bereits ausgeführte Bann- oder Entbannaktionen nicht rückgängig.

## Browser-Erweiterungen und Darstellungsprobleme

Andere Browser-Erweiterungen können die Darstellung oder Bedienung von Twitch beeinflussen. Wenn das Tool Probleme macht, teste Twitch gegebenenfalls in einem separaten Browserprofil oder deaktiviere Erweiterungen testweise einzeln.

Mögliche Kandidaten sind Erweiterungen, die Twitch verändern oder Seiteninhalte filtern, zum Beispiel FrankerFaceZ, BetterTTV, 7TV oder Dark Reader. Deaktiviere sie nur testweise, um herauszufinden, ob eine Erweiterung die Ursache ist.

## Gespeicherte Daten und Sicherungen

Das Tool speichert seine Daten im Browser. Es verwendet dafür vorrangig IndexedDB und kann bei einem Speicherproblem auf LocalStorage zurückgreifen.

Die Daten werden nicht automatisch zwischen verschiedenen Browsern oder Browserprofilen synchronisiert. Ein Wechsel des Browsers oder Profils übernimmt gespeicherte Listen und Bearbeitungsstände daher nicht automatisch.

Verwende **export** in der Listenübersicht, um eine Sicherungsdatei zu erstellen. Mit **import** kannst du eine solche Datei wieder einlesen. Erstelle vor einem Replace-Import eine Sicherung: Replace ersetzt die bisher gespeicherten Tool-Daten.

Wenn du Browserdaten oder Website-Daten löschst, können dadurch auch die gespeicherten Tool-Daten verloren gehen. Exportiere wichtige Daten vorher. Nach dem Löschen kann das Tool nicht mehr auf die dort gespeicherten Bearbeitungsstände zurückgreifen.

## Sammelaktionen und Verzögerungen

Das Script wartet zwischen aufeinanderfolgenden Bann- und Entbannaktionen. Die Verzögerungen sind im Code zentral festgelegt:

```javascript
const DELAY\_BAN\_ACTION = 130;
const DELAY\_UNBAN\_ACTION = 130;
```

Die Verzögerung sollte mindestens 120 ms betragen. Kürzere Intervalle können dazu führen, dass einzelne Aktionen nicht zuverlässig verarbeitet oder abgebrochen werden. Setze die Werte daher nicht unter 120 ms.
