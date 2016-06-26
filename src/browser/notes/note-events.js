/*****************************************************************
 * Handles events associated with notes.
 *
 * @author : Abijeet Patro
 ****************************************************************/

'use strict';
var _shell = require('shell');

var _appConfig = require(__dirname + '/../../../config');
var _noteKeyBindings = require(__dirname + '/note-keybindings');
var _noteEditor = require(__dirname + '/note-editor');
var _appUtil = require(_appConfig.commonsPath + 'utility.js');

var NoteEvents = function() {
  var _noteHandler = {};

  function init(noteCallbackMethods) {
    _noteHandler = noteCallbackMethods;
  }

  function _addEditableEvents(note) {
    note.addEventListener('keydown', evtNoteKeyDown, false);
    _addEvents(note);
  }

  function _addEvents(note) {
    note.addEventListener('keypress', evtNoteKeyPress, false);
    note.addEventListener('blur', evtNoteBlur, false);
    note.addEventListener('click', evtNoteClick, false);
  }

  function _removeEvents(note) {
    note.removeEventListener('blur', evtNoteBlur);
    note.removeEventListener('keypress', evtNoteKeyPress);
    note.removeEventListener('keydown', evtNoteKeyDown);
    note.removeEventListener('click', evtNoteClick, false);
    note = null;
  }

  function _addNonEditableEvents(note) {
    _removeEvents(note);
    _addEvents(note);
  }

  /**
   * Fired whenever focus is lost on a note. Then calls `saveNote`
   * @param  {Object} event Event object
   * @return {undefined}    No return type.
   */
  function evtNoteBlur(event) {
    var note = event.target;
    if(_noteEditor.isToBeMoved(note)) {
      _noteEditor.move(note);
    }
    if (!_noteEditor.isEditable(event.target)) {
      return;
    }
    _noteHandler.saveNote(event.target, true);
  }

  function evtNoteKeyPress(event) {
    if (!event.ctrlKey) {
      // Ctrl key not pressed, nothing to do.
      return;
    }
    _handleKeyNoteEvents(event, 'keypress');
  }

  function evtNoteKeyDown(event) {
    if (!event.ctrlKey) {
      // Ctrl key not pressed, nothing to do.
      return;
    }
    _handleKeyNoteEvents(event, 'keydown');
  }

  function evtNoteClick(event) {
    if (event.target.href) {
      _shell.openExternal(event.target.href);
      event.preventDefault();
    }
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
    if (callback.hasOwnProperty('isEditable') &&
      callback.isEditable !== noteState.isEditable) {
      return false;
    }

    if (callback.hasOwnProperty('isComplete') &&
      callback.isComplete !== noteState.isComplete) {
      return false;
    }

    if (callback.shiftModifier && event.shiftKey !== callback.shiftModifier) {
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
    if (callbacks === undefined) {
      // No keybindings exist
      return;
    }

    var currState = _noteEditor.getCurrState(event.target);
    var cbToFire = false;
    if (Array.isArray(callbacks)) {
      for (var i = 0; i !== callbacks.length; i++) {
        if (_checkIfCbIsValid(event, callbacks[i], currState)) {
          cbToFire = callbacks[i];
        }
      }
    } else {
      if (_checkIfCbIsValid(event, callbacks, currState)) {
        cbToFire = callbacks;
      }
    }

    if (!cbToFire) {
      return;
    }

    if (cbToFire && _noteHandler[cbToFire.cb]) {
      _noteHandler[cbToFire.cb](event.target, event, currState);
    }

    if (cbToFire.allowDefault) {
      return;
    }
    event.preventDefault();
  }

  function evtNoteDateChangeOpen(dlg, isComplete) {
    // Generate the date picker
    var datePicker = dlg.querySelector('#txtTargetDate_88');

    // Config for datepicker, don't allow past dates if the note is not complete.
    var datePickerConfig = _appConfig.getDatepickerConfig();
    if(isComplete) {
      var currDate = new Date();
      currDate.setDate(currDate.getDate() - _appConfig.maxPastDate);
      datePickerConfig.startDate = currDate;
    } else {
      datePickerConfig.startDate = new Date();
    }
    $(datePicker).datepicker(datePickerConfig);

    // 2. Add the event
    dlg.querySelector('#btnMoveNote_88').addEventListener('click', moveNoteToNewDate);
    dlg.querySelector('form').addEventListener('submit', moveNoteToNewDate);

    // 3. Focus the textbox.
    dlg.querySelector('#txtTargetDate_88').focus();
  }

  function evtNoteDateChangeClose(dlg) {
    var datePicker = dlg.querySelector('#txtTargetDate_88');
    $(datePicker).datepicker('remove');

    dlg.querySelector('#btnMoveNote_88').removeEventListener('click', moveNoteToNewDate);
    dlg.querySelector('form').removeEventListener('submit', moveNoteToNewDate);
    var noteID = dlg.querySelector('#hdnNoteID_88').value;
    if (!noteID) {
      return;
    }
    var note = _noteEditor.getNoteByID(noteID);
    if (note) {
      // If the note still exists, focus it.
      note.focus();
    }

    $(dlg).data('modal', null).remove();
  }

  function moveNoteToNewDate(event) {
    var $dlg = jQuery('#dlgMoveNote_88');
    var formElements = $dlg.find('form')[0].elements;
    var formData = _appUtil.readFormData(formElements);
    var selectedDate = $dlg.find('#txtTargetDate_88').datepicker('getDate');

    if (selectedDate) {
      formData.targetDate = selectedDate;
      _noteHandler.modifyNoteDate(formData.noteID, formData.targetDate, $dlg);
    }
    event.preventDefault();
  }

  return {
    init: init,
    addEditableEvents: _addEditableEvents,
    addEvents: _addEvents,
    removeAllEvents: _removeAllEvents,
    addNonEditableEvents: _addNonEditableEvents,
    evtNoteDateChangeOpen: evtNoteDateChangeOpen,
    evtNoteDateChangeClose: evtNoteDateChangeClose
  };
};

module.exports = new NoteEvents();
