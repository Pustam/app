var NoteEvents = function() {
  var addEvents = function(note) {
    note.addEventListener('keydown', evtNoteKeyDown, false);
  };

  var TEXT_MODIFIERS = {
    BOLD : 1,
    ITALICS : 2
  };

  var deleteEvents = function(note) {
    note.removeEventListener('keydown', evtNoteKeyDown);
  };

  function evtNoteKeyDown(event) {
    if(event.ctrlKey === true) {
      if(!isNoteEditable(event.target)) {
        return;
      }
      if(event.which === 66) {
        // Bold
        handleTextModifier(event.target, TEXT_MODIFIERS.BOLD);
      } else if(event.which === 73) {
        // Italics
        handleTextModifier(event.target, TEXT_MODIFIERS.ITALICS);
      }
      event.preventDefault();
    }
  }

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

      if(modifierType === TEXT_MODIFIERS.BOLD) {
        doBoldOrItalics(chunk, 2);
      } else if(modifierType === TEXT_MODIFIERS.ITALICS) {
        doBoldOrItalics(chunk, 1);
      }

      var startRangeOffset = range.startOffset;
      var endRangeOffset = range.endOffset;

      // after first, before later.
      // if the node is same, and the node value changes, the range collapses.
      if(chunk.sameNodes) {
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

  /**
  * DUPLICATED --- NEEDS REFACTORING!!!!!!!
  * Checks if a note is editable
  * @param  {Object}  note The note element
  * @return {Boolean}      Returns true if the note is editable, else false
  */
  function isNoteEditable(note) {
    if(!note) {
      return false;
    }
    return note.getAttribute('contenteditable') === "true";
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
    if(chunk.added) {
      startRangeOffset = startRangeOffset + chunk.added;
      if(chunk.sameNodes) {
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
    if ((prevStars >= nStars) && (prevStars != 2 || nStars != 1)) {
      chunk.before = chunk.before.replace(RegExp("[*]{" + nStars + "}$", ""), "");
      chunk.after = chunk.after.replace(RegExp("^[*]{" + nStars + "}", ""), "");
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

  return {
    addEvents : addEvents,
    deleteEvents : deleteEvents
  };
};

module.exports = new NoteEvents();
