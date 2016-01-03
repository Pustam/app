'use strict';
var _i18n = require('i18n');

var _appConfig = require(__dirname + '/../../../config.js');
var _notesClient = require(_appConfig.browserSrcPath + '/notes/note-client.js');
var _appError = require(_appConfig.commonsPath + 'app-error.js');
var _noteEvents = require(_appConfig.browserSrcPath + '/notes/note-events.js');
var _appUtil = require(_appConfig.commonsPath + 'utility.js');
var _notebook = require(__dirname + '/notebook');

var NotebookEvents = function() {
  var containerUL = null;
  var tabHeading = null;
  var tabContainer = null;
  var client = null;

  function _init(notebookClient, notebooksContainerUL, notebooksTabHeading, notebooksTabContainer) {
    client = notebookClient;
    containerUL = notebooksContainerUL;
    tabHeading = notebooksTabHeading;
    tabContainer = notebooksTabContainer;

    document.getElementById('btnAddNotebook').addEventListener('click', evtAddNotebook);
    tabHeading.addEventListener('click', evtTabChanged);
  }

  function _addNotebookSelectedEvent() {
    var notebooksChk = containerUL.querySelectorAll('input[type="checkbox"]');
    for (var i = 0, len = notebooksChk.length; i !== len; ++i) {
      notebooksChk[i].addEventListener('change', evtNotebookChanged, false);
    }
  }

  function _addEvents(notebookContents, notebookID) {
    // Add new note button handler..
    var btnAddNote = notebookContents.querySelector('.add-note');
    btnAddNote.addEventListener('click', evtAddNote);
    btnAddNote.dataset.notebookid = notebookID;
    btnAddNote = null;

    // Adding the change event to the datepicker
    var $datePicker = $(notebookContents.querySelector('.notebook-date'));
    $datePicker.on('changeDate', evtNotebookDateChanged);
    $datePicker = null;

    // Adding the delete notebook event.
    var btnDeleteNotebook = notebookContents.querySelector('#btnDeleteNotebook_16');
    btnDeleteNotebook.addEventListener('click', evtDeleteNotebook);
    btnDeleteNotebook.dataset.notebookid = notebookID;
    btnDeleteNotebook = null;
  }

  function _removeEvents(notebookContents) {
    // Removing the add button
    var btnAddNote = notebookContents.querySelector('.add-note');
    btnAddNote.removeEventListener('click', evtAddNote);
    btnAddNote = null;

    // Remove the delete button
    var btnDeleteNotebook = notebookContents.querySelector('#btnDeleteNotebook_16');
    btnDeleteNotebook.removeEventListener('click', evtDeleteNotebook);
    btnDeleteNotebook = null;

    // Removing the datepicker
    jQuery(notebookContents.querySelector('.notebook-date')).datepicker('remove');

    // Removing the notes.
    _noteEvents.removeAllEvents(notebookContents);
  }

  /**
   * Events
   */
  function evtAddNote(event) {
    try {
      var notebookID = event.target.dataset.notebookid;
      if (notebookID) {
        client.clearEmptyNotebook(notebookID);
        _notesClient.addNewNote(notebookID);
      }
    } catch (e) {
      var errObj = new _appError(e, _i18n.__('error.add_new_error'));
      errObj.display();
    }
  }

  function evtNotebookDateChanged(e) {
    var selectedDate = null;
    var currentDateInt = null;
    var selectedDateInt = null;
    var notebookDbID = null;
    var btnAddNote = null;

    try {
      selectedDate = e.date;
      selectedDateInt = e.date.getTime();
      currentDateInt = new Date().setHours(0, 0, 0, 0);
      notebookDbID = jQuery(e.target).data('notebookid');
      if (!notebookDbID) {
        // TODO - Notebook ID not found, throw error.
        return;
      }

      // Show the "Add note" button
      var notebookID = _appConfig.getNotebookContentID(notebookDbID);
      var notebookContainer = document.getElementById(notebookID);
      btnAddNote = notebookContainer.querySelector('.add-note');
      btnAddNote.style.display = 'inline-block';

      client.clearEmptyNotebook(notebookContainer);

      // Remove the notes
      _notesClient.removeNotesFromNotebook(notebookDbID);
    } catch (e) {
      var errObj = new _appError(e, _i18n.__('error.err_date_change'));
      errObj.display();
      return;
    }

    if (selectedDateInt < currentDateInt) {
      // Hide the "Add note" button.
      btnAddNote.style.display = 'none';
      client.showNotesForPastDate(notebookDbID, selectedDate);
    } else if (selectedDateInt > currentDateInt) {
      client.showFutureNotes(notebookDbID, selectedDate);
    } else {
      client.showActiveNotes(notebookDbID);
    }
  }

  function evtNotebookChanged(event) {
    if (event.target.checked) {
      client.showTab(event.target.id);
    } else {
      client.hideTab(event.target.id);
    }
  }

  function evtNotebookDlgClose(event) {
    document.getElementById('btnNewNotebook').removeEventListener('click', evtNotebookSave);
  }

  function evtNotebookDlgOpen() {
    document.getElementById('btnNewNotebook').addEventListener('click', evtNotebookSave);
  }

  function evtNotebookSave(event) {
    event.preventDefault();
    var dlgForm = document.getElementById('frmNewNotebook_92');
    if (!dlgForm) {
      return false;
    }
    var notebookData = _appUtil.readFormData(dlgForm.elements);
    client.saveNotebook(notebookData, function() {
      $('#dlgNewNotebook').modal('toggle');
    });
  }

  function evtAddNotebook(event) {
    // Show the dialog box
    _appUtil.loadDialog('new-notebook.html', {}, function(err, html) {
      if (!_appUtil.checkAndInsertDialog(err, html, _i18n.__('error.new_notebook_display_error'))) {
        return;
      }
      var $dlg = jQuery('#dlgNewNotebook');
      evtNotebookDlgOpen();
      $dlg.modal('show');
      _appUtil.addCloseEvent($dlg, evtNotebookDlgClose);
    });
  }

  function evtTabChanged(event) {
    if(!event.target.href) {
      return;
    }
    var currNotebookID = event.target.getAttribute('aria-controls');
    if(!currNotebookID) {
      return;
    }
    _notebook.setCurrentNotebook(currNotebookID);
  }

  function evtDeleteNotebook(event) {
     var isUserSure = window.confirm(_i18n.__('notebook.deletion_confirmation'));
     if(!isUserSure) {
       return;
     }
     // Call client method to delete.
     var notebookID = event.target.dataset.notebookid || event.target.parentNode.dataset.notebookid;
     if(!notebookID) {
       return;
     }
     client.deleteNotebook(notebookID);
  }

  /**
   * End of events
   */
  return {
    addNotebookSelectedEvent: _addNotebookSelectedEvent,
    addEvents: _addEvents,
    removeEvents: _removeEvents,
    init: _init
  };
};

module.exports = new NotebookEvents();
