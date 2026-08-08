import os from "node:os";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Worker } from "node:worker_threads";

const STORAGE_DIR = join(process.cwd(), "stress-storage");

const CPU_WORKER_CODE = `
const { parentPort } = require("node:worker_threads");
while (parentPort) {
  let total = 0;
  for (let i = 0; i < 8000000; i += 1) {
    total += Math.sqrt(i) * Math.sin(i);
  }
  parentPort.postMessage({ total });
}
`;

const THREAD_WORKER_CODE = `
const { parentPort } = require("node:worker_threads");
parentPort.on("message", (message) => {
  if (message === "stop") process.exit(0);
});
setInterval(() => {}, 2147483647);
`;

function createWorker(code) {
  return new Worker(code, { eval: true });
}

class StressManager {
  constructor() {
    this.cpuWorkers = [];
    this.memoryChunks = [];
    this.storageFiles = [];
    this.threadWorkers = [];
    this.lastError = null;
    this.active = {
      cpu: false,
      memory: false,
      storage: false,
      threads: false,
    };
    this.config = {
      cpuWorkers: 0,
      memoryMB: 0,
      storageMB: 0,
      threadWorkers: 0,
    };
    this.stats = {
      loopsCompleted: 0,
      memoryAllocatedMB: 0,
      storageAllocatedMB: 0,
      storageFiles: 0,
      threadWorkersSpawned: 0,
    };
  }

  getStatus() {
    return {
      active: { ...this.active },
      config: { ...this.config },
      stats: { ...this.stats },
      lastError: this.lastError,
    };
  }

  startCpu(workerCount = os.cpus().length) {
    this.stopCpu();
    this.lastError = null;

    const count = Math.max(1, Math.min(workerCount, os.cpus().length));
    this.cpuWorkers = Array.from({ length: count }, () => {
      const worker = createWorker(CPU_WORKER_CODE);
      worker.on("message", () => {
        this.stats.loopsCompleted += 1;
      });
      worker.on("error", (error) => {
        this.lastError = error.message;
        this.active.cpu = false;
      });
      return worker;
    });

    this.active.cpu = true;
    this.config.cpuWorkers = count;
  }

  stopCpu() {
    for (const worker of this.cpuWorkers) {
      worker.terminate().catch(() => {});
    }
    this.cpuWorkers = [];
    this.active.cpu = false;
    this.config.cpuWorkers = 0;
  }

  startMemory(targetMB = 512) {
    this.stopMemory();
    this.lastError = null;

    const chunkSize = 8 * 1024 * 1024;
    const chunksNeeded = Math.ceil((targetMB * 1024 * 1024) / chunkSize);

    for (let i = 0; i < chunksNeeded; i += 1) {
      this.memoryChunks.push(Buffer.alloc(chunkSize, 1));
    }

    this.active.memory = true;
    this.config.memoryMB = targetMB;
    this.stats.memoryAllocatedMB = targetMB;
  }

  stopMemory() {
    this.memoryChunks = [];
    this.active.memory = false;
    this.config.memoryMB = 0;
    this.stats.memoryAllocatedMB = 0;
  }

  async startStorage(targetMB = 512) {
    await this.stopStorage();
    this.lastError = null;

    await mkdir(STORAGE_DIR, { recursive: true });

    const chunkSize = 32 * 1024 * 1024;
    const totalBytes = targetMB * 1024 * 1024;
    let writtenBytes = 0;
    let fileIndex = 0;

    while (writtenBytes < totalBytes) {
      const remaining = totalBytes - writtenBytes;
      const size = Math.min(chunkSize, remaining);
      const filePath = join(STORAGE_DIR, `storage-block-${fileIndex}.bin`);

      await writeFile(filePath, Buffer.alloc(size, 9));
      this.storageFiles.push(filePath);

      writtenBytes += size;
      fileIndex += 1;
    }

    this.active.storage = true;
    this.config.storageMB = targetMB;
    this.stats.storageAllocatedMB = targetMB;
    this.stats.storageFiles = this.storageFiles.length;
  }

  async stopStorage() {
    this.storageFiles = [];
    this.active.storage = false;
    this.config.storageMB = 0;
    this.stats.storageAllocatedMB = 0;
    this.stats.storageFiles = 0;

    try {
      await rm(STORAGE_DIR, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }

  async startThreads(workerCount = 100) {
    await this.stopThreads();
    this.lastError = null;

    const count = Math.max(1, Math.min(workerCount, 200));
    const batchSize = 25;
    const workers = [];

    for (let index = 0; index < count; index += batchSize) {
      const end = Math.min(index + batchSize, count);

      for (let workerIndex = index; workerIndex < end; workerIndex += 1) {
        try {
          const worker = createWorker(THREAD_WORKER_CODE);
          worker.on("error", (error) => {
            this.lastError = error.message;
          });
          workers.push(worker);
        } catch (error) {
          this.lastError = error.message;
          throw error;
        }
      }

      this.threadWorkers = workers;
      await new Promise((resolve) => setImmediate(resolve));
    }

    this.active.threads = workers.length > 0;
    this.config.threadWorkers = workers.length;
    this.stats.threadWorkersSpawned = workers.length;
  }

  async stopThreads() {
    for (const worker of this.threadWorkers) {
      worker.postMessage("stop");
      await worker.terminate().catch(() => {});
    }

    this.threadWorkers = [];
    this.active.threads = false;
    this.config.threadWorkers = 0;
    this.stats.threadWorkersSpawned = 0;
  }

  async stopAll() {
    this.stopCpu();
    this.stopMemory();
    await this.stopStorage();
    await this.stopThreads();
    this.lastError = null;
    this.stats = {
      loopsCompleted: 0,
      memoryAllocatedMB: 0,
      storageAllocatedMB: 0,
      storageFiles: 0,
      threadWorkersSpawned: 0,
    };
  }
}

const globalKey = "__systemStressManager";

if (!globalThis[globalKey]) {
  globalThis[globalKey] = new StressManager();
}

export const stressManager = globalThis[globalKey];
