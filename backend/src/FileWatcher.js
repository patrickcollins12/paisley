const chokidar = require('chokidar');
const Queue = require('better-queue');

// chokidar is a file watcher and better-queue is a very simple in memory queue manager.
//
// Strategy:
// We monitor for CSV files appearing and put them in a queue for processing.
// when the queue has been empty for 1 second, we call the postProcessingFunc
// 
// The predominant post processing activity is the "classification" exercise.
// The reason for this queuing and waiting is so that we can run the classifier 
// over all rules (r) ONCE for each new transaction file (r) after all of the file
//  processing has complete... this means the classification 
// process is O(r) instead of O(r*t) which matters a lot when you're 
// loading 500 CSV files.

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
    }, 1000);
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
