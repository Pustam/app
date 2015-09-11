'use strict';

var _remote = require('remote');
var _dialog = _remote.require('dialog');

var _appConfig = require(__dirname + '/../../../config.js');
var _settings = require(_appConfig.commonsPath + 'settings.js');

var SettingEvents = function() {
  var dlg;
  var allTabAnchors;
  var settingsRef;

  function init(refObj) {
    dlg = refObj.dlg;
    allTabAnchors = refObj.allTabAnchors;
    settingsRef = refObj;
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
    settingsRef = null;
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
