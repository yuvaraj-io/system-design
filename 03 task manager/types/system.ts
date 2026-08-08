export interface SystemCpuInfo {
  cores: number;
  averageUtilizationPercent: number;
  loadAverage: [number, number, number];
  perCore: { core: number; utilizationPercent: number }[];
}

export interface SystemMemoryInfo {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  utilizationPercent: number;
}

export interface SystemSwapInfo {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  utilizationPercent: number;
}

export interface SystemDiskInfo {
  path: string;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  utilizationPercent: number;
}

export interface SystemNetworkInfo {
  bytesIn: number | null;
  bytesOut: number | null;
  note: string | null;
}

export interface SystemSnapshot {
  timestamp: string;
  host: string;
  platform: NodeJS.Platform;
  processCount: number;
  threadCount: number | null;
  cpu: SystemCpuInfo;
  memory: SystemMemoryInfo;
  swap: SystemSwapInfo;
  disk: SystemDiskInfo;
  network: SystemNetworkInfo;
}
