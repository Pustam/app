var fs = require('fs');
var AppConfig = require(__dirname + '/../config.js');
var AppUtil = require(AppConfig.helperPath + 'utility.js');
var path =  require('path');
var async = require('async');
var ipc = require('ipc');
var AppError = require(AppConfig.helperPath + 'app-error.js');
var i18n =
var appSettings = null;
var newSettingsToApply = {};

var Settings = function() {
  // TODO Test the whole flow, with all conditions.
  var loadSettings = function() {
    try {
      var jsonStrSettings = fs.readFileSync(AppConfig.settingsPath);
      if(jsonStrSettings.trim().length === 0) {
        // Empty settings, throw an error and let
        // the code handle it.
        var e = new Error('Empty settings!');
        e.code = 'ENOENT';
        throw e;
      }
      appSettings = JSON.parse(jsonStrSettings);
    } catch (e) {
      appSettings = getDefaultSettings();
      if(e.code === 'ENOENT') {
        // Creating the settings file
        saveAppSettings(appSettings);
      } else {
        // Invalid Settings, backup and then restore to defaults.
        handleInvalidSettings();
      }
    }
  };

  var getAppSettings = function() {
    if(!appSettings) {
      loadSettings();
    }
    return appSettings;
  };

  var saveAppSettings = function(settings, cbMain) {
    if(!settings) {
      return cbMain(new AppError(new Error('Invalid settings object passed!'),
        'Invalid settings object passed!'));
    }
    var settingsJSON = JSON.stringify(settings, null, 2);
    fs.writeFile(AppConfig.settingsPath, settingsJSON, function(err) {
      var customErr = null;
      if(err) {
        var customErr = new AppError(err, 'There was an error while storing the settings.'));
      }
      appSettings = settings;
      if(cbMain) {
        return cbMain(customErr, null);
      }
    });
  };

  var updateAppSettings = function(cbMain) {
    var oldSettings = getAppSettings();
    var settingsToApply = [];
    if(newSettingsToApply.dbLocation) {
      // Time to move the database.
      settingsToApply.push(function(next) {
        moveDbFiles(oldSettings.dbLocation, newSettingsToApply.dbLocation, next);
      });
    }

    async.parallel(settingsToApply, function(err) {
      if(err) {
        // TODO Do not apply any settings! Maybe show an error!
        return cbMain(err);
      }
      // Normalize and write the settings to file.
      var finalSettings = normalizeSettings(oldSettings, newSettingsToApply);
      newSettingsToApply = {};
      saveAppSettings(finalSettings, cbMain);
    });
  };

  function moveDbFiles(oldPath, newPath, cbMain) {
    var oldNotesPath = path.normalize(oldPath + path.sep +
      AppConfig.database.notes);
    var newNotesPath = path.normalize(newPath + path.sep +
      AppConfig.database.notes);

    var oldNotebookPath = path.normalize(oldPath + path.sep +
      AppConfig.database.notebooks);
    var newNotebookPath = path.normalize(newPath + path.sep +
      AppConfig.database.notebooks);

    async.parallel([
      function(next) {
        AppUtil.mvFile(oldNotesPath, newNotesPath, next);
      }, function(next) {
        AppUtil.mvFile(oldNotebookPath, newNotebookPath, next);
      }
    ], function(err) {
      if(err) {
        return cbMain(err);
      }
      return cbMain();
    })
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
    if(newSettings.dbLocation !== oldSettings.dbLocation) {
      // Store the location of the new path and change when
      // app is about to restart.
      newSettingsToApply.dbLocation = newSettings.dbLocation;
      requiresRestart = true;
    }

    if(newSettings.globalShortcut.toLowerCase() !==
      oldSettings.globalShortcut.toLowerCase()) {
      // Update the keystrokes
      var arg = {
        old : oldSettings.globalShortcut,
        new : newSettings.globalShortcut
      }
      if(!ipc.sendSync('update-shortcut', arg)) {
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
      if(err) {
        return cbMain(err);
      }

      if(requiresRestart) {
        // Hook the updateAppSettings to be called on restart.
        ipc.send('settings-updated');
      }
      cbMain(null, requiresRestart);
    });
  }

  function normalizeSettings(oldSettings, newSettings) {
    for(var prop in newSettings) {
      if(!oldSettings.hasOwnProperty(prop)) {
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
    AppUtil.mvFile(AppConfig.settingsPath,
      AppConfig.settingsPath + '_' + Date.now(), function(err) {
        if(err) {
          ipc.sendSync('fatal-error', generateSettingsFatalError());
          return;
        }
        // 2. Write the defaults to settings.json
        saveAppSettings(appSettings, function(err) {
          if(err) {
            ipc.sendSync('fatal-error', generateSettingsFatalError());
          }
        });
    });
  }

  /**
   * Generates a fatal APP Error. Called when handleInvalidSettings fails to
   * backup or write settings.
   * @return {AppError} An error object.
   */
  function generateSettingsFatalError() {
    return new AppError(err, i18n.__('settings.settings_save_fatal') + '\n\n' +
      i18n.__('settings.app_fatal_close') + '\n\n' + i18n.__('settings.app_support'));
  }

  /**
   * Returns the default settings for the app, called on initial startup and
   * when the settings file is corrupted.
   * @return {Object} Default settings object
   */
  function getDefaultSettings() {
    return {
      "dbLocation": AppConfig.database.path,
      "globalShortcut": "D"
    }
  }

  return {
    saveAppSettings : saveAppSettings,
    getAppSettings : getAppSettings,
    loadSettings : loadSettings,
    updateAppSettings : updateAppSettings,
    updateSettings : updateSettings
  }
}

module.exports = new Settings();
