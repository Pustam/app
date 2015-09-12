/*****************************************************************
 * Handles events associated with notes.
 *
 * @author : Abijeet Patro
 ****************************************************************/

'use strict';

var _appConfig = require(__dirname + '/../../../config');
var _noteKeyBindings = require(__dirname + '/note-keybindings');
var _noteEditor = require(__dirname + '/note-editor');

var NoteEvents = function() {
  var _noteHandler = {};

  function init(noteCallbackMethods) {
    _noteHandler = noteCallbackMethods;
  }

  function _addEditableEvents(note) {
    note.addEventListener('keydown', evtNoteKeyDown, false);
    note.addEventListener('blur', evtNoteBlur, false);
    _addEvents(note);
  }

  function _addEvents(note) {
    note.addEventListener('keypress', evtNoteKeyPress, false);
  }

  function _removeEvents(note) {
    note.removeEventListener('blur', evtNoteBlur);
    note.removeEventListener('keypress', evtNoteKeyPress);
    note = null;
  }

  /**
   * Fired whenever focus is lost on a note. Then calls `saveNote`
   * @param  {Object} event Event object
   * @return {undefined}    No return type.
   */
  function evtNoteBlur(event) {
    _noteHandler.saveNote(event.target, true);
  }

  function evtNoteKeyPress(event) {
    if(!event.ctrlKey) {
      // Ctrl key not pressed, nothing to do.
      return;
    }
    _handleKeyNoteEvents(event, 'keypress');
  }

  function evtNoteKeyDown(event) {
    if(!event.ctrlKey) {
      // Ctrl key not pressed, nothing to do.
      return;
    }
    _handleKeyNoteEvents(event, 'keydown');
  }

  /**
   * Cleanup function, removes all the events from the all notes inside a
   * given notebook. Calls `removeNoteEvents`.
   * @param  {Object} notebookContainer Notebook container HTML element
   * @return {undefined}                No return type
   */
  var _removeAllEvents = function(notebookContainer) {
    var allNotes = notebookContainer.querySelectorAll('.note');
    for (var i = 0; i !== allNotes.length; ++i) {
      _removeEvents(allNotes[i]);
    }
    allNotes = null;
  };

  function _checkIfCbIsValid(event, callback, noteState) {
    if(callback.hasOwnProperty('isEditable') &&
      callback.isEditable !== noteState.isEditable) {
      return false;
    }

    if(callback.hasOwnProperty('isComplete') &&
      callback.isComplete !== noteState.isComplete) {
      return false;
    }

    if(event.shiftKey !== callback.shiftModifier) {
      return false;
    }
    return true;
  }

  function _getCurrentEvent() {
    var currentEvent = false;
  }

  function _handleKeyNoteEvents(event, eventType) {
    var keyCode = event.which;
    var callbacks = _noteKeyBindings[eventType][keyCode];
    if(callbacks === undefined) {
      // No keybindings exist
      return;
    }

    var currState = _noteEditor.getCurrState(event.target);
    var cbToFire = false;
    if(Array.isArray(callbacks)) {
        for(var i = 0; i !== callbacks.length; i++) {
          if(_checkIfCbIsValid(event, callbacks[i], currState)) {
            cbToFire = callbacks[i];
          }
        }
    } else {
      if(_checkIfCbIsValid(event, callbacks, currState)) {
        cbToFire = callbacks;
      }
    }

    if(!cbToFire) {
      return;
    }

    if(cbToFire && _noteHandler[cbToFire.cb]) {
      _noteHandler[cbToFire.cb](event.target, event, currState);
    }

    if(cbToFire.allowDefault) {
      return;
    }
    event.preventDefault();
  }

  return {
    init : init,
    addEditableEvents : _addEditableEvents,
    addEvents : _addEvents,
    removeAllEvents : _removeAllEvents,
  };
};

module.exports = new NoteEvents();
