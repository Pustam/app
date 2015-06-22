/* global AppConfig */
var Notes = require(AppConfig.srcPath + 'notes.js');
var ejs = require('ejs');
var AppUtil = require(AppConfig.helperPath + 'utility.js');
var i18n = require('i18n');
var marked = require('marked');

'use strict';

var NotesClient = function() {
  var init = function() {

  };

  var buildNotesHtml = function(notes, notebookID) {
    return '';
  };

  var addNewNoteHtml = function(notebookContainer, notebookID) {        
    if(!notebookID) {
      notebookID = notebookContainer.getAttribute('id');
    } else if (!notebookContainer) {
      notebookContainer = document.getElementById(notebookID);
    }
    
    var notesContainer = notebookContainer.querySelector('.notes-container');
    
    // Create the note
    var noteContainer = document.createElement('div');
    noteContainer.setAttribute('class', 'note-container');
    
    // Add it to the notes container
    notesContainer.appendChild(noteContainer);
    
    // Create the inner elements.
    noteContainer.innerHTML = '<div class="note" data-notebookid="' + notebookID + '"contenteditable></div>' 
      + '<div class="pull-right note-footer"><span class="small">' 
      + i18n.__('Press Cntrl+S to save or Shift + Enter to save and a new note') 
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
    console.log('focus...');
    console.log(event);
  }

  function evtNoteBlur(event) {
    console.log('blur...');
    saveNote(event.target, true);
  }

  function evtNoteKeyPress(event) {
    if(event.which === 19 && event.ctrlKey === true) {
      // Need to save...
      saveNote(event.target, false);
      event.preventDefault();
    } else if(event.which === 13 && event.shiftKey === true) {
      // Need to save and create a new note.      
      saveAndCreateNote(event.target);
      event.preventDefault();
    }    
  }
  
  function saveAndCreateNote(note) {
    var notebookID = note.dataset.notebookid;
    saveNote(note, true);
    addNewNoteHtml(null, notebookID);
  }
  
  function saveNote(note, isBlur) {
    var noteText = note.textContent;    
    if(noteText) {
      var noteID = note.dataset.noteid;
      var notebookID = note.dataset.notebookid;
      if(noteID && notebookID) {
        // TODO : Save the note in the database!!  
      } else if(notebookID) {
        // TODO : Create the note in the database!!
      } else {
        // TODO : Error!! No notebookID AND noteID
        return;
      }
      
      if(isBlur) {
        var noteHtml = marked(noteText);
        note.innerHTML = noteHtml;
      } 
    }
    note = null;        
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
