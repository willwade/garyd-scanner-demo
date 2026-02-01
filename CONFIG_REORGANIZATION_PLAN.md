# Config Reorganization Plan

## Current Implementation Analysis

### What We Have ✅

| Feature | Our Implementation | Guide Reference |
|---------|-------------------|-----------------|
| **Linear Scan** | ✅ `scanPattern: 'linear'` | Simple Scan |
| **Row-Column Scan** | ✅ `scanPattern: 'row-column'` | Row/Column Scan |
| **Column-Row Scan** | ✅ `scanPattern: 'column-row'` | Column/Row Scan |
| **Snake Scan** | ✅ `scanPattern: 'snake'` | (variation of linear) |
| **Quadrant Scan** | ✅ `scanPattern: 'quadrant'` | Progressive segmenting |
| **Elimination Scan** | ✅ `scanPattern: 'elimination'` | Progressive/Elimination |
| **Group Scanning** | ✅ `scanMode: 'group-row-column'` | Group Scan |
| **Continuous/Joystick** | ✅ `scanMode: 'continuous'` | Directed Scan |
| **Gliding Cursor** | ✅ `continuousTechnique: 'gliding'` | Directed variant |
| **Crosshair** | ✅ `continuousTechnique: 'crosshair'` | Directed variant |
| **Compass (8-direction)** | ✅ `continuousTechnique: 'eight-direction'` | Directed Scan |
| **Auto Scan** | ✅ `scanInputMode: 'auto'` | Auto Scan |
| **Manual/Step Scan** | ✅ `scanInputMode: 'manual'` | Step Scan |
| **Dwell Selection** | ✅ `dwellTime` | Dwell |
| **Switch Selection** | ✅ Default | Switch Encoded |
| **Acceptance Time** | ✅ `acceptanceTime` | Selection confirmation |
| **Scan Rate** | ✅ `scanRate` | Timing |
| **Sound Feedback** | ✅ `soundEnabled` | Auditory Highlighting |
| **Cost Heatmap** | ✅ `viewMode: 'cost-heatmap'` | (analysis feature) |
| **Grid Presentation** | ✅ Default | Grid Presentation |
| **Numbers/Keyboard Content** | ✅ `gridContent` | (demo content) |
| **2-8 Switch Elimination** | ✅ `eliminationSwitchCount` | Progressive variants |
| **Cause & Effect** | ✅ `scanMode: 'cause-effect'` | (early learning) |
| **Themes** | ✅ `theme` attribute | Custom Presentation |

### What We're Missing ❌

| Feature | Guide Reference | Priority | Complexity |
|---------|----------------|----------|------------|
| **Critical Overscan** | Critical Overscan | HIGH | Medium |
| **Auto-While-Held Scan** | User/Auto-While-Held | HIGH | Low |
| **Initial Item Extended Pause** | Auto - restart | HIGH | Low |
| **Empty/Cancel Items** | Empty Items, Cancel scan | HIGH | Low |
| **Long-hold Cancel** | Switch manipulation | HIGH | Low |
| **Backspace Item** | Error items | MEDIUM | Low |
| **Undo/Redo** | Undo/redo operations | MEDIUM | High |
| **Back Navigation** | Back (groups/pages) | MEDIUM | Medium |
| **Flip Chart Presentation** | Flip chart | MEDIUM | High |
| **Pop-up Pages** | Pop-up/Secondary | MEDIUM | High |
| **Custom/Priority Items** | Custom presentation | LOW | Medium |
| **Switch Alternation** | Step scan alternation | MEDIUM | Medium |
| **Scan Direction Control** | Circular, reverse, oscillating | MEDIUM | Low |
| **Auto Restart Options** | Continue vs restart | LOW | Low |
| **Page/Group Indicators** | (visual load management) | LOW | Low |

---

## Proposed New Config Structure

