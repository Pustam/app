/*************************************************
 * Contains code to communicate with the Notes
 * database and the business logic as well.
 * @author : Abijeet Patro 
 *************************************************/

'use strict';

var AppConfig = require(__dirname + '/../config.js');
var NotesApp = require(AppConfig.srcPath + 'notes-app.js');
var AppError = require(AppConfig.helperPath + 'app-error.js');

var Notes = function() {
  var getAllNotesByID = function(notebookID, cbMain) {
    // Fetch all the notes in a given notebookID
    var notesDb = NotesApp.getNotesDb();
    notesDb.find({
      notebookID: notebookID
    }, function(err, notes) {
      if (err) {
        return cbMain(new AppError(err, 'There was an error while fetching your notes.'));
      }
      return cbMain(null, notes);
    });
  };

  return {
    getAllNotesByID: getAllNotesByID
  };
};

module.exports = Notes();
