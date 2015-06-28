/*global AppConfig */

'use strict';

var NotesApp = require(AppConfig.srcPath + 'notes-app.js');
var Notebooks = require(AppConfig.srcPath + 'notebooks.js');
var NotebooksClient = require(AppConfig.browserSrcPath + 'notebooks-client.js');
var AppClient = require(AppConfig.browserSrcPath + 'app-client.js');
var async = require('async');

function onDOMReady() {
  // Inititalize classes
  AppClient.init();
  NotebooksClient.init();


  // 1. Initialize the app
  // 2. Get the list of notebooks
  // 3. Bind the notebooks
  async.waterfall([NotesApp.init, Notebooks.getAllNotebooks], function(err, notebooks) {
    if (err) {
      // TODO Show error to user.
      return;
    }
    NotebooksClient.cbBindNotebooks(notebooks);
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
  });
}

document.addEventListener('DOMContentLoaded', onDOMReady, false);
