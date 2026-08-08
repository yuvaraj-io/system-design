import { parentPort } from "node:worker_threads";

while (parentPort) {
  let total = 0;
  for (let i = 0; i < 8_000_000; i += 1) {
    total += Math.sqrt(i) * Math.sin(i);
  }
  parentPort.postMessage({ total });
}
