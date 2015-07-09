/* global AppConfig  */
/* jshint esnext: true */

'use strict';

var Notebooks = require(AppConfig.srcPath + 'notebooks.js');
var AppUtil = require(AppConfig.helperPath + 'utility.js');
var NotesClient = require(AppConfig.browserSrcPath + 'notes-client.js');
var Notes = require(AppConfig.srcPath + 'notes.js');
var AppError = require(AppConfig.helperPath + 'app-error.js');
var i18n = require('i18n');

var NotebooksClient = function() {
  var notebooksContainerUL = null;
  var notebooksTabHeading = null;
  var notebooksTabContainer = null;
  const EMPTY_NOTES_CLASS = 'empty-notebook';

  var init = function() {
    notebooksContainerUL = document.getElementById('1_lstNotebooks');
    notebooksTabHeading = document.getElementById('1_openTab');
    notebooksTabContainer = document.getElementById('1_openTabContainer');
  };

  var cbBindNotebooks = function(notebooks) {
    try {
      var notebooksHTML = '';
      for (var i = 0, len = notebooks.length; i !== len; ++i) {
        notebooksHTML += '<li class="checkbox"><input type="checkbox" id="' + notebooks[i]._id + '">' +
          '<label for="' + notebooks[i]._id + '">' + notebooks[i].name + '</label></li>';
      }
      notebooksContainerUL.innerHTML = notebooksHTML;
      addNotebookSelectedEvent();
    } catch (e) {
      var errObj = new AppError(e, i18n.__('error.app_init'));
      errObj.display();
    }
  };

  // Private functions
  function addNotebookSelectedEvent() {
    var notebooksChk = notebooksContainerUL.querySelectorAll('input[type="checkbox"]');
    for (var i = 0, len = notebooksChk.length; i !== len; ++i) {
      notebooksChk[i].addEventListener('change', notebookSelectChanged, false);
    }
  }

  // Fires when a notebook is selected or deselected.
  function notebookSelectChanged(event) {
    if (event.target.checked) {
      showTab(event.target.id);
    } else {
      hideTab(event.target.id);
    }
  }

  // Displays a notebook with the given ID
  function showTab(notebookID) {
    // Fetch the notebook details
    Notebooks.getFullDetailByID(notebookID, function(err, notebookData) {
      if (err) {
        err.display();
        return;
      }

      AppUtil.loadPartial('notes.html', {}, function(err, notesPageHeaderHtml) {
        if (err) {
          var errParse = new AppError(err, i18n.__('error.app_init'), false, true);
          errParse.display();
          return;
        }
        try {
          var notebookContentID = AppConfig.getNotebookContentID(notebookID);

          // Add <li> to tab header
          notebooksTabHeading.insertAdjacentHTML('beforeend', '<li role="presentation" id="' + AppConfig.getNotebookHeaderID(
              notebookID) + '" class="active"><a href="#' + notebookContentID + '" aria-controls="' +
            notebookID + '" role="tab" data-toggle="tab">' + notebookData.name + '</a></li>');

          // Add the default content of the notebook.
          notebooksTabContainer.insertAdjacentHTML('beforeend', '<div role="tabpanel" class="tab-pane active" id="' +
            notebookContentID + '">' + notesPageHeaderHtml + '</div>');

          var notebookContents = document.getElementById(notebookContentID);

          // Generate the datepicker!
          var $datePicker = jQuery(notebookContents.querySelector('.notebook-date')).datepicker({
            todayBtn: true,
            orientation: 'top',
            todayHighlight: true,
            autoclose: true,
            format: AppConfig.dateFormat
          }).datepicker('update', new Date()).element.data('notebookid', notebookID);

          if (notebookData.notes.length !== 0) {
            // Build the notes html.
            NotesClient.buildNotes(notebookData.notes, notebookID, notebookContents);
          } else {
            // Add empty notebok HTML
            notebookContents.insertAdjacentHTML('beforeend', getEmptyNotebookHTML());
          }

          // Attach the events.
          addNotebookEvents(notebookContents, notebookID);

        } catch (errDisplay) {
          var appError = new AppError(errDisplay, i18n.__('error.notebook_display_error') + ' ' + i18n.__('error.app_unstable'));
          appError.display();
        }
        notebookContents = null;
      });
    });
  }

  // Hides a notebook with the given ID
  function hideTab(notebookID) {
    var notebookHeader = null;
    var notebookContents = null;
    try {
      notebookHeader = notebooksTabHeading.querySelector('#' + AppConfig.getNotebookHeaderID(notebookID));
      if (notebookHeader) {
        notebookHeader.remove();
      }
      notebookContents = notebooksTabContainer.querySelector('#' + AppConfig.getNotebookContentID(notebookID));

      // Cleanup!!
      removeNotebookEvents(notebookContents);
      if (notebookContents) {
        notebookContents.remove();
      }
    } catch (e) {
      var errObj = new AppError(e, i18n.__('error.notebook_hide_error') + ' ' + i18n.__('error.app_unstable'));
      errObj.display();
    }
    notebookContents = null;
    notebookHeader = null;
  }

  function addNotebookEvents(notebookContents, notebookID) {
    // Add new note button handler..
    var btnAddNote = notebookContents.querySelector('.add-note');
    btnAddNote.addEventListener('click', evtAddNote);
    btnAddNote.dataset.notebookid = notebookID;
    btnAddNote = null;

    // Adding the change event to the datepicker
    var $datePicker = $(notebookContents.querySelector('.notebook-date'));
    $datePicker.on('changeDate', evtNotebookDateChanged);
    $datePicker = null;
  }

  /**
   * Private function used to remove and cleanup event handlers.
   * Also cleans up notes related events.
   */
  function removeNotebookEvents(notebookContents) {
    // Removing the add button
    var btnAddNote = notebookContents.querySelector('.add-note');
    btnAddNote.removeEventListener('click', evtAddNote);
    btnAddNote = null;

    // Removing the datepicker
    jQuery(notebookContents.querySelector('.notebook-date')).datepicker('remove');

    // Removing the notes.
    NotesClient.removeAllNoteEvents(notebookContents);
  }

  /**
   * Events
   */
  function evtAddNote(event) {
    try {
      var notebookID = event.target.dataset.notebookid;
      if (notebookID) {
        clearEmptyNotebook(notebookID);
        NotesClient.addNewNote(notebookID);
      }
    } catch (e) {
      var errObj = new AppError(e, i18n.__('error.add_new_error'));
      errObj.display();
    }
  }

  function evtNotebookDateChanged(e) {
    var selectedDate = null, currentDateInt = null,
      selectedDateInt = null, notebookDbID = null,
      btnAddNote = null;

    try {
      selectedDate = e.date;
      selectedDateInt = e.date.getTime();
      currentDateInt = new Date().setHours(0, 0, 0, 0);
      notebookDbID = jQuery(this).data('notebookid');
      if (!notebookDbID) {
        // Notebook id not found!!
        return;
      }

      // Show the "Add note" button
      var notebookID = AppConfig.getNotebookContentID(notebookDbID);
      var notebookContainer = document.getElementById(notebookID);
      btnAddNote = notebookContainer.querySelector('.add-note');
      btnAddNote.style.display = 'inline-block';

      clearEmptyNotebook(notebookContainer);

      // Remove the notes
      NotesClient.removeNotesFromNotebook(notebookDbID);
    } catch (e) {
      var errObj = new AppError(e, i18n.__('error.err_date_change'));
      errObj.display();
      return;
    }

    if (selectedDateInt < currentDateInt) {
      // Hide the "Add note" button.
      btnAddNote.style.display = 'none';
      showNotesForPastDate(notebookDbID, selectedDate);
    } else if (selectedDateInt > currentDateInt) {
      showFutureNotes(notebookDbID, selectedDate);
    } else {
      showActiveNotes(notebookDbID);
    }
  }

  /**
   * End of events
   */

  function showNotesForPastDate(notebookDbID, selectedDate) {
    Notes.getCompletedNotesForDate(notebookDbID, selectedDate, function(err, notes) {
      if (err) {
        err.display();
        return;
      }
      try {
        if (notes.length === 0) {
          handleEmptyNotebook(notebookDbID);
        } else {
          // Build the notes html and attach the event handlers.
          NotesClient.buildNotes(notes, notebookDbID, null, false);
        }
      } catch (e) {
        var errObj = new AppError(e, i18n.__('error.notes_display_error'));
        errObj.display();
      }
    });
  }

  function showFutureNotes(notebookDbID, selectedDate) {
    Notes.getFutureNotesByDate(notebookDbID, selectedDate, function(err, notes) {
      if (err) {
        err.display();
        return;
      }
      try {
        if (notes.length === 0) {
          handleEmptyNotebook(notebookDbID);
        } else {
          // Build the notes html and attach the event handlers.
          NotesClient.buildNotes(notes, notebookDbID, null);
        }
      } catch (e) {
        var errObj = new AppError(e, i18n.__('error.notes_display_error'));
        errObj.display();
      }
    });
  }

  function showActiveNotes(notebookDbID) {
    Notes.getAllActiveNotes(notebookDbID, function(err, notes) {
      if (err) {
        err.display();
        return;
      }
      try {
        if (notes.length === 0) {
          handleEmptyNotebook(notebookDbID);
        } else {
          // Build the notes html and attach the event handlers.
          NotesClient.buildNotes(notes, notebookDbID, null);
        }
      } catch (e) {
        var errObj = new AppError(e, i18n.__('error.notes_display_error'));
        errObj.display();
      }
    });
  }

  function clearEmptyNotebook(notebookInfo) {
    var notebookContainer = null;
    if (typeof notebookInfo === 'string') {
      // Its the ID
      var notebookID = AppConfig.getNotebookContentID(notebookInfo);
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
    return '<div class="' + EMPTY_NOTES_CLASS + '">' + i18n.__('notebook.empty_notebook') + '</div>';
  }

  function handleEmptyNotebook(notebookDbID) {
    var notebookID = AppConfig.getNotebookContentID(notebookDbID);
    var notebookContainer = notebooksTabContainer.querySelector('#' + notebookID);
    notebookContainer.insertAdjacentHTML('beforeend', getEmptyNotebookHTML());
  }

  return {
    cbBindNotebooks: cbBindNotebooks,
    init: init
  };
};

module.exports = NotebooksClient();
