'use strict';

var _18n = require('i18n');
var _ipc = require('ipc');
var _shell = require('shell');

var _appConfig = require(__dirname + '/../../../config.js');
var _appUtil = require(_appConfig.commonsPath + 'utility.js');
var _appError = require(_appConfig.commonsPath + 'app-error.js');
var _settings = require(_appConfig.commonsPath + 'settings.js');
var _settingsClient = require(_appConfig.browserSrcPath + 'settings/setting-client');

var AppEvents = function() {

  function init() {
    document.getElementById('1_btnShortcutHelp').addEventListener('click', showShortcutDialog, false);
    document.getElementById('1_btnAboutUs').addEventListener('click', showAboutDialog, false);
    document.getElementById('1_btnExitApp').addEventListener('click', exitApp, false);
    document.getElementById('1_btnSettings').addEventListener('click', showSettingsDialog, false);
  }

  function showShortcutDialog() {
    // TODO Fix localization in dialog html
    _appUtil.loadDialog('shortcuts-help.html', {}, function(err, html) {
      if(!checkAndInsertDialogHTML(err, html, _18n.__('error.shortcut_dialog_display'))) {
        return;
      }
      var $dlg = jQuery('#dlgShortcutHelp');
      $dlg.modal('show');
      addCloseEvent($dlg);
    });
  }

  function showAboutDialog() {
    // Load the JSON file for information regarding the version
    var pjJson = require(_appConfig.basePath + 'package.json');
    _appUtil.loadDialog('about.html', { package : pjJson }, function(err, html) {
      if(!checkAndInsertDialogHTML(err, html, _18n.__('error.about_dialog_display'))) {
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
      _shell.openExternal(href);
    }
  }

  function showSettingsDialog() {
    var settings = _settings.getAppSettings();
    _appUtil.loadDialog('settings.html', { settings : settings }, function(err, html) {
      if(!checkAndInsertDialogHTML(err, html, _18n.__('error.settings_dialog_display'))) {
        return;
      }
      var $dlg = jQuery('#dlgSettings');
      if($dlg) {
        _settingsClient.init($dlg[0]);
        $dlg.modal('show');
        addCloseEvent($dlg, _settingsClient.destroy);
      }
    });
  }
  function removeAboutEvents() {
    document.getElementById('9_lnkAppIssues').removeEventListener('click', showIssuesList);
  }

  function addAboutEvents() {
    document.getElementById('9_lnkAppIssues').addEventListener('click', showIssuesList, false);
  }

  function exitApp() {
    _ipc.send('exit-app');
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
      var errParse = new _appError(err, errMsg, false, true);
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

module.exports = new AppEvents();
