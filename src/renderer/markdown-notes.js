'use strict';

const {app, globalShortcut, dialog, ipcMain} = require('electron');
var _i18n = require('i18n');

// Custom
var _appConfig = require(__dirname + '/../../config');
var _settings = require(_appConfig.commonsPath + 'settings');
var _mainWindow = require(_appConfig.rendererPath + 'main-window');

var MarkdownNotes = function() {
  // Keep a track of whether the settings have changed.
  // Some settings need to be applied at application
  // close.
  var settingsToBeApplied = null;

  function init() {
    // Let's load the settings
    _settings.loadSettings();
    attachAppEvents();
    attachIPCEvents();
  }

  function attachAppEvents() {
    // Called when the application is ready.
    app.on('ready', appReady);

    // Called on all windows closed
    app.on('window-all-closed', appWindowClosed);

    // Called on application quit
    app.on('will-quit', appWillQuit);
  }

  function appWillQuit(event) {
    if (settingsToBeApplied) {
      // Settings have been updated, apply the settings
      // and close the app.
      event.preventDefault();
      _settings.updateAppSettings(settingsToBeApplied, function() {
        settingsToBeApplied = null;
        app.quit();
      });
    } else {
      globalShortcut.unregisterAll();
    }
  }

  function appReady() {
    _mainWindow.init();
  }

  function appWindowClosed() {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  function attachIPCEvents() {
    // Start of IPC messages.
    ipcMain.on('exit-app', function(event) {
      app.quit();
    });

    ipcMain.on('update-shortcut', function(event, arg) {
      var oldKey = arg.old;
      var newKey = arg.new;
      globalShortcut.unregister('Super+Shift+' + oldKey);
      event.returnValue = _mainWindow.bindShortcutKey(newKey);
    });

    ipcMain.on('settings-updated', function(event, arg) {
      settingsToBeApplied = arg.newSettings;
    });

    ipcMain.on('fatal-error', function(event, arg) {
      dialog.showErrorBox(_i18n.__('app.fatal_error'), arg.message);
      settingsToBeApplied = null;
      app.quit();
    });
  }

  return {
    init: init
  };
};

// Create an object and initialize the application.
var objMarkdownNotes = new MarkdownNotes();
objMarkdownNotes.init();
