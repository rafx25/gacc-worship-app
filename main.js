// GACC Worship desktop shell.
// Wraps the offline HTML app (app/index.html) in an Electron window and adds
// the things a browser can't: automatic projector placement on the second
// screen, media autoplay with sound, and a proper installed app.
const { app, BrowserWindow, Menu, dialog, net, protocol, screen, session, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const SCHEME = 'gacc';
const ORIGIN = `${SCHEME}://app`;
const APP_URL = `${ORIGIN}/index.html`;
const APP_DIR = path.join(__dirname, 'app');
const ICON = path.join(__dirname, 'build', 'icon.png');
const PROJECTOR_SIZE = { width: 1280, height: 720 };

// A fixed custom origin keeps localStorage, IndexedDB and BroadcastChannel
// stable no matter where the app is installed.
protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

const webPreferences = {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  spellcheck: false,
  backgroundThrottling: false,
  autoplayPolicy: 'no-user-gesture-required',
};

// Windows marks a covered or minimized window as hidden, and Chromium then pauses
// video-only media "to save power" — the projector video froze whenever the
// operator window sat on top of it. The projector must never count as hidden.
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-background-media-suspend');

let mainWindow = null;
let projectorWindow = null;

function isProjectorUrl(url) {
  try {
    // Node reports the origin of custom schemes as "null", so compare parts.
    const u = new URL(url);
    return u.protocol === `${SCHEME}:` && u.host === 'app' && u.searchParams.get('present') === '1';
  } catch {
    return false;
  }
}

function alive(win) {
  return win && !win.isDestroyed();
}

function operatorDisplay() {
  return alive(mainWindow) ? screen.getDisplayMatching(mainWindow.getBounds()) : screen.getPrimaryDisplay();
}

// The first screen that isn't showing the operator window, if any.
function audienceDisplay() {
  const operator = operatorDisplay();
  return screen.getAllDisplays().find((d) => d.id !== operator.id) || null;
}

function windowedBounds(display) {
  const { x, y, width, height } = display.workArea;
  const w = Math.min(PROJECTOR_SIZE.width, width);
  const h = Math.min(PROJECTOR_SIZE.height, height);
  return { x: x + Math.round((width - w) / 2), y: y + Math.round((height - h) / 2), width: w, height: h };
}

function placeOnDisplay(win, display, fullscreen) {
  const move = () => {
    if (!alive(win)) return;
    if (fullscreen) {
      win.setBounds(display.bounds);
      win.setFullScreen(true);
    } else {
      win.setBounds(windowedBounds(display));
    }
    win.show();
  };
  if (win.isFullScreen()) {
    win.once('leave-full-screen', move);
    win.setFullScreen(false);
  } else {
    move();
  }
}

function moveProjectorToNextScreen() {
  if (!alive(projectorWindow)) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'GACC Worship',
      message: 'The projector window is not open.',
      detail: 'Click Present (or press P) to open it first.',
    });
    return;
  }
  const displays = screen.getAllDisplays();
  const current = screen.getDisplayMatching(projectorWindow.getBounds());
  const next = displays[(displays.findIndex((d) => d.id === current.id) + 1) % displays.length];
  placeOnDisplay(projectorWindow, next, displays.length > 1 && next.id !== operatorDisplay().id);
}

function setupProjector(win) {
  projectorWindow = win;
  win.removeMenu();
  win.setTitle('GACC Worship — Projector');
  // The projector has no menu bar, so handle F11 here.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });
  win.on('closed', () => {
    if (projectorWindow === win) projectorWindow = null;
  });
  const audience = audienceDisplay();
  if (audience) placeOnDisplay(win, audience, true);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'GACC Worship',
    backgroundColor: '#10141c',
    icon: ICON,
    autoHideMenuBar: true,
    webPreferences,
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isProjectorUrl(url)) {
      const audience = audienceDisplay();
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          ...windowedBounds(audience || operatorDisplay()),
          title: 'GACC Worship — Projector',
          backgroundColor: '#000000',
          icon: ICON,
          autoHideMenuBar: true,
          webPreferences,
        },
      };
    }
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('did-create-window', (win, { url }) => {
    if (isProjectorUrl(url)) setupProjector(win);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });
  mainWindow.on('close', (event) => {
    if (!alive(projectorWindow)) return;
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      buttons: ['Close', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      title: 'GACC Worship',
      message: 'Close GACC Worship?',
      detail: 'The projector screen is still open and will close too.',
    });
    if (choice === 1) event.preventDefault();
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });

  mainWindow.loadURL(APP_URL);
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'Open Data Folder', click: () => shell.openPath(app.getPath('userData')) },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Projector',
      submenu: [
        { label: 'Move Projector to Next Screen', accelerator: 'CmdOrCtrl+Shift+P', click: moveProjectorToNextScreen },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About GACC Worship',
          click: () =>
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About GACC Worship',
              message: `GACC Worship ${app.getVersion()}`,
              detail: `God's Anointing Christian Church\n\nYour library and media are stored in:\n${app.getPath('userData')}`,
            }),
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function registerAppProtocol() {
  protocol.handle(SCHEME, (request) => {
    const { pathname } = new URL(request.url);
    const file = path.normalize(path.join(APP_DIR, decodeURIComponent(pathname)));
    if (!file.startsWith(APP_DIR + path.sep)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
}

function hardenSessions() {
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((_wc, permission, callback) => callback(permission === 'fullscreen'));
  // Backups download as JSON; suggest saving them in Documents.
  ses.on('will-download', (_event, item) => {
    item.setSaveDialogOptions({ defaultPath: path.join(app.getPath('documents'), item.getFilename()) });
  });
}

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`${ORIGIN}/`)) event.preventDefault();
  });
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
});

// Keep the projector on the audience screen when cables are plugged in or out.
function watchDisplays() {
  screen.on('display-added', () => {
    setTimeout(() => {
      if (!alive(projectorWindow)) return;
      const audience = audienceDisplay();
      const onOperator = screen.getDisplayMatching(projectorWindow.getBounds()).id === operatorDisplay().id;
      if (audience && onOperator) placeOnDisplay(projectorWindow, audience, true);
    }, 750);
  });
  screen.on('display-removed', () => {
    setTimeout(() => {
      if (alive(projectorWindow) && !audienceDisplay()) placeOnDisplay(projectorWindow, operatorDisplay(), false);
    }, 750);
  });
}

// The portable .exe keeps its library in a folder beside itself so it travels
// with the USB drive. Falls back to %APPDATA% if that folder isn't writable.
function usePortableDataFolder() {
  const exeDir = process.env.PORTABLE_EXECUTABLE_DIR;
  if (!exeDir) return;
  const dataDir = path.join(exeDir, 'GACC Worship Data');
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    const probe = path.join(dataDir, '.write-test');
    fs.writeFileSync(probe, '');
    fs.rmSync(probe);
    app.setPath('userData', dataDir);
  } catch {
    // Read-only location: keep the default data folder.
  }
}

usePortableDataFolder();

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!alive(mainWindow)) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
  if (process.platform === 'win32') app.setAppUserModelId('org.gacc.worship');
  app.whenReady().then(() => {
    registerAppProtocol();
    hardenSessions();
    buildMenu();
    watchDisplays();
    createMainWindow();
  });
  app.on('window-all-closed', () => app.quit());
}
