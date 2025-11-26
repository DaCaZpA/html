let x=100;
let y=8;
let multiplikation = x * y;

let os = require('os');

const { exec } = require("child_process");

const command = `"C:\\Program Files (x86)\\VBox\\VBoxManage.exe" list vms`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Fehler: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Fehlerausgabe: ${stderr}`);
    return;
  }
  console.log(`Ausgabe:\n${stdout}`);
});



console.log("Freie Speicher: " + os.freemem());
console.log('Hallo Welt ' + multiplikation);