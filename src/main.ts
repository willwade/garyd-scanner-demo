import './style.css'
import { SwitchScannerElement } from './SwitchScannerElement';
import { adviseSettings } from './ScanSettingsAdvisor';

customElements.define('switch-scanner', SwitchScannerElement);

console.log('Switch Scanner Web Component Registered');

(window as any).ScanSettingsAdvisor = {
  adviseSettings
};
