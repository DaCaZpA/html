# Martins Cloud Computing Base (Landing Page)

Kurze Anleitung zum lokalen Entwickeln und zur Verwendung der API, die VirtualBox-VMs steuert.

Wichtig
- Die Datei `vms.json` wird lokal erzeugt und ist im Repository ignoriert (`.gitignore`).
- Wenn du die VM-Inventarliste teilen möchtest, verwende stattdessen `vms.example.json` als Vorlage.

Voraussetzungen
- Node.js (aktuelle LTS) installiert
- VirtualBox installiert und `VBoxManage` im PATH oder die Umgebungsvariable `VBOX_PATH` gesetzt

Install & Start
1. Abhängigkeiten installieren (falls `package.json` Abhängigkeiten enthält):
```powershell
npm install
```
2. API starten:
```powershell
# Beispiel: VBOX_PATH setzen, falls VBoxManage nicht im PATH ist
$env:VBOX_PATH = 'C:\\Program Files\\Oracle\\VirtualBox\\VBoxManage.exe'
node Api.js
```

Wichtige Endpunkte
- `GET /vms` — Liefert die aktuell geladene VM-Liste (aus `vms.json`)
- `POST /sync-vms` — Führt `VBoxManage list vms` aus und aktualisiert die lokale `vms.json`
- `POST /vm/start` — Starte eine VM (Request JSON: `{ "name": "VM-Name" }`)
- `POST /vm/stop` — Stoppe eine VM (Request JSON: `{ "name": "VM-Name" }`)
- `GET /vm/status?name=<VM-Name>` — Liefert `showvminfo --machinereadable` geparst zurück

Database (Postgres via Docker)
- Start/Stop: `docker-compose.db.yml` enthält einen Postgres- und einen Adminer-Service. Verwende `.
start-db.ps1 -Action up` bzw. `-Action down`, oder starte per API:
	- `POST /db/start` — startet das Docker-Stack (geschützt per Basic Auth, falls `ADMIN_USER`/`ADMIN_PASS` gesetzt)
	- `POST /db/stop` — stoppt das Docker-Stack (geschützt)
- Status: `GET /db/status` — prüft, ob die DB erreichbar ist
- Init: `POST /db/init` — legt Tabelle `entries` an (geschützt)
- CRUD Einträge:
	- `GET /db/entries`
	- `POST /db/entries` (JSON `{ title, body }`, geschützt)
	- `DELETE /db/entries/:id` (geschützt)

Security
- Du kannst `ADMIN_USER` und `ADMIN_PASS` als Umgebungsvariablen setzen (z. B. mit `setx`) damit die sensiblen Endpunkte Basic-Auth erfordern. Falls nicht gesetzt, erlaubt die API die Aktionen aus Entwicklungsgründen.

Beispiele
- Start DB via PowerShell helper:
```powershell
.\start-db.ps1 -Action up
```
- Start DB via API (wenn API läuft):
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/db/start -Headers @{ Authorization = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('admin:secret')) }
```

Hinweise zur Sicherheit
- Die API ist aktuell ungeschützt und erlaubt CORS von überall (`*`). Nicht direkt ins öffentliches Netz stellen ohne Auth/Firewall.

Weiteres
- Wenn du eine In‑Browser-Grafik-Konsole möchtest (z. B. Guacamole / noVNC), kann ich dafür ein `docker-compose.yml` und eine Anleitung ergänzen.

Kontakt
- Repo: `https://github.com/DaCaZpA/html` (Branch `Landing-Page`)
