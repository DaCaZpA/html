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

Hinweise zur Sicherheit
- Die API ist aktuell ungeschützt und erlaubt CORS von überall (`*`). Nicht direkt ins öffentliches Netz stellen ohne Auth/Firewall.

Weiteres
- Wenn du eine In‑Browser-Grafik-Konsole möchtest (z. B. Guacamole / noVNC), kann ich dafür ein `docker-compose.yml` und eine Anleitung ergänzen.

Kontakt
- Repo: `https://github.com/DaCaZpA/html` (Branch `Landing-Page`)