### Old Structure (Current)
```typescript
interface AppConfig {
  // Timing - SCATTERED
  scanRate: number;
  acceptanceTime: number;
  dwellTime: number;
  initialScanDelay: number;
  scanPauseDelay: number;
  postSelectionDelay: number;

  // Repeat - UNCLEAR PURPOSE
  autoRepeat: boolean;
  repeatDelay: number;
  repeatTime: number;

  // Scan - CONFUSING OVERLAP
  scanInputMode: 'auto' | 'manual';
  scanPattern: 'row-column' | 'column-row' | 'linear' | 'snake' | 'quadrant' | 'elimination';
  scanTechnique: 'block' | 'point';
  scanMode: 'group-row-column' | 'continuous' | 'probability' | 'cause-effect' | null;
  continuousTechnique: 'gliding' | 'crosshair' | 'eight-direction';
  compassMode: 'continuous' | 'fixed-8';
  eliminationSwitchCount: 2 | 3 | 4 | 5 | 6 | 7 | 8;

  // Display
  gridContent: 'numbers' | 'keyboard';
  gridSize: number;
  showUI: boolean;
  soundEnabled: boolean;

  // Language & Layout
  language: string;
  layoutMode: 'alphabetical' | 'frequency';
  viewMode: 'standard' | 'cost-numbers' | 'cost-heatmap';
  heatmapMax: number;
}
```

**Problems:**
- ❌ Technical terms (user-unfriendly)
- ❌ Related concepts scattered (timing in 3 places)
- ❌ Unclear hierarchy (pattern vs technique vs mode)
- ❌ Missing key features from guide
- ❌ No presets or profiles

---

### New Structure (Proposed)

```typescript
interface AppConfig {
  // ============================================
  // LEVEL 1: PRESENTATION (How items look)
  // ============================================
  presentation: {
    // Visual layout style
    layout: 'grid' | 'list' | 'flip-chart' | 'custom';

    // For grid layout
    gridSize: number;
    gridColumns?: number; // Forced column count

    // Theme/styling
    theme: 'default' | 'sketch' | 'high-contrast' | 'custom';
    showUI: boolean; // Settings button visibility
  };

  // ============================================
  // LEVEL 2: ORGANIZATION (How items grouped)
  // ============================================
  organization: {
    // Structural approach
    structure: 'flat' | 'hierarchical' | 'elimination';

    // For hierarchical
    groupMethod: 'rows' | 'columns' | 'quadrants' | 'mixed';
    groupSize: 'small' | 'medium' | 'large' | number;

    // For elimination
    eliminationSwitches: 2 | 3 | 4 | 5 | 6 | 7 | 8;

    // Page navigation
    itemsPerPage: number;
    showPageNumbers: boolean;
    allowPageLinks: boolean;
  };

  // ============================================
  // LEVEL 3: MOVEMENT (How highlight moves)
  // ============================================
  movement: {
    // Primary control method
    controlMode: 'auto' | 'manual' | 'directed';

    // Auto scan specific
    autoScan: {
      technique: 'linear' | 'row-column' | 'column-row' | 'group' | 'elimination';
      scanStyle: 'block' | 'point'; // For row/col/linear

      // Continuous/joystick specific
      continuousTechnique?: 'gliding' | 'crosshair' | 'compass';
      compassMode?: 'continuous' | 'fixed-8';

      // Direction control
      direction?: 'circular' | 'reverse' | 'oscillating';
    };

    // Manual/step scan specific
    stepScan: {
      switchCount: 1 | 2;
      alternation?: boolean; // Swap switch functions
    };

    // Directed scan specific
    directedScan: {
      technique: 'joystick' | 'arrow-keys' | 'switches';
      directions: 4 | 8; // Cardinal or cardinal + diagonal
    };
  };

  // ============================================
  // LEVEL 4: TIMING (When things happen)
  // ============================================
  timing: {
    // Scan speed
    scanRate: number; // ms per item

    // Initial scan
    initialItemPause: number; // Extended first item highlight
    scanStartDelay: number; // Delay before scan starts

    // Selection
    dwellTime: number; // 0 = off
    acceptanceTime: number; // Confirmation delay

    // Advanced timing
    criticalOverscan?: {
      fastRate: number; // Initial fast scan
      slowRate: number; // After switch press
    };

    autoWhileHeld?: {
      enabled: boolean;
      progressRate: number;
    };

    // Between selections
    postSelectionDelay: number;
    pauseBetweenGroups: number;
  };

  // ============================================
  // LEVEL 5: FEEDBACK (What user perceives)
  // ============================================
  feedback: {
    // Visual
    visual: {
      highlightStyle: 'border' | 'background' | 'both';
      highlightColor?: string; // Custom color
      showSelectionPreview: boolean; // Flash before selecting
    };

    // Auditory
    audio: {
      enabled: boolean;
      scanSound: boolean;
      selectSound: boolean;
      voiceOutput?: boolean; // Speak item names
    };

    // Visualization (for analysis)
    costVisualization: 'none' | 'numbers' | 'heatmap' | 'colored-items';
    heatmapMax: number;
  };

  // ============================================
  // LEVEL 6: ERROR HANDLING (Recovery options)
  // ============================================
  errors: {
    // Error items
    allowEmptyItems: boolean; // Non-selectable items
    allowCancel: boolean;

    // Cancel methods
    cancelMethod: 'button' | 'long-hold' | 'timeout';
    longHoldTime?: number;

    // Undo/redo
    undoType: 'none' | 'character' | 'operation' | 'full';
    maxHistory?: number;

    // Scan error recovery
    scanErrorAction: 'reset' | 'continue' | 'highlight-all';
  };

  // ============================================
  // LEVEL 7: ADVANCED (Power user options)
  // ============================================
  advanced: {
    // Auto-restart behavior
    autoRestart: 'continue' | 'restart-from-start';
    restartDelay?: number;

    // Repeat functions
    autoRepeat: boolean;
    repeatDelay: number;
    repeatRate: number;

    // Content
    content: 'numbers' | 'keyboard' | 'custom';
    customItems?: GridItem[];

    // Language
    language: string;
    layoutMode: 'alphabetical' | 'frequency';

    // Debugging
    debugMode: boolean;
    showCostInfo: boolean;
  };
}
```

