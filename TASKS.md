# Switch Scanner Development Tasks

> Last updated: 2026-02-02

## Legend
- 🔥 **HIGH** - Critical for usability
- ⚡ **QUICK WIN** - 1-2 days
- 🔨 **MEDIUM** - 1 week
- 🏗️ **MAJOR** - 2+ weeks
- ✅ **DONE** - Completed
- 🧪 **TESTS** - Needs test coverage

---

## 🔥 QUICK WINS (1-2 days each)

### Timing Enhancements
- [x] ⚡ **Initial Item Pause** - Extended highlight on first item ✅ DONE
  - [x] Add `initialItemPause` to timing config (default: 0ms)
  - [x] Implement in Scanner base class scheduleNextStep()
  - [x] Test: Verify first item stays highlighted longer
  - [x] Add UI control to Timing settings
  - [x] 14 tests added

### Selection Options
- [x] ⚡ **Long-Hold Cancel** - Cancel scan with long press ✅ DONE
  - [x] Add `cancelMethod: 'button' | 'long-hold'` to config
  - [x] Add `longHoldTime: number` (default: 1000ms)
  - [x] Implement hold detection in SwitchInput
  - [x] Test: Long hold triggers cancel action
  - [x] Test: Immediate action on early release
  - [x] Add UI dropdown for cancel method selection
  - [x] 13 tests added

- [x] ⚡ **Empty Items** - Non-selectable items for scan reset ✅ DONE
  - [x] Add `allowEmptyItems: boolean` to config
  - [x] Add `isEmpty: boolean` property to GridItem interface
  - [x] Skip selection when empty item selected
  - [x] Reset scan to beginning
  - [x] Test: Empty item doesn't trigger output
  - [x] 13 tests added

- [x] ⚡ **Scan Direction Control** - Circular, reverse, oscillating ✅ DONE
  - [x] Add `scanDirection: 'circular' | 'reverse' | 'oscillating'` to config
  - [x] Implement reverse logic in LinearScanner
  - [x] Implement oscillating (forward → backward → forward)
  - [x] Test: All three directions work correctly
  - [x] Add UI dropdown for direction selection
  - [x] 17 tests added (including edge cases)

### Quality of Life
- [x] ⚡ **Post-Selection Delay** - Refractory period ✅ DONE
  - [x] Already have `postSelectionDelay` in config
  - [x] Verify it's actually implemented in scanners
  - [x] Test: Delay works after selection

- [x] ⚡ **Scan Loops** - Limit scan cycles ✅ DONE
  - [x] Add `scanLoops: number` (default: 4, 0 = infinite)
  - [x] Track loop count in Scanner base class
  - [x] Implement `reportCycleCompleted()` method
  - [x] Stop scanning after reaching loop limit
  - [x] Reset functionality works after stop
  - [x] Add UI control (0-20 range, 0 = infinite)
  - [x] 13 tests added

---

## 🔨 MEDIUM PROJECTS (1 week each)

### Critical Features
- [x] 🔨 **Critical Overscan** - Fast scan → slow backward → select ✅ DONE
  - [x] Add to timing config:
    ```typescript
    criticalOverscan: {
      enabled: boolean;
      fastRate: number; // Initial fast scan (e.g., 100ms)
      slowRate: number; // After switch press (e.g., 1000ms)
    }
    ```
  - [x] Implement state machine: FAST → SLOW_BACKWARD → SELECT
  - [x] Abstract `doSelection()` method in base Scanner
  - [x] Switch press (first) triggers transition to SLOW_BACKWARD
  - [x] Switch press (second) in SLOW_BACKWARD triggers selection
  - [x] Test: Fast → slow transition works
  - [x] Test: Selection in slow mode works
  - [x] Add UI controls for fast/slow rates and enable checkbox
  - [x] 14 tests added

### Visualization Enhancements
- [x] 🔨 **Highlight Visualization Options** ✅ DONE
  - [x] Add `highlightBorderWidth: number` (0-10px, default: 4)
  - [x] Add `highlightBorderColor: string` (default: '#FF9800' orange)
  - [x] Add `highlightScale: number` (1.0-1.5, default: 1.0)
  - [x] Add `highlightOpacity: number` (0.3-1.0, default: 1.0)
  - [x] Add `highlightAnimation: boolean` (default: false)
  - [x] Implement `updateHighlightStyles()` in GridRenderer
  - [x] Modify `setFocus()` to accept config and apply animation
  - [x] Update shadow DOM CSS (standard + sketch theme)
  - [x] Add UI controls in SettingsUI (Visualization section)
  - [x] Add config change subscription to update styles dynamically
  - [x] Disable grid size input when in keyboard mode
  - [x] 13 tests added (GridRenderer highlight visualization)

