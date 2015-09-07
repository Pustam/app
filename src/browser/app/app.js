'use strict';

var _async = require('async');
var _i18n = require('i18n');
var _nedb = require('nedb');

var _appConfig = require(__dirname + '/../../../config.js');
var _appError = require(_appConfig.commonsPath + 'app-error.js');
var _settings = require(_appConfig.commonsPath + 'settings.js');

var App = function() {
  var dbObjs = {};

  /**
   * Called when the application starts.
   * - Checks if the databases are present, if not creates and
   * loads them into memory.
   * - Checks if the default data is present in the database.
   */
  var init = function(cbMain) {
    // Generate the db storage locations based on settings.
    var settings = _settings.getAppSettings();
    var dbBasePath = settings.dbLocation;

    if (!dbBasePath) {
      dbBasePath = _appConfig.database.path;
    }

    var dbPaths = {
      notesDb: dbBasePath + _appConfig.database.notes,
      notebookDb: dbBasePath + _appConfig.database.notebooks
    };

    // Check for databases and load them as needed.
    _async.each(Object.keys(dbPaths), function(dbName, callback) {
      var dbPath = dbPaths[dbName];
      if (!dbPath) {
        return callback(new Error(_i18n.__('error.empty_database_path')));
      }
      var db = new _nedb({
        filename: dbPath
      });

      db.loadDatabase(function(err) {
        if (err) {
          return callback(err);
        }
        if (db.filename.toLowerCase() === dbPaths.notesDb.toLowerCase()) {
          dbObjs.noteDb = db;
        } else if (db.filename.toLowerCase() === dbPaths.notebookDb.toLowerCase()) {
          dbObjs.notebookDb = db;
        }
        callback();
      });
    }, function(err) {
      if (err) {
        // Error while loading the databases.
        return cbMain(new _appError(err, _i18n.__('error.loading_database')));
      }
      return cbMain(null);
    });
  };

  /**
   * Returns a reference to the notes database.
   */
  var getNotesDb = function() {
    return dbObjs.noteDb;
  };

  /**
   * Returns a reference to the notebook database.
   */
  var getNotebooksDb = function() {
    return dbObjs.notebookDb;
  };

  return {
    init: init,
    getNotebooksDb: getNotebooksDb,
    getNotesDb: getNotesDb
  };
};

module.exports = new App();