---

## Migration Strategy

### Phase 1: Add Compatibility Layer (Backward Compatible)

```typescript
// NEW: Structure-based config
interface NewAppConfig {
  presentation: { ... };
  organization: { ... };
  // ... etc
}

// COMPATIBILITY: Adapter for old config
function migrateConfig(oldConfig: AppConfig): NewAppConfig {
  return {
    presentation: {
      layout: 'grid',
      gridSize: oldConfig.gridSize,
      theme: 'default',
      showUI: oldConfig.showUI,
    },
    organization: {
      structure: oldConfig.scanMode === 'continuous' ? 'flat' : 'hierarchical',
      groupMethod: oldConfig.scanPattern === 'row-column' ? 'rows' : 'columns',
      eliminationSwitches: oldConfig.eliminationSwitchCount,
      // ...
    },
    movement: {
      controlMode: oldConfig.scanInputMode,
      autoScan: {
        technique: oldConfig.scanPattern,
        scanStyle: oldConfig.scanTechnique,
        continuousTechnique: oldConfig.continuousTechnique,
        // ...
      },
      // ...
    },
    // ... map all old fields to new structure
  };
}
```

### Phase 2: Update Settings UI

**Old Settings UI:**
- Single long scrolling form
- Technical sections
- Unclear organization

**New Settings UI:**
- Tabbed interface (6 tabs)
- Clear labels, no jargon
- Help text for each option
- Visual previews where possible

### Phase 3: Add Missing Features

Implement in priority order:
1. Critical overscan
2. Initial item pause
3. Empty/cancel items
4. Long-hold cancel
5. Error handling improvements

### Phase 4: Add Presets

```typescript
const PRESETS: Record<string, Partial<NewAppConfig>> = {
  beginner: {
    movement: { controlMode: 'auto' },
    timing: { scanRate: 2000, initialItemPause: 1500 },
    feedback: { visual: { highlightStyle: 'both' }, audio: { enabled: true } },
  },

  intermediate: {
    movement: { controlMode: 'auto' },
    timing: { scanRate: 1000 },
    organization: { structure: 'hierarchical', groupMethod: 'rows' },
  },

  advanced: {
    movement: { controlMode: 'manual' },
    timing: { scanRate: 500 },
    organization: { structure: 'elimination', eliminationSwitches: 4 },
  },

  singleSwitch: {
    movement: {
      controlMode: 'auto',
      stepScan: { switchCount: 1 },
    },
    timing: { dwellTime: 1000 },
  },

  multiSwitch: {
    movement: {
      controlMode: 'manual',
      stepScan: { switchCount: 2, alternation: true },
    },
  },
};
```

---

## Benefits of New Structure