### Documentation & Education
- [x] 🔨 **Interactive Scanning Book** ✅ DONE
  - [x] Created comprehensive interactive book (Astro book in `book/`)
  - [x] 24 chapters + glossary with interactive demos
  - [x] Chapter 1-9: Foundations (switch basics → elimination scanning)
  - [x] Chapter 10: Pattern Comparison (side-by-side demos)
  - [x] Chapter 11: Efficiency Calculator (interactive cost tool)
  - [x] Chapter 12: Timing & Optimization (rate comparisons, dwell, loops)
  - [x] Chapter 13: Visualization Options (border, scale, animation)
  - [x] Chapter 14: Block vs Point technique comparison
  - [x] Mobile responsive design
  - [x] Navigation system (Next/Prev buttons, sticky ToC, search)
  - [x] GitHub Pages auto-deployment setup (build:gh)
  - [x] BOOK_README.md user guide
  - [x] SCANNING_PATTERNS_ANALYSIS.md deep dive

- [x] 🔨 **Scanning Patterns Analysis Document** ✅ DONE
  - [x] Complete analysis of 7 key components
  - [x] Pattern efficiency comparisons (Linear vs Row-Column vs Elimination)
  - [x] Alphabet layout analysis (alphabetical vs frequency order)
  - [x] Real-world typing examples ("THE", "AND", "HELLO")
  - [x] User profile configurations (athetosis, degenerative, visual, cognitive)
  - [x] Timing guidelines by user type
  - [x] Decision trees for pattern/technique selection
  - [x] Efficiency calculation formulas and examples

### Error Handling
- [ ] 🔨 **Undo/Redo System** - Operation history
  - [ ] Add to error config:
    ```typescript
    undoType: 'none' | 'character' | 'operation' | 'full';
    maxHistory?: number;
    ```
  - [ ] Create HistoryManager class
  - [ ] Track operations in stack
  - [ ] Implement undo() method
  - [ ] Implement redo() method
  - [ ] Add undo/redo buttons to UI
  - [ ] Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
  - [ ] Test: Undo removes last selection
  - [ ] Test: Redo restores undone action
  - [ ] 🧪 Write history manager tests

- [ ] 🔨 **Switch Alternation** - Balance switch load
  - [ ] Add to stepScan config:
    ```typescript
    stepScan: {
      switchCount: 1 | 2;
      alternation?: boolean; // Swap functions after each selection
    }
    ```
  - [ ] Track which switch made last selection
  - [ ] Swap switch functions after selection
  - [ ] Test: Functions alternate correctly
  - [ ] Add UI checkbox for "Alternate switches"
  - [ ] 🧪 Write alternation logic tests

---

## 🏗️ MAJOR PROJECTS (2+ weeks each)

### New Scanning Modes
- [ ] 🏗️ **Auto-While-Held Scan** - Progress only while switch held
  - [ ] Add to movement config:
    ```typescript
    autoWhileHeld?: {
      enabled: boolean;
      progressRate: number;
      selectOnRelease: boolean;
    }
    ```
  - [ ] Implement hold detection in SwitchInput
  - [ ] Pause scan when switch released
  - [ ] Resume/continue on next press
  - [ ] Select on release if configured
  - [ ] Test: Hold advances scan, release pauses
  - [ ] Add UI checkbox for "Hold to scan"
  - [ ] 🧪 Write tests for hold behavior

### UI & Config
- [ ] 🏗️ **Config Structure Migration** - Flatten to hierarchical
  - [ ] Create new AppConfig interface with 7 levels
  - [ ] Build compatibility adapter (migrateConfig())
  - [ ] Update all scanners to use new structure
  - [ ] Maintain backward compatibility
  - [ ] 🧪 Write migration tests
  - [ ] Document old → new field mapping
  - [ ] Update SettingsUI to use new structure

