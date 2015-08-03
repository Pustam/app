var packager = require('electron-packager');

var options = {
  "dir" : ".",
  "name" : "markdown-notes",
  "platform" : ["linux","win32"],
  "version" : "0.30.1",
  "out" : "/home/abijeet/Projects/markdown-notes/releases/",
  "icon" : "/home/abijeet/Pictures/markdown-notes-ico.png",
  "app-version" : "0.1.3",
  "arch" : "x64",
  "ignore" : ["settings.json", "utils", "Gruntfile.js", ".bowerrc",
    "node_modules/grunt", "node_modules/grunt-jsbeautifier"]
}

packager(options, function done (err, appPath) { })
