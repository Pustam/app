/* global AppConfig */
var Notes = require(AppConfig.srcPath + 'notes.js');
var ejs = require('ejs');
var AppUtil = require(AppConfig.helperPath + 'utility.js');
var i18n = require('i18n');
var marked = require('marked');

'use strict';

var NotesClient = function() {

  var currentlyFocusedNote = null;
  var focusTimeout = null;

  var init = function() {

  };

  var buildNotesHtml = function(notes, notebookID) {
    return '';
  };

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
    var noteContainer = document.createElement('div');
    noteContainer.setAttribute('class', 'note-container');

    // Add it to the notes container
    notesContainer.appendChild(noteContainer);

    // Create the inner elements.
    noteContainer.innerHTML = '<div class="note" data-notebookid="' + notebookDbID + '" contenteditable></div>' 
      + '<div class="pull-right note-footer"><span class="small">' 
      + i18n.__('Press Cntrl+S to save or Shift + Enter to save and a new note.') 
      + '</span></div>';

    // Add events.
    var currNote = noteContainer.querySelector('.note');
    addNoteEvents(currNote);
    currNote.focus();
  };

  var removeAllNoteEvents = function(notebookContainer) {
    var allNotes = notebookContainer.querySelectorAll('.note');
    for (var i = 0; i !== allNotes.length; ++i) {
      removeNoteEvents(allNotes[i]);
    }
    allNotes = null;
  };

  function addNoteEvents(note) {
    // Focus - Nothing for now
    note.addEventListener('focus', evtNoteFocus, false);

    // Blur - Save
    note.addEventListener('blur', evtNoteBlur, false);

    // Keyup event - Perform action according to the
    // key's pressed.
    note.addEventListener('keypress', evtNoteKeyPress, false);
  };

  function removeNoteEvents(note) {
    note.removeEventListener('focus', evtNoteFocus);
    note.removeEventListener('blur', evtNoteBlur);
    note.removeEventListener('keypress', evtNoteKeyPress);
    note = null;
  };

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

  function evtNoteBlur(event) {
    console.log('blur...');
    saveNote(event.target, true);
  }

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
   * Callbacks
   */
  function cbModifiedNote(err, noteObj) {
    if (err) {
      // TODO : Error while creating new note.
      return;
    }
    checkIfBlur(noteObj);
  }

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
