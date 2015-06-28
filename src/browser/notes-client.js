'use strict';

var Notes = require(AppConfig.srcPath + 'notes.js');
var i18n = require('i18n');
var marked = require('marked');

var NotesClient = function() {
  const NOTE_COMPLETE_CLASS = 'complete';
  const DEFAULT_NOTE_CLASS = 'note';

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
  var buildNotes = function(notes, notebookDbID, notebookContainer) {
    var notebooksContainer = notebookContainer.querySelector('.notes-container');
    if(!notebooksContainer) {
      // TODO Something bad happened!!
    }
    for (var i = 0, len = notes.length; i !== len; ++i) {
      appendNoteElement(notebookDbID, notes[i], notebooksContainer);
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
    if(!notebookDbID) {
      throw new ReferenceError('Notebook ID not provided!');
    }
    if(!notebookContainer) {
      var notebookID = AppConfig.getNotebookContentID(notebookDbID);
      notebookContainer = document.getElementById(notebookID);
    }

    var notesContainer = notebookContainer.querySelector('.notes-container');

    // Create the note
    var currNote = appendNoteElement(notebookDbID, null, notesContainer);

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
    if(!currentlyFocusedNote.dataset.noteid) {
      return;
    }
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
      // Ctrl + S - Need to save...
      saveNote(event.target, false);
      event.preventDefault();
    } else if (event.which === 14 && event.ctrlKey === true) {
      // Ctrl + N - Need to save and create a new note.
      saveAndCreateNote(event.target);
      event.preventDefault();
    } else if (event.which === 4 && event.ctrlKey === true) {
      // Ctrl + D - Need to delete the note
      deleteNote(event.target);
      event.preventDefault();
    } else if (event.which === 5 && event.ctrlKey === true) {
      // Ctrl + E - Mark note as complete.
      markNoteAsComplete(event.target);
      event.preventDefault();
    }
  }

  /**
   * Saves and creates a note. This is called when the user presses
   * Shift + Enter. Calls `saveNote` and the calls `addNewNote`
   * @param  {Object} note The note object
   * @return {undefined}
   */
  function saveAndCreateNote(note) {
    var notebookID = note.dataset.notebookid;
    saveNote(note, true);
    addNewNote(notebookID);
  }

  /**
   * Calls the method to update or create a note, based on the note element.
   * @param  {Object}  note   HTML note element that needs to be saved.
   * @param  {Boolean} isBlur Is this triggered as part of blur event.
   * @return {undefined}      No return type.
   */
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
   * Calls the method to delete a note, based on the note element.
   * @param  {Object} note HTML note element
   * @return {undefined}      No return type.
   */
  function deleteNote(note) {
    var noteID = note.dataset.noteid;
    if(noteID) {
      Notes.deleteNote(noteID, function(err) {
        if(err) {
          // TODO Show error regarding delete.
        }
      });
    }
    removeNoteEvents(note);
    if(note.parentNode) {
      note.parentNode.remove();
    } else {
      note.remove();
    }
  }

  /**
   * Adds the necessary class depending on whether the note is complete or
   * incomplete. It then calls the `saveNote` method to save the note.
   * @param  {Object} note HTML note element
   * @return {undefined}      No return type.
   */
  function markNoteAsComplete(note) {
    var isComplete = false;
    if(!note.innerText) {
      // TODO Maybe show a message stating that an empty note
      // can't be marked as complete.
      return;
    }
    // Toggle the classes as necessary.
    if(note.classList.contains(NOTE_COMPLETE_CLASS)) {
      isComplete = true;
      note.classList.remove(NOTE_COMPLETE_CLASS);
    } else {
      note.classList.add(NOTE_COMPLETE_CLASS);
    }
    // Save the note, it will update the note or create it.
    // This will also mark it as complete or mark it as uncomplete.
    saveNote(note, false);
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

    if(note.classList.contains(NOTE_COMPLETE_CLASS)) {
      noteObj.isComplete = true;
    } else {
      noteObj.isComplete = false;
    }

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
  function appendNoteElement(notebookDbID, note, notebooksContainer) {
    // Create the note
    var noteContainer = document.createElement('div');
    noteContainer.setAttribute('class', 'note-container');

    // Create the inner elements.
    noteContainer.innerHTML = getNoteHTML(notebookDbID, note);

    // Add events.
    var currNote = noteContainer.querySelector('.note');
    addNoteEvents(currNote);

    // Add it to the notes container
    notebooksContainer.appendChild(noteContainer);

    return currNote;
  }

  /**
   * Returns the HTML for a new note. Adds default values if `note` object
   * is null.
   * @param  {String} notebookDbID Notebook ID
   * @param  {Object} note         The note object from the database
   * @return {String}              HTML String for note
   */
  function getNoteHTML(notebookDbID, note, noteID) {
    if(note) {
      noteText = marked(note.text);
      noteClasses = note.isComplete ? (DEFAULT_NOTE_CLASS + ' ' +
        NOTE_COMPLETE_CLASS) : DEFAULT_NOTE_CLASS;
      noteID = 'data-noteid="' + note._id + '"';
    } else {
      noteText = '';
      noteID = '';
      noteClasses = DEFAULT_NOTE_CLASS;
    }

    return '<div class="' + noteClasses + '" ' + noteID + ' data-notebookid="' +
      notebookDbID + '" contenteditable>' + noteText +
      '</div><div class="pull-right note-footer"></div>';
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
    buildNotes: buildNotes,
    addNewNote: addNewNote,
    addNotesEvents: addNoteEvents,
    removeAllNoteEvents: removeAllNoteEvents
  };
};

module.exports = NotesClient();
