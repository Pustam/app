var Notes = require(AppConfig.srcPath + 'notes.js');
var i18n = require('i18n');
var marked = require('marked');

'use strict'

var NotesClient = function() {

  var currentlyFocusedNote = null;
  var focusTimeout = null;

  var init = function() {

  };

  /**
   * Used to generate the note elements inside a notebook. Whenever the user
   * clicks on a notebook to be displayed this function will be called to
   * generate the notes. It also adds events to the notes generated.
   * @param  {Array} notes              The notes present inside the notebook
   * @param  {String} notebookDbID      The ID of the notebook
   * @param  {Object} notebookContainer The notebook container HTML element
   * @return {undefined}                No return type.
   */
  var buildNotesHtml = function(notes, notebookDbID, notebookContainer) {
    var notebooksContainer = notebookContainer.querySelector('.notes-container');
    if(!notesContainer) {
      // TODO Something bad happened!!
    }
    for (var i = 0, len = notes.length; i !== len; ++i) {
      appendNoteElement(notebookDbID, notes[i].text, notes[i]._id, notebooksContainer);
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
  var addNewNoteHtml = function(notebookDbID, notebookContainer) {
    if(!notebookDbID) {
      throw new ReferenceError('Notebook ID not provided!');
    }
    if(!notebookContainer) {
      var notebookID = AppConfig.getNotebookContentID(notebookDbID);
      notebookContainer = document.getElementById(notebookID);
    }

    var notesContainer = notebookContainer.querySelector('.notes-container');

    // Create the note
    var currNote = appendNoteElement(notebookDbID, null, null, notesContainer);

    currNote.focus();
  };

  /**
   * Cleanup function, removes all the events from the all notes inside a
   * given notebook. Calls `removeNoteEvents`.
   * @param  {Object} notebookContainer Notebook container HTML element
   * @return {undefined}                No return type
   */
  var removeAllNoteEvents = function(notebookContainer) {
    var allNotes = notebookContainer.querySelectorAll('.note');
    for (var i = 0; i !== allNotes.length; ++i) {
      removeNoteEvents(allNotes[i]);
    }
    allNotes = null;
  };

  /**
   * Used to add events to the note element that has been created.
   * @param {Object} note HTML note element
   */
  function addNoteEvents(note) {
    // Focus - Nothing for now
    note.addEventListener('focus', evtNoteFocus, false);

    // Blur - Save
    note.addEventListener('blur', evtNoteBlur, false);

    // Keyup event - Perform action according to the
    // key's pressed.
    note.addEventListener('keypress', evtNoteKeyPress, false);
  }

  /**
   * Removes events from an individual note.
   * @param  {Object} note HTML note element
   * @return {undefined}   No return type.
   */
  function removeNoteEvents(note) {
    note.removeEventListener('focus', evtNoteFocus);
    note.removeEventListener('blur', evtNoteBlur);
    note.removeEventListener('keypress', evtNoteKeyPress);
    note = null;
  }

  /**
   * Fired whenever a note is focused. When this happens, the function waits
   * for a few milliseconds and then calls functions that fetch the details
   * regarding the note and put it in the note element.
   * @param  {Object} event Event object
   * @return {undefined}    No return type.
   */
  function evtNoteFocus(event) {
    currentlyFocusedNote = event.target;
    if (focusTimeout) {
      clearTimeout(focusTimeout);
    }
    if(!currentlyFocusedNote.dataset.noteid) {
      return;
    }
    focusTimeout = setTimeout(function() {
      if (currentlyFocusedNote && currentlyFocusedNote.dataset.noteid) {
        // Fetch the content of the note.
        Notes.getNoteByID(currentlyFocusedNote.dataset.noteid,
          function(err, noteObj) {
            if (currentlyFocusedNote.dataset.noteid === noteObj._id) {
              // the note is still selected.
              currentlyFocusedNote.innerHTML = "";
              currentlyFocusedNote.innerText = noteObj.text;
            }
          });
      }
      focusTimeout = null;
    }, 300);
  }

  /**
   * Fired whenever focus is lost on a note. Then calls `saveNote`
   * @param  {Object} event Event object
   * @return {undefined}    No return type.
   */
  function evtNoteBlur(event) {
    saveNote(event.target, true);
  }

  /**
   * Fires whenever a key is pressed in the note event. Checks if Shift + Enter
   * has been pressed, if so calls the `saveAndCreateNote`,
   * if Ctrl + S has been pressed, if so calls `saveNote`
   * @param  {Object} event Event object
   * @return {undefined}    No return type.
   */
  function evtNoteKeyPress(event) {
    if (event.which === 19 && event.ctrlKey === true) {
      // Need to save...
      saveNote(event.target, false);
      event.preventDefault();
    } else if (event.which === 13 && event.shiftKey === true) {
      // Need to save and create a new note.
      saveAndCreateNote(event.target);
      event.preventDefault();
    }
  }

  /**
   * Saves and creates a note. This is called when the user presses
   * Shift + Enter. Calls `saveNote` and the calls `addNewNoteHtml`
   * @param  {Object} note The note object
   * @return {undefined}   
   */
  function saveAndCreateNote(note) {
    var notebookID = note.dataset.notebookid;
    saveNote(note, true);
    addNewNoteHtml(notebookID);
  }

  function saveNote(note, isBlur) {
    var noteText = note.innerText;
    if (noteText) {
      var noteID = note.dataset.noteid;
      var notebookID = note.dataset.notebookid;
      var noteObj = createNoteObjFromElement(note, isBlur);
      if (noteID && notebookID) {
        // Update
        Notes.modifyNote(noteObj, false, cbModifiedNote);
      } else if (notebookID) {
        // Insert
        Notes.modifyNote(noteObj, true, function(err, noteObj) {
          if(noteObj) {
            noteObj.noteElem.dataset.noteid = noteObj._id;
          }
          cbModifiedNote(err, noteObj);
        });
      } else {
        // TODO : Error!! No notebookID AND noteID
        return;
      }
    }
    note = null;
  }

  /**
   * Creates a note object from the given note element.
   * This note object can then be stored in the database.
   * @param  {object}  note   Note HTML Element
   * @param  {Boolean} isBlur Whether this function was called on blur of note
   * element.
   * @return {object}         Note object to be stored in the database
   */
  function createNoteObjFromElement(note, isBlur) {
    var noteObj = {
      text: note.innerText,
      notebookID: note.dataset.notebookid,
      noteElem: note,
      isBlur: isBlur
    };

    if (note.dataset.noteid) {
      noteObj._id = note.dataset.noteid;
    }
    return noteObj;
  }

  /**
   * Creates and appends a note element to the notebook container and
   * calls `addNoteEvents`.
   * @param  {String} notebookDbID   Notebook ID
   * @param  {String} noteText       Note text
   * @param  {String} noteID         Note ID
   * @param  {Object} notesContainer HTML notes container element
   * @return {[type]}                HTML note element
   */
  function appendNoteElement(notebookDbID, noteText, noteID, notebooksContainer) {
    // Create the note
    var noteContainer = document.createElement('div');
    noteContainer.setAttribute('class', 'note-container');

    // Create the inner elements.
    noteContainer.innerHTML = getNoteHTML(notebookDbID, noteText, noteID);

    // Add events.
    var currNote = noteContainer.querySelector('.note');
    addNoteEvents(currNote);

    // Add it to the notes container
    notebooksContainer.appendChild(noteContainer);

    return currNote;
  }

  /**
   * Returns the HTML for a new note
   * @param  {String} notebookDbID Notebook ID
   * @param  {String} noteText     Note text
   * @param  {String} noteID       Note ID
   * @return {String}              HTML String for note
   */
  function getNoteHTML(notebookDbID, noteText, noteID) {
    if(!noteText) {
      noteText = '';
    } else {
      noteText = marked(noteText);
    }

    if(noteID) {
      noteID = 'data-noteid="' + noteID + '""';
    } else {
      noteID = '';
    }

    return '<div class="note" ' + noteID + ' data-notebookid="' + notebookDbID + '" contenteditable>' +
      noteText + '</div><div class="pull-right note-footer"><span class="small">' +
      i18n.__('Press Cntrl+S to save or Shift + Enter to save and a new note.') + '</span></div>';
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
      // TODO Error while creating new note.
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
      var noteHtml = marked(noteObj.text);
      noteObj.noteElem.innerHTML = noteHtml;
    }
  }

  return {
    init: init,
    buildNotesHtml: buildNotesHtml,
    addNewNoteHtml: addNewNoteHtml,
    addNotesEvents: addNoteEvents,
    removeAllNoteEvents: removeAllNoteEvents
  };
};

module.exports = NotesClient();
