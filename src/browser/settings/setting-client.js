'use strict';

var _i18n = require('i18n');
var _remote = require('remote');
var _dialog = _remote.require('dialog');

var _appConfig = require(__dirname + '/../../../config.js');
var _settings = require(_appConfig.commonsPath + 'settings.js');
var _settingEvents = require(__dirname + '/setting-events.js');
var _appUtil = require(_appConfig.commonsPath + 'utility.js');

var SettingsClient = function() {
  var dlg = null;
  var allTabs = null;
  var allTabAnchors = null;
  var defaultMsgClass = 'alert';

  var init = function(dlgRef) {
    _settingEvents.init({
      showActiveTab : showActiveTab,
      hideAllTabs : hideAllTabs,      
      settingsAppliedInfo : settingsAppliedInfo,
      dialogOpened : settingsDialogOpened,
      destroy : destroy
    });
  };

  function settingsDialogOpened(dlgRef, settingsTabs, tagAnchors) {
    dlg = dlgRef;
    var currActiveTabAnchor = dlg.querySelector('.active');
    showActiveTab(currActiveTabAnchor);

    allTabs = settingsTabs;
    allTabAnchors = tagAnchors;
  }

  function destroy() {
    dlg = null;
    allTabs = null;
    allTabAnchors = null;
  }

  function showActiveTab(currActiveTabAnchor) {
    currActiveTabAnchor.className += " active";
    var tabToShow = currActiveTabAnchor.dataset.show;
    if(tabToShow) {
      var eTabToShow = dlg.querySelector('#' + tabToShow);
      eTabToShow.style.display = 'block';
    }
  }

  function hideAllTabs() {
    for(var i = 0; i !== allTabs.length; ++i) {
      allTabs[i].style.display = 'none';
    }

    for(i = 0; i !== allTabAnchors.length; ++i) {
      allTabAnchors[i].className = 'list-group-item';
    }
  }

  function settingsAppliedInfo(hadError, requiresRestart) {
    var settingInfo = document.getElementById('pSettingsInfo_7');
    var classToUse = 'show ' + defaultMsgClass;
    var msgToShow = '';
    settingInfo.className = 'hidden';
    if(hadError) {
      classToUse += ' alert-danger';
      msgToShow = _i18n.__('settings.settings_error');
    } else if(requiresRestart) {
      classToUse += ' alert-info';
      msgToShow = _i18n.__('settings.settings_applied_restart');
    } else {
      classToUse += ' alert-success';
      msgToShow = _i18n.__('settings.settings_applied');
    }
    settingInfo.className = classToUse;
    settingInfo.innerHTML = msgToShow;
  }

  return {
    init : init
  };
};

module.exports = new SettingsClient();
