/* jshint esnext: true */
'use strict';

var _i18n = require('i18n');

// Custom
var _appConfig = require(__dirname + '/../../../config.js');
var _notebooks = require(_appConfig.browserSrcPath + '/notebooks/notebook.js');
var _notebookEvents = require(_appConfig.browserSrcPath + '/notebooks/notebook-events.js');
var _notesClient = require(_appConfig.browserSrcPath + '/notes/note-client.js');
var _notes = require(_appConfig.browserSrcPath + '/notes/note.js');
var _appUtil = require(_appConfig.commonsPath + 'utility.js');
var _appError = require(_appConfig.commonsPath + 'app-error.js');

var NotebooksClient = function() {
  var notebooksContainerUL = null;
  var notebooksTabHeading = null;
  var notebooksTabContainer = null;
  const EMPTY_NOTES_CLASS = 'empty-notebook';

  function _init(cbMain) {
    notebooksContainerUL = document.getElementById('1_lstNotebooks');
    notebooksTabHeading = document.getElementById('1_openTab');
    notebooksTabContainer = document.getElementById('1_openTabContainer');

    // Expose a limited API to the events handler.
    _notebookEvents.init(eventsApi, notebooksContainerUL,
      notebooksTabHeading, notebooksTabContainer);

    _notebooks.initializeDefaults(cbMain);
  }

  function _getAndBindNotebooks(cbMain) {
    _notebooks.getAllNotebooks(function(err, notebooks) {
      if (err) {
        return cbMain(err);
      }
      try {
        var notebooksHTML = '';
        for (var i = 0, len = notebooks.length; i !== len; ++i) {
          notebooksHTML += getNotebookItem(notebooks[i]);
        }
        notebooksContainerUL.innerHTML = notebooksHTML;
        _notebookEvents.addNotebookSelectedEvent();
        cbMain();
      } catch (e) {
        return cbMain(e);
      }
    });
  }

  // Displays a notebook with the given ID
  function showTab(notebookID) {
    // Fetch the notebook details
    _notebooks.getFullDetailByID(notebookID, function(err, notebookData) {
      if (err) {
        err.display();
        return;
      }

      _appUtil.loadPartial('notes.html', {}, function(err, notesPageHeaderHtml) {
        if (err) {
          var errParse = new _appError(err, _i18n.__('error.app_init'), false, true);
          errParse.display();
          return;
        }
        try {
          var notebookContentID = _appConfig.getNotebookContentID(notebookID);

          // Remove current active tabs and heading.
          removeActiveTab(notebooksTabHeading, notebooksTabContainer);

          // Add <li> to tab header
          notebooksTabHeading.insertAdjacentHTML('beforeend', '<li role="presentation" id="' + _appConfig.getNotebookHeaderID(
              notebookID) + '" class="active"><a href="#' + notebookContentID + '" aria-controls="' +
            notebookID + '" role="tab" data-toggle="tab">' + notebookData.name + '</a></li>');

          // Add the default content of the notebook.
          notebooksTabContainer.insertAdjacentHTML('beforeend', '<div role="tabpanel" class="tab-pane active" id="' +
            notebookContentID + '">' + notesPageHeaderHtml + '</div>');

          var notebookContents = document.getElementById(notebookContentID);

          // Generate the datepicker!
          var datePicker = jQuery(notebookContents.querySelector('.notebook-date')).datepicker(_appConfig.getDatepickerConfig());
          datePicker.datepicker('update', new Date()).element.data('notebookid', notebookID);

          if (notebookData.notes.length !== 0) {
            // Build the notes html.
            _notesClient.buildNotes(notebookData.notes, notebookID, notebookContents);
          } else {
            // Add empty notebok HTML
            notebookContents.insertAdjacentHTML('beforeend', getEmptyNotebookHTML());
          }

          // Attach the events.
          _notebookEvents.addEvents(notebookContents, notebookID);

        } catch (errDisplay) {
          var appError = new _appError(errDisplay, _i18n.__('error.notebook_display_error') + ' ' + _i18n.__('error.app_unstable'));
          appError.display();
        }
      });
    });
  }

  // Hides a notebook with the given ID
  function hideTab(notebookID) {
    var notebookHeader = null;
    var notebookContents = null;
    try {
      notebookHeader = notebooksTabHeading.querySelector('#' + _appConfig.getNotebookHeaderID(notebookID));
      if (notebookHeader) {
        notebookHeader.remove();
      }
      notebookContents = notebooksTabContainer.querySelector('#' + _appConfig.getNotebookContentID(notebookID));

      // Cleanup!!
      _notebookEvents.removeEvents(notebookContents);
      if (notebookContents) {
        notebookContents.remove();
      }
      showNextNotebook();
    } catch (e) {
      var errObj = new _appError(e, _i18n.__('error.notebook_hide_error') + ' ' + _i18n.__('error.app_unstable'));
      errObj.display();
    }
    notebookContents = null;
    notebookHeader = null;
  }

  function showNextNotebook() {
    var checkedBoxes = notebooksContainerUL.querySelectorAll('input[type="checkbox"]:checked');
    var chkLength = checkedBoxes.length;
    if (chkLength === 0) {
      return;
    }
    var lastCheckboxSelected = checkedBoxes[chkLength - 1];
    var notebookDbID = lastCheckboxSelected.id;
    changeActiveNotebook(notebookDbID);
  }

  function changeActiveNotebook(notebookDbId) {
    var notebookContentID = _appConfig.getNotebookContentID(notebookDbId);
    var notebookHeaderID = _appConfig.getNotebookHeaderID(notebookDbId);
    removeActiveTab(notebooksTabHeading, notebooksTabContainer);
    notebooksTabHeading.querySelector('#' + notebookHeaderID).classList.add('active');
    notebooksTabContainer.querySelector('#' + notebookContentID).classList.add('active');
  }

  function showNotesForPastDate(notebookDbID, selectedDate) {
    _notes.getCompletedNotesForDate(notebookDbID, selectedDate, function(err, notes) {
      if (err) {
        err.display();
        return;
      }
      try {
        _displayNotes(notes, notebookDbID, false);
      } catch (e) {
        var errObj = new _appError(e, _i18n.__('error.notes_display_error'));
        errObj.display();
      }
    });
  }

  function showFutureNotes(notebookDbID, selectedDate) {
    _notes.getFutureNotesByDate(notebookDbID, selectedDate, function(err, notes) {
      if (err) {
        err.display();
        return;
      }
      try {
        _displayNotes(notes, notebookDbID, true);
      } catch (e) {
        var errObj = new _appError(e, _i18n.__('error.notes_display_error'));
        errObj.display();
      }
    });
  }

  function showActiveNotes(notebookDbID) {
    _notes.getAllActiveNotes(notebookDbID, function(err, notes) {
      if (err) {
        err.display();
        return;
      }
      try {
        _displayNotes(notes, notebookDbID, true);
      } catch (e) {
        var errObj = new _appError(e, _i18n.__('error.notes_display_error'));
        errObj.display();
      }
    });
  }

  function clearEmptyNotebook(notebookInfo) {
    var notebookContainer = null;
    if (typeof notebookInfo === 'string') {
      // Its the ID
      var notebookID = _appConfig.getNotebookContentID(notebookInfo);
      notebookContainer = notebooksTabContainer.querySelector('#' + notebookID);
    } else {
      // It is the element.
      notebookContainer = notebookInfo;
    }

    if (notebookContainer) {
      var elemEmptyNotebook = notebookContainer.querySelector('.' + EMPTY_NOTES_CLASS);
      if (elemEmptyNotebook) {
        elemEmptyNotebook.remove();
      }
    }
  }

  function getEmptyNotebookHTML() {
    return '<div class="' + EMPTY_NOTES_CLASS + '">' + _i18n.__('notebook.empty_notebook') + '</div>';
  }

  function handleEmptyNotebook(notebookDbID) {
    var notebookID = _appConfig.getNotebookContentID(notebookDbID);
    var notebookContainer = notebooksTabContainer.querySelector('#' + notebookID);
    notebookContainer.insertAdjacentHTML('beforeend', getEmptyNotebookHTML());
  }

  function _displayNotes(notes, notebookDbID, isEditable) {
    if (notes.length === 0) {
      handleEmptyNotebook(notebookDbID);
    } else {
      // Build the notes html and attach the event handlers.
      _notesClient.buildNotes(notes, notebookDbID, null, isEditable);
    }
  }

  function _selectFirstNotebook() {
    var notebooksContainerUL = document.getElementById('1_lstNotebooks');

    // Check the first checkbox.
    var firstChkBox = notebooksContainerUL.querySelector('input[type="checkbox"]');
    firstChkBox.checked = true;

    // Then simulate the change event.
    var changeEvent = new Event('HTMLEvents');
    changeEvent.initEvent("change", false, true);
    firstChkBox.dispatchEvent(changeEvent);
    changeEvent = null;
    firstChkBox = null;
  }

  function saveNotebook(notebookData) {
    _notebooks.createNotebook(notebookData, cbHandleNotebookSave);
  }


  function cbHandleNotebookSave(err, newNotebook) {
    if (err) {
      // TODO : Show error!
      return;
    }
    var notebookLi = getNotebookItem(newNotebook, true);
    notebooksContainerUL.insertAdjacentHTML('beforeend', notebookLi);
    showTab(newNotebook._id);
  }

  function removeActiveTab(notebooksTabHeading, notebooksTabContainer) {
    var activeTab = notebooksTabHeading.querySelector('.active');
    if (activeTab) {
      activeTab.classList.remove('active');
    }

    var activeTabContainer = notebooksTabContainer.querySelector('.active');
    if (activeTabContainer) {
      activeTabContainer.classList.remove('active');
    }
  }

  function getNotebookItem(notebook, isChecked) {
    var checkedHTML = '';
    if (isChecked) {
      checkedHTML = 'checked';
    }
    return '<li class="checkbox"><input type="checkbox" ' + checkedHTML + ' id="' + notebook._id + '">' +
      '<label for="' + notebook._id + '">' + notebook.name + '</label></li>';
  }


  var eventsApi = {
    showTab: showTab,
    hideTab: hideTab,
    showNotesForPastDate: showNotesForPastDate,
    showFutureNotes: showFutureNotes,
    showActiveNotes: showActiveNotes,
    clearEmptyNotebook: clearEmptyNotebook,
    saveNotebook: saveNotebook
  };

  return {
    getAndBindNotebooks: _getAndBindNotebooks,
    selectFirstNotebook: _selectFirstNotebook,
    init: _init
  };
};

module.exports = new NotebooksClient();
