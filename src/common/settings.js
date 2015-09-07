'use strict';

var _fs = require('fs');
var _path = require('path');
var _async = require('async');
var _ipc = require('ipc');
var _i18n = require('i18n');

// Custom
var _appConfig = require(__dirname + '/../../config.js');
var _appUtil = require(_appConfig.commonsPath + 'utility.js');
var _appError = require(_appConfig.commonsPath + 'app-error.js');

var Settings = function() {
  var appSettings = null;

  var loadSettings = function() {
    try {
      var jsonStrSettings = _fs.readFileSync(_appConfig.settingsPath);
      if (jsonStrSettings && jsonStrSettings.toString().trim().length === 0) {
        // Empty settings, throw an error and let
        // the code handle it.
        var e = new Error('Empty settings!');
        e.code = 'ENOENT';
        throw e;
      }
      appSettings = JSON.parse(jsonStrSettings);
    } catch (e) {
      var err = new _appError(e, 'Error while reading the settings.');
      appSettings = getDefaultSettings();
      if (e.code === 'ENOENT') {
        // Creating the settings file
        saveAppSettings(appSettings);
      } else {
        // Invalid Settings, backup and then restore to defaults.
        handleInvalidSettings();
      }
    }
  };

  var getAppSettings = function(readFromFile) {
    if (!appSettings || readFromFile) {
      loadSettings();
    }
    return appSettings;
  };

  var saveAppSettings = function(settings, cbMain) {
    if (!settings) {
      return cbMain(new _appError(new Error('Invalid settings object passed!'),
        'Invalid settings object passed!'));
    }
    var settingsJSON = JSON.stringify(settings, null, 2);
    _fs.writeFile(_appConfig.settingsPath, settingsJSON, function(err) {
      var customErr = null;
      if (err) {
        customErr = new _appError(err, 'There was an error while storing the settings.');
      }
      appSettings = settings;
      if (cbMain) {
        return cbMain(customErr, null);
      }
    });
  };

  var updateAppSettings = function(newSettingsToApply, cbMain) {
    var oldSettings = getAppSettings(true);
    var settingsToApply = [];
    if (newSettingsToApply.dbLocation) {
      // Time to move the database.
      settingsToApply.push(function(next) {
        moveDbFiles(oldSettings.dbLocation, newSettingsToApply.dbLocation, next);
      });
    }

    _async.parallel(settingsToApply, function(err) {
      settingsToApply = null;
      if (err) {
        // TODO Do not apply any settings! Maybe show an error!
        return cbMain(err);
      }
      // Normalize and write the settings to file.
      var finalSettings = normalizeSettings(oldSettings, newSettingsToApply);
      newSettingsToApply = null;
      saveAppSettings(finalSettings, cbMain);
    });
  };

  function moveDbFiles(oldPath, newPath, cbMain) {
    var oldNotesPath = _path.normalize(oldPath + _path.sep +
      _appConfig.database.notes);
    var newNotesPath = _path.normalize(newPath + _path.sep +
      _appConfig.database.notes);

    var oldNotebookPath = _path.normalize(oldPath + _path.sep +
      _appConfig.database.notebooks);
    var newNotebookPath = _path.normalize(newPath + _path.sep +
      _appConfig.database.notebooks);

    _async.parallel([
      function(next) {
        _appUtil.mvFile(oldNotesPath, newNotesPath, next);
      },
      function(next) {
        _appUtil.mvFile(oldNotebookPath, newNotebookPath, next);
      }
    ], function(err) {
      if (err) {
        return cbMain(err);
      }
      return cbMain();
    });
  }


  /**
   * Compares the new settings with the old ones, and performs necessary updates.
   * Called when the user clicks on Save in the settings dialog. Applies whatever
   * settings that can be applied immediately and schedules the others to be
   * applied on restart.
   * @param  {object} newSettings New settings object, retrieved from the form.
   * @return {boolean}            True / False depending on success / failure.
   */
  var updateSettings = function(newSettings, cbMain) {
    var oldSettings = getAppSettings();
    var requiresRestart = false;
    var newSettingsToApply = {};
    if (newSettings.dbLocation !== oldSettings.dbLocation) {
      // Store the location of the new path and change when
      // app is about to restart.
      var newDbLocation = newSettings.dbLocation;
      newDbLocation += _path.sep;
      newDbLocation = _path.normalize(newDbLocation);
      newSettingsToApply.dbLocation = newDbLocation;
      requiresRestart = true;
    }

    if (newSettings.globalShortcut.toLowerCase() !==
      oldSettings.globalShortcut.toLowerCase()) {
      // Update the keystrokes
      var arg = {
        old: oldSettings.globalShortcut,
        new: newSettings.globalShortcut
      };
      if (!_ipc.sendSync('update-shortcut', arg)) {
        // TODO Show error message about shortcut register error.
        // Reset the value since there was an error.
        newSettings.globalShortcut = oldSettings.globalShortcut;
      }
    }

    // IMPORTANT - Delete the settings that will be applied on restart of app.
    delete newSettings.dbLocation;

    // Normalize and write the settings to file.
    var finalSettings = normalizeSettings(oldSettings, newSettings);
    saveAppSettings(finalSettings, function(err) {
      if (err) {
        return cbMain(err);
      }

      if (requiresRestart) {
        // Hook the updateAppSettings to be called on restart.
        var arg = {
          newSettings: newSettingsToApply
        };
        _ipc.send('settings-updated', arg);
      }
      newSettingsToApply = null;
      cbMain(null, requiresRestart);
    });
  };

  function normalizeSettings(oldSettings, newSettings) {
    for (var prop in newSettings) {
      if (!oldSettings.hasOwnProperty(prop)) {
        continue;
      }
      oldSettings[prop] = newSettings[prop];
    }
    return oldSettings;
  }

  /**
   * Called when the loading /parsing of the settings JSON fails, maybe
   * because of invalid JSON or permissions when reading the file.
   * Takes a backup of the existing file, and then writes the defaults to
   * the settings. If this method fails, the application will show an error,
   * and quit.
   * @return {undefined} No return type.
   */
  function handleInvalidSettings() {
    // 1. Take a backup of the existing settings file.
    _appUtil.mvFile(_appConfig.settingsPath,
      _appConfig.settingsPath + '_' + Date.now(),
      function(err) {
        if (err) {
          _ipc.sendSync('fatal-error', generateSettingsFatalError(err));
          return;
        }
        // 2. Write the defaults to settings.json
        saveAppSettings(appSettings, function(err) {
          if (err) {
            _ipc.sendSync('fatal-error', generateSettingsFatalError(err));
          }
        });
      });
  }

  /**
   * Generates a fatal APP Error. Called when handleInvalidSettings fails to
   * backup or write settings.
   * @return {AppError} An error object.
   */
  function generateSettingsFatalError(err) {
    return new _appError(err, _i18n.__('settings.settings_save_fatal') + '\n\n' +
      _i18n.__('settings.app_fatal_close') + '\n\n' + _i18n.__('settings.app_support'));
  }

  /**
   * Returns the default settings for the app, called on initial startup and
   * when the settings file is corrupted.
   * @return {Object} Default settings object
   */
  function getDefaultSettings() {
    return {
      "dbLocation": _appConfig.database.path,
      "globalShortcut": "D"
    };
  }

  return {
    saveAppSettings: saveAppSettings,
    getAppSettings: getAppSettings,
    loadSettings: loadSettings,
    updateAppSettings: updateAppSettings,
    updateSettings: updateSettings
  };
};

module.exports = new Settings();