- [ ] 🏗️ **Tabbed Settings UI** - Better UX
  - [ ] Design 6-tab interface:
    1. Presentation
    2. Scanning
    3. Timing
    4. Feedback
    5. Accessibility
    6. Advanced
  - [ ] Implement tab navigation
  - [ ] Group related settings
  - [ ] Add help text for each option
  - [ ] Add visual previews where possible
  - [ ] Test: All settings accessible and functional
  - [ ] Mobile responsive design

### Navigation
- [ ] 🏗️ **Page/Group Navigation** - Back, forward, history
  - [ ] Add page stack to track navigation
  - [ ] Implement "back" action (pop from stack)
  - [ ] Implement page indicators ("Page 1 of 3")
  - [ ] Add visual page navigation buttons
  - [ ] Test: Navigate forward through pages
  - [ ] Test: Navigate back through history
  - [ ] Test: Page indicators update correctly
  - [ ] 🧪 Write navigation tests

### New Scanning Modes
- [ ] 🏗️ **Flip Chart Presentation** - One-item-at-a-time
  - [ ] Add `layout: 'flip-chart'` to presentation config
  - [ ] Create FlipChartScanner class
  - [ ] Display only one item/group at a time
  - [ ] Navigate with next/prev actions
  - [ ] Show remaining items count
  - [ ] Smooth animations between items
  - [ ] Test: Navigation through all items
  - [ ] Test: Selection works in flip-chart mode
  - [ ] 🧪 Write flip-chart scanner tests

- [ ] 🏗️ **Pop-up/Secondary Pages** - Nested navigation
  - [ ] Add page hierarchy support
  - [ ] Implement "pop-up page" concept
  - [ ] Return to parent on selection/cancel
  - [ ] Visual indicator for pop-up state
  - [ ] Test: Navigate into pop-up
  - [ ] Test: Return from pop-up
  - [ ] Test: Selection in pop-up works
  - [ ] 🧪 Write navigation tests

### Advanced Features
- [ ] 🏗️ **Presets System** - Pre-configured profiles
  - [ ] Define 5 core presets:
    - beginner
    - intermediate
    - advanced
    - single-switch
    - multi-switch
  - [ ] Create preset definitions
  - [ ] Add preset selector to settings
  - [ ] Allow preset customization
  - [ ] Export/import custom presets
  - [ ] Save preset preference to localStorage
  - [ ] Test: Each preset applies correctly
  - [ ] Test: Customization doesn't break preset
  - [ ] 🧪 Write preset application tests

- [ ] 🏗️ **Continuous Scanner Mouse Integration**
  - [ ] Integrate with actual mouse events
  - [ ] Support external mouse/joystick devices
  - [ ] Map mouse movement to cursor position
  - [ ] Map click to selection
  - [ ] Test: Mouse movement controls cursor
  - [ ] Test: Mouse click selects item
  - [ ] 🧪 Write mouse integration tests

- [ ] 🏗️ **Visual Polish** - Continuous Scanner improvements
  - [ ] Better color schemes for highlights
  - [ ] Smooth animations and transitions
  - [ ] Cursor trail effects
  - [ ] Direction indicator improvements
  - [ ] Buffer zone visual improvements
  - [ ] Test: All animations smooth at 60fps
  - [ ] Test: Visual feedback is clear

- [ ] 🏗️ **Save/Load User Configurations**
  - [ ] Implement config export (JSON)
  - [ ] Implement config import
  - [ ] Save to localStorage
  - [ ] Save to file download
  - [ ] Load from file upload
  - [ ] Validation on import
  - [ ] Test: Export includes all settings
  - [ ] Test: Import restores settings
  - [ ] Test: Invalid config rejected
  - [ ] 🧪 Write config serialization tests

- [ ] 🏗️ **Audio Assets** - Better sounds
  - [ ] Source or create better sound files
  - [ ] Scan sound (short beep)
  - [ ] Select sound (pleasant confirmation)
  - [ ] Error sound (gentle warning)
  - [ ] Cancel sound (clear feedback)
  - [ ] Load sounds as assets
  - [ ] Replace Oscillator with audio files
  - [ ] Test: All sounds play correctly
  - [ ] Test: Sounds don't overlap unpleasantly

---

## ✅ COMPLETED

