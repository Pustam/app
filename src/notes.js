/*************************************************
 * Contains code to communicate with the Notes
 * database and the business logic as well.
 * @author : Abijeet Patro
 *************************************************/
/*global AppConfig */

'use strict';

var AppConfig = require(__dirname + '/../config.js');
var NotesApp = require(AppConfig.srcPath + 'notes-app.js');
var AppError = require(AppConfig.helperPath + 'app-error.js');
var i18n = require('i18n');

var Notes = function() {
  /**
   * Fetches the notes present in the given notebook.
   * @param  {String} notebookID Notebook ID
   * @param  {function} cbMain   Callback method that is sent an errror object
   * or the list of notes SORTED by createdOn
   * @return {undefined}         No return type.
   */
  var getAllNotesByID = function(notebookID, cbMain) {
    var notesDb = NotesApp.getNotesDb();
    notesDb.find({
      notebookID: notebookID
    }).sort({
      createdOn: 1
    }).exec(function(err, notes) {
      if (err) {
        return cbMain(new AppError(err, i18n.__('error.notes_fetch_error')));
      }
      return cbMain(null, notes);
    });
  };

  /**
   * Updates or Inserts the details of a note in the database
   * @param  {Object}  noteObj   The note to be updated
   * @param  {Boolean} isNewNote Determies if it's a new note.
   * @param  {function}  cbMain  Callback function. Is sent the error object if
   * there was an error, else is sent the updated / inserted note object.
   * @return {undefined}         No return type.
   */
  var modifyNote = function(noteObj, isNewNote, cbMain) {
    if (!validateNote(noteObj, isNewNote)) {
      return cbMain(new AppError(new Error('Invalid note object'),
        i18n.__('error.notes_save_validation_err')));
    }
    var noteElem = noteObj.noteElem;
    var isBlur = noteObj.isBlur;
    var noteID = noteObj._id;

    noteObj = populateValues(noteObj, true);

    var notesDb = NotesApp.getNotesDb();

    // Delete _id, just in case so nedb can create its own.
    delete noteObj._id;

    if (isNewNote) {
      // Insert
      notesDb.insert(noteObj, cbNoteModified);
    } else {
      // Update
      notesDb.update({
        _id: noteID
      }, noteObj, function(err, numReplaced) {
        if (numReplaced <= 0) {
          err = new AppError(err, i18n.__('error.notes_update_err'));
        }
        return cbNoteModified(err, noteObj);
      });
    }

    /**
     * Callback method called after a note has been inserted or updated.
     * This adds the original element back to the note object and calls the
     * original callback method sent as parameter to `modifyNote`
     * @param  {error} err     Error object returned if there was an error,
     * else returns null.
     * @param  {Object} noteObj Updated / Inserted note object
     * @return {undefined}         No return type.
     */
    function cbNoteModified(err, noteObj) {
      noteObj.noteElem = noteElem;
      noteObj.isBlur = isBlur;
      if (err) {
        cbMain(new AppError(err, i18n.__('error.notes_modification_err')), noteObj);
        noteObj = null, cbMain = null;
        return;
      }

      cbMain(null, noteObj);
      noteObj = null, cbMain = null;
      return;
    }
  };

  /**
   * Fetches note details by the ID
   * @param  {String} noteID ID of the note
   * @param  {function} cbMain Callback that is sent the note object that
   * contains the details of the note, if there was an error is returned the
   * error object.
   * @return {undefined}        No return type.
   */
  var getNoteByID = function(noteID, cbMain) {
    var notesDb = NotesApp.getNotesDb();
    if (!noteID) {
      // TODO Add proper error.
      return cbMain(new AppError());
    }
    notesDb.findOne({
      _id: noteID
    }, function(err, noteObj) {
      if (err) {
        return cbMain(new AppError(err, i18n.__('error.note_fetch_error')));
      }
      return cbMain(null, noteObj);
    });
  };

  /**
   * Delete's a note with the given ID
   * @param  {String} noteID   Note ID
   * @param  {function} cbMain Callback function. Error is passed as an argument
   * if deletion failed, else error is passed as null
   * @return {undefined}    No return type.
   */
  var deleteNote = function(noteID, cbMain) {
    if (!noteID) {
      var err = new AppError(new ReferenceError('Note ID is a mandatory value'), i18n.__('error.note_delete_validation_err'));
      return cbMain(err);
    }
    var notesDb = NotesApp.getNotesDb();
    notesDb.remove({
      _id: noteID
    }, {}, function(err, numRemoved) {
      if (err) {
        return cbMain(new AppError(err), i18n.__('error.note_delete_err'));
      }
      if (numRemoved <= 0) {
        return cbMain(new AppError(), i18n.__('error.note_delete_not_found'));
      }
      cbMain(null);
    });
  };


  /**
   * Fetches all the active notes in a notebook. Active notes are notes that are
   * created on today OR created on in the past but NOT completed.
   * @param  {String} notebookID Notebook ID
   * @param  {function} cbMain     Callback function
   * @return {undefined}           No return type.
   */
  var getAllActiveNotes = function(notebookID, cbMain) {
    var notesDb = NotesApp.getNotesDb();
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
        return cbMain(new AppError(err, i18n.__('error.notes_fetch_error')));
      }
      return cbMain(null, notes);
    });
  };

  /**
   * Fetches all the completed notes for a given day.
   * @param  {String} notebookID Notebook ID
   * @param  {Date} date         The requested date
   * @param  {function} cbMain   Callback function
   * @return {undefined}         No return type.
   */
  var getCompletedNotesForDate = function(notebookID, date, cbMain) {
    var notesDb = NotesApp.getNotesDb();
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
        return cbMain(new AppError(err, i18n.__('error.notes_fetch_error')));
      }
      return cbMain(null, notes);
    });
  };

  var getFutureNotesByDate = function(notebookID, futureDate, cbMain) {
    var notesDb = NotesApp.getNotesDb();
    var dtFutureDate = new Date(futureDate.setHours(0, 0, 0, 0));
    notesDb.find({
      targetDate: dtFutureDate
    }).sort({
      createdOn: -1
    }).exec(function(err, notes) {
      if (err) {
        return cbMain(new AppError(err, i18n.__('error.notes_fetch_error')));
      }
      return cbMain(null, notes);
    });
  };

  /**
   * Private function used to validate a note object. If it's NOT a new note
   * ensures that the _id parameter has been provided.
   * @param  {Object}  noteObj   Note object
   * @param  {Boolean} isNewNote Is this a new note?
   * @return {Boolean}           true if it's a valid note object, else false.
   */
  function validateNote(noteObj, isNewNote) {
    // TODO : More validations are pending.
    if (!noteObj) {
      return false;
    }
    if (!isNewNote) {
      // It's an old note. Reason for this crazy NOT usage is that populateValues uses
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
  function populateValues(noteObj, isNewNote) {
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
    modifyNote: modifyNote,
    deleteNote: deleteNote,
    getAllActiveNotes: getAllActiveNotes,
    getCompletedNotesForDate: getCompletedNotesForDate,
    getFutureNotesByDate: getFutureNotesByDate
  };
};

module.exports = Notes();
