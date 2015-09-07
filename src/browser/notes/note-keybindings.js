/***********************************************************
 * Contains the event bindings and details about
 * when they are to fire.
 *
 * Each number represents the event ID.
 * 'typeOfEvent' : [{
 * 		// if not specified then applicable for both states.
 * 		isEditable : 'does the note have to be in editable state?',
 * 		isComplete : 'is it valid only for isCompleteNotes'
 * 		shiftModifier : 'is shift modifier necessary? mandatory',
 * 		cb : callback method
 *
 * }]
 * @author : Abijeet Patro
 ******************************************************/
'use strict';

var keybindings = {
  'keypress': {
    3: [{
      comment : 'Mark a note as complete on Ctrl + Shift + C',
      isEditable: false,
      isComplete: false,
      shiftModifier: true,
      cb : 'markNoteAsComplete'
    }],
    19 : [{
      comment : 'Save a note on pressing Ctrl + S',
      isEditable: true,
      isComplete: false,
      shiftModifier: false,
      cb : 'saveNote'
    }],
    14 : [{
      comment : 'Save and create a note Ctrl + N',
      shiftModifier: false,
      cb : 'saveAndCreateNote'
    }],
    4 : [{
      comment : 'Delete note Ctrl + D',
      shiftModifier: false,
      cb : 'deleteNote'
    }],
    5 : [{
      comment : 'Makes a note editable Ctrl + E',
      isEditable: false,
      isComplete: false,
      shiftModifier: false,
      cb : 'makeNoteEditable'
    }],
    3333 : [{

    }],
    5555 : [{

    }],
  },
  'keydown': {

  }
};

module.exports = keybindings;
