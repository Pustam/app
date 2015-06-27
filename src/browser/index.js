/* global AppConfig */
'use strict'

var NotesApp = require(AppConfig.srcPath + 'notes-app.js');
var Notebooks = require(AppConfig.srcPath + 'notebooks.js');
var NotebooksClient = require(AppConfig.browserSrcPath + 'notebooks-client.js');
var async = require('async');

function onDOMReady() {
  // Inititalize classes
  NotebooksClient.init();


  // 1. Initialize the app
  // 2. Get the list of notebooks
  // 3. Bind the notebooks
  async.waterfall([NotesApp.init, Notebooks.getAllNotebooks], NotebooksClient.cbBindNotebooks);
}

document.addEventListener('DOMContentLoaded', onDOMReady, false);
