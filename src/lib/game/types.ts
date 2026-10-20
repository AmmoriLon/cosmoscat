export type Phase = "intro" | "hangar" | "launch" | "ops";

export type SystemId = "rocket" | "booster" | "sat";

export type Biome =
  | "port"
  | "fields"
  | "storm"
  | "ice"
  | "city"
  | "coast"
  | "mine"
  | "desert";

export type JobStage = "onboard" | "downlink" | "processing" | "ready";

export type ContractStatus = "offered" | "active" | "pipeline" | "done";

export interface PPI {
  id: string;
  name: string;
  short: string;
  lat: number;
  lon: number;
}

export interface ContractTemplate {
  id: string;
  client: string;
  role: string;
  title: string;
  brief: string;
  lat: number;
  lon: number;
  biome: Biome;
  payout: number;
  fur: string;
}

export interface Contract extends ContractTemplate {
  status: ContractStatus;
  seed: number;
  cloud: number;
}

export interface PhotoJob {
  contractId: string;
  stage: JobStage;
  progress: number;
  ppiId?: string;
  capturedAt: number;
}

export interface LogEntry {
  id: string;
  t: number;
  text: string;
}

export interface GameState {
  version: 1;
  phase: Phase;
  introStep: number;
  money: number;
  repairs: Record<SystemId, number>;
  focused: SystemId;
  opticsLevel: number;
  operatorsLevel: number;
  photosSold: number;
  moneyEarned: number;
  orbits: number;
  contracts: Contract[];
  job: PhotoJob | null;
  log: LogEntry[];
  launchT: number;
  seenRadarBrief: boolean;
}

export interface SimSnapshot {
  anomaly: number;
  earthAngle: number;
  satLat: number;
  satLon: number;
  inImaging: string[];
  approaching: string[];
  inPpi: string[];
}

export interface SimRef {
  current: SimSnapshot;
}
