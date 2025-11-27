const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Name der VM genau so wie in Hyper-V
const VM_NAME = process.env.VM_NAME || "Bumsbude Ubuntu";

app.use(express.json());

// Simple CORS - öffnet die API für den Browser
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	if (req.method === 'OPTIONS') return res.sendStatus(200);
	next();
});

// Statische Dateien (z.B. index.html) aus dem gleichen Ordner bereitstellen
app.use(express.static(path.join(__dirname)));

function runPowerShell(cmd, res){
	// Build the PowerShell command. Use -NoProfile and -NonInteractive for predictability.
	const full = `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${cmd}"`;
	exec(full, { windowsHide: true, timeout: 120000 }, (error, stdout, stderr) => {
		if (error) {
			return res.status(500).json({ success: false, error: error.message, stdout, stderr });
		}
		res.json({ success: true, stdout: stdout.trim(), stderr: stderr.trim() });
	});
}

app.post('/vm/start', (req, res) => {
	const target = (req.body && req.body.name) ? req.body.name : VM_NAME;
	const cmd = `Start-VM -Name '${target}'`;
	runPowerShell(cmd, res);
});

app.post('/vm/stop', (req, res) => {
	// Stop-VM kann -Force/ -TurnOff benötigen, je nach gewünschtem Verhalten
	const target = (req.body && req.body.name) ? req.body.name : VM_NAME;
	const cmd = `Stop-VM -Name '${target}' -Force`;
	runPowerShell(cmd, res);
});

app.get('/vm/status', (req, res) => {
	// Liefert z.B. Running, Off, Paused
	const target = req.query && req.query.name ? req.query.name : VM_NAME;
	const cmd = `(Get-VM -Name '${target}').State`;
	runPowerShell(cmd, res);
});

app.listen(PORT, () => {
	console.log(`API server listening on port ${PORT}`);
	console.log(`Controlling VM name: ${VM_NAME}`);
});

// Hinweise:
// - Dieser Server muss auf Windows laufen und der Benutzer benötigt Rechte, um Hyper-V Befehle auszuführen (evtl. Administrator).
// - Öffnen Sie die Firewall/Port nur wenn nötig oder benutzen Sie einen Reverse-Proxy + HTTPS und Auth.
