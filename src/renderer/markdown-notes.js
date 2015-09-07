'use strict';

var _app = require('app');
var _ipc = require('ipc');
var _globalShortcut = require('global-shortcut');
var _dialog = require('dialog');
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
    _app.on('ready', appReady);

    // Called on all windows closed
    _app.on('window-all-closed', appWindowClosed);

    // Called on application quit
    _app.on('will-quit', appWillQuit);
  }


  function appWillQuit(event) {
    if (settingsToBeApplied) {
      // Settings have been updated, apply the settings
      // and close the app.
      event.preventDefault();
      _settings.updateAppSettings(settingsToBeApplied, function() {
        settingsToBeApplied = null;
        _app.quit();
      });
    } else {
      _globalShortcut.unregisterAll();
    }
  }

  function appReady() {
    _mainWindow.init();
  }

  function appWindowClosed() {
    if (process.platform !== 'darwin') {
      _app.quit();
    }
  }

  function attachIPCEvents() {
    // Start of IPC messages.
    _ipc.on('exit-app', function(event) {
      _app.quit();
    });

    _ipc.on('update-shortcut', function(event, arg) {
      var oldKey = arg.old;
      var newKey = arg.new;
      _globalShortcut.unregister('Super+Shift+' + oldKey);
      event.returnValue = _mainWindow.bindShortcutKey(newKey);
    });

    _ipc.on('settings-updated', function(event, arg) {
      settingsToBeApplied = arg.newSettings;
    });

    _ipc.on('fatal-error', function(event, arg) {
      _dialog.showErrorBox(_i18n.__('app.fatal_error'), arg.message);
      settingsToBeApplied = null;
      _app.quit();
    });
  }

  return {
    init: init
  };
};

// Create an object and initialize the application.
var objMarkdownNotes = new MarkdownNotes();
objMarkdownNotes.init();
