var Settings = require(AppConfig.srcPath + 'settings.js');
var i18n = require('i18n');

var SettingsClient = function() {
  var dlg = null;
  var allTabs = null;
  var allTabAnchors = null;
  var defaultMsgClass = 'settings-info';

  var init = function(dlgRef) {
    dlg = dlgRef;
    var currActiveTabAnchor = dlg.querySelector('.active');
    showActiveTab(currActiveTabAnchor);

    allTabs = dlg.querySelectorAll('.settings-tab');
    allTabAnchors = dlg.querySelectorAll('.list-group-item');

    addEventHandlers();
  };

  var destroy = function() {
    removeEventHandlers();

    dlg = null;
    allTabs = null;
    allTabAnchors = null;
  };

  function addEventHandlers() {
    var btnSubmit = dlg.querySelector('#btnSettingsSave_7');
    btnSubmit.addEventListener('click', evtSaveClicked);

    for(var i = 0; i !== allTabAnchors.length; ++i) {
      allTabAnchors[i].addEventListener('click', evtTabClicked)
    }
  }

  function removeEventHandlers() {
    var btnSubmit = dlg.querySelector('#btnSettingsSave_7');
    btnSubmit.removeEventListener('click', evtSaveClicked);

    for(var i = 0; i !== allTabAnchors.length; ++i) {
      allTabAnchors[i].removeEventListener('click', evtTabClicked)
    }
  }

  /** Events!! **/
  function evtTabClicked(event) {
    hideAllTabs();
    showActiveTab(event.target);
  }

  function evtSaveClicked(event) {
    // TODO Show loading screen
    // TODO Perform validations
    var newSettings = readSettings();
    Settings.updateSettings(newSettings, function(err, requiresRestart) {
      var hadError = false;
      if(err) {
        hadError = true;
      }
      settingsAppliedInfo(hadError, requiresRestart)
    });
  }
  /** End of events!! **/

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

  function readSettings() {
    var settingsForm = dlg.querySelector('#frmSettings');
    var settingsElems = settingsForm.elements;
    var newSettings = {};
    for(var i = 0, len = settingsElems.length; i !== len; ++i) {
      var elem = settingsElems[i];
      if(elem.type === 'button' || elem.name === "") {
        continue;
      }
      var ctrlName = elem.name;
      var ctrlVal = elem.value;
      if(ctrlVal) {
        newSettings[ctrlName] = ctrlVal;
      }
    }
    return newSettings;
  }

  function settingsAppliedInfo(hadError, requiresRestart) {
    var settingInfo = document.getElementById('pSettingsInfo_7');
    var classToUse = 'show ' + defaultMsgClass;
    var msgToShow = '';
    settingInfo.className = 'hidden';
    if(hadError) {
      classToUse = ' text-danger bg-danger';
      msgToShow = i18n.__('settings.settings_error');
    } else if(requiresRestart) {
      classToUse = ' text-info bg-info';
      msgToShow = i18n.__('settings.settings_applied_restart');
    } else {
      classToUse = ' text-success bg-success';
      msgToShow = i18n.__('settings.settings_applied');
    }
    settingInfo.className = classToUse;
    settingInfo.innerHTML = msgToShow;
  }

  return {
    init : init,
    destroy : destroy
  };
}

module.exports = new SettingsClient();
