/*****************************************************************
 * Acts like a controller and contains code to handle notes in the
 * application. It calls and coordinates the activities of other
 * note-related modules such as the notes, note editor and events.
 *
 * @author : Abijeet Patro
 ****************************************************************/

'use strict';
var _i18n = require('i18n');
var _marked = require('marked');

var _appConfig = require(__dirname + '/../../../config.js');
var _notes = require(_appConfig.browserSrcPath + 'notes/note.js');
var _noteEvents = require(_appConfig.browserSrcPath + 'notes/note-events.js');
var _noteEditor = require(_appConfig.browserSrcPath + 'notes/note-editor.js');
var _appError = require(_appConfig.commonsPath + 'app-error.js');
var _appUtil = require(_appConfig.commonsPath + 'utility.js');

var NoteClient = function() {
  var currentlyFocusedNote = null;

  function _init() {
    // Initialize note events with callback events.
    _noteEvents.init({
      saveNote: saveNote,
      markNoteAsComplete: markNoteAsComplete,
      saveAndCreateNote: saveAndCreateNote,
      deleteNote: deleteNote,
      makeNoteEditable: makeNoteEditable,
      displayNoteDateDlg: displayNoteDateDlg,
      modifyNoteDate: modifyNoteDate
    });
  }

  /**
   * Used to generate the note elements inside a notebook. Whenever the user
   * clicks on a notebook to be displayed this function will be called to
   * generate the notes. It also adds events to the notes generated.
   * @param  {Array} notes              The notes present inside the notebook
   * @param  {String} notebookDbID      The ID of the notebook
   * @param  {Object} notebookContainer The notebook container HTML element
   * @return {undefined}                No return type.
   */
  var buildNotes = function(notes, notebookDbID, notebookContainer, isEditable) {
    if (!notebookContainer) {
      notebookContainer =
        document.getElementById(_appConfig.getNotebookContentID(notebookDbID));
    }

    if (isEditable === undefined) {
      isEditable = true;
    }

    var notebooksContainer = notebookContainer.querySelector('.notes-container');
    if (!notebooksContainer) {
      throw new Error(_i18n.__('error.notebook_container_not_found'));
    }
    if (notes.length === 0) {
      return;
    }
    for (var i = 0, len = notes.length; i !== len; ++i) {
      appendNoteElement(notebookDbID, notes[i], notebooksContainer, isEditable);
    }
  };

  /**
   * Adds a new note element and calls addNoteEvents to add the events
   * to the new note element.
   * @param  {String} notebookDbID      ID of the notebook to which the note is
   * being added
   * @param  {Object} notebookContainer HTML element containing the notes.
   * @return {undefined}                No return type.
   */
  var addNewNote = function(notebookDbID, notebookContainer) {
    if (!notebookDbID) {
      throw new ReferenceError('Notebook ID not provided!');
    }
    if (!notebookContainer) {
      var notebookID = _appConfig.getNotebookContentID(notebookDbID);
      notebookContainer = document.getElementById(notebookID);
    }

    var notesContainer = notebookContainer.querySelector('.notes-container');

    // Create the note
    var currNote = appendNoteElement(notebookDbID, null, notesContainer);

    makeNoteEditable(currNote);
  };

  var removeNotesFromNotebook = function(notebookDbID) {
    if (!notebookDbID) {
      throw new ReferenceError('Notebook ID not provided!');
    }
    var notebookID = _appConfig.getNotebookContentID(notebookDbID);
    var notebookContainer = document.getElementById(notebookID);
    _noteEvents.removeAllEvents(notebookContainer);
    var notesContainer = notebookContainer.querySelector('.notes-container');
    while (notesContainer.firstChild) {
      notesContainer.removeChild(notesContainer.firstChild);
    }
  };

  /**
   * Saves and creates a note. This is called when the user presses
   * Shift + Enter. Calls `saveNote` and the calls `addNewNote`
   * @param  {Object} note The note object
   * @return {undefined}
   */
  function saveAndCreateNote(note) {
    var notebookID = note.dataset.notebookid;
    try {
      if (_noteEditor.isEditable(note)) {
        saveNote(note, true);
      }
      addNewNote(notebookID);
    } catch (e) {
      var errObj = new _appError(e, _i18n.__('error.save_and_create_note'));
      errObj.display();
    }
  }

  /**
   * Calls the method to update or create a note, based on the note element.
   * @param  {Object}  note   HTML note element that needs to be saved.
   * @param  {Boolean} isBlur Is this triggered as part of blur event.
   * @return {undefined}      No return type.
   */
  function saveNote(note, isBlur, isNoteComplete) {
    var noteText = note.innerText;
    if (noteText) {
      try {
        var noteID = note.dataset.noteid;
        var notebookID = note.dataset.notebookid;
        var noteObj = createNoteObjFromElement(note, isBlur, isNoteComplete);
        if (noteID && notebookID) {
          // Update
          _notes.modifyNote(noteObj, false, cbModifiedNote);
        } else if (notebookID) {
          // Insert
          _notes.modifyNote(noteObj, true, function(err, noteObj) {
            if (noteObj) {
              noteObj.noteElem.dataset.noteid = noteObj._id;
            }
            cbModifiedNote(err, noteObj);
          });
        } else {
          throw new Error(_i18n.__('error.savenote_invalid_call'));
        }
        if(isBlur) {
          // If its' a blur event, save the note and remove the editable property
          // In addition also remove the unnecessary blur event.
          _noteEditor.turnOffEditing(note);
          _noteEvents.addNonEditableEvents(note);
        }
      } catch (e) {
        var errObj = new _appError(e, _i18n.__('error.notes_modification_err'));
        errObj.display();
      }
    }
    note = null;
  }

  /**
   * Calls the method to delete a note, based on the note element.
   * @param  {Object} note HTML note element
   * @return {undefined}      No return type.
   */
  function deleteNote(note) {
    try {
      var respConfirm = window.confirm(_i18n.__('note.deletion_confirmation_text'),
        _i18n.__('note.deletion_confirmation_title'));
      if (!respConfirm) {
        return;
      }
      var noteID = note.dataset.noteid;
      if (noteID) {
        _notes.deleteNote(noteID, function(err) {
          if (err) {
            var errObj = new _appError(err, _i18n.__('error.notes_deletion_err'));
            errObj.display();
            return;
          }
          // Remove the events
          _noteEvents.removeAllEvents(note);

          // Remove the note from DOM.
          _noteEditor.removeNote(note);
        });
      } else {
        // Remove the note from DOM.
        _noteEditor.removeNote(note);
      }
    } catch (e) {
      var appErrObj = new _appError(e, _i18n.__('error.notes_deletion_err'));
      appErrObj.display();
    }
  }

  /**
   * Adds the necessary class depending on whether the note is complete or
   * incomplete. It then calls the `saveNote` method to save the note.
   * @param  {Object} note HTML note element
   * @return {undefined}      No return type.
   */
  function markNoteAsComplete(note) {
    var isComplete = _noteEditor.isComplete(note);
    if (!_noteEditor.markAsComplete(note)) {
      return;
    }
    // Save the note, it will update the note or create it.
    // This will also mark it as complete or mark it as uncomplete.
    saveNote(note, false, isComplete);
  }

  function makeNoteEditable(note) {
    if (_noteEditor.isEditable(note)) {
      return;
    }
    _noteEvents.addEditableEvents(note);
    currentlyFocusedNote = note;
    // Completed notes are not editable.
    if (_noteEditor.isComplete(currentlyFocusedNote)) {
      return;
    }
    if (!currentlyFocusedNote.dataset.noteid) {
      // Note has not been saved before, no need to fetch the data.
      _noteEditor.turnOnEditing(currentlyFocusedNote);
      return;
    }
    // Fetch the content of the note.
    _notes.getNoteByID(currentlyFocusedNote.dataset.noteid,
      function(err, noteObj) {
        if (currentlyFocusedNote.dataset.noteid === noteObj._id) {
          // the note is still selected.
          currentlyFocusedNote.innerHTML = "";
          currentlyFocusedNote.innerText = noteObj.text;
          _noteEditor.turnOnEditing(currentlyFocusedNote);
        }
      });
  }

  /**
   * Creates a note object from the given note element.
   * This note object can then be stored in the database.
   * @param  {object}  note   Note HTML Element
   * @param  {Boolean} isBlur Whether this function was called on blur of note
   * element.
   * @return {object}         Note object to be stored in the database
   */
  function createNoteObjFromElement(note, isBlur, isNoteComplete) {
    var noteObj = {
      text: note.innerText,
      notebookID: note.dataset.notebookid,
      noteElem: note,
      isBlur: isBlur
    };

    if (note.dataset.noteid) {
      noteObj._id = note.dataset.noteid;
    }

    if (_noteEditor.isComplete(note)) {
      noteObj.isComplete = true;
    } else {
      noteObj.isComplete = false;
    }

    if (isNoteComplete === true) {
      noteObj.completedOn = new Date();
    } else {
      noteObj.completedOn = null;
    }

    var notebookElemID = _appConfig.getNotebookContentID(note.dataset.notebookid);
    var notebookDate = jQuery('#' + notebookElemID).find('.notebook-date').datepicker('getDate');

    // We need to store this to filter future date!
    noteObj.targetDate = notebookDate;

    return noteObj;
  }

  /**
   * Creates and appends a note element to the notebook container and
   * calls `addNoteEvents`.
   * defaults.
   * @param  {String} notebookDbID       Notebook ID
   * @param  {[type]} note               The note object from the database
   * @param  {Object} notebooksContainer HTML notes container element
   * @return {Object} HTML note element that was added.
   */
  function appendNoteElement(notebookDbID, note, notebooksContainer, isEditable) {
    // Create the note
    var noteContainer = document.createElement('div');
    noteContainer.setAttribute('class', 'note-container');

    if (isEditable === undefined) {
      isEditable = true;
    }

    // Create the inner elements.
    noteContainer.innerHTML = _noteEditor.getNoteHTML(notebookDbID, note, isEditable);

    // Add it to the notes container
    notebooksContainer.appendChild(noteContainer);

    // Return the newly added note
    var currNote = noteContainer.querySelector('.note');

    // Keyup event - Perform action according to the
    // key's pressed.
    if (isEditable) {
      _noteEvents.addEvents(currNote);
    }

    return currNote;
  }

  // START of CALLBACKS
  /**
   * Callback triggered after a note is saved in the database.
   * @param  {AppError} err   App Error object or null if no error
   * @param  {Object} noteObj The note object that is inserted or modified.
   * @return {undefined}      No return type.
   */
  function cbModifiedNote(err, noteObj) {
    if (err) {
      var errObj = new _appError(err, _i18n.__('error.notes_modification_err'));
      errObj.display();
      return;
    }
    checkIfBlur(noteObj);
    noteObj = null;
  }
  // END of CALLBACKS

  /**
   * Triggered after a note is saved in the database, checks if it was a blur
   * event, if so converts the text inside the note to HTML using **marked**.
   * @param  {Object} noteObj The note object that is inserted or modified
   * @return {undefined}      No return type.
   */
  function checkIfBlur(noteObj) {
    if (noteObj.isBlur && noteObj.noteElem) {
      var noteHtml = _marked(noteObj.text);
      noteObj.noteElem.innerHTML = noteHtml;
      _noteEditor.turnOffEditing(noteObj.noteElem);
    }
  }

  function displayNoteDateDlg(note) {
    // Show the dialog box to handle the note update.
    _appUtil.loadDialog('change-note-date.html', {
      note: note
    }, function(err, html) {
      if (!_appUtil.checkAndInsertDialog(err, html, _i18n.__('error.note_dlg_change_open'))) {
        return;
      }
      var $dlg = jQuery('#dlgMoveNote_88');
      // Set the value in the hidden field
      var noteID = note.dataset.noteid;
      if (!noteID) {
        // TODO User tried to move an unsaved note.
        return;
      }
      $dlg.find('#hdnNoteID_88').val(noteID);

      _noteEvents.evtNoteDateChangeOpen($dlg[0]);
      $dlg.on('shown.bs.modal', function() {
        this.querySelector('#txtTargetDate_88').focus();
      });

      $dlg.modal('show');
      _appUtil.addCloseEvent($dlg, function() {
        _noteEvents.evtNoteDateChangeClose($dlg[0]);
        $dlg = null;
      });
    });
  }

  function modifyNoteDate(noteID, newDate, $dlg) {
    _notes.changeDate(noteID, newDate, function(err) {
      if (err) {
        var errObj = new _appError(err, _i18n.__('error.notes_modification_err'));
        errObj.display();
      } else {
        var note = _noteEditor.getNoteByID(noteID);
        if (!note) {
          return;
        }
        // Remove the events
        _noteEvents.removeAllEvents(note);
        $dlg.modal('hide');
        // Remove the note from DOM.
        _noteEditor.removeNote(note);

        // TODO If all notes are gone, need to show empty notebook message.
      }
    });
  }

  return {
    buildNotes: buildNotes,
    addNewNote: addNewNote,
    removeNotesFromNotebook: removeNotesFromNotebook,
    init: _init
  };
};

module.exports = new NoteClient();
