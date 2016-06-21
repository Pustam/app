'use strict';

var _browserWindow = require('browser-window');
var _globalShortcut = require('global-shortcut');
var _i18n = require('i18n');

// Custom
var _appConfig = require(__dirname + '/../../config.js');
var _settings = require(_appConfig.commonsPath + 'settings.js');

var MainWindow = function() {
  var mainWindow = null;
  var isMaximized = false;

  function init() {
    var settings = _settings.getAppSettings();

    // Create the browser window.
    mainWindow = new _browserWindow({
      width: 800,
      height: 600,
      icon: _appConfig.srcPath + 'img/markdown-notes-ico.png',
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
    mainWindow.loadURL('file://' + _appConfig.htmlPath + 'index.html');

    mainWindow.on('closed', function() {
      // Delete the corresponding element.
      mainWindow = null;
    });
  }

  function bindShortcutKey(shortcutKey) {
    var ret = _globalShortcut.register('Super+Shift+' + shortcutKey, function() {
      if (mainWindow.isFocused()) {
        isMaximized = mainWindow.isMaximized();
        mainWindow.hide();
      } else {
        mainWindow.show();
        if(isMaximized) {
          mainWindow.maximize();
        }
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