### For Users
- ✅ Clearer mental model (Presentation → Organization → Movement)
- ✅ Easier to find related settings
- ✅ Presets for common use cases
- ✅ Better labels and help text
- ✅ Progressive disclosure (basic → advanced)

### For Developers
- ✅ Logical grouping of related functionality
- ✅ Easier to add new features
- ✅ Better type safety with nested objects
- ✅ Clearer extension points
- ✅ Easier testing

### For Maintainers
- ✅ Matches domain model from research
- ✅ Easier to onboard new developers
- ✅ Better documentation alignment
- ✅ Clear feature boundaries

---

## Implementation Roadmap

### Sprint 1: Foundation (1 week)
- [ ] Create new config interfaces
- [ ] Build compatibility adapter
- [ ] Write migration tests
- [ ] Document mapping between old/new

### Sprint 2: UI Update (2 weeks)
- [ ] Design tabbed settings interface
- [ ] Implement new UI components
- [ ] Add help text and tooltips
- [ ] Create visual previews

### Sprint 3: High Priority Features (2 weeks)
- [ ] Critical overscan
- [ ] Initial item pause
- [ ] Empty/cancel items
- [ ] Long-hold cancel

### Sprint 4: Presets & Polish (1 week)
- [ ] Implement preset system
- [ ] Create 5 core presets
- [ ] Add preset customization
- [ ] Export/import config

### Sprint 5: Medium Priority Features (2 weeks)
- [ ] Undo/redo system
- [ ] Back navigation
- [ ] Switch alternation
- [ ] Direction control

### Sprint 6: Testing & Documentation (1 week)
- [ ] Full test coverage
- [ ] User guide update
- [ ] Migration guide
- [ ] Video tutorials

**Total: ~9 weeks**

---

## Config Example Comparisons

### Example 1: Beginner - Single Switch Auto Scan

**Old Config:**
```typescript
{
  scanRate: 2000,
  scanInputMode: 'auto',
  scanPattern: 'row-column',
  scanTechnique: 'block',
  soundEnabled: true,
  dwellTime: 0,
  acceptanceTime: 500,
}
```

**New Config:**
```typescript
{
  presentation: {
    layout: 'grid',
    gridSize: 12,
    theme: 'default',
  },
  organization: {
    structure: 'hierarchical',
    groupMethod: 'rows',
    groupSize: 'small',
  },
  movement: {
    controlMode: 'auto',
    autoScan: {
      technique: 'row-column',
      scanStyle: 'block',
      direction: 'circular',
    },
  },
  timing: {
    scanRate: 2000,
    initialItemPause: 1500,
    dwellTime: 0,
    acceptanceTime: 500,
  },
  feedback: {
    visual: { highlightStyle: 'both' },
    audio: { enabled: true, scanSound: true, selectSound: true },
  },
}
```

### Example 2: Advanced - 4-Switch Elimination

**Old Config:**
```typescript
{
  scanRate: 500,
  scanInputMode: 'manual',
  scanPattern: 'elimination',
  eliminationSwitchCount: 4,
  dwellTime: 0,
}
```

**New Config:**
```typescript
{
  presentation: {
    layout: 'grid',
    gridSize: 64,
  },
  organization: {
    structure: 'elimination',
    eliminationSwitches: 4,
  },
  movement: {
    controlMode: 'manual',
    stepScan: {
      switchCount: 4,
      alternation: false,
    },
  },
  timing: {
    scanRate: 500,
    initialItemPause: 0,
  },
  feedback: {
    visual: { highlightStyle: 'background' },
    audio: { enabled: false },
  },
}
```

### Example 3: Joystick/Direct Scanning

**Old Config:**
```typescript
{
  scanMode: 'continuous',
  continuousTechnique: 'gliding',
  scanRate: 100,
}
```

**New Config:**
```typescript
{
  presentation: {
    layout: 'grid',
    gridSize: 64,
  },
  organization: {
    structure: 'flat',
  },
  movement: {
    controlMode: 'directed',
    directedScan: {
      technique: 'joystick',
      directions: 8,
    },
    autoScan: {
      continuousTechnique: 'gliding',
    },
  },
  timing: {
    scanRate: 100, // Movement refresh rate
  },
  feedback: {
    visual: { highlightStyle: 'border' },
    audio: { enabled: true },
  },
}
```
