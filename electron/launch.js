#!/usr/bin/env node
// Launcher script that clears ELECTRON_RUN_AS_NODE before starting Electron.
// VSCode (itself an Electron app) sets ELECTRON_RUN_AS_NODE=1 in its terminal,
// which forces electron.exe to run as plain Node.js instead of Electron.

const { spawn } = require('child_process');
const path = require('path');

const electronPath = require('electron');
const projectRoot = path.join(__dirname, '..');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, [projectRoot], {
  stdio: 'inherit',
  env,
  windowsHide: false,
});

child.on('close', (code, signal) => {
  if (code === null) {
    console.error('Electron exited with signal', signal);
    process.exit(1);
  }
  process.exit(code);
});

const handleSignal = (signal) => {
  process.on(signal, () => {
    if (!child.killed) child.kill(signal);
  });
};
handleSignal('SIGINT');
handleSignal('SIGTERM');
