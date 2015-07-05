'use strict';
/**
 * Contains functions that run at app startup. Also supplies references to the
 * databases used by the app.
 */

var async = require('async');
var Datastore = require('nedb');
var AppConfig = require(__dirname + '/../config.js');
var AppError = require(AppConfig.helperPath + 'app-error.js');
var i18n = require('i18n');

var NotesApp = function() {
  var dbObjs = {};

  var dbPaths = {
    notesDb: AppConfig.database.path + AppConfig.database.notes,
    notebookDb: AppConfig.database.path + AppConfig.database.notebooks
  };

  /**
   * Called when the application starts.
   * - Checks if the databases are present, if not creates and
   * loads them into memory.
   * - Checks if the default data is present in the database.
   */
  var init = function(cbMain) {
    // Check for databases and load them as needed.
    async.each(Object.keys(dbPaths), function(dbName, callback) {
      var dbPath = dbPaths[dbName];
      if (!dbPath) {
        return callback(new Error(i18n.__('error.empty_database_path')));
      }
      var db = new Datastore({
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
        return cbMain(new AppError(err, i18n.__('error.loading_database')));
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

module.exports = NotesApp();
