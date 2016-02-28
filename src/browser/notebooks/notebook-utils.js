'use strict';
var _i18n = require('i18n');

var NotebookUtils = function () {
  function getNotebookItem(notebook, isChecked) {
    var checkedHTML = '';
    if (isChecked) {
      checkedHTML = 'checked';
    }
    return '<li class="checkbox"><input type="checkbox" ' + checkedHTML + ' id="' + notebook._id + '">' +
      '<label for="' + notebook._id + '">' + notebook.name + '</label></li>';
  }

  function removeActiveTab(notebooksTabHeading, notebooksTabContainer) {
    var activeTab = notebooksTabHeading.querySelector('.active');
    if (activeTab) {
      activeTab.classList.remove('active');
    }

    var activeTabContainer = notebooksTabContainer.querySelector('.active');
    if (activeTabContainer) {
      activeTabContainer.classList.remove('active');
    }
  }

  function getHeaderHTML(notebookHeaderID, notebookContentID, notebookID, notebookName) {
    return '<li role="presentation" id="' + notebookHeaderID + '" class="active"><a href="#' + notebookContentID + '" aria-controls="' +
      notebookID + '" role="tab" data-toggle="tab">' + notebookName + '</a></li>'
  }
  
  function getContainerHTML(notebookContentID, notesPageHeaderHtml) {
    return '<div role="tabpanel" class="tab-pane active" id="' +
            notebookContentID + '">' + notesPageHeaderHtml + '</div>'
  }
  
  function getEmptyHTML(notebookClass) {
    return '<div class="' + notebookClass + '">' + _i18n.__('notebook.empty_notebook') + '</div>';
  }
  
  function selectFirst(notebooksContainerUL) {
    // Check the first checkbox.
    var firstChkBox = notebooksContainerUL.querySelector('input[type="checkbox"]');
    firstChkBox.checked = true;

    // Then simulate the change event.
    var changeEvent = new Event('HTMLEvents');
    changeEvent.initEvent("change", false, true);
    firstChkBox.dispatchEvent(changeEvent);
  }
  
  function checkAndReturn(callback, err, data) {
    if (callback) {
      return callback(err, data);
    }
  }
  
  function getOpenNotebooks(containerUL) {
    var checkedBoxes = containerUL.querySelectorAll(':checked');
    var selectedNotebookIds = [];
    for (var i = 0; i !== checkedBoxes.length; ++i) {
      selectedNotebookIds.push(checkedBoxes[i].id);
    }
    return selectedNotebookIds;
  }
  
  function removeCheckbox(notebookID) {
    var chkNotebook = document.getElementById(notebookID);
    if (!chkNotebook) {
      return;
    }
    chkNotebook.parentNode.remove();
  }
    
  return {
    getNotebookItem: getNotebookItem,
    removeActiveTab: removeActiveTab,
    getHeaderHTML: getHeaderHTML,
    getContainerHTML: getContainerHTML,
    getEmptyHTML: getEmptyHTML,
    selectFirst: selectFirst,
    checkAndReturn: checkAndReturn,
    getOpenNotebooks: getOpenNotebooks,
    removeCheckbox: removeCheckbox
  };
};

module.exports = NotebookUtils();