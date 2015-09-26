/*****************************************************************
 * Contains code to determine and change the current state
 * of the note. For example to determine when the note is
 * currently editable, complete and to make it editable.
 * Only deals with the DOM side of things.
 *
 * @author : Abijeet Patro
 ****************************************************************/
'use strict';

var _appConfig = require(__dirname + '/../../../config.js');
var _marked = require('marked');

var NoteEditor = function() {
  const NOTE_COMPLETE_CLASS = 'complete';
  const DEFAULT_NOTE_CLASS = 'note';
  const NOTE_NOT_EDITABLE_CLASS = 'readonly';
  var TEXT_MODIFIERS = {
    BOLD: 1,
    ITALICS: 2
  };

  /**
   * Checks if a note is editable
   * @param  {Object}  note The note element
   * @return {Boolean}      Returns true if the note is editable, else false
   */
  function _isEditable(note) {
    if (!note) {
      return false;
    }
    return note.getAttribute('contenteditable') === "true";
  }

  function _turnOnEditing(note) {
    note.setAttribute('contenteditable', true);
    note.focus();

    // Now set the cursor at the end.
    var range = document.createRange();
    range.selectNodeContents(note);
    range.collapse(false);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function _turnOffEditing(note) {
    note.setAttribute('contenteditable', false);
  }

  function _toggleNoteComplete(note) {
    var isComplete = false;
    if (note.classList.contains(NOTE_COMPLETE_CLASS)) {
      isComplete = true;
      note.classList.remove(NOTE_COMPLETE_CLASS);
    } else {
      note.classList.add(NOTE_COMPLETE_CLASS);
    }
    return isComplete;
  }

  /**
   * Returns the HTML for a new note. Adds default values if `note` object
   * is null.
   * @param  {String} notebookDbID Notebook ID
   * @param  {Object} note         The note object from the database
   * @return {String}              HTML String for note
   */
  function _getNoteHTML(notebookDbID, note, isEditable) {
    var noteText = '';
    var noteID = '';
    var noteClasses = DEFAULT_NOTE_CLASS;

    if (note) {
      noteText = _marked(note.text);
      noteClasses = note.isComplete ? (DEFAULT_NOTE_CLASS + ' ' +
        NOTE_COMPLETE_CLASS) : DEFAULT_NOTE_CLASS;
      noteID = 'data-noteid="' + note._id + '"';
    }

    if (!isEditable) {
      noteClasses += ' ' + NOTE_NOT_EDITABLE_CLASS;
    }
    return '<div class="' + noteClasses + '" ' + noteID + ' data-notebookid="' +
      notebookDbID + '" tabindex="0">' + noteText +
      '</div><div class="pull-right note-footer"></div>';
  }

  function _isComplete(note) {
    if (note.classList.contains(NOTE_COMPLETE_CLASS)) {
      return true;
    }
    return false;
  }

  // TODO Refactor this code
  function handleTextModifier(note, modifierType) {
    var sel = window.getSelection();
    if (sel.rangeCount) {
      var range = sel.getRangeAt(0);
      var noteStr = note.innerText;
      var nmRange = getNormalizedRange(range, note);
      var selectedRange = nmRange.endOffset - nmRange.startOffset;

      var chunk = {};

      var nodeStack = [note],
        node, foundStart = false,
        stop = false;
      var foundStartNode = false;
      var charIndex = 0;
      while (!stop && (node = nodeStack.pop())) {
        if (node.nodeType === 3) {
          var nextCharIndex = charIndex + node.length;
          if (!foundStart && nmRange.startOffset >= charIndex && nmRange.startOffset <= nextCharIndex) {
            // Found the start of the selection..
            foundStart = true;
            chunk.beforeNode = node;
            foundStartNode = true;
          }

          if (!stop && nmRange.endOffset >= charIndex && nmRange.endOffset <= nextCharIndex) {
            // Found the end of the selection..
            stop = true;
            chunk.afterNode = node;
            if (foundStartNode) {
              chunk.sameNodes = true;
            } else {
              chunk.sameNodes = false;
            }
          }
          foundStartNode = false;
          charIndex = nextCharIndex;
        } else {
          var i = node.childNodes.length;
          while (i--) {
            nodeStack.push(node.childNodes[i]);
          }
        }
      }
      chunk.after = chunk.afterNode.nodeValue.substr(range.endOffset, chunk.afterNode.nodeValue.length);
      chunk.before = chunk.beforeNode.nodeValue.substr(0, range.startOffset);

      if (modifierType === TEXT_MODIFIERS.BOLD) {
        doBoldOrItalics(chunk, 2);
      } else if (modifierType === TEXT_MODIFIERS.ITALICS) {
        doBoldOrItalics(chunk, 1);
      }

      var startRangeOffset = range.startOffset;
      var endRangeOffset = range.endOffset;

      // after first, before later.
      // if the node is same, and the node value changes, the range collapses.
      if (chunk.sameNodes) {
        var finalStr = chunk.afterNode.nodeValue.substr(0, range.endOffset) + chunk.after;
        finalStr = chunk.before + finalStr.substr(range.startOffset, finalStr.length);
        chunk.afterNode.nodeValue = finalStr;
      } else {
        chunk.afterNode.nodeValue = chunk.afterNode.nodeValue.substr(0, range.endOffset) + chunk.after;
        chunk.beforeNode.nodeValue = chunk.before + chunk.beforeNode.nodeValue.substr(range.startOffset, chunk.beforeNode.nodeValue.length);
      }
      restoreHighlight(chunk, startRangeOffset, endRangeOffset);
      chunk = null;
    }
  }

  function getNormalizedRange(range, note) {
    var preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(note);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    var start = preSelectionRange.toString().length;

    return {
      startOffset: start,
      endOffset: start + range.toString().length
    };
  }

  function restoreHighlight(chunk, startRangeOffset, endRangeOffset) {
    var sel = window.getSelection();
    sel.removeAllRanges();
    var range = document.createRange();
    if (chunk.added) {
      startRangeOffset = startRangeOffset + chunk.added;
      if (chunk.sameNodes) {
        endRangeOffset = endRangeOffset + chunk.added;
      }
    }
    range.setEnd(chunk.afterNode, endRangeOffset);
    range.setStart(chunk.beforeNode, startRangeOffset);
    sel.addRange(range);
  }

  function doBoldOrItalics(chunk, nStars) {
    // Look for stars before and after.  Is the chunk already marked up?
    // note that these regex matches cannot fail
    var starsBefore = /(\**$)/.exec(chunk.before)[0];
    var starsAfter = /(^\**)/.exec(chunk.after)[0];

    var prevStars = Math.min(starsBefore.length, starsAfter.length);

    // Remove stars if we have to since the button acts as a toggle.
    if ((prevStars >= nStars) && (prevStars !== 2 || nStars !== 1)) {
      chunk.before = chunk.before.replace(new RegExp("[*]{" + nStars + "}$", ""), "");
      chunk.after = chunk.after.replace(new RegExp("^[*]{" + nStars + "}", ""), "");
      chunk.added = -nStars;
    } else {
      chunk.added = nStars;

      // Add the true markup.
      var markup = nStars <= 1 ? "*" : "**"; // shouldn't the test be = ?
      chunk.before = chunk.before + markup;
      chunk.after = markup + chunk.after;
    }
    return chunk;
  }

  function _getCurrentStateOfNote(currNote) {
    var noteState = {};
    noteState.isComplete = _isComplete(currNote);
    noteState.isEditable = _isEditable(currNote);
    return noteState;
  }

  function _markAsComplete(note) {
    if (_isEditable(note)) {
      return false;
    }
    if (!note.innerText) {
      // TODO Maybe show a message stating that an empty note
      // can't be marked as complete.
      return false;
    }
    // Toggle the classes as necessary.
    if (_isComplete(note)) {
      note.classList.remove(NOTE_COMPLETE_CLASS);
    } else {
      note.classList.add(NOTE_COMPLETE_CLASS);
    }
    return true;
  }

  /**
   * Determines the note to be focused once the current note is removed,
   * focuses it and then removes the current note.
   * @param  {note element} note Note element to be removed
   * @return {undefined}
   */
  function _removeNote(note) {
    if (note.parentNode) {
      // Find a note to focus
      var parentNodeOfNote = null;
      if (note.parentNode.nextElementSibling) {
        // Does it have a next sibling??
        parentNodeOfNote = note.parentNode.nextElementSibling;
      } else if (note.parentNode.previousElementSibling) {
        // Does not have a next sibling, does it have
        // a previous sibling??
        parentNodeOfNote = note.parentNode.previousElementSibling;
      }

      if (parentNodeOfNote) {
        // Now focus that note.
        var noteToFocus = parentNodeOfNote.querySelector('.note');
        if (noteToFocus) {
          noteToFocus.focus();
        }
      }
      note.parentNode.remove();
    } else {
      note.remove();
    }
  }

  function _getNoteByID(noteID, container) {
    var note = null;
    if (container) {
      note = container.querySelector('.note[data-noteid="' + noteID + '"]');
    } else {
      note = document.querySelector('.note[data-noteid="' + noteID + '"]');
    }
    return note;
  }

  return {
    isEditable: _isEditable,
    turnOnEditing: _turnOnEditing,
    turnOffEditing: _turnOffEditing,
    markAsComplete: _markAsComplete,
    getNoteHTML: _getNoteHTML,
    isComplete: _isComplete,
    toggleNoteComplete: _toggleNoteComplete,
    getCurrState: _getCurrentStateOfNote,
    removeNote: _removeNote,
    TEXT_MODIFIERS: TEXT_MODIFIERS,
    getNoteByID: _getNoteByID
  };
};

module.exports = new NoteEditor();
