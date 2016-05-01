'use strict';

var _i18n = require('i18n');
const _ipcRenderer = require('electron').ipcRenderer;
var _shell = require('shell');

var _appConfig = require(__dirname + '/../../../config.js');
var _appUtil = require(_appConfig.commonsPath + 'utility.js');
var _appError = require(_appConfig.commonsPath + 'app-error.js');

var AppEvents = function() {

  function init() {
    document.getElementById('1_btnShortcutHelp').addEventListener('click', showShortcutDialog, false);
    document.getElementById('1_btnAboutUs').addEventListener('click', showAboutDialog, false);
    document.getElementById('1_btnExitApp').addEventListener('click', exitApp, false);
  }

  function showShortcutDialog() {
    // TODO Fix localization in dialog html
    _appUtil.loadDialog('shortcuts-help.html', {}, function(err, html) {
      if (!_appUtil.checkAndInsertDialog(err, html, _i18n.__('error.shortcut_dialog_display'))) {
        return;
      }
      var $dlg = jQuery('#dlgShortcutHelp');
      $dlg.modal('show');
    });
  }

  function showAboutDialog() {
    // Load the JSON file for information regarding the version
    var pjJson = require(_appConfig.basePath + 'package.json');
    _appUtil.loadDialog('about.html', {
      package: pjJson
    }, function(err, html) {
      if (!_appUtil.checkAndInsertDialog(err, html, _i18n.__('error.about_dialog_display'))) {
        return;
      }
      var $dlg = jQuery('#dlgAbout');
      addAboutEvents();
      $dlg.modal('show');
      _appUtil.addCloseEvent($dlg, removeAboutEvents);
    });
  }

  function showIssuesList(event) {
    var href = event.target.getAttribute('href');
    event.preventDefault();
    if (href) {
      _shell.openExternal(href);
    }
  }

  function removeAboutEvents() {
    document.getElementById('9_lnkAppIssues').removeEventListener('click', showIssuesList);
  }

  function addAboutEvents() {
    document.getElementById('9_lnkAppIssues').addEventListener('click', showIssuesList, false);
  }

  function exitApp() {
    _ipcRenderer.send('exit-app');
  }

  return {
    init: init
  };

};

module.exports = new AppEvents();
