import './style.css'
import { ConfigManager, AppConfig } from './ConfigManager';
import { AudioManager } from './AudioManager';
import { SwitchInput } from './SwitchInput';
import { GridRenderer, GridItem } from './GridRenderer';
import { SettingsUI } from './SettingsUI';
import { AlphabetManager } from './AlphabetManager';

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

const initApp = async () => {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  const configManager = new ConfigManager();
  const audioManager = new AudioManager(configManager.get().soundEnabled);
  const switchInput = new SwitchInput(configManager);
  const alphabetManager = new AlphabetManager();

  await alphabetManager.init();

  const gridRenderer = new GridRenderer('grid-container');
  // Pass alphabetManager to SettingsUI if needed to populate dropdowns?
  // Or SettingsUI can access it globally or we pass it.
  // We'll update SettingsUI later. For now, let's just make sure it works.
  // Actually, plan step 8 is Update Settings UI. I'll expose alphabetManager via window or pass it?
  // Better pass it.
  const settingsUI = new SettingsUI(configManager, alphabetManager);

  // Grid Generation
  const generateNumbers = (size: number): GridItem[] => {
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

  const generateKeyboard = async (config: AppConfig): Promise<GridItem[]> => {
    await alphabetManager.loadLanguage(config.language);
    const chars = alphabetManager.getCharacters(config.layoutMode);

    // Convert to GridItems
    const items: GridItem[] = chars.map((c, i) => ({
        id: `char-${i}`,
        label: c,
        type: 'char' as const
    }));

    // Add controls
    [' ', '.', ',', '?', '!', 'Backspace', 'Clear', 'Enter'].forEach((c, i) => {
        items.push({
            id: `ctrl-${i}`,
            label: c === ' ' ? 'Space' : c,
            type: 'action'
        });
    });

    return items;
  };

  let baseItems: GridItem[] = [];
  let currentScanner: Scanner | null = null;

  const getHeatmapColor = (cost: number, max: number) => {
    const t = Math.min(cost / max, 1);
    const hue = 120 * (1 - t); // 120 (Green) -> 0 (Red)
    return `hsl(${hue}, 80%, 80%)`;
  };

  const applyVisualization = (items: GridItem[], config: AppConfig): GridItem[] => {
      if (!currentScanner) return items;
      if (config.viewMode === 'standard') return items;

      return items.map((item, index) => {
          const cost = currentScanner!.getCost(index);
          const newItem = { ...item };

          if (config.viewMode === 'cost-numbers') {
              newItem.label = cost.toString();
              // Keep original type to avoid breaking selection logic?
              // Selection uses item from renderer. renderer returns the item passed to it.
              // So if we click "5", we trigger selection of "5".
              // This breaks typing!
              // But visual mode is for analysis. User probably understands.
              // Or we can keep logic working by checking original item?
              // For now, let's assume Visual Mode is for visualization.
          } else if (config.viewMode === 'cost-heatmap') {
              newItem.backgroundColor = getHeatmapColor(cost, config.heatmapMax);
              newItem.textColor = '#000'; // Ensure readability
          }
          return newItem;
      });
  };

  const updateGrid = async (config: AppConfig, forceRegen: boolean = false) => {
      // Regenerate items if content/language/layout changed
      if (forceRegen) {
          if (config.gridContent === 'keyboard') {
              baseItems = await generateKeyboard(config);
          } else {
              baseItems = generateNumbers(config.gridSize);
          }
      }

      // Calculate columns
      // For numbers, we use sqrt or config? Config has gridSize (total items).
      // If we used generateNumbers(64), we want 8 cols.
      // If keyboard (e.g. 35 items), 6x6=36.
      const total = baseItems.length;
      const cols = Math.ceil(Math.sqrt(total));

      // 1. Render base items first so scanner has correct dimensions to calculate cost
      gridRenderer.render(baseItems, cols);

      // 2. Ensure scanner is active/updated
      // Scanner needs renderer to have items.
      if (currentScanner) {
          // Restart scanner with new grid?
          // Some scanners cache dimensions in start().
          // If we just re-rendered, we should probably re-start or notify scanner.
          // But setScanner calls start().
          // If we already have a scanner, we might need to refresh it.
      }

      // 3. Apply visualization
      if (config.viewMode !== 'standard' && currentScanner) {
          const visualItems = applyVisualization(baseItems, config);
          gridRenderer.render(visualItems, cols);
      }
  };

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

  // Initial Load
  const initialConfig = configManager.get();
  await updateGrid(initialConfig, true);
  setScanner(initialConfig.scanStrategy);
  // Re-render for visualization if needed (since scanner wasn't ready during updateGrid)
  if (initialConfig.viewMode !== 'standard') {
      updateGrid(initialConfig, false);
  }

  // Config Subscription
  let lastConfig = initialConfig;
  configManager.subscribe(async (cfg) => {
    audioManager.setEnabled(cfg.soundEnabled);

    // Detect what changed
    const contentChanged = cfg.gridContent !== lastConfig.gridContent ||
                           cfg.gridSize !== lastConfig.gridSize ||
                           cfg.language !== lastConfig.language ||
                           cfg.layoutMode !== lastConfig.layoutMode;

    const strategyChanged = cfg.scanStrategy !== lastConfig.scanStrategy;
    const viewChanged = cfg.viewMode !== lastConfig.viewMode || cfg.heatmapMax !== lastConfig.heatmapMax;

    if (contentChanged) {
        await updateGrid(cfg, true);
        setScanner(cfg.scanStrategy);
    } else if (strategyChanged) {
        setScanner(cfg.scanStrategy);
        // If view mode is active, we need to re-render grid because costs changed
        if (cfg.viewMode !== 'standard') {
             await updateGrid(cfg, false);
        }
    } else if (viewChanged) {
        await updateGrid(cfg, false);
    }

    lastConfig = cfg;
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
      // In cost-numbers mode, item.label is the cost.
      // We should use the ID to find the original value?
      // Or just assume if viewMode != standard, typing is disabled?
      // The user wants to "show how... time... will differ".
      // Let's try to recover the character from ID if possible, or just print label.
      // Our IDs are `char-0`, `key-0`, `item-1`.
      // If we regenerated, we lost the map.
      // But `baseItems` is available in closure!

      const originalItem = baseItems.find(i => i.id === item.id);
      const label = originalItem ? originalItem.label : item.label;

      if (label === 'Backspace') {
          output.textContent = output.textContent?.slice(0, -1) || '';
      } else if (label === 'Clear') {
          output.textContent = '';
      } else if (label === 'Enter') {
          output.textContent += '\n';
      } else if (label === 'Space') {
          output.textContent += ' ';
      } else {
          output.textContent += label;
      }
    }
  });
};

initApp();
