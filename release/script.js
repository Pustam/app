'use strict';

var packager = require('electron-packager');

var options = {
  "dir" : ".",
  "name" : "markdown-notes",
  "platform" : ["linux","win32"],
  "version" : "0.37.6",
  "out" : "/home/abijeet/Projects/markdown-notes/releases/",
  "icon" : "/home/abijeet/Pictures/markdown-notes-ico.png",
  "app-version" : "0.3.0",
  "arch" : "x64",
  "ignore" : ["settings.json", "release", "Gruntfile.js", ".bowerrc",
    "node_modules/grunt", "node_modules/grunt-jsbeautifier", ".jshintrc"]
};

console.log('Packaging app with following settings --\n\n');
console.log(options);

packager(options, function done (err, appPath) {
  if(err) {
    console.log('There was an error while packaging the app.');
    console.log('---------------------------------------\n\n');
  } else {
    console.log('App packaged successfully!');
  }
});
