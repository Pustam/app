'use strict';

/*************************************************
 * Contains code to communicate with the Notebooks
 * database and the business logic as well.
 * @author : Abijeet Patro
 *************************************************/

var AppConfig = require(__dirname + '/../config.js');
var NotesApp = require(AppConfig.srcPath + 'notes-app.js');
var Notes = require(AppConfig.srcPath + 'notes.js');
var AppError = require(AppConfig.helperPath + 'app-error.js');
var async = require('async');

var Notebooks = function() {
  /**
   * Fetches all the notebooks.
   */
  var getAll = function(cbMain) {
    var notebooksDb = NotesApp.getNotebooksDb();
    notebooksDb.find({}, function(err, notebooks) {
      if (err) {
        return cbMain(new AppError(err, 'There was an error while retrieving your notebooks.'));
      }
      return cbMain(null, notebooks);
    });
  };

  /**
   * Fetches full details regarding a notebook including the
   * notes present in the notebook.
   */
  var getFullDetailByID = function(notebookID, cbMain) {
    var notebooksDb = NotesApp.getNotebooksDb();

    async.parallel([function(cb) {
      // Fetch all details about notebook.
      notebooksDb.findOne({
        _id: notebookID
      }, function(err, notebook) {
        if (err) {
          return cb(new AppError(err, 'There was an error while retrieving information about your notebook.'));
        } else if (notebook === null) {
          return cb(new AppError(err, 'Your notebook was not found.'));
        }
        cb(null, notebook);
      });
    }, function(cb) {
      // Now fetch all notes in a notebook.
      Notes.getAllNotesByID(notebookID, cb);
    }], function(err, results) {
      if (err) {
        if (err instanceof AppError) {
          return cbMain(err);
        }
        return cbMain(new AppError(err, 'There was an error while retrieving information about your notebook.'));
      }
      // Create a property under the notebook object,
      // and assign all notes and return object.
      results[0].notes = results[1];
      return cbMain(null, results[0]);
    });
  };

  return {
    getAllNotebooks: getAll,
    getFullDetailByID: getFullDetailByID
  };
};

module.exports = Notebooks();
