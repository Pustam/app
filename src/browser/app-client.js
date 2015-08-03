'use strict';

var AppConfig = require(__dirname + '/../../config.js');
var AppUtil = require(AppConfig.helperPath + 'utility.js');
var AppError = require(AppConfig.helperPath + 'app-error.js');
var SettingsClient = require(AppConfig.browserSrcPath + 'settings-client.js');
var Settings = require(AppConfig.srcPath + 'settings.js');

var i18n = require('i18n');
var ipc = require('ipc');
var shell = require('shell');

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
      if(!checkAndInsertDialogHTML(err, html, i18n.__('error.shortcut_dialog_display'))) {
        return;
      }
      var $dlg = jQuery('#dlgShortcutHelp');
      $dlg.modal('show');
      addCloseEvent($dlg);
    });
  }

  function showSettingsDialog() {
    var settings = Settings.getAppSettings();
    AppUtil.loadDialog('settings.html', { settings : settings }, function(err, html) {
      if(!checkAndInsertDialogHTML(err, html, i18n.__('error.settings_dialog_display'))) {
        return;
      }
      var $dlg = jQuery('#dlgSettings');
      if($dlg) {
        SettingsClient.init($dlg[0]);
        $dlg.modal('show');
        addCloseEvent($dlg, SettingsClient.destroy);
      }
    });
  }

  function showAboutDialog() {
    // Load the JSON file for information regarding the version
    var pjJson = require(AppConfig.basePath + 'package.json');
    AppUtil.loadDialog('about.html', { package : pjJson }, function(err, html) {
      if(!checkAndInsertDialogHTML(err, html, i18n.__('error.about_dialog_display'))) {
        return;
      }
      var $dlg = jQuery('#dlgAbout');
      $dlg.modal('show');
      addAboutEvents();
      addCloseEvent($dlg, removeAboutEvents);
    });
  }

  function showIssuesList(event) {
    var href = event.target.getAttribute('href');
    event.preventDefault();
    if(href) {
      shell.openExternal(href);
    }
  }

  function removeAboutEvents() {
    document.getElementById('9_lnkAppIssues').removeEventListener('click', showIssuesList);
  }

  function addAboutEvents() {
    document.getElementById('9_lnkAppIssues').addEventListener('click', showIssuesList, false);
  }

  function exitApp() {
    ipc.send('exit-app');
  }

  function addCloseEvent($dlg, cbOnClose) {
    $dlg.on('hidden.bs.modal', function() {
      $dlg.off('hidden.bs.modal');
      if(cbOnClose) {
        cbOnClose();
      }
      $dlg = null;
      this.remove();
    });
  }

  function checkAndInsertDialogHTML(err, html, errMsg) {
    if (err) {
      var errParse = new AppError(err, errMsg, false, true);
      errParse.display();
      return false;
    }
    document.querySelector('body').insertAdjacentHTML('beforeend', html);
    return true;
  }

  return {
    init: init
  };
};

module.exports = AppClient();
