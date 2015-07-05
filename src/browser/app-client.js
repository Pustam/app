/*global AppConfig */

'use strict';

var AppUtil = require(AppConfig.helperPath + 'utility.js');

var AppClient = function() {
  var init = function() {
    // Shortcuts button clicked.
    document.getElementById('1_btnShortcutHelp').addEventListener('click', showShortcutDialog, false);
  };

  function showShortcutDialog() {
    AppUtil.loadDialog('shortcuts-help.html', {}, function(err, html) {
      if (err) {
        var errParse = new AppError(err, i18n.__('error.shortcut_dialog_display'), false, true);
        errParse.display();
        return;
      }
      document.querySelector('body').insertAdjacentHTML('beforeend', html);
      var $dlg = jQuery('#dlgShortcutHelp');
      $dlg.modal('show');

      $dlg.on('hidden.bs.modal', function() {
        $dlg.off('hidden.bs.modal');
        this.remove();
      });
    });
  }

  return {
    init: init
  };
};

module.exports = AppClient();
