const chokidar = require('chokidar');

class FileWatcher {
  constructor(dir, pattern) {
      this.dir = dir || "/Users/patrick/Downloads/bank_statements";
      this.pattern = pattern || "*.csv";
      this.files = `${this.dir}/${this.pattern}`;
      this.watcher = null;
  }

  startWatching(callfunc) {
      this.watcher = chokidar.watch(this.files, { awaitWriteFinish: true });

      this.watcher.on('all', (event, path) => {
        //   console.log("Calling ", callfunc, " with ", event, path);
          callfunc(path);
      });
  }
}

module.exports = FileWatcher;