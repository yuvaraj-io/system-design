import { parentPort } from "node:worker_threads";

parentPort.on("message", (message) => {
  if (message === "stop") {
    process.exit(0);
  }
});

setInterval(() => {}, 60_000);
