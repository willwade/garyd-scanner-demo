Switch Scanning - The Complete Reference & Design Guide

Based on "Switch Access with a Pointer Interface - An evaluation and design guide"
Reference: David Colven & Simon Judge (ACE Centre).

1. The Core Philosophy: Input Bandwidth

Access to technology exists on a spectrum of "bandwidth." A touch typist uses many keys and high speed (high bandwidth). A switch user operates with just one or two bits of information—ON or OFF (low bandwidth).

The Sushi Bar Analogy:
Scanning is like a sushi bar. You cannot reach all the dishes at once; you must wait for the conveyor belt to bring the desired item to you. The user effectively sacrifices time to gain access.

graph LR
    A[Single Switch] -->|Low Bandwidth| B(On-Screen Keyboards)
    B --> C(Hunt & Peck Typing)
    C -->|High Bandwidth| D[Touch Typing / CAD]
    style A fill:#f96,stroke:#333
    style D fill:#6f9,stroke:#333


2. User Characteristics & Needs

Understanding the user's physical and cognitive profile is the first step in configuration.

Characteristic

Impact on Scanning

Required Feature

Athetosis (Involuntary Movement)

Accidental double-taps or "drags"

Debounce & Acceptance Time

Degenerative (e.g., MND/ALS)

Fatigue over time

Switch Alternation / Dwell

Visual Impairment

Difficulty tracking the highlight

Auditory Highlighting (Prompting)

Cognitive Loading

Overwhelmed by large grids

Hierarchical Grouping / Pages

3. Selection Sets

The set of all items from which choices are made is the selection set.

Presentation Formats

Single Line: Visual representations in a simple line (any orientation).

Grid: Two-dimensional layout for large numbers of items (e.g., The Grid).

Flip Chart: Items displayed one at a time, similar to a rotary file index.

Pop-up: Secondary pages displayed temporarily within the current page.

Custom: Non-standard layouts giving higher priority to specific items.

mindmap
  root((Selection Set))
    Presentation
      Linear
      Grid
      Flip Chart
      Pop-up
    Items
      Characters
      Words/Symbols
      Functions
      Links to Pages


4. Grouping & Hierarchy

When selection sets are large, items are organized into a layered hierarchy to reduce the scan path.

Lowest Level: Individual items (cells).

Groups: Contain individual items (e.g., a row).

Super-groups: Contain multiple groups (e.g., half a grid).

Pagination: Sub-dividing the set into separate pages connected by "links" (similar to hyperlinks).

5. Highlighting & Feedback

Highlighting indicates the currently active item or group.

Visual: Color changes, thick borders, animations, or size changes.

Auditory: Sound cues or voice output of item names (auditory prompting).

Combined: Multisensory feedback is often most effective.

Acceptance Feedback: Crucial to indicate when a switch press has been successfully filtered and registered.

6. Scanning Sequencing Methods

1. Simple Scan (Linear)

Sequential progression through all items, one at a time.

2. Group Scan (Row-Column)

The set is divided into groups. The user selects a group, then scans items within it.

Row/Column: Select row, then item.

Column/Row: Select column, then item.

Progressive Segmenting: "Halving" or "Quartering" the set repeatedly.

3. Directed Scan (Joystick)

The user controls the direction of the highlight movement (Up, Down, Left, Right).

Natural Setup: 4+ switches for each direction.

Reduced Switch: Right and Down only, looping at edges.

7. Highlighter Movement Control

Autoscan (Single Switch)

The machine progresses the highlight; the user presses a switch to select.

flowchart TD
    Start([Start Scan]) --> High[Highlight Item 1]
    High --> Wait{Switch Pressed?}
    Wait -- No --> Delay[Wait Scan Time]
    Delay --> Next[Highlight Next Item]
    Next --> Wait
    Wait -- Yes --> Select([Select Item])
    Select --> Restart{Auto-Restart?}
    Restart -- Yes --> Start


Step Scan (Two Switches)

The user controls both movement and selection.

Switch 1: Advance highlight.

Switch 2: Select current item.

Alternation (Swap Switch): Functions swap after each selection to balance physical load.

Critical Overscan

Designed for rapid access to large sets.

Machine moves the highlight very fast.

User presses switch to slow down and reverse (or retrace).

User selects item at the normal rate.

8. Manipulating Movement & Errors

Start/Restart Options

Initial Item Pause: Highlighting the first item longer to allow the user to prepare.

Auto-Restart: Jumping back to the first item after a selection.

Manual Restart: Waiting for a switch press to begin the next scan.

**Scan Loops**: The number of complete scan cycles before stopping (default: 4, 0 = infinite). This prevents users from having to wait indefinitely for their item to come around again. After the specified number of loops, the scanner stops and waits for manual restart or reactivation.

Error Correction

Backspace/Undo: Reversing the last character or operation.

Empty Items: Selectable "dead zones" that do nothing but reset the scan.

Cancel Option: A dedicated method to stop the current scan (e.g., highlighting the whole group).

Long-Hold Cancel: Using a long switch activation to jump back to a home page.

9. Selection & Filtering

Dwell Selection

Selection occurs automatically if the highlight remains on an item for a specified time. Useful for users who can move a highlight but find the "click" action fatiguing.

Input Filtering (Technical Fine-Tuning)

Crucial for removing unwanted switch actions caused by tremors or mechanical bounce.

gantt
    title Switch Input Timeline (Acceptance & Debounce)
    dateFormat  X
    axisFormat %s
    section Switch State
    Initial Press      :active, p1, 0, 2
    Tremor/Bounce      :done, b1, 2, 3
    Sustained Hold     :active, h1, 3, 7
    section Logic
    Debounce Period    :crit, d1, 0, 4
    Acceptance Window  :milestone, a1, 6, 0


Debounce: Ignores rapid "chatter" from mechanical switches.

Acceptance Time: The time a switch must be held before it is "accepted."

Post-Acceptance Time: The "cool down" period where further presses are ignored.

Generated based on the ACE Centre Switch Access Guide.