'use strict';

/*************************************************
 * Contains code to communicate with the Notebooks
 * database and the business logic as well.
 * @author : Abijeet Patro
 *************************************************/

var _async = require('async');
var _i18n = require('i18n');

var _appConfig = require(__dirname + '/../../../config.js');
var _app = require(_appConfig.browserSrcPath + 'app/app.js');
var _notes = require(_appConfig.browserSrcPath + 'notes/note.js');
var _appError = require(_appConfig.commonsPath + 'app-error.js');

var Notebooks = function() {
  /**
   * Fetches all the notebooks.
   */
  var getAll = function(cbMain) {
    var notebooksDb = _app.getNotebooksDb();
    notebooksDb.find({}, function(err, notebooks) {
      if (err) {
        return cbMain(new _appError(err, _i18n.__('errors.retrieving_notebooks')));
      }
      return cbMain(null, notebooks);
    });
  };

  /**
   * Fetches full details about a notebook, including the active notes in the
   * notebook by calling getAllActiveNotes in Notes model
   * @param  {String} notebookID The ID of the notebook.
   * @param  {function} cbMain   Callback function
   * @return {undefined}         None
   */
  var getFullDetailByID = function(notebookID, cbMain) {
    var notebooksDb = _app.getNotebooksDb();

    _async.parallel([function(cb) {
        // Fetch all details about notebook.
        notebooksDb.findOne({
          _id: notebookID
        }, function(err, notebook) {
          if (err) {
            return cb(err);
          } else if (notebook === null) {
            return cb(new Error(_i18n.__('errors.notebook_not_found', notebookID)));
          }
          cb(null, notebook);
        });
      },
      function(cb) {
        // Now fetch all the ACTIVE notes in a notebook.
        _notes.getAllActiveNotes(notebookID, cb);
      }
    ], function(err, results) {
      if (err) {
        return cbMain(new _appError(err, _i18n.__('errors.retrieving_notebook')));
      }
      // Create a property under the notebook object,
      // and assign all notes and return object.
      results[0].notes = results[1];
      return cbMain(null, results[0]);
    });
  };

  /**
   * Checks if the default data is present. The default data at this moment
   * consists of the "Daily" notebook
   */
  var initializeDefaults = function(cbMain) {
    var notebookDb = _app.getNotebooksDb();
    // Checking if the default notebook exists
    notebookDb.find({
      $and: [{
        'name': _appConfig.defaultNotebook.name
      }, {
        'type': _appConfig.defaultNotebook.type
      }]
    }, function(err, docs) {
      if (err) {
        return cbMain(new _appError(err, _i18n.__('errors.checking_default_notebook')));
      }
      if (docs.length === 0) {
        // It doesn't so let's create the notebook.
        var notebook = _appConfig.defaultNotebook;
        notebook.createdOn = new Date();
        notebook.modifiedOn = notebook.createdOn;
        notebookDb.insert(notebook, function(err) {
          if (err) {
            return cbMain(new _appError(err, _i18n.__('errors.creating_default_notebook')));
          }
          return cbMain(null);
        });
      } else {
        // The default notebook is present, move on...
        return cbMain(null);
      }
    });
  };

  return {
    getAllNotebooks: getAll,
    getFullDetailByID: getFullDetailByID,
    initializeDefaults: initializeDefaults
  };
};

module.exports = new Notebooks();
