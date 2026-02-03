import { SwitchScannerElement } from './SwitchScannerElement';

if (!customElements.get('switch-scanner')) {
  customElements.define('switch-scanner', SwitchScannerElement);
}
