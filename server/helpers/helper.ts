import { cpus } from 'os';

export function getWorkerCount() {
  return Math.max(cpus().length, 2);
}
