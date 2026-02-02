# Switch Scanning - Complete Reference Guide

> Based on "Switch Access with a Pointer Interface - An evaluation and design guide"
> Source: Judge-Colven & Brown (from SwitchScanningMaster_8_472.pdf)

## Table of Contents
1. [Selection Sets](#selection-sets)
2. [Grouping](#grouping)
3. [Highlighting](#highlighting)
4. [Scanning Sequencing Methods](#scanning-sequencing-methods)
5. [Highlighter Movement Control](#highlighter-movement-control)
6. [Manipulating the Highlighter](#manipulating-the-highlighter)
7. [Selection Methods](#selection-methods)

---

## Selection Sets

> "The set of all the items from which choices are made is called the selection set. At any one time it may be more appropriate to present only a sub-set (or group) of this. If the number of items is larger than can be displayed on one screen (page) then further pages are required. The set can now be thought of as a book or card index rack with some items providing links between the different pages/cards."

### Presentation Formats

#### 1. Single Line Presentation
- Visual representations in a single simple line
- 'Line' is used rather than 'row' to include all possible orientations
- **Example**: Clicker Talking Book

#### 2. Grid Presentation
- When there are large numbers of items
- Two-dimensional grid format
- **Example**: The Grid

#### 3. Flip Chart Presentation
- Individual items or parts of the selection set displayed one at a time
- Similar to turning cards in a rotary file index
- Existence of other parts indicated behind the current display

#### 4. Pop-up Presentation / Secondary-Multi-Page Presentation
- Pages (groups) displayed 'within' the current page
- Normally a new page would replace the previous one
- Pop-ups usually only displayed for the time required to make a single choice

#### 5. Custom Presentation
- Non-standard methods of presentation
- Items given higher priority or visual prominence
- Customization to particular application or task

---

## Grouping

> "When there are a large number of items to choose from some level of grouping is required. Groups (or sub-sets) may be presented in a variety of formats: pages, tabs, views, rows, columns etc. In general items can be constructed into a selection set in a layered hierarchy. At the lowest level there are individual items. These can be contained within groups which themselves can be within super-groups etc. Each level may have an associated range of properties that describe the appearance and actions of items."

### Hierarchy Levels

- **Lowest level**: Individual items
- **Groups**: Contain individual items
- **Super-groups**: Contain groups
- **Unlimited hierarchy**: More complex systems allow unlimited nesting

### Two-Level vs Unlimited Hierarchy

- **Most 'simple to medium' complexity systems**: Allow two-level hierarchy of scanning
- **More complex systems**: Allow unlimited hierarchy
- **Both approaches have good arguments**

### Group Presentation Formats

- Pages
- Tabs
- Views
- Rows
- Columns
- Mixed approaches

### Pagination and Linking

> "To reduce the amount of visual load of scanning systems the total selection set is often sub-divided into groups which are displayed separately (normally called pages)."

> "Moving between pages normally happens on selection of a 'link' item. This is similar to the concept of hyper linking on the Internet."

- For very small selection sets (<10 items): Simple single level, single page presentation
- Link items provide navigation between pages/groups
- Similar to hyperlinks on the Internet

---

## Highlighting

### Visual Highlighting
- Color changes
- Border/outline emphasis
- Animation/movement
- Opacity changes 
- Size changes (zoom of a button as its highlighted - it gets bigger)

### Auditory Highlighting
- Sound cues on highlight
- Voice output of item names
- Pitch/tone variations for different items

### Combined Feedback
- Multisensory approaches (visual + auditory)
- Tactile feedback (where available)

---

## Scanning Sequencing Methods

### 1. Simple Scan (Linear)
- Sequential progression through all items
- Single item at a time
- No grouping

### 2. Group Scan

> "In a group scan the whole selection set is divided into groups of items and these are then individually highlighted. The user first selects a group, after which the individual items (or further groups) in that same group are scanned. The hierarchy of subgroups is scanned until one reaches the level of single items. When the item is selected the scan (usually) will be re-set to the top level again."

#### Common Group Forms

##### Row/Column Scan
- Groups arranged in rows
- Select row, then items within row

##### Column/Row Scan
- Groups arranged in columns
- Select column, then items within column

##### Mixed Row/Column and Group Scan
> "Some systems employ a mixture of group and row-column scanning – for example, a rectilinear grid can be initially split into two halves as super-groups and then inside these super groups there can be sub-groups with items arranged in rows and columns"

##### Progressive Segmenting Scan
- **Quartering**
- **Scan Direct**
- **Halving**
- **Elimination Scanning** (a form of progressive segmenting)

### 3. Directed Scan / Joystick Scan

> "Directed scans are used to emulate direct selection. The direction of the highlighter movement is controlled by switch operations."

#### Movement Directions
- Up
- Down
- Left
- Right
- Combinations for 45-degree movement

#### System Requirements
- Decide which is the next item in any direction
- Send highlight to that item
- Selection by switch press or dwell

#### Switch Configurations

**Natural Setup**
- One switch operation per direction (4+ switches)

**Reduced Switch Count**
- Right and Down only
- Scan loops back to start when reaching edge

**Rotating Arrow Approach**
- Rotating arrow indicates possible directions
- Switch selection to implement chosen direction

---

## Highlighter Movement Control

### Auto Scan

#### User Scan / Auto-While-Held Scan

> "With this scan method the machine progresses the highlight only whilst the user is activating the switch. User scan generally requires a single switch."

**Single Switch**
- Scan doesn't start until switch press detected
- Machine progresses highlight at predetermined rate
- Currently highlighted item selected on:
  - Switch release, OR
  - After dwell time

**Two Switches**
- Second switch used to activate currently highlighted item
- First switch used to progress the scan

#### Critical Overscan

> "This scan control is devised to give a rapid access to items in a large selection set without the complications of subsets."

**How it works**
- Machine controls progression of highlight
- Moves initially very quickly
- User presses switch to slow the scan
- User selects item at desired position

### Step Scan

> "In step scan the user controls the movement of the highlight and the selection of the items"

#### Two Switch Step Scan
- Switch 1: Advance highlight
- Switch 2: Select current item

#### One Switch Step Scan
- Single switch for both advance and select
- Uses dwell time or other selection method
- Requires timing-based mode switching

### Step Scan Switch Alternation (Swap Switch)

> "When the switch function is alternated this means that when a selection has been made with a particular switch its function swaps so that it becomes the switch which advances the highlighter. The other switch then takes on the role of selecting. After the next selection the roles reverse again."

**Purpose**
- Distribute pattern of switch presses more evenly between two switches
- Balance physical load across switches

---

## Manipulating the Highlighter Movement

### Auto – Restart, Starting and Restarting

> "After selecting an item the highlight can be restarted by either continuing from the position of the last item selected, or by starting from the initial item again."

**Restart Options**
1. **Continue from last selected item**
2. **Start from initial item again**

**Control Methods**
- **Automatic**: Machine restarts the scan
- **Manual**: Wait for user to press switch to start

**Applicability**
- Only for scanning methods where machine progresses scan highlight
- May require restart after given number of passes (e.g., critical overscan)

**Initial Item Highlighting**
- Beneficial to highlight first item for longer period
- Gives user time to prepare

### Dealing with Errors

> "The cost of the errors for switch users is much greater than for other people since it takes more time and effort to correct wrong selections."

#### Error Items

**Backspace**
- Undo the last character

**Undo/Redo**
- Undo/redo the last 'operation'

**Back**
- Specific to groups and pages
- Reverse the last group/page change

#### Scan Error Correction

> "Errors in switch selections may not trigger an output, without a method of correcting a scan error the user is required to make an inappropriate selection and then undo that selection (a very costly process)."

**Methods to Overcome Scan Errors**

1. **Empty Items**
   - Allow users to select an item that does not result in an output
   - Resets the scan

2. **Cancel Scan Option**
   - Specific method for 'offering' a scan cancellation
   - Example: Highlighting all items in current group

3. **Switch Manipulation**
   - Use specific type of switch activation (e.g., long hold)
   - To cancel the scan
   - See 'selection' section below

---

## Selection Methods

### Dwell Selection
- Selection occurs after highlighting for specified time
- No switch press required
- Time threshold configurable
- Used with one-switch or direct pointing methods

### Switch Encoded Selection
- Switch press triggers selection
- May involve encoding (multiple presses, patterns)
- Can be combined with dwell for hybrid approaches

### Selection Confirmation
- Acceptance time delay before confirming selection
- Visual feedback during acceptance period
- Ability to cancel during acceptance

---

## Implementation Considerations

### Visual Load
- Reduce visual load through appropriate grouping
- Balance items per page
- Consider cognitive load

### Timing Parameters
- Scan rate (items per minute/second)
- Initial item highlight time
- Dwell time threshold
- Acceptance time delay
- Error recovery timeout

### Physical Considerations
- Switch placement and accessibility
- Fatigue management
- Repetitive strain prevention
- Alternation strategies for load balancing

### User Control
- Allow adjustment of:
  - Scan speed
  - Group sizes
  - Highlight styles
  - Audio feedback
  - Error recovery methods

---

## Missing Features to Implement

Based on this guide, features not yet in our scanner:

### High Priority
1. **Critical Overscan** - Fast initial scan, slow on demand
2. **Auto-While-Held Scan** - Progress only while switch held
3. **Step Scan Alternation** - Swap switch functions after each selection
4. **Empty Items** - Non-selectable items for scan reset
5. **Cancel Scan Option** - Dedicated scan cancellation method
6. **Long-hold Cancel** - Use long press to cancel
7. **Initial Item Extended Highlight** - Longer pause on first item

### Medium Priority
8. **Flip Chart Presentation** - One-item-at-a-time display
9. **Pop-up/Secondary Pages** - Nested page navigation
10. **Custom Presentation** - Priority/emphasis items
11. **Backspace Item** - Undo last character selection
12. **Undo/Redo Operations** - Full operation history
13. **Back Navigation** - Reverse page/group changes
14. **Rotating Arrow Direction** - Visual direction indicator

### Lower Priority
15. **Mixed Group Scanning** - Hybrid approaches
16. **Scan Loop at Edge** - For reduced-switch directed scan
17. **Visual Load Indicators** - Show page/group count
18. **Fatigue Monitoring** - Suggest breaks based on usage

---

## Configuration Organization Plan

### Current Issues
- Too many top-level config options
- Related options scattered
- Unclear relationships between settings
- Technical terminology (user-unfriendly)

### Proposed Structure

#### Level 1: Presentation (How items look)
```
presentation:
  - layout: grid | list | flip-chart | custom
  - groupSize: small | medium | large
  - itemsPerPage: number
  - theme: default | sketch | high-contrast
```

#### Level 2: Organization (How items are grouped)
```
organization:
  - structure: flat | hierarchical
  - method: rows | columns | mixed | elimination
  - groupCount: number (for elimination/progressive)
  - showPageNumbers: boolean
  - allowPageLinks: boolean
```

#### Level 3: Movement (How highlight moves)
```
movement:
  - mode: auto | step | directed
  - technique: linear | row-column | group | continuous
  - control: single-switch | two-switch | multi-switch
  - direction: circular | reverse | oscillating
```

#### Level 4: Timing (When things happen)
```
timing:
  - scanRate: milliseconds
  - initialPause: milliseconds (extended first item)
  - dwellTime: milliseconds (0 = off)
  - acceptanceTime: milliseconds
  - criticalOverscan: { fastRate, slowRate }
```

#### Level 5: Feedback (What user sees/hears)
```
feedback:
  - visual: { highlights, borders, colors, animation }
  - audio: { scanSound, selectSound, voiceOutput }
  - tactile: boolean (where supported)
```

#### Level 6: Error Handling (How to recover)
```
errors:
  - allowEmptyItems: boolean
  - allowCancel: boolean
  - cancelMethod: button | long-hold | timeout
  - undoType: none | character | operation | full
  - maxHistory: number
```

#### Level 7: Advanced (Power user settings)
```
advanced:
  - switchAlternation: boolean
  - autoRestart: continue | restart
  - restartDelay: milliseconds
  - debugMode: boolean
  - costVisualization: none | numbers | heatmap
```

### UI Organization
**Tabbed Settings Panel**:
1. **Presentation** - Layout, theme, visual style
2. **Scanning** - Movement method, technique, switches
3. **Timing** - Speed, delays, dwell
4. **Feedback** - Visual, audio settings
5. **Accessibility** - Error recovery, shortcuts
6. **Advanced** - Power user options

### Presets
- **Beginner**: Simple linear scan, slow speed, lots of feedback
- **Intermediate**: Row-column, medium speed, standard feedback
- **Advanced**: Elimination scanning, fast speed, minimal feedback
- **Single Switch**: Optimized for one-switch use
- **Multi Switch**: Optimized for 3+ switches
