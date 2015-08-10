var packager = require('electron-packager');
var config = require(__dirname + '/../config.js');

if(config.isDevelopment) {
  console.log('Development mode is still on!!');
  return;
}

var options = {
  "dir" : ".",
  "name" : "markdown-notes",
  "platform" : ["linux","win32"],
  "version" : "0.30.1",
  "out" : "/home/abijeet/Projects/markdown-notes/releases/",
  "icon" : "/home/abijeet/Pictures/markdown-notes-ico.png",
  "app-version" : "0.2.0",
  "arch" : "x64",
  "ignore" : ["settings.json", "markdown-notes/utils", "Gruntfile.js", ".bowerrc",
    "node_modules/grunt", "node_modules/grunt-jsbeautifier", "logs/error.log"],
  "overwrite" : true
}

packager(options, function done (err, appPath) {
  if(err) {
    console.log('There was an error while building the release.')
    console.log('\n------- ERROR ------- \n');
    console.log(err);
  } else {
    console.log('SUCCESS ---- Application built!');
  }
})
