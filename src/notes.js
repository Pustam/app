/*************************************************
 * Contains code to communicate with the Notes
 * database and the business logic as well.
 * @author : Abijeet Patro
 *************************************************/

'use strict';

var AppConfig = require(__dirname + '/../config.js');
var NotesApp = require(AppConfig.srcPath + 'notes-app.js');
var AppError = require(AppConfig.helperPath + 'app-error.js');

var Notes = function() {
  var getAllNotesByID = function(notebookID, cbMain) {
    // Fetch all the notes in a given notebookID
    var notesDb = NotesApp.getNotesDb();
    notesDb.find({
      notebookID: notebookID
    }, function(err, notes) {
      if (err) {
        return cbMain(new AppError(err, 'There was an error while fetching your notes.'));
      }
      return cbMain(null, notes);
    });
  };

  var modifyNote = function(noteObj, isNewNote, cbMain) {
    if (!validateNote(noteObj, isNewNote)) {
      // TODO Validation error.
      return cbMain(new AppError());
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
          // TODO Return the error stating
          // that no rows got updated.
          err = new AppError();
        }
        return cbNoteModified(err, noteObj);
      });
    }

    function cbNoteModified(err, noteObj) {
      if (err) {
        cbMain(new AppError(err))
        noteObj = null, cbMain = null;
        return;
      }
      noteObj.noteElem = noteElem;
      noteObj.isBlur = isBlur;

      cbMain(null, noteObj);
      noteObj = null, cbMain = null;
      return;
    }
  };

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
        return cbMain(err);
      }
      return cbMain(null, noteObj);
    });
  };

  function validateNote(noteObj, isNewNote) {
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
    getAllNotesByID: getAllNotesByID,
    getNoteByID: getNoteByID,
    modifyNote: modifyNote
  };
};

module.exports = Notes();
