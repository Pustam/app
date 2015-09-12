'use strict';

var _remote = require('remote');
var _dialog = _remote.require('dialog');
var _i18n = require('i18n');

var _appConfig = require(__dirname + '/../../../config.js');
var _appUtil = require(_appConfig.commonsPath + 'utility.js');
var _settings = require(_appConfig.commonsPath + 'settings.js');

var SettingEvents = function() {
  var settingsRef;
  var dlg = null;
  var allTabs = null;
  var allTabAnchors = null;

  function init(refObj) {
    settingsRef = refObj;

    // Add the settings dialog hook.
    document.getElementById('1_btnSettings').addEventListener('click', showSettingsDialog, false);
  }

  function showSettingsDialog() {
    var settings = _settings.getAppSettings();
    _appUtil.loadDialog('settings.html', { settings : settings }, function(err, html) {
      if(!_appUtil.checkAndInsertDialog(err, html, _i18n.__('error.settings_dialog_display'))) {
        return;
      }
      var $dlg = jQuery('#dlgSettings');
      if($dlg) {
        dlg = $dlg[0];
        allTabs = dlg.querySelectorAll('.settings-tab');
        allTabAnchors = dlg.querySelectorAll('.list-group-item');

        addEventHandlers();
        settingsRef.dialogOpened(dlg, allTabs, allTabAnchors);
        $dlg.modal('show');

        _appUtil.addCloseEvent($dlg, function() {
          removeEventHandlers();
          settingsRef.destroy();
        });
      }
    });
  }

  function addEventHandlers() {
    var btnSubmit = dlg.querySelector('#btnSettingsSave_7');
    btnSubmit.addEventListener('click', evtSaveClicked);

    for(var i = 0; i !== allTabAnchors.length; ++i) {
      allTabAnchors[i].addEventListener('click', evtTabClicked);
    }

    var btnChooseDialog = dlg.querySelector('#btnChooseDbLocation_7');
    btnChooseDialog.addEventListener('click', evtChooseFolder);
  }

  function removeEventHandlers() {
    var btnSubmit = dlg.querySelector('#btnSettingsSave_7');
    btnSubmit.removeEventListener('click', evtSaveClicked);

    for(var i = 0; i !== allTabAnchors.length; ++i) {
      allTabAnchors[i].removeEventListener('click', evtTabClicked);
    }

    dlg.querySelector('#btnChooseDbLocation_7').removeEventListener('click', evtChooseFolder);

    dlg = null;
    allTabAnchors = null;
    allTabs = null;
  }

  function evtTabClicked(event) {
    settingsRef.hideAllTabs();
    settingsRef.showActiveTab(event.target);
  }

  function evtSaveClicked() {
    // TODO Show loading screen
    // TODO Perform validations
    var newSettings = settingsRef.readSettings();
    _settings.updateSettings(newSettings, function(err, requiresRestart) {
      var hadError = false;
      if(err) {
        hadError = true;
      }
      settingsRef.settingsAppliedInfo(hadError, requiresRestart);
    });
  }

  function evtChooseFolder(event) {
    var path = _dialog.showOpenDialog(null, {
      properties : ['openDirectory', 'createDirectory']
    });
    if(path !== 'undefined') {
        document.getElementById('hdnDbLocation_7').value = path;
        document.getElementById('preDbLocation_7').innerHTML = path;
    }
  }

  return {
    removeEventHandlers : removeEventHandlers,
    addEventHandlers : addEventHandlers,
    init : init
  };
};

module.exports = new SettingEvents();
