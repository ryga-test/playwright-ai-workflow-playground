// Open URLs in the system default browser without shell-script helpers.

import { spawn, spawnSync } from 'node:child_process';

function commandExists(command) {
  const result = spawnSync('sh', ['-lc', `command -v ${command} >/dev/null 2>&1`]);
  return result.status === 0;
}

function spawnDetached(command, args) {
  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

function getDefaultBrowser() {
  return spawnSync('xdg-settings', ['get', 'default-web-browser'], {
    encoding: 'utf8',
  }).stdout?.trim();
}

function linuxBrowserCommand(url) {
  const defaultBrowser = getDefaultBrowser();
  return defaultBrowser && commandExists('gtk-launch')
    ? ['gtk-launch', [defaultBrowser, url]]
    : ['xdg-open', [url]];
}

export function openDefaultBrowser(url) {
  const platformCommand = {
    darwin: ['open', [url]],
    win32: ['cmd', ['/c', 'start', '', url]],
  }[process.platform];
  const [command, args] = platformCommand ?? linuxBrowserCommand(url);
  spawnDetached(command, args);
}
