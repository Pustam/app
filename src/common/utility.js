'use strict';

var _i18n = require('i18n');
var _ejs = require('ejs');
var _fs = require('fs');

// Custom
var _appConfig = require(__dirname + '/../../config.js');
var _appError = require(_appConfig.commonsPath + 'app-error.js');

_i18n.configure(_appConfig.i18nConfiguration);

var Utility = function() {
  var loadPartial = function(partialName, data, callback) {
    loadTemplateFile(partialName, false, data, callback);
  };

  var loadDialog = function(dialogName, data, callback) {
    loadTemplateFile(dialogName, true, data, callback);
  };

  function loadTemplateFile(fileName, isDialog, data, callback) {
    try {
      if (typeof data === 'undefined' || !data) {
        data = {
          AppUtil: new Utility(),
          i18n: _i18n,
          basePath: _appConfig.basePath
        };
      } else {
        data.AppUtil = new Utility();
        data.i18n = _i18n;
        data.basePath = _appConfig.basePath;
      }
      var fileToLoad = '';
      if (isDialog) {
        fileToLoad = _appConfig.dialogsPath + fileName;
      } else {
        fileToLoad = _appConfig.partialsPath + fileName;
      }
      _fs.readFile(fileToLoad, 'utf-8', function(err, htmlFile) {
        if (err) {
          data.AppUtil = null;
          return callback(new _appError(err, _i18n.__('error.partial_load_error', fileToLoad)));
        }
        var tmpl = _ejs.compile(htmlFile);
        var str = tmpl(data);
        data.AppUtil = null;

        return callback(null, str);
      });
    } catch (e) {
      return callback(new _appError(e, _i18n.__('error.partial_load_error', fileName)));
    }
  }

  var mvFile = function(oldPath, newPath, cbMain) {
    var source = _fs.createReadStream(oldPath);
    var dest = _fs.createWriteStream(newPath);

    source.pipe(dest);
    source.on('end', function() {
      _fs.unlink(oldPath, function(err) {
        if (err) {
          return cbMain(new _appError(err, 'There was an error while moving the file.'));
        }
        return cbMain();
      });
    });

    source.on('error', function(err) {
      return cbMain(new _appError(err, 'There was an error while moving the file.'));
    });
  };

  function checkAndInsertDialog(err, html, errMsg) {
    if (err) {
      var errParse = new _appError(err, errMsg, false, true);
      errParse.display();
      return false;
    }
    document.querySelector('body').insertAdjacentHTML('beforeend', html);
    return true;
  }

  function addCloseEvent($dlg, cbOnClose) {
    $dlg.on('hidden.bs.modal', function() {
      $dlg.off('hidden.bs.modal');
      if(cbOnClose) {
        cbOnClose();
      }
      $dlg = null;
      this.remove();
    });
  }

  function readFormData(formElements) {
    var formData = {};
    for(var i = 0, len = formElements.length; i !== len; ++i) {
      var elem = formElements[i];
      if(elem.type === 'button' || elem.name === "") {
        continue;
      }
      var ctrlName = elem.name;
      var ctrlVal = elem.value;
      if(ctrlVal) {
        formData[ctrlName] = ctrlVal;
      }
    }
    return formData;
  }

  return {
    loadPartial: loadPartial,
    loadDialog: loadDialog,
    mvFile: mvFile,
    checkAndInsertDialog : checkAndInsertDialog,
    addCloseEvent : addCloseEvent
  };
};

module.exports = new Utility();
