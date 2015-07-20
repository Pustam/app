/*global AppConfig */

'use strict';

var AppConfig = require(__dirname + '/../../config.js');
var AppUtil = require(AppConfig.helperPath + 'utility.js');
var AppError = require(AppConfig.helperPath + 'app-error.js');
var i18n = require('i18n');
var ipc = require('ipc');

var AppClient = function() {
  var init = function() {
    // Shortcuts button clicked.
    document.getElementById('1_btnShortcutHelp').addEventListener('click', showShortcutDialog, false);
    document.getElementById('1_btnSettings').addEventListener('click', showSettingsDialog, false);
    document.getElementById('1_btnAboutUs').addEventListener('click', showAboutDialog, false);
    document.getElementById('1_btnExitApp').addEventListener('click', exitApp, false);
  };

  function showShortcutDialog() {
    // TODO Fix localization in dialog html
    AppUtil.loadDialog('shortcuts-help.html', {}, function(err, html) {
      if (err) {
        var errParse = new AppError(err, i18n.__('error.shortcut_dialog_display'), false, true);
        errParse.display();
        return;
      }
      document.querySelector('body').insertAdjacentHTML('beforeend', html);
      var $dlg = jQuery('#dlgShortcutHelp');
      $dlg.modal('show');

      $dlg.on('hidden.bs.modal', function() {
        $dlg.off('hidden.bs.modal');
        $dlg = null;
        this.remove();
      });
    });
  }

  function showSettingsDialog() {
    var settingsJson = require(AppConfig.basePath + 'settings.json');
    AppUtil.loadDialog('settings.html', { settings : settingsJson }, function(err, html) {
      if (err) {
        var errParse = new AppError(err, i18n.__('error.settings_dialog_display'), false, true);
        errParse.display();
        return;
      }
      document.querySelector('body').insertAdjacentHTML('beforeend', html);
      var $dlg = jQuery('#dlgSettings');
      $dlg.modal('show');

      $dlg.on('hidden.bs.modal', function() {
        $dlg.off('hidden.bs.modal');
        $dlg = null;
        this.remove();
      });
    });
  }

  function showAboutDialog() {
    // Load the JSON file for information regarding the version
    var pjJson = require(AppConfig.basePath + 'package.json');
    AppUtil.loadDialog('about.html', { package : pjJson }, function(err, html) {
      if (err) {
        var errParse = new AppError(err, i18n.__('error.about_dialog_display'), false, true);
        errParse.display();
        return;
      }
      document.querySelector('body').insertAdjacentHTML('beforeend', html);
      var $dlg = jQuery('#dlgAbout');
      $dlg.modal('show');

      $dlg.on('hidden.bs.modal', function() {
        $dlg.off('hidden.bs.modal');
        $dlg = null;
        this.remove();
      });
    });
  }

  function exitApp() {
    ipc.send('exit-app');
  }

  return {
    init: init
  };
};

module.exports = AppClient();
