const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs').promises;
const Queue = require('better-queue');

class FileWatcher {
  constructor(callfunc, postProcessingFunc) {
    this.callfunc = callfunc;
    this.postProcessingFunc = postProcessingFunc;

    this.queue = new Queue(async (filePath, cb) => {
      await this.callfunc(filePath);
      cb();
    }, { concurrent: 1 });

    this.watcher = null;
    this.queueEmptyTimeout = null;

    // Process the queue
    this.queue.on('drain', () => {
      this.resetQueueEmptyTimeout();
    });
  }

  resetQueueEmptyTimeout() {
    if (this.queueEmptyTimeout) {
      clearTimeout(this.queueEmptyTimeout);
    }
    this.queueEmptyTimeout = setTimeout(() => {
      if (this.queue.length === 0 && this.postProcessingFunc) {
        this.postProcessingFunc();
      }
    }, 3000);
  }

  startWatching(directory,processed) {

    this.watcher = chokidar.watch(directory, { 
      awaitWriteFinish: true, 
      ignored: processed
    });

    this.watcher.on('all', (event, filePath) => {
      if (event === "add" && /\.csv$/i.test(filePath)) {
        this.queue.push(filePath);
      }
    });
  }
}

module.exports = FileWatcher;
