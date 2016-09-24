'use strict';

var path = require('path');
/**
 * Contains functions that run at app startup. Also supplies references to the
 * databases used by the app.
 */
var _app = require(path.join(__dirname, 'app'));
var _appEvents = require(path.join(__dirname, 'app-events'));

var AppClient = function() {
  var dbObjs = {};
  var timeSpent = null;
  var notesCompleted = null;

  /**
   * Called when the application starts.
   * - Checks if the databases are present, if not creates and
   * loads them into memory.
   * - Checks if the default data is present in the database.
   */
  var _init = function(cbMain) {
    _app.init(cbMain);
    _appEvents.init();
    timeSpent = document.getElementById('timeSpend_1');
    notesCompleted = document.getElementById('notesCompleted_1');
  };

  var _statusBar = {
    setCompletedNotes: function(completedNotes, totalNotes) {
      notesCompleted.innerHTML = completedNotes  + '/' + totalNotes + ' completed';
    }
  };

  return {
    init: _init,
    statusBar: _statusBar
  };
};

module.exports = new AppClient();
