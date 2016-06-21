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

  /**
   * Called when the application starts.
   * - Checks if the databases are present, if not creates and
   * loads them into memory.
   * - Checks if the default data is present in the database.
   */
  var _init = function(cbMain) {
    _app.init(cbMain);
    _appEvents.init();
  };

  return {
    init: _init
  };
};

module.exports = new AppClient();
