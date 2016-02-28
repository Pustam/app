/* jshint esnext: true */
'use strict';

var _i18n = require('i18n');
var _async = require('async');
var _path = require('path');

// Custom
var _appConfig = require(_path.join(__dirname, '..', '..', '..', 'config'));
var _notebooks = require(_path.join(_appConfig.browserSrcPath, 'notebooks', 'notebook'));
var _notebookEvents = require(_path.join(_appConfig.browserSrcPath, 'notebooks' , 'notebook-events'));
var _notesClient = require(_path.join(_appConfig.browserSrcPath, 'notes', 'note-client'));
var _notes = require(_path.join(_appConfig.browserSrcPath, 'notes', 'note'));
var _appUtil = require(_path.join(_appConfig.commonsPath, 'utility'));
var _appError = require(_path.join(_appConfig.commonsPath, 'app-error'));
var _notebookUtil = require(_path.join(__dirname, 'notebook-utils'));

var NotebooksClient = function () {
  var notebooksContainerUL, notebooksTabHeading, notebooksTabContainer;
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
    _notebooks.getAllNotebooks(function (err, notebooks) {
      if (err) {
        return cbMain(err);
      }
      try {
        let notebooksHTML = '';
        for (var i = 0, len = notebooks.length; i !== len; ++i) {
          notebooksHTML += _notebookUtil.getNotebookItem(notebooks[i]);
        }
        notebooksContainerUL.innerHTML = notebooksHTML;
        _notebookEvents.addNotebookSelectedEvent();
        cbMain();
      } catch (e) {
        return cbMain(e);
      }
    });
  }

  /**
   * Displays the notebook with the given ID
   * @param  {string} notebookID           The notebook ID to display
   * @param  {boolean} updateActiveNotebook Whether to update the localStorage
   * @return {undefined}
   */
  function showTab(notebookID, updateActiveNotebook, cbMain) {
    // Fetch the notebook details
    _notebooks.getFullDetailByID(notebookID, function (err, notebookData) {
      if (err) {
        err.display();
        return _notebookUtil.checkAndReturn(cbMain, err);
      }

      _appUtil.loadPartial('notes.html', {}, function (err, notesPageHeaderHtml) {
        if (err) {
          let errParse = new _appError(err, _i18n.__('error.app_init'), false, true);
          errParse.display();
          return _notebookUtil.checkAndReturn(cbMain, errParse);
        }
        try {
          let notebookContentID = _appConfig.getNotebookContentID(notebookID);

          // Remove current active tabs and heading.
          _notebookUtil.removeActiveTab(notebooksTabHeading, notebooksTabContainer);

          // Add <li> to tab header
          notebooksTabHeading.insertAdjacentHTML('beforeend', _notebookUtil.getHeaderHTML(_appConfig.getNotebookHeaderID(
            notebookID), notebookContentID, notebookID, notebookData.name));                    

          // Add the default content of the notebook.
          notebooksTabContainer.insertAdjacentHTML('beforeend', _notebookUtil.getContainerHTML(notebookContentID, notesPageHeaderHtml));

          let notebookContents = document.getElementById(notebookContentID);

          // Generate the datepicker!
          var datePicker = jQuery(notebookContents.querySelector('.notebook-date')).datepicker(_appConfig.getDatepickerConfig());
          datePicker.datepicker('update', new Date()).element.data('notebookid', notebookID);

          if (notebookData.notes.length !== 0) {
            // Build the notes html.
            _notesClient.buildNotes(notebookData.notes, notebookID, notebookContents);
          } else {
            // Add empty notebok HTML
            notebookContents.insertAdjacentHTML('beforeend', _notebookUtil.getEmptyHTML(EMPTY_NOTES_CLASS));
          }

          // Attach the events.
          _notebookEvents.addEvents(notebookContents, notebookID);

          if (updateActiveNotebook !== false) {
            updateOpenNotebookCache();
            _notebooks.setCurrentNotebook(notebookID);
          }
          return _notebookUtil.checkAndReturn(cbMain);
        } catch (errDisplay) {
          var appError = new _appError(errDisplay, _i18n.__('error.notebook_display_error') + ' ' + _i18n.__('error.app_unstable'));
          appError.display();
          return _notebookUtil.checkAndReturn(cbMain, appError);
        }
      });
    });
  }

  /**
   * Hides the notebook with the given ID
   * @param  {string} notebookID The notebook ID to hide.
   * @return {undefined}            No description.
   */
  function hideTab(notebookID) {
    var notebookHeader, notebookContents;
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
  }

  function showNextNotebook() {
    var checkedBoxes = notebooksContainerUL.querySelectorAll('input[type="checkbox"]:checked');
    var chkLength = checkedBoxes.length;
    if (chkLength === 0) {
      // No notebooks to select, update the cache!
      updateOpenNotebookCache();
      _notebooks.setCurrentNotebook('');
      return;
    }
    changeActiveNotebook(checkedBoxes[chkLength - 1].id);
  }

  function changeActiveNotebook(notebookDbId) {
    // Get the content ID and header ID, based on database ID
    var notebookContentID = _appConfig.getNotebookContentID(notebookDbId);
    var notebookHeaderID = _appConfig.getNotebookHeaderID(notebookDbId);
    
    // Remove the currently active notebook.
    _notebookUtil.removeActiveTab(notebooksTabHeading, notebooksTabContainer);
    
    // Chang the current active notebook.
    notebooksTabHeading.querySelector('#' + notebookHeaderID).classList.add('active');
    notebooksTabContainer.querySelector('#' + notebookContentID).classList.add('active');
    updateOpenNotebookCache();
    _notebooks.setCurrentNotebook(notebookDbId);
  }

  function showNotesForPastDate(notebookDbID, selectedDate) {
    _notes.getCompletedNotesForDate(notebookDbID, selectedDate, function (err, notes) {
      handleNotebookDisplay(err, notebookDbID, notes, false);
    });
  }

  function showFutureNotes(notebookDbID, selectedDate) {
    _notes.getFutureNotesByDate(notebookDbID, selectedDate, function (err, notes) {
      handleNotebookDisplay(err, notebookDbID, notes, true);
    });
  }

  function showActiveNotes(notebookDbID) {
    _notes.getAllActiveNotes(notebookDbID, function (err, notes) {
      handleNotebookDisplay(err, notebookDbID, notes, true);
    });
  }

  function handleNotebookDisplay(err, notebookDbID, notes, isEditable) {
    if (err) {
      err.display();
      return;
    }
    try {
      _displayNotes(notes, notebookDbID, isEditable);
    } catch (e) {
      var errObj = new _appError(e, _i18n.__('error.notes_display_error'));
      errObj.display();
    }
  }

  function clearEmptyNotebook(notebookInfo) {
    var notebookContainer;
    if (typeof notebookInfo === 'string') {
      // Its the ID
      let notebookID = _appConfig.getNotebookContentID(notebookInfo);
      notebookContainer = notebooksTabContainer.querySelector('#' + notebookID);
    } else {
      // It is the element.
      notebookContainer = notebookInfo;
    }

    if (notebookContainer) {
      let elemEmptyNotebook = notebookContainer.querySelector('.' + EMPTY_NOTES_CLASS);
      if (elemEmptyNotebook) {
        elemEmptyNotebook.remove();
      }
    }
  }

  function handleEmptyNotebook(notebookDbID) {
    var notebookID = _appConfig.getNotebookContentID(notebookDbID);
    var notebookContainer = notebooksTabContainer.querySelector('#' + notebookID);
    notebookContainer.insertAdjacentHTML('beforeend', _notebookUtil.getEmptyHTML(EMPTY_NOTES_CLASS));
  }

  function _displayNotes(notes, notebookDbID, isEditable) {
    if (notes.length === 0) {
      handleEmptyNotebook(notebookDbID);
    } else {
      // Build the notes html and attach the event handlers.
      _notesClient.buildNotes(notes, notebookDbID, null, isEditable);
    }
  }

  function saveNotebook(notebookData, cbMain) {
    _notebooks.createNotebook(notebookData, function (err, newNotebook) {
      if (err) {
        err.display();
        return _notebookUtil.checkAndReturn(cbMain, err);
      }
      let notebookLi = _notebookUtil.getNotebookItem(newNotebook, true);
      notebooksContainerUL.insertAdjacentHTML('beforeend', notebookLi);
      showTab(newNotebook._id);
      return _notebookUtil.checkAndReturn(cbMain, null, newNotebook);
    });
  }

  function updateOpenNotebookCache() {
    var openNotebooks = _notebookUtil.getOpenNotebooks(notebooksContainerUL);
    _notebooks.updateOpenNotebooks(openNotebooks);
  }

  function deleteNotebook(notebookID) {
    _async.waterfall([
      function (next) {
        // Delete the notes first.
        _notes.deleteByNotebookID(notebookID, next);
      },
      function (data, next) {
        // Delete the notebook next.
        _notebooks.deleteByID(notebookID, next);
      }
    ], function (err, data) {
      if (err) {
        return err.display();
      }

      // Remove the checkbox first, this order is important.
      _notebookUtil.removeCheckbox(notebookID);

      // Then remove the notebook from the DOM
      hideTab(notebookID);
    });
  }

  function _initDisplay() {
    var openNotebooks = _notebooks.getLastOpenedNotebooks();
    if (openNotebooks) {
      // Show the last open notebooks.
      _async.each(openNotebooks, function (notebookID, cbMain) {
        showTab(notebookID, false, function (err) {
          if (err) {
            // If there was an error showing the notebook,
            // stop and dont check the checkbox.
            return cbMain(err);
          }
          let notebookChk = notebooksContainerUL.querySelector('#' + notebookID);
          notebookChk.checked = true;
          return cbMain();
        });
      }, function (err) {
        if (err) {
          if (!(err instanceof _appError)) {
            let parsedErr = new _appError(err, _i18n.__('error.notebook_init_display'));
            parsedErr.display();
          }
          return;
        }
        // Done, showing the last open notebooks, now show the last
        // active notebook.
        var lastActiveNotebookID = _notebooks.getLastActiveNotebook();
        if (lastActiveNotebookID) {
          changeActiveNotebook(lastActiveNotebookID);
        }
      });
    } else {
      // No active notebooks found, select the first notebook.
      _notebookUtil.selectFirst(notebooksContainerUL);
    }
  }



  var eventsApi = {
    showTab: showTab,
    hideTab: hideTab,
    showNotesForPastDate: showNotesForPastDate,
    showFutureNotes: showFutureNotes,
    showActiveNotes: showActiveNotes,
    clearEmptyNotebook: clearEmptyNotebook,
    saveNotebook: saveNotebook,
    deleteNotebook: deleteNotebook
  };

  return {
    getAndBindNotebooks: _getAndBindNotebooks,
    init: _init,
    initDisplay: _initDisplay
  };
};

module.exports = NotebooksClient();
