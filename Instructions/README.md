# QueerModsDACH MagicCleaningTool

-----

## Hinweise zur Benutzung

**WICHTIG**: Es darf nur einen Twitch Tab im Browser-Fenster geben, sobald ein weiteren Tab dazukommt, versucht der Bannhammer dort zu bannen.

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
  - den Tab Web-Speicher (Application/Anwendung) suchen
  - Dort LocalStorage auswählen
  - darin "<span>https://www.twitch.tv</span>" auswählen
  - dann nach "_bannlist" filtern [KANALNAME_banlist]
  - oder nach "_unbannlist" filtern [KANALNAME_unbanlist]
  - die gefunden Einträge mit Rechts-Klick löschen

***Werden Coockies und das LocalStorage gelöscht, müssen alle Listen noch einmal gebannt werden!***

### Das Tool läuft eine Weile, dann kommt ein Fehler auf der Website von Twitch
Dann ist vermutlich für euer Setup die Geschwindigkeit zu hoch für die MassenBann/MassenUnbann funktionen.
Das könnt ihr an diesen beiden Stellen anpassen:
**HINWEIS:** Es ist dringend davon abzuraten den Wert runter zu setzen -> Twitch Shadow-Ban Gefahr!!!
