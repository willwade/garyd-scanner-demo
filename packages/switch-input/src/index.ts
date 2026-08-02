export type {
  SwitchInputPort,
  Unsubscribe,
} from './port';

export {
  GestureEngine,
  createManualGestureEngine,
  type GestureEngineOptions,
  type GestureEvent,
  type GestureEventType,
  type GestureListener,
} from './gestureEngine';

export {
  KeyboardAdapter,
  attachKeyboard,
  type KeyboardBindings,
  type KeyboardAdapterOptions,
} from './keyboardAdapter';

export {
  PointerAdapter,
  attachPointer,
  type PointerAdapterOptions,
} from './pointerAdapter';

export {
  connectToScanner,
  type SwitchBinding,
  type SwitchBindings,
  type ScannerLike,
} from './scannerBridge';

export {
  UsahpAdapter,
  attachUsahp,
  USAHP_DEFAULT_URL,
  type UsahpAdapterOptions,
  type UsahpStatus,
  type UsahpSocket,
} from './usahpAdapter';
