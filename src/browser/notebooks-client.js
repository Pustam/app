/* global AppConfig */
var Notebooks = require(AppConfig.srcPath + 'notebooks.js');
var AppUtil = require(AppConfig.helperPath + 'utility.js');
var NotesClient = require(AppConfig.browserSrcPath + 'notes-client.js');

'use strict'

var NotebooksClient = function() {
  var notebooksContainerUL = null;
  var notebooksTabHeading = null;
  var notebooksTabContainer = null;

  var init = function() {
    notebooksContainerUL = document.getElementById('1_lstNotebooks');
    notebooksTabHeading = document.getElementById('1_openTab');
    notebooksTabContainer = document.getElementById('1_openTabContainer');
  };

  var cbBindNotebooks = function(err, notebooks) {
    if (err) {
      // TODO Show error to user.
      return;
    }
    try {
      var notebooksHTML = '';
      for (var i = 0, len = notebooks.length; i !== len; ++i) {
        notebooksHTML += '<li class="checkbox"><input type="checkbox" id="' + notebooks[i]._id + '">' +
          '<label for="' + notebooks[i]._id + '">' + notebooks[i].name + '</label></li>';
      }
      notebooksContainerUL.innerHTML = notebooksHTML;
      addNotebookSelectedEvent();
    } catch (e) {
      // TODO Show error to user.
      console.log(e);
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
        // TODO Show error to user.
        return;
      }

      AppUtil.loadPartial('notes.html', {}, function(err, notesPageHeaderHtml) {
        if (err) {
          // TODO Error while fetching the template, show error
          return;
        }
        var notebookContentID = AppConfig.getNotebookContentID(notebookID);

        // Add <li> to tab header
        notebooksTabHeading.innerHTML += '<li role="presentation" id="' + AppConfig.getNotebookHeaderID(
            notebookID) + '" class="active"><a href="#' + notebookContentID + '" aria-controls="' +
          notebookID + '" role="tab" data-toggle="tab">' + notebookData.name + '</a></li>';

        // Add the default content of the notebook.
        notebooksTabContainer.innerHTML += '<div role="tabpanel" class="tab-pane active" id="' +
            notebookContentID + '">' + notesPageHeaderHtml + '</div>';

        var notebookContents = document.getElementById(notebookContentID);
        addNotebookEvents(notebookContents, notebookID);

        // Build the notes html and attach the event handlers.
        NotesClient.buildNotesHtml(notebookData.notes, notebookID, notebookContents);

        // Add <div> to tab body
        notebookContents = null;
      });
    });
  }

  // Hides a notebook with the given ID
  function hideTab(notebookID) {
    var notebookHeader = notebooksTabHeading.querySelector('#' + AppConfig.getNotebookHeaderID(notebookID));
    if (notebookHeader) {
      notebookHeader.remove();
    }
    var notebookContents = notebooksTabContainer.querySelector('#' + AppConfig.getNotebookContentID(notebookID));

    // Cleanup!!
    removeNotebookEvents(notebookContents);
    if (notebookContents) {
      notebookContents.remove();
    }
    notebookContents = null;
  }

  function addNotebookEvents(notebookContents, notebookID) {
    // Add new note button handler..
    var btnAddNote = notebookContents.querySelector('.add-note');
    btnAddNote.addEventListener('click', evtAddNote);
    btnAddNote.dataset.notebookid = notebookID;
    btnAddNote = null;
  }

  /**
   * Private function used to remove and cleanup event handlers.
   * Also cleans up notes related events.
   */
  function removeNotebookEvents(notebookContents) {
    var btnAddNote = notebookContents.querySelector('.add-note');
    btnAddNote.removeEventListener('click', evtAddNote);
    btnAddNote = null;
    NotesClient.removeAllNoteEvents(notebookContents);
  }

  /**
   * Events
   */
  function evtAddNote(event) {
    var notebookID = this.dataset.notebookid;
    NotesClient.addNewNoteHtml(notebookID);
  }

  /**
   * End of events
   */

  return {
    cbBindNotebooks: cbBindNotebooks,
    init: init
  };
};

module.exports = NotebooksClient();
