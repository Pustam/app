'use strict';

var _browserWindow = require('browser-window');
var _globalShortcut = require('global-shortcut');
var _i18n = require('i18n');

// Custom
var _appConfig = require(__dirname + '/../../config.js');
var _settings = require(_appConfig.commonsPath + 'settings.js');

var MainWindow = function() {
  var mainWindow = null;

  function init() {
    var settings = _settings.getAppSettings();

    // Create the browser window.
    mainWindow = new _browserWindow({
      width: 800,
      height: 600,
      icon: _appConfig.basePath + 'img/markdown-notes-ico.png',
    });

    // Open the dev tools.
    if (_appConfig.isDevelopment) {
      mainWindow.openDevTools();
    }

    mainWindow.setMenu(null);

    // Add the shortcut hook;
    var shortcutKey = settings.globalShortcut;
    if (shortcutKey) {
      bindShortcutKey(shortcutKey);
    }

    // and load the index.html of the app.
    mainWindow.loadUrl('file://' + _appConfig.htmlPath + 'index.html');

    mainWindow.on('closed', function() {
      // Delete the corresponding element.
      mainWindow = null;
    });
  }

  function bindShortcutKey(shortcutKey) {
    var ret = _globalShortcut.register('Super+Shift+' + shortcutKey, function() {
      if (mainWindow.isFocused()) {
        mainWindow.hide();
      } else {
        // TODO : highlight first note.
        mainWindow.show();
      }
    });

    if (!ret) {
      return false;
    }
    return true;
  }

  return {
    init: init,
    bindShortcutKey: bindShortcutKey
  };
};

module.exports = new MainWindow();
