/*************************************************
 * Contains code to communicate with the Notes
 * database.
 * @author : Abijeet Patro
 *************************************************/

'use strict';

var _appConfig = require(__dirname + '/../../../config.js');
var _app = require(_appConfig.browserSrcPath + 'app/app.js');
var _appError = require(_appConfig.commonsPath + 'app-error.js');
var _i18n = require('i18n');

var Notes = function() {
  /**
   * Fetches the notes present in the given notebook.
   * @param  {String} notebookID Notebook ID
   * @param  {function} cbMain   Callback method that is sent an errror object
   * or the list of notes SORTED by createdOn
   * @return {undefined}         No return type.
   */
  function getAllNotesByID(notebookID, cbMain) {
    var notesDb = _app.getNotesDb();
    notesDb.find({
      notebookID: notebookID
    }).sort({
      createdOn: 1
    }).exec(function(err, notes) {
      if (err) {
        return cbMain(new _appError(err, _i18n.__('error.notes_fetch_error')));
      }
      return cbMain(null, notes);
    });
  }

  /**
   * Updates or Inserts the details of a note in the database
   * @param  {Object}  noteObj   The note to be updated
   * @param  {Boolean} isNewNote Determies if it's a new note.
   * @param  {function}  cbMain  Callback function. Is sent the error object if
   * there was an error, else is sent the updated / inserted note object.
   * @return {undefined}         No return type.
   */
  function _modifyNote(noteObj, isNewNote, cbMain) {
    if (!_validateNote(noteObj, isNewNote)) {
      return cbMain(new _appError(new Error('Invalid note object'),
        _i18n.__('error.notes_save_validation_err')));
    }
    var noteElem = noteObj.noteElem;
    var isBlur = noteObj.isBlur;
    var noteID = noteObj._id;
    noteObj = _populateValues(noteObj, true);

    var notesDb = _app.getNotesDb();

    // Delete _id, just in case so nedb can create its own.
    delete noteObj._id;

    /**
     * Callback method called after a note has been inserted or updated.
     * This adds the original element back to the note object and calls the
     * original callback method sent as parameter to `modifyNote`
     * @param  {error} err     Error object returned if there was an error,
     * else returns null.
     * @param  {Object} noteObj Updated / Inserted note object
     * @return {undefined}         No return type.
     */
    function cbNoteModified(err, noteObj, c) {
      noteObj.noteElem = noteElem;
      noteObj.isBlur = isBlur;
      if (err) {
        cbMain(new _appError(err, _i18n.__('error.notes_modification_err')), noteObj);
      } else {
        cbMain(null, noteObj);
      }
      noteObj = null;
      cbMain = null;
      return;
    }

    if (isNewNote) {
      // Insert
      notesDb.insert(noteObj, cbNoteModified);
    } else {
      // Update
      notesDb.update({
        _id: noteID
      }, noteObj, function(err, numReplaced) {
        if (numReplaced <= 0) {
          err = new _appError(err, _i18n.__('error.notes_update_err'));
        }
        return cbNoteModified(err, noteObj);
      });
    }
  }

  /**
   * Fetches note details by the ID
   * @param  {String} noteID ID of the note
   * @param  {function} cbMain Callback that is sent the note object that
   * contains the details of the note, if there was an error is returned the
   * error object.
   * @return {undefined}        No return type.
   */
  function getNoteByID(noteID, cbMain) {
    var notesDb = _app.getNotesDb();
    if (!noteID) {
      // TODO Add proper error.
      return cbMain(new _appError());
    }
    notesDb.findOne({
      _id: noteID
    }, function(err, noteObj) {
      if (err) {
        return cbMain(new _appError(err, _i18n.__('error.note_fetch_error')));
      }
      return cbMain(null, noteObj);
    });
  }

  /**
   * Delete's a note with the given ID
   * @param  {String} noteID   Note ID
   * @param  {function} cbMain Callback function. Error is passed as an argument
   * if deletion failed, else error is passed as null
   * @return {undefined}    No return type.
   */
  function deleteNote(noteID, cbMain) {
    if (!noteID) {
      var err = new _appError(new ReferenceError('Note ID is a mandatory value'), _i18n.__('error.note_delete_validation_err'));
      return cbMain(err);
    }
    var notesDb = _app.getNotesDb();
    notesDb.remove({
      _id: noteID
    }, {}, function(err, numRemoved) {
      if (err) {
        return cbMain(new _appError(err), _i18n.__('error.note_delete_err'));
      }
      if (numRemoved <= 0) {
        return cbMain(new _appError(), _i18n.__('error.note_delete_not_found'));
      }
      cbMain(null);
    });
  }


  /**
   * Fetches all the active notes in a notebook. Active notes are notes that are
   * created on today OR created on in the past but NOT completed.
   * @param  {String} notebookID Notebook ID
   * @param  {function} cbMain     Callback function
   * @return {undefined}
   * No return type.
   */
  function getAllActiveNotes(notebookID, cbMain) {
    var notesDb = _app.getNotesDb();
    var dtNow = new Date().getTime();
    var dtNowString = new Date().toDateString();
    notesDb.find({
      $where: function() {
        // Check if belongs to current notebook.
        if (this.notebookID !== notebookID) {
          return false;
        }

        // Check if date is current date
        if (this.targetDate.toDateString() === dtNowString) {
          return true;
        }

        // Check if date is less than current date, and note
        // is not complete.
        if (this.targetDate.getTime() < dtNow && this.isComplete === false) {
          return true;
        }

        return false;
      }
    }).sort({
      createdOn: -1
    }).exec(function(err, notes) {
      if (err) {
        return cbMain(new _appError(err, _i18n.__('error.notes_fetch_error')));
      }
      return cbMain(null, notes);
    });
  }

  /**
   * Fetches all the completed notes for a given day.
   * @param  {String} notebookID Notebook ID
   * @param  {Date} date         The requested date
   * @param  {function} cbMain   Callback function
   * @return {undefined}         No return type.
   */
  function getCompletedNotesForDate(notebookID, date, cbMain) {
    var notesDb = _app.getNotesDb();
    var dtSelectedString = date.toDateString();
    notesDb.find({
      $where: function() {
        // Check if belongs to current notebook.
        if (this.notebookID !== notebookID) {
          return false;
        }

        // Check if date is current date and its completed.
        if (this.targetDate.toDateString() === dtSelectedString && this.isComplete === true) {
          return true;
        }

        return false;
      }
    }).sort({
      createdOn: -1
    }).exec(function(err, notes) {
      if (err) {
        return cbMain(new _appError(err, _i18n.__('error.notes_fetch_error')));
      }
      return cbMain(null, notes);
    });
  }


  function getFutureNotesByDate(notebookID, futureDate, cbMain) {
    var notesDb = _app.getNotesDb();
    var dtFutureDate = new Date(futureDate.setHours(0, 0, 0, 0));
    notesDb.find({
      targetDate: dtFutureDate
    }).sort({
      createdOn: -1
    }).exec(function(err, notes) {
      if (err) {
        return cbMain(new _appError(err, _i18n.__('error.notes_fetch_error')));
      }
      return cbMain(null, notes);
    });
  }

  /**
   * Private function used to validate a note object. If it's NOT a new note
   * ensures that the _id parameter has been provided.
   * @param  {Object}  noteObj   Note object
   * @param  {Boolean} isNewNote Is this a new note?
   * @return {Boolean}           true if it's a valid note object, else false.
   */
  function _validateNote(noteObj, isNewNote) {
    if (!noteObj) {
      return false;
    }
    if (!isNewNote) {
      // It's an old note. Reason for this crazy NOT usage is that _populateValues uses
      // isNewNote, and hence using it here too, to maintain uniformity.
      // Validate that the _id key is present.
      if (!noteObj._id) {
        return false;
      }
    }
    if (!noteObj.notebookID) {
      return false;
    }
    return true;
  }

  /**
   * Private function to populate values into the note object before its saved
   * or updated. Adds the createdOn property if it's a new note.
   * @param  {Object}  noteObj   Note Object
   * @param  {Boolean} isNewNote Is this a new note?
   * @return {Object}            Modified note object
   */
  function _populateValues(noteObj, isNewNote) {
    delete noteObj.noteElem;
    delete noteObj.isBlur;
    if (isNewNote) {
      noteObj.createdOn = new Date();
    }
    noteObj.modifiedOn = new Date();
    return noteObj;
  }

  return {
    getNoteByID: getNoteByID,
    modifyNote: _modifyNote,
    deleteNote: deleteNote,
    getAllActiveNotes: getAllActiveNotes,
    getCompletedNotesForDate: getCompletedNotesForDate,
    getFutureNotesByDate: getFutureNotesByDate
  };
};

module.exports = new Notes();
