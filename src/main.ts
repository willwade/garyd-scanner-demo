import './style.css'
import { ConfigManager, AppConfig } from './ConfigManager';
import { AudioManager } from './AudioManager';
import { SwitchInput } from './SwitchInput';
import { GridRenderer, GridItem } from './GridRenderer';
import { SettingsUI } from './SettingsUI';

import { Scanner } from './scanners/Scanner';
import { RowColumnScanner } from './scanners/RowColumnScanner';
import { LinearScanner } from './scanners/LinearScanner';
import { SnakeScanner } from './scanners/SnakeScanner';
import { QuadrantScanner } from './scanners/QuadrantScanner';
import { GroupScanner } from './scanners/GroupScanner';
import { EliminationScanner } from './scanners/EliminationScanner';
import { ContinuousScanner } from './scanners/ContinuousScanner';
import { ProbabilityScanner } from './scanners/ProbabilityScanner';

console.log('Scanner Demo Initialized');

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  const configManager = new ConfigManager();
  const audioManager = new AudioManager(configManager.get().soundEnabled);
  const switchInput = new SwitchInput(configManager);

  const gridRenderer = new GridRenderer('grid-container');
  const settingsUI = new SettingsUI(configManager);

  // Grid Generation
  const generateNumbers = (size: number) => {
    const items: GridItem[] = [];
    for (let i = 1; i <= size; i++) {
      items.push({
        id: `item-${i}`,
        label: i.toString(),
        type: 'action'
      });
    }
    return items;
  };

  const generateKeyboard = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz".split('');
    // Add common punctuation
    chars.push(' ', '.', ',', '?', '!');
    // Add controls
    chars.push('Backspace', 'Clear', 'Enter');

    return chars.map((c, i) => ({
       id: `key-${i}`,
       label: c === ' ' ? 'Space' : c,
       type: 'char' as const
    }));
  };

  const updateGrid = (config: AppConfig) => {
      let items: GridItem[];
      if (config.gridContent === 'keyboard') {
          items = generateKeyboard();
      } else {
          items = generateNumbers(config.gridSize);
      }
      gridRenderer.render(items);
  };

  // Initial Render
  updateGrid(configManager.get());

  // Scanner Management
  let currentScanner: Scanner | null = null;

  const createScanner = (type: AppConfig['scanStrategy']): Scanner => {
    switch (type) {
      case 'linear': return new LinearScanner(gridRenderer, configManager, audioManager);
      case 'snake': return new SnakeScanner(gridRenderer, configManager, audioManager);
      case 'quadrant': return new QuadrantScanner(gridRenderer, configManager, audioManager);
      case 'group-row-column': return new GroupScanner(gridRenderer, configManager, audioManager);
      case 'elimination': return new EliminationScanner(gridRenderer, configManager, audioManager);
      case 'continuous': return new ContinuousScanner(gridRenderer, configManager, audioManager);
      case 'probability': return new ProbabilityScanner(gridRenderer, configManager, audioManager);
      case 'row-column':
      default:
        return new RowColumnScanner(gridRenderer, configManager, audioManager);
    }
  };

  const setScanner = (type: AppConfig['scanStrategy']) => {
    if (currentScanner) {
      currentScanner.stop();
    }
    currentScanner = createScanner(type);
    currentScanner.start();
  };

  // Start initial scanner
  setScanner(configManager.get().scanStrategy);

  // Config Subscription
  configManager.subscribe((cfg) => {
    audioManager.setEnabled(cfg.soundEnabled);

    // Check if content changed
    const currentMode = gridRenderer.getItem(0)?.type === 'char' ? 'keyboard' : 'numbers';
    if (currentMode !== cfg.gridContent) {
        updateGrid(cfg);
    } else if (cfg.gridContent === 'numbers' && gridRenderer.getItemsCount() !== cfg.gridSize) {
        updateGrid(cfg);
    }

    setScanner(cfg.scanStrategy);
  });

  // Switch Handling
  switchInput.addEventListener('switch', (e: Event) => {
    const detail = (e as CustomEvent).detail;

    if (detail.action === 'menu') {
        settingsUI.toggle();
        return;
    }

    if (currentScanner) {
      currentScanner.handleAction(detail.action);
    }
  });

  window.addEventListener('scanner:selection', (e: Event) => {
    const item = (e as CustomEvent).detail.item;
    const output = document.getElementById('output-text');
    if (output) {
      if (item.label === 'Backspace') {
          output.textContent = output.textContent?.slice(0, -1) || '';
      } else if (item.label === 'Clear') {
          output.textContent = '';
      } else if (item.label === 'Enter') {
          output.textContent += '\n';
      } else if (item.label === 'Space') {
          output.textContent += ' ';
      } else {
          output.textContent += item.label;
      }
    }
  });
}
