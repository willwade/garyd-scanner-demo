export type SwitchAction =
  | 'select'
  | 'step'
  | 'reset'
  | 'cancel'
  | 'menu'
  | 'switch-1'
  | 'switch-2'
  | 'switch-3'
  | 'switch-4'
  | 'switch-5'
  | 'switch-6'
  | 'switch-7'
  | 'switch-8';

export interface ScanItemData {
  label?: string;
  isEmpty?: boolean;
}

export interface ScanItemStyle {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  boxShadow?: string;
  opacity?: number;
}

export interface FocusMeta {
  phase?: 'major' | 'minor' | 'item';
  scanRate?: number;
  scanPattern?: string;
  scanTechnique?: string;
  scanDirection?: string;
}

export type ContinuousTechnique = 'gliding' | 'crosshair' | 'eight-direction';
export type ContinuousState =
  | 'x-scan'
  | 'y-scan'
  | 'x-scanning'
  | 'x-capturing'
  | 'y-scanning'
  | 'y-capturing'
  | 'direction-scan'
  | 'moving'
  | 'processing';

export interface ContinuousUpdate {
  technique: ContinuousTechnique;
  state: ContinuousState;
  xPos: number;
  yPos: number;
  bufferLeft: number;
  bufferRight: number;
  bufferTop: number;
  bufferBottom: number;
  fineXPos: number;
  fineYPos: number;
  lockedXPosition: number;
  compassAngle: number;
  currentDirection: number;
  directionName: string;
  directionDx: number;
  directionDy: number;
}

export interface ScanSurface {
  getItemsCount(): number;
  getColumns(): number;
  setFocus(indices: number[], meta?: FocusMeta): void;
  setSelected(index: number): void;
  getItemData?(index: number): ScanItemData | null;
  setItemStyle?(index: number, style: ScanItemStyle): void;
  clearItemStyles?(): void;
  getContainerElement?(): HTMLElement | null;
  resolveIndexAtPoint?(xPercent: number, yPercent: number): number | null;
}

export interface ScanCallbacks {
  onScanStep?: () => void;
  onSelect?: (index: number) => void;
  onRedraw?: () => void;
  onContinuousUpdate?: (state: ContinuousUpdate) => void;
}

export interface CriticalOverscanConfig {
  enabled: boolean;
  fastRate: number;
  slowRate: number;
}

export interface ColorCodeConfig {
  errorRate: number;
  selectThreshold: number;
}

export interface ScanConfig {
  scanRate: number;
  scanInputMode: 'auto' | 'manual';
  scanDirection: 'circular' | 'reverse' | 'oscillating';
  scanPattern: 'row-column' | 'column-row' | 'linear' | 'snake' | 'quadrant' | 'elimination';
  scanTechnique: 'block' | 'point';
  scanMode: 'group-row-column' | 'continuous' | 'probability' | 'cause-effect' | 'color-code' | null;
  continuousTechnique: ContinuousTechnique;
  compassMode: 'continuous' | 'fixed-8';
  eliminationSwitchCount: 2 | 3 | 4 | 5 | 6 | 7 | 8;
  allowEmptyItems: boolean;
  initialItemPause: number;
  scanLoops: number;
  criticalOverscan: CriticalOverscanConfig;
  colorCode: ColorCodeConfig;
}

export interface ScanConfigProvider {
  get(): ScanConfig;
}
