const express = require('express');
const { exec, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Default VM name (unused, but kept for compatibility)
const VM_NAME = process.env.VM_NAME || 'BumsbudeUbuntu';

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

// Load vms.json if exists
let vmList = [];
try {
	const raw = fs.readFileSync(path.join(__dirname, 'vms.json'), 'utf8');
	vmList = JSON.parse(raw);
} catch (e) {
	vmList = [];
}

// Determine VBoxManage path
function determineVbox(){
	if (process.env.VBOX_PATH) return `"${process.env.VBOX_PATH}"`;
	try {
		const out = execSync('where VBoxManage', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
		if (out) return `"${out.split(/[\r?\n]/)[0].trim()}"`;
	} catch (e) {}
	const tried = [
		'C:\\Program Files\\Oracle\\VirtualBox\\VBoxManage.exe',
		'C:\\Program Files (x86)\\Oracle\\VirtualBox\\VBoxManage.exe'
	];
	for (const p of tried) if (fs.existsSync(p)) return `"${p}"`;
	return 'VBoxManage';
}

const VBOX = determineVbox();

function writeVmList(){
	try { fs.writeFileSync(path.join(__dirname, 'vms.json'), JSON.stringify(vmList, null, 2), 'utf8'); } catch(e){/*ignore*/}
}

function q(name){ return '"' + String(name).replace(/"/g, '\\"') + '"'; }

function runCommand(cmd, res, parseFn){
	exec(cmd, { windowsHide: true, timeout: 120000 }, (error, stdout, stderr) => {
		if (error) return res.status(500).json({ success: false, error: error.message, stdout, stderr });
		try {
			if (parseFn) return res.json({ success: true, result: parseFn(stdout || ''), stdout: (stdout||'').trim() });
		} catch (e) { return res.status(500).json({ success: false, error: e.message, stdout, stderr }); }
		res.json({ success: true, stdout: (stdout||'').trim(), stderr: (stderr||'').trim() });
	});
}

// sync function used by endpoint
function syncVms(callback){
	const cmd = `${VBOX} list vms`;
	exec(cmd, { windowsHide: true, timeout: 20000 }, (error, stdout, stderr) => {
		if (error) return callback ? callback(error, null, stdout, stderr) : null;
		const lines = (stdout||'').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
		const newList = lines.map(line => {
			const m = line.match(/^"(.+)"\s+\{([0-9a-fA-F-]+)\}$/);
			if (m) return { name: m[1], id: m[2], type: 'vm', region: 'local', status: 'unknown', last: '-', description: '' };
			return null;
		}).filter(Boolean);
		vmList = newList;
		writeVmList();
		if (callback) callback(null, vmList);
	});
}

// Endpoints
app.get('/vms', (req, res) => res.json(vmList));

app.post('/sync-vms', (req, res) => {
	syncVms((err, list, stdout, stderr) => { if (err) return res.status(500).json({ success:false, error: err.message, stdout, stderr }); res.json({ success:true, count: list.length, vms: list }); });
});

app.post('/vm/start', (req, res) => {
	const target = (req.body && req.body.name) ? req.body.name : VM_NAME;
	const cmdHeadless = `${VBOX} startvm ${q(target)} --type headless`;
	exec(cmdHeadless, { windowsHide: true, timeout: 120000 }, (error, stdout, stderr) => {
		if (!error) return res.json({ success:true, method:'headless', stdout:(stdout||'').trim(), stderr:(stderr||'').trim() });
		const cmdGui = `${VBOX} startvm ${q(target)} --type gui`;
		exec(cmdGui, { windowsHide: false, timeout: 120000 }, (err2, stdout2, stderr2) => {
			if (!err2) return res.json({ success:true, method:'gui', stdout:(stdout2||'').trim(), stderr:(stderr2||'').trim() });
			return res.status(500).json({ success:false, error:`headless:${error.message}; gui:${err2.message}`, stdout:(stdout||'').trim() + '\n' + (stdout2||'').trim(), stderr:(stderr||'').trim() + '\n' + (stderr2||'').trim() });
		});
	});
});



app.post('/vm/stop', (req, res) => {
	const target = (req.body && req.body.name) ? req.body.name : VM_NAME;
	const cmd = `${VBOX} controlvm ${q(target)} acpipowerbutton`;
	runCommand(cmd, res);
});

app.get('/vm/status', (req, res) => {
	const target = req.query && req.query.name ? req.query.name : VM_NAME;
	const cmd = `${VBOX} showvminfo ${q(target)} --machinereadable`;
	exec(cmd, { windowsHide: true, timeout: 20000 }, (error, stdout, stderr) => {
		if (error) return res.status(500).json({ success:false, error: error.message, stdout, stderr });
		const out = String(stdout || '');
		const info = {};
		out.split(/\r?\n/).forEach(line => {
			const m = line.match(/^([^=]+)="?(.*)"?$/);
			if (m) {
				const k = m[1].trim();
				let v = m[2];
				if (v === undefined) v = '';
				info[k] = v;
			}
		});
		const state = info.VMState || 'unknown';
		// VRDE fields: VRDE, VRDEAddress, VRDEPort
		const vrde = {
			enabled: info.VRDE === 'on' || info.VRDE === 'true',
			address: info.VRDEAddress || null,
			port: info.VRDEPort || null
		};
		res.json({ success:true, state, info, vrde });
	});
});

const server = app.listen(PORT, '0.0.0.0', () => { console.log(`API server listening on port ${PORT}`); console.log(`Using VBoxManage: ${VBOX}`); });

server.on('error', (err) => { console.error('Server error:', err); process.exit(1); });

// initial sync
syncVms((err, list) => { if (err) console.warn('Initial VBoxManage sync failed:', err.message); else console.log(`Initial VM sync: ${list.length} VMs loaded`); });

// End Hinweise
