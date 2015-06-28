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
    notesDb : AppConfig.database.path + AppConfig.database.notes,
    notebookDb : AppConfig.database.path + AppConfig.database.notebooks
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
      if(!dbPath) {
        // TODO Handle empty path error!!!
        return callback(new AppError());
      }
      var db = new Datastore({
        filename: dbPath
      });

      db.loadDatabase(function(err) {
        if (err) {
          return callback(err);
        }
        if(db.filename.toLowerCase() === dbPaths.notesDb.toLowerCase()) {
          dbObjs.noteDb = db;
        } else if(db.filename.toLowerCase() === dbPaths.notebookDb.toLowerCase()) {
          dbObjs.notebookDb = db;
        }
        callback();
      });
    }, function(err) {
      if (err) {
        // Error while loading the databases.
        cbMain(new AppError(err, 'Error while creating/loading the database.', true));
      } else {
        checkIfDefaultDataPresent(cbMain);
      }
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

  /**
   * Checks if the default data is present. The default data at this moment
   * consists of the "Daily" notebook
   */
  function checkIfDefaultDataPresent(cbMain) {
    var notebookDb = getNotebooksDb();
    // Checking if the default notebook exists
    notebookDb.find({
      $and: [{
        'name': AppConfig.defaultNotebook.name
      }, {
        'type': AppConfig.defaultNotebook.type
      }]
    }, function(err, docs) {
      if (err) {
        return cbMain(new AppError(err, 'There was an error while checking if the new notebook exists.'));
      }
      if (docs.length === 0) {
        // It doesn't so let's create the notebook.
        // TODO Needs to be moved to notebook.js
        var notebook = AppConfig.defaultNotebook;
        notebook.createdOn = new Date();
        notebook.modifiedOn = notebook.createdOn;
        notebookDb.insert(notebook, function(err, data) {
          if (err) {
            return cbMain(new AppError(err, 'There was an error while creating the default notebook.'));
          }
          return cbMain(null);
        });
      } else {
        // The default notebook is present, move on...
        return cbMain(null);
      }
    });
  }

  return {
    init: init,
    getNotebooksDb: getNotebooksDb,
    getNotesDb: getNotesDb
  };
};

module.exports = NotesApp();
