const chokidar = require('chokidar');
const path = require('path');

class FileWatcher {
  constructor(dir,processed) {
      this.dir = dir
      this.processed = processed
      this.watcher = null;
  }

  startWatching(callfunc) {
    // console.log(callfunc);
    this.watcher = chokidar.watch (this.dir, { 
      awaitWriteFinish: true, 
      ignored: this.processed
    });

    this.watcher.on('all', (event, path) => {
      //   console.log("Calling ", callfunc, " with ", event, path);
      let re = /\.csv$/i;
      if (re.test(path)) {
        callfunc(path);
      }

    });
  }
}

module.exports = FileWatcher;