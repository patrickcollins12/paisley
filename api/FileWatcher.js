const chokidar = require('chokidar');
const path = require('path');

class FileWatcher {
  constructor(dir, pattern) {
      this.dir = dir
      this.pattern = pattern;
      this.files = path.join(this.dir,this.pattern);
      this.watcher = null;
  }

  startWatching(callfunc) {
    console.log(callfunc);
    this.watcher = chokidar.watch (this.files, { awaitWriteFinish: true });

    this.watcher.on('all', (event, path) => {
      //   console.log("Calling ", callfunc, " with ", event, path);
        callfunc(path);
    });
  }
}

module.exports = FileWatcher;