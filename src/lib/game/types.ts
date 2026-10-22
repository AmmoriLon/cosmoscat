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
  | "desert"
  | "volcano"
  | "forest"
  | "aurora";

export type CameraId = "opt" | "ir" | "ms";
export type OrbitId = "sso535" | "eq400" | "polar800" | "ellip";
export type MemoryId = "bzu1" | "bzu4" | "bzu16";
export type HullId = "cubesat" | "irbus" | "msbus" | "combo" | "polar" | "molniya" | "bus";
export type CraftStatus = "alive" | "reentry" | "failed";
export type OpsTab = "contracts" | "fleet";

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
  camera: CameraId;
}

export interface Contract extends ContractTemplate {
  status: ContractStatus;
  seed: number;
  cloud: number;
}

export interface PhotoJob {
  id: string;
  craftId: string;
  contractId: string;
  stage: JobStage;
  progress: number;
  ppiId?: string;
  capturedAt: number;
}

export interface CraftEvent {
  id: string;
  at: number;
  kind: string;
  title: string;
  detail: string;
}

export interface Craft {
  id: string;
  name: string;
  orbit: OrbitId;
  cameras: CameraId[];
  memory: MemoryId;
  hull: HullId;
  phase: number;
  launchedAt: number;
  status: CraftStatus;
  events: CraftEvent[];
  lifeCut: number;
}

export type AssemblyStep = "gear" | "bolts" | "flash" | "verdict";
export type BuildGrade = "good" | "mid" | "bad";

export interface Assembly {
  craft: Craft;
  step: AssemblyStep;
  scores: number[];
}

export interface WorkshopDraft {
  name: string;
  orbit: OrbitId;
  cameras: CameraId[];
  memory: MemoryId;
}

export interface LogEntry {
  id: string;
  t: number;
  text: string;
}

export interface GameState {
  version: 3;
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
  timeSec: number;
  tab: OpsTab;
  contracts: Contract[];
  jobs: PhotoJob[];
  crafts: Craft[];
  activeCraftId: string | null;
  workshop: WorkshopDraft | null;
  assembly: Assembly | null;
  pendingCraft: Craft | null;
  log: LogEntry[];
  launchT: number;
  seenRadarBrief: boolean;
}

export interface SimSnapshot {
  clock: number;
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
