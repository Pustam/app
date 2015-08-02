'use strict';

var App = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');
var globalShortcut = require('global-shortcut');
var dialog = require('dialog');
var i18n = require('i18n');

// Custom
var AppConfig = require(__dirname + '/../../config.js');
var NotesApp = require(AppConfig.srcPath + 'notes-app.js');
var Settings = require(AppConfig.srcPath + 'settings.js');

// Keep a global reference of the window object, to avoid GC and close.
var mainWindow = null;

// Keep a track of whether the settings have changed.
// Some settings need to be applied at application
// close.
var settingsToBeApplied = null;

// Let's load the settings first!
Settings.loadSettings();

// Quit when all windows are closed.
App.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    globalShortcut.unregisterAll();
    App.quit();
  }
});

App.on('ready', function() {
  var settings = Settings.getAppSettings();

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon : AppConfig.basePath + 'img/markdown-notes-ico.png',
  });

  mainWindow.setMenu(null);

  // Add the shortcut hook;
  var shortcutKey = settings.globalShortcut;
  if(shortcutKey) {
    bindGlobalShortcutKey(shortcutKey, mainWindow);
  }

  // Open the dev tools.
  if (AppConfig.isDevelopment) {
    mainWindow.openDevTools();
  }

  // and load the index.html of the app.
  mainWindow.loadUrl('file://' + AppConfig.htmlPath + 'loading.html');

  setTimeout(function() {
    NotesApp.init(function(err) {
      if (err) {
        // TODO Load error html.
        return;
      }
      mainWindow.loadUrl('file://' + AppConfig.htmlPath + 'index.html');
    });
    // TODO See if you can eventually come up with a better alternative!
  }, 500);

  mainWindow.on('closed', function() {
    // Delete the corresponding element.
    mainWindow = null;
  });
});

App.on('will-quit', function(event) {
  if(settingsToBeApplied) {
    // Settings have been updated, apply the settings
    // and close the app.
    event.preventDefault();
    Settings.updateAppSettings(settingsToBeApplied, function() {
      settingsToBeApplied = null;
      App.quit();
    });
  } else {
    settingsToBeApplied = null;
  }
});

// Start of IPC messages.
ipc.on('exit-app', function(event, arg) {
  App.quit();
});

ipc.on('update-shortcut', function(event, arg) {
  var oldKey = arg.old;
  var newKey = arg.new;
  globalShortcut.unregister('Super+Shift+' + oldKey);
  event.returnValue = bindGlobalShortcutKey(newKey, mainWindow);
});

ipc.on('settings-updated', function(event, arg) {
  settingsToBeApplied = arg.newSettings;
});

ipc.on('fatal-error', function(event, arg) {
  dialog.showErrorBox(i18n.__('app.fatal_error'), arg.message);
  settingsUpdated = false;
  App.quit();
});

// Private methods
function bindGlobalShortcutKey(shortcutKey, mainWindow) {
  var ret = globalShortcut.register('Super+Shift+' + shortcutKey, function() {
    NotesApp.evtGlobalShortcutKey(mainWindow);
  });

  if(!ret) {
    return false;
  }
  return true;
}
