'use strict';

var _async = require('async');
var _i18n = require('i18n');

var _appConfig = require(__dirname + '/../../config.js');

var _notebooksClient = require(_appConfig.browserSrcPath + 'notebooks/notebook-client');
var _appClient = require(_appConfig.browserSrcPath + 'app/app-client');
var _notesClient = require(_appConfig.browserSrcPath + 'notes/note-client');
var _settingsClient = require(_appConfig.browserSrcPath + 'settings/setting-client');

var _appError = require(_appConfig.commonsPath + 'app-error');

function onDOMReady() {

  function initializeApp(cbMain) {
    _async.waterfall([_appClient.init, _notebooksClient.init, function(cb) {
      _notesClient.init();
      _settingsClient.init();
      cb();
    }], function(err) {
      cbMain(err);
    });
  }

  // 1. Initialize the app
  // 2. Get and bind the list of notebooks
  // 3. Select the first notebook
  _async.waterfall([initializeApp, _notebooksClient.getAndBindNotebooks], function(err) {
    if (err) {
      err.display();
      return;
    }
    try {
      _notebooksClient.selectFirstNotebook();
    } catch (err) {
      var errObj = new _appError(err, _i18n.__('errors.app_init'));
      errObj.display();
    }
  });
}

document.addEventListener('DOMContentLoaded', onDOMReady, false);