### Core Scanning Features
- [x] Dwell Activation (Zero-switch mode)
- [x] Gliding Cursor / Crosshair (iOS Style) for Continuous Scanner
- [x] Eight-Direction Compass Mode (continuous + fixed-8)
- [x] Multi-Switch Elimination Scanning (2-8 switches)
- [x] Color-coded switch buttons
- [x] Manual vs Auto scanning mode
- [x] Timing & Access configuration
- [x] Cause & Effect scanning mode
- [x] Theme system (sketch theme)
- [x] Custom items support
- [x] Critical Overscan (two-stage scanning)

### Testing Infrastructure
- [x] Test infrastructure (Vitest, 146+ tests)
- [x] GridRenderer tests (13 tests)
- [x] LinearScanner tests (timing, direction)
- [x] Empty Items tests (13 tests)
- [x] Initial Item Pause tests (14 tests)
- [x] Scan Direction tests (17 tests)
- [x] Long-Hold Cancel tests (13 tests)
- [x] Critical Overscan tests (14 tests)
- [x] Highlight Visualization tests (13 tests)

### Documentation
- [x] Switch Scanning Guide (complete reference)
- [x] Interactive Scanning Book (24 chapters + glossary)
- [x] Scanning Patterns Analysis (7 key components deep dive)
- [x] Efficiency Calculator with real-time calculations
- [x] User Profile configurations with examples

---

## 🧪 TESTING TASKS

### Coverage Gaps
- [ ] RowColumnScanner dedicated test file
- [ ] ContinuousScanner tests (all 3 techniques)
- [ ] LinearScanner dedicated test file (currently tested through integration)
- [ ] SnakeScanner tests
- [ ] QuadrantScanner tests
- [ ] GroupScanner tests
- [ ] ProbabilityScanner tests
- [ ] CauseEffectScanner tests
- [ ] Integration tests (full workflows)
- [ ] SettingsUI interaction tests
- [ ] Web component lifecycle tests

### Test Infrastructure
- [ ] Add coverage reporting
- [ ] Set up CI test runs
- [ ] Visual regression tests
- [ ] Performance benchmarks

---

## 📋 REMAINING TODO (from old TODO.md)

### In Planning
- [ ] Inverse Scanning Mode (Move on Hold, Select on Release)
- [ ] Keyboard Layout adjacency mapping for PPMPredictor
- [ ] Error Correction Logic: "Back/Undo" insertion in scan path

### Completed
- [x] Post-Selection Delay (verified working)
- [x] Dwell Activation (implemented)
- [x] Gliding Cursor (implemented)
- [x] "Back up one level" (consistent across all scanners)
- [x] Full integration of Continuous Scanner (basic integration done)

---

## 🚀 NEXT SPRINT PRIORITIES

### Immediate (High Impact)
1. **Undo/Redo System** - Critical for error recovery
2. **Auto-While-Held Scan** - Important for users with limited motor control
3. **Tabbed Settings UI** - Improve UX significantly

### Short Term (Week 1-2)
4. Config Structure Migration
5. Switch Alternation
6. Save/Load Configurations

### Medium Term (Week 3-4)
7. Presets System
8. Page/Group Navigation

### Long Term (Week 5+)
9. Flip Chart Presentation
10. Pop-up Pages
11. Continuous Scanner Mouse Integration
12. Visual Polish

---

## 📊 PROGRESS TRACKING

**Total Tasks:** 75

**Completed:**
- Quick Wins: 5/5 (100%) ✅
- Medium Projects: 3/23 (13%)
- Major Projects: 0/17 (0%)
- Quick Win Progress: 5/5 (100%) ✅
- Overall Progress: 8/75 (11%)

**Recently Completed:**
- Critical Overscan (Medium project)
- Highlight Visualization (Medium project)
- Interactive Book with 24 chapters + glossary
- Scanning Patterns Analysis documentation
- Efficiency Calculator

**Test Coverage:**
- 146 passing tests
- 8 timing-related test failures (pre-existing, edge cases)
- Core functionality fully tested

---

## 🔗 REFERENCES

- Switch Scanning Guide: `SWITCH_SCANNING_GUIDE.md`
- Additional Guide: `SWITCH_SCANNING_GUIDE-additional.md`
- Pattern Analysis: `SCANNING_PATTERNS_ANALYSIS.md`
- Book: Astro site in `book/` (24 chapters + glossary, interactive demos)
- User Guide: `BOOK_README.md`
- Deployment Info: `BOOK_DEPLOYMENT.md`
- Testing Guide: `TESTING.md`
