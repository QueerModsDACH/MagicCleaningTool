# QueerModsDACH MagicCleaningTool

-----

## Hinweise zur Benutzung

**WICHTIG**: Es darf nur einen Twitch Tab im Browser-Fenster geben, sobald ein weiteren Tab dazukommt, versucht das MagicCleaningTool dort zu bannen.

‼ Das Tool arbeitet mit eurem Chatfenster. Klickt ihre da rein oder schreibet etwas, dann bringt ihr das Tool aus dem tritt. Das Tool ist nicht dafür gedacht, während der normladen Nutzung mit Tonnen von User betankt zu werden. Möchte man das machen ist die Empfehlung: _**eigenes Browserfenster in dem nur der Kanal offen ist in dem gebannt werden soll und sonst nichts.**_

‼: _**Nicht mehrere Kanäle gleichzeitig bannen!**_ Hintergrund: **Shadowban-Gefahr**, da zu viele Anfragen in zu kurzer Zeit bei Twitch aufschlagen. Das mag Twitch nicht!

⁉ Bei einigen kommt es je nach Einstellungen mit Erweiterungen wie Frankers/BetterTTV/7TVAPP/Darkreader zu Problem.
Hier ggf. für das Bannen diese Erweiterungen deaktivieren, wenn man Probleme hat.

### Die Sache mit "Merken wo welcher User gebannt wurde
Das Tool verwendet dazu den LocalStorage des Browsers.

Das bedeutet: 
- man benutzt mehrere Browser? 
  - Der Speicher ist pro Browser. __Browser übergreifend funktioniert das also nicht!__
- Im LocalStorage gespeichert Listen löschen
  - Entwicklungs-Konsole des Browser öffnen (F12)
  - den Tab `Web-Speicher` (Application/Anwendung) suchen
  - Dort `LocalStorage` auswählen
  - darin `https://www.twitch.tv` auswählen
  - dann nach `_bannlist` filtern [`KANALNAME_banlist`]
  - oder nach `_unbannlist` filtern [`KANALNAME_unbanlist`]
  - die gefunden Einträge mit Rechts-Klick löschen

***Werden Cookies und das LocalStorage gelöscht, müssen alle Listen noch einmal gebannt werden!***

### Das Tool läuft eine Weile, dann kommt ein Fehler auf der Website von Twitch
Dann ist vermutlich für euer Setup die Geschwindigkeit zu hoch für die MassenBann/MassenUnbann funktionen.
Das könnt ihr an diesen beiden Stellen anpassen:
**HINWEIS:** Es ist dringend davon abzuraten den Wert runter zu setzen -> Twitch Shadow-Ban Gefahr!!!

```
// Zentrale Delay-Werte in Millisekunden
      const DELAY_BAN_ACTION = 130; // HINWEIS: Es ist dringend davon abzuraten den Wert runter (<125) zu setzen -> Twitch Shadow-Ban Gefahr!!! (evtl. in kleinen Schritten bis 200 gehen)
      const DELAY_UNBAN_ACTION = 130; // HINWEIS: Es ist dringend davon abzuraten den Wert runter (<125) zu setzen -> Twitch Shadow-Ban Gefahr!!! (evtl. in kleinen Schritten bis 200 gehen)
      const DELAY_PAUSE_CHECK = 1000;
```

-----

# Mod-Menü
Das Mod Menü ist ein Schwert Icon oben links, wenn man einen Twitch Kanal besucht erscheint in der linken oberen Ecke, rechts vom Twitch Logo. In der der Mod-View wird das bestehende Schwert nach dem Laden etwas kleiner und ist nun anklickbar.
Hierbei handelt es um ein kleines Menü, in dem man die Kanäle hinterlegen kann in welchen man Mod ist.
Klickt man auf einen Namen, so wird die Mod-View des Kanals in einem neuen Tab geöffnet.

![](pix/Mod-Menu1.png)


## Einen Kanal als Mod Kanal hinzufügen
Schreibe alle Kanäle in das Feld in das man Namen schreiben kann.
Hinweis: Die Kanäle werden in der Reihenfolge angelegt wie man sie in die Liste schreibt.

![](pix/Mod-Menu2.png)


Dann auf "+ Hinzufügen" klicken und die User werden dann in eine Liste geladen, wie man das von den Bannlisten kennt.
Dort hat man nun die Möglichkeit unten ALLE auf einmal zu Mod Kanälen als Mod-Kanäle festzulegen, oder eben jeden einzeln.
![](pix/Mod-Menu3.png)

Mit dem nächsten Neuladen der Webseite, wird der Kanal dann hinzugefügt:

![](pix/Mod-Menu4.png)

## Einen kanal als Mod Kanal entfernen
Das funktioniert analog zuum Hinzufügen.

-----


# Support
Du kannst gerne [hier](https://github.com/QueerModsDACH/MagicCleaningTool/issues) ein Ticket aufmachen.
