# Switch Scanning: The 7 Key Components - Deep Dive

**Target Audience:** Developers, UX Designers, Clinicians, Occupational Therapists

---

## The 7 Key Components

1. **Scanning Pattern** - How items are organized and traversed
2. **Scanning Mode** - Specialized scanning behaviors
3. **Scanning Technique** - How groups are highlighted
4. **Scan Direction** - Order of item traversal
5. **Scan Timing** - Speed and pacing
6. **Visualization** - Visual feedback and highlighting
7. **Error Recovery** - Mistake correction methods

---

## Component 1: Scanning Patterns

### What Are Scanning Patterns?

Scanning patterns determine **how items are organized** and **the sequence in which they're highlighted**. This is the single most important factor affecting scanning efficiency.

### The Patterns

#### 1. Linear Scan
**How it works:** Items are highlighted one by one in sequence (left-to-right, top-to-bottom)

**Best for:**
- Small selection sets (<10 items)
- Single-switch users
- Beginners learning to scan

**Efficiency:** O(n) - Average cost = n/2 presses

**Example:** Selecting "M" from 26 letters
- A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
- Average cost: 13 presses

**When to use:**
- Simple menus (Yes/No, Menu/Back)
- Small number grids (0-9)
- Teaching scanning basics

---

#### 2. Row-Column Scan
**How it works:**
- Stage 1: Scan all rows
- Stage 2: Scan items within selected row

**Best for:**
- Medium to large grids (16-64 items)
- Organized content (keyboards, number pads)
- Two-dimensional layouts

**Efficiency:** O(√n) - For 36 items in 6×6 grid: max 12 presses, avg 9 presses

**Example:** Selecting "M" from alphabet (QWERTY layout, 3 rows)
```
Stage 1: Select row 2 (3 options: 1, 2, 3)
Stage 2: Select "M" in row 2 (10 options: Q→P)
Total: 3 + 5 = 8 presses
```

**Compared to linear:** 8 presses vs 13 presses = **38% faster**

**When to use:**
- Keyboards (most common use case)
- Number pads
- Any grid with logical row structure

---

#### 3. Snake Scan
**How it works:** Like linear scan, but reverses direction at each row end
```
→ → → → →
         ↓
← ← ← ← ←
         ↓
→ → → → →
```

**Best for:**
- Minimizing travel distance
- Reducing scan time for last items in rows
- Visual continuity

**Efficiency:** O(n) - Similar to linear, but slightly better average

**Example:** 4×4 grid
```
Linear:  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16
Snake:   1  2  3  4  8  7  6  5  9 10 11 12 16 15 14 13
```

**When to use:**
- When physical layout doesn't matter
- Want to reduce "jump" from row end to next row start
- Dense grids

---

#### 4. Quadrant Scan
**How it works:**
- Split grid into quadrants (4 sections)
- User selects quadrant
- Scan items within selected quadrant

**Best for:**
- Large grids (64+ items)
- Users who can handle 2-stage selection
- Reducing scan time significantly

**Efficiency:** For 64 items (8×8 grid)
- Stage 1: 4 quadrants = 4 options
- Stage 2: 16 items in quadrant = 16 options
- Max cost: 4 + 16 = 20 presses
- Average: ~12 presses

**Compared to row-column (8×8):**
- Row-Column: 8 + 8 = 16 max, ~9 avg
- Quadrant: 4 + 16 = 20 max, ~12 avg
- **Row-column wins!**

**When to use:**
- Non-rectangular layouts
- When rows have different sizes
- Specialized grid arrangements

---

#### 5. Elimination Scanning ⭐ FASTEST
**How it works:**
- Repeatedly split selection set in half (or quarters)
- User selects which portion contains their target
- Continue until single item reached

**Best for:**
- Large grids (64+ items)
- Power users
- Maximizing speed

**Efficiency:** O(log₂n) - Logarithmic!

**Example:** 64 items with 4-switch (quadrant) elimination
```
Stage 1: 64 items → 4 quadrants → Select 1 (16 items remaining)
Stage 2: 16 items → 4 quadrants → Select 1 (4 items remaining)
Stage 3: 4 items → 4 quadrants → Select 1 (1 item = DONE!)
Total: 3 presses MAX
```

**Comparison Table (64 items):**

| Pattern | Max Presses | Avg Presses | Speed |
|---------|-------------|-------------|-------|
| Linear | 64 | 32 | 😴 Slow |
| Row-Column (8×8) | 16 | 9 | 🙂 Medium |
| Quadrant Scan | 20 | 12 | 🤷 Okay |
| **Elimination (4-switch)** | **3** | **3** | **🚀 Fastest!** |

**When to use:**
- Large keyboards
- Power users
- When speed is critical
- User has good cognitive ability for multi-stage selection

**Trade-offs:**
- ❌ Higher cognitive load
- ❌ Requires good timing
- ❌ Can be confusing for beginners
- ✅ Extremely fast once learned
- ✅ Efficient for any grid size

---

### Pattern Selection Guide

```
Grid Size          Recommended Pattern        Reason
───────────────────────────────────────────────────────────
1-10 items         Linear                    Simple, fast enough
11-30 items        Row-Column                Good balance
31-100 items       Row-Column OR Elimination  Depending on user ability
100+ items         Elimination               Only viable option
```

---

## Component 2: Scanning Modes

Scanning modes are **specialized behaviors** that override or enhance standard patterns.

### 1. Group-Row-Column Scan
**What it is:** Enhanced row-column with explicit group selection

**How it works:**
- Stage 1: Highlight groups (super-groups)
- Stage 2: Highlight rows within group
- Stage 3: Highlight items within row

**Best for:** Very large grids (>100 items) organized hierarchically

**Example:** Communication device
```
Stage 1: [Categories] [People] [Actions] [Places]
         Select "People"
Stage 2: [Family] [Friends] [Workers]
         Select "Family"
Stage 3: [Mom] [Dad] [Sister] [Brother]
         Select "Mom"
```

**Efficiency:** 3 stages for potentially hundreds of items

---

### 2. Continuous Scanning
**What it is:** Smooth, mouse-like movement instead of discrete steps

**How it works:** Highlight moves continuously across the grid
- **Gliding:** Smooth path with buffer zones
- **Crosshair:** Two independent lines (horizontal + vertical)
- **Eight-Direction:** Compass-style movement

**Best for:**
- Users with good timing
- Precise selection needed
- Mouse-like control desired

**Efficiency:** Low (requires very precise timing)

**When to use:**
- Direct selection is too difficult
- User has excellent timing abilities
- Joystick/alternative access needed

---

### 3. Probability Scanning (PPM)
**What it is:** Items scan in order of likely use, not position

**How it works:**
- Most frequently used items scan first
- Statistical models predict likely next items
- Adaptive: learns user patterns over time

**Best for:**
- Augmentative communication (AAC)
- Reducing scan time for common words
- Power users

**Example:** English letter frequency
```
Standard:  A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
           (avg: 13 presses for any letter)

Frequency: E T A O I N S H R D L C U M W F G Y P B V K J X Q Z
           (avg: 6-7 presses for common letters!)
```

**Efficiency:** Can reduce average scan cost by 50-70%

**When to use:**
- AAC devices
- Language prediction
- User has consistent vocabulary

---

### 4. Cause-Effect Mode
**What it is:** Teaching mode - single item always selected

**How it works:** Switch press ALWAYS triggers the only available item

**Best for:**
- Teaching cause-and-effect
- Beginners
- Assessment

**When to use:**
- First-time switch users
- Testing understanding
- Building confidence

---

## Component 3: Scanning Techniques

### Block vs Point Technique

These apply to row-column and other grouped patterns.

#### Block Technique
**What it is:** Entire group/row highlights as solid block

**Visual:**
```
┌─────────────────────────┐
│ ████████████████████████ │ ← Entire row lit up
└─────────────────────────┘
```

**Pros:**
- ✅ Easy to see
- ✅ Clear group boundaries
- ✅ Better for larger items
- ✅ Less visual clutter

**Cons:**
- ❌ Can overwhelm visually
- ❌ Harder to see individual items

**When to use:**
- Beginners
- Larger grids
- Items with icons/images
- Low vision users

---

#### Point Technique
**What it is:** Only group indicator highlights (not the items themselves)

**Visual:**
```
[→] Row 1     ← Just an indicator
[→] Row 2
[→] Row 3
```

**Pros:**
- ✅ Less visual distraction
- ✅ Easier to focus
- ✅ Better for dense grids

**Cons:**
- ❌ Harder to see group boundaries
- ❌ Less intuitive
- ❌ Requires abstract thinking

**When to use:**
- Dense grids (small cells)
- Experienced users
- Text-based content
- Minimizing visual load

---

### Decision Tree

```
User has low vision?
├─ Yes → Use BLOCK technique
└─ No
   ├─ Items are large icons/images?
   │  ├─ Yes → Use BLOCK technique
   │  └─ No
   │     ├─ Grid is dense (>64 items)?
   │     │  ├─ Yes → Use POINT technique
   │     └─ No → User preference
   └─ User is beginner?
      ├─ Yes → Start with BLOCK
      └─ No → User preference
```

---

## Component 4: Scan Direction

### The Three Directions

#### 1. Circular (Default)
**What it is:** Standard forward scan
```
0 → 1 → 2 → 3 → 4 → ... → n-1 → 0 → 1 → ...
```

**Best for:** Most users, most situations

---

#### 2. Reverse
**What it is:** Scan in opposite direction
```
n-1 ← n-2 ← ... ← 2 ← 1 ← 0 ← n-1 ← n-2 ← ...
```

**Best for:**
- Left-to-right reading languages (Hebrew, Arabic)
- User preference
- Reducing scan time for items at "end"

**Example:** Hebrew keyboard
```
Linear forward:  א ב ג ד ה ו ז ח ט י כ ל מ נ ס ע פ צ ק ר ש ת
                (selecting "ת" = 27 presses)

Linear reverse:  ת ש ר ק צ פ ע ס נ מ ל כ י ט ח ז ו ה ד ג ב א
                (selecting "ת" = 1 press!)
```

**Efficiency gain:** Depends on target position

---

#### 3. Oscillating
**What it is:** Back-and-forth scanning
```
0 → 1 → 2 → 3 → 4 → 5
                    ↓
4 ← 3 ← 2 ← 1 ← 0
  ↓
1 → 2 → 3 → 4 → 5
...
```

**Best for:**
- Reducing travel distance
- Minimizing wait time for edge items
- Smoother visual flow

**Efficiency:** Slightly better than circular for edge items

**When to use:**
- Dense grids
- User scans visually (not just waiting)
- Aesthetics/motion smoothness

---

### Direction Selection Guide

| User Scenario | Recommended Direction |
|---------------|----------------------|
| Right-to-left language | Reverse |
| Items clustered at end | Reverse |
| Evenly distributed items | Circular |
| User prefers smooth motion | Oscillating |
| No preference | Circular (default) |

---

## Component 5: Scan Timing

### Timing Parameters

#### 1. Scan Rate
**What it is:** Time between item highlights (milliseconds)

**Typical values:**
- Fast: 500ms (2 items/second)
- Medium: 1000ms (1 item/second)
- Slow: 1500-2000ms (0.5-0.7 items/second)

**Impact on efficiency:**
- **Too fast:** Missed selections, frustration
- **Too slow:** Boring, takes too long
- **Just right:** User feels in control

**Guidelines:**
```
User Profile          Recommended Range
─────────────────────────────────────────
Beginner             1500-2000ms
Intermediate         1000-1500ms
Advanced             500-1000ms
Motor impairment     1500-2000ms
Visual impairment    1000-1500ms (with audio)
Cognitive impairment  1500-2000ms
Tremors/athetosis    1500ms + debounce
```

**Efficiency calculation:**
```
Time to select item = (scan rate × item position) + reaction time

Example: Selecting 15th item at 1000ms rate
= 1000ms × 15 + 200ms (reaction)
= 15.2 seconds
```

---

#### 2. Initial Item Pause
**What it is:** Extended highlight on first item of each cycle

**Purpose:** Gives user time to prepare before scan starts

**Typical values:**
- Off: 0ms (no pause)
- Short: 500ms
- Long: 1000-1500ms

**When to use:**
- ✅ Users with slow reaction time
- ✅ Beginners learning to scan
- ✅ Complex multi-stage patterns
- ❌ Power users (wastes time)

**Efficiency impact:**
- Slows overall scan by: pause_time × number_of_cycles
- But reduces missed selections significantly

---

#### 3. Dwell Time
**What it is:** Auto-select after highlight duration (no switch press needed)

**How it works:**
- User doesn't press switch
- Just waits on desired item
- System auto-selects after dwell time

**Best for:**
- Users who can't press switch reliably
- Reducing motor load
- "Hands-free" scanning

**Typical values:**
- Short: 1000ms (fast selection)
- Medium: 1500ms (standard)
- Long: 2000-3000ms (for slower users)

**Efficiency:**
- Slower than switch selection
- But reduces physical effort
- May reduce errors

**When to use:**
- User has consistent movement but unreliable switch activation
- Minimizing fatigue
- Head/eye tracking systems

---

#### 4. Acceptance Time
**What it is:** Time switch must be held to confirm selection

**Purpose:** Prevent accidental activations from tremors

**How it works:**
1. User presses switch
2. System waits X ms
3. If still pressed after X ms → accept selection
4. If released before X ms → ignore

**Best for:** Users with tremors, spasticity, or motor fluctuations

**Typical values:**
- Off: 0ms (instant selection)
- Short: 200-300ms
- Medium: 500ms
- Long: 800-1000ms

**Efficiency impact:**
- Adds delay to every selection
- But dramatically reduces errors
- Net benefit: fewer corrections needed

---

#### 5. Scan Loops
**What it is:** Number of complete scan cycles before stopping (0 = infinite)

**Purpose:** Prevent infinite waiting

**How it works:**
- Scan loops through items N times
- Then stops and waits for manual restart
- Or requires reactivation

**Best for:**
- Users who may miss their item
- Preventing frustration
- Energy conservation

**Typical values:**
- 0 (infinite): Continuous scanning
- 1-2: Quick pass, then stop
- 3-4: Standard (default)
- 5+: Multiple opportunities

**Efficiency calculation:**
```
Probability of selecting item = 1 - (miss_rate ^ loops)

Example: 90% success rate, 4 loops
= 1 - (0.10 ^ 4)
= 1 - 0.0001
= 99.99% success probability!
```

---

### Timing Optimization Strategy

**Step 1:** Start slow and conservative
- Scan rate: 2000ms
- Initial pause: 1000ms
- Acceptance time: 500ms

**Step 2:** Gradually increase speed
- Reduce scan rate by 100-200ms per session
- Monitor error rate
- Stop when errors increase

**Step 3:** Fine-tune for individual
- Adjust based on most common tasks
- Consider fatigue throughout day
- Allow user presets (morning vs afternoon)

---

## Component 6: Visualization

### Visual Highlighting Options

#### 1. Border Emphasis
**What it is:** Add colored outline/border to highlighted item

**Parameters:**
- Width: 0-10px (thicker = more visible)
- Color: Any CSS color (contrast matters!)
- Style: Solid, dashed, double

**Best practices:**
- Minimum 4px for visibility
- High contrast color (orange on white = good)
- Avoid red/green (color blindness)

**Efficiency:** Better visibility → faster reaction → fewer misses

---

#### 2. Color Changes
**What it is:** Change background color of highlighted item

**Best for:**
- Users with low vision
- High contrast needs
- Visual scanning

**Colors to avoid:**
- Red/green combination (color blindness)
- Low contrast (light yellow on white)

**Recommended:**
- Orange (#FF9800) - High contrast
- Blue (#2196F3) - Good visibility
- Cyan (#00BCD4) - Very visible

---

#### 3. Size Changes (Scale)
**What it is:** Enlarge highlighted item

**Parameters:** 1.0 (no change) to 1.5 (50% larger)

**Best for:**
- Low vision users
- Drawing attention
- Reducing visual search

**Trade-offs:**
- ✅ Very visible
- ❌ Can cause layout shift
- ❌ May overlap adjacent items

**When to use:**
- Larger grids (small cells)
- Items have space to expand
- User has visual impairment

---

#### 4. Opacity Changes
**What it is:** Dim non-highlighted items

**Parameters:** 0.3 (very dim) to 1.0 (no change)

**Best for:**
- Reducing visual clutter
- Focusing attention
- Large grids

**Example:**
```
Highlighted:  ████████ 100% opacity
Others:       ░░░░░░░░  30% opacity
```

**Efficiency:** Reduces distraction → faster target identification

---

#### 5. Animation
**What it is:** Pulse, bounce, or shake highlighted item

**Types:**
- **Pulse:** Size/opacity oscillation
- **Bounce:** Vertical movement
- **Shake:** Horizontal vibration
- **Glow:** Brightness oscillation

**Best for:**
- Drawing attention
- Making scanning more engaging
- Low vision users

**Caution:**
- Can be distracting
- May cause motion sickness
- Increases visual load

**When to use:**
- User prefers dynamic feedback
- Need strong visual cue
- Aesthetic preference

---

### Visualization Strategy

**For low vision:**
- Thick borders (6-8px)
- High contrast colors
- Scale increase (1.2-1.3)
- Animation enabled

**For cognitive impairment:**
- Simple, clear highlighting
- Avoid animation (distracting)
- One visual cue at a time
- High contrast

**For power users:**
- Minimal highlighting
- Thin borders (2-4px)
- No animation
- Subtle color changes

---

## Component 7: Error Recovery

### Why Error Recovery Matters

**For typical users:**
- Click wrong item → 1 second to correct

**For switch users:**
- Select wrong item → 30+ seconds to scan again and fix

**Error cost is 30x higher for switch users!**

---

### Error Recovery Methods

#### 1. Empty Items
**What it is:** Special items that don't trigger output, just reset scan

**How it works:**
- User selects "Reset" item
- Scan restarts from beginning
- No output triggered

**Best for:**
- Preventing wrong selections
- Anxiety reduction
- Allowing mistakes without penalty

**Placement strategy:**
- Every 5-10 items
- At end of each row
- User-selectable position

**Efficiency impact:**
- Increases scan length slightly
- But dramatically reduces correction time
- Net benefit: Lower stress, fewer actual errors

---

#### 2. Long-Hold Cancel
**What it is:** Hold switch for 1+ seconds to cancel current scan

**How it works:**
1. User holds switch (instead of quick press)
2. System detects long hold
3. Scan cancels/returns to start
4. No selection made

**Best for:**
- Users who can sustain switch activation
- Reducing anxiety about mistakes
- "Panic button" functionality

**Typical timing:**
- Detection threshold: 1000ms
- User must hold continuously
- Visual feedback during hold

---

#### 3. Cancel Button
**What it is:** Dedicated button to cancel scan cycle

**How it works:**
- Always visible in scan
- Pressing it cancels current scan
- Returns to start or previous level

**Best for:**
- Multi-switch users
- Clear, explicit action
- Reducing cognitive load

---

#### 4. Undo/Redo
**What it is:** Reverse last action

**Types:**
- **Character undo:** Remove last character
- **Word undo:** Remove last word
- **Operation undo:** Reverse last complete action

**Best for:**
- Text entry
- Building sentences
- Complex sequences

**Implementation:**
- Maintain history stack
- Allow multiple undo (3-10 actions)
- Clear history on new session

---

#### 5. Back Navigation
**What it is:** Return to previous level in hierarchy

**Best for:**
- Group scanning (row → row selection)
- Multi-level menus
- "I chose wrong group" scenarios

**Efficiency:**
- Saves restarting entire scan
- Quick correction
- Reduces frustration

---

### Error Recovery Strategy

**For beginners:**
- Empty items every 5 positions
- Cancel button always visible
- Generous undo (10+ actions)
- No long-hold (too complex)

**For intermediate:**
- Empty items at row ends
- Long-hold cancel available
- Moderate undo (5 actions)
- Back navigation in groups

**For advanced:**
- Minimal empty items (user preference)
- Long-hold cancel enabled
- Limited undo (3 actions)
- Back navigation only in deep hierarchies

---

## Efficiency Deep Dive

### Alphabet Layout: Alphabetical vs Frequency

#### Alphabetical Order
```
A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
```

**Cost to select common letters:**
- E (most common): 5th position = 5 presses
- T (2nd most common): 20th position = 20 presses
- A (3rd most common): 1st position = 1 press
- O (4th most common): 15th position = 15 presses
- **Average for top 10:** ~10.5 presses

---

#### Frequency Order
```
E T A O I N S H R D L C U M W F G Y P B V K J X Q Z
```

**Cost to select common letters:**
- E: 1st = 1 press ✅
- T: 2nd = 2 presses ✅
- A: 3rd = 3 presses ✅
- O: 4th = 4 presses ✅
- **Average for top 10:** ~5.5 presses

**Efficiency gain:** 50% reduction for most common letters!

---

### Real-World Typing Analysis

**Assuming typical English text:**

Letter frequency in English:
```
E: 12.7%  T: 9.1%  A: 8.2%  O: 7.5%  I: 7.0%  N: 6.7%  S: 6.3%  H: 6.1%  R: 6.0%  D: 4.3%
```

**Alphabetical layout:**
```
Average cost per letter = 13 presses
For "THE" (T + H + E) = 20 + 8 + 5 = 33 presses
```

**Frequency layout:**
```
Average cost per letter = 6.5 presses
For "THE" (T + H + E) = 2 + 8 + 1 = 11 presses
```

**Efficiency gain:** 67% reduction for "THE"!

---

### Pattern Efficiency Comparison

**Task: Type "HELLO WORLD" (11 characters, includes space)**

Using alphabetical layout (row-column scan):
```
Average per letter: ~9 presses
Total: 11 × 9 = 99 presses
Time at 1000ms rate: 99 seconds
```

Using frequency layout (row-column scan):
```
Average per letter: ~5 presses
Total: 11 × 5 = 55 presses
Time at 1000ms rate: 55 seconds
```

**Time savings:** 44 seconds per sentence! 🚀

---

### Optimizing for Different Tasks

#### Email Writing
**Common patterns:**
- "Hi [Name],"
- "Thank you,"
- "Best regards,"
- User's own name

**Optimization:**
- Frequency-based layout
- Add common phrases to top row
- Personal word prediction

**Efficiency gain:** 60-70% time reduction

---

#### Programming
**Common patterns:**
- Keywords (function, return, if, else)
- Syntax ( { } ( ) ; )
- Variable names

**Optimization:**
- Custom layout with keywords first
- Code templates
- Snippet expansion

**Efficiency gain:** 50% time reduction

---

#### Web Browsing
**Common patterns:**
- Navigation (back, forward, home)
- Links (few at a time)
- Forms (text entry)

**Optimization:**
- Dynamic context-aware layouts
- Few items, faster scan
- Predictive next options

**Efficiency gain:** 40% time reduction

---

## User-Centered Design: Matching Patterns to Users

### Beginner User Profile
**Characteristics:**
- Learning scanning concepts
- Slow reaction time
- Low confidence
- High error rate

**Recommended Configuration:**
```
Pattern: Linear or Row-Column (block)
Technique: Block (easier to see)
Direction: Circular
Rate: 1500-2000ms (slow)
Loops: 4 (plenty of chances)
Visualization: Thick borders, scale 1.2, animation ON
Error Recovery: Empty items every 5, undo enabled
```

**Rationale:**
- Simplicity over speed
- Clear visual feedback
- Forgiving of mistakes
- Builds confidence

**Progression path:**
1. Start with linear (3-5 items)
2. Add row-column (3×3 grid)
3. Increase grid size (4×4)
4. Introduce elimination
5. Optimize for efficiency

---

### Intermediate User Profile
**Characteristics:**
- Comfortable with scanning
- Moderate reaction time
- Some efficiency desired
- Low-moderate error rate

**Recommended Configuration:**
```
Pattern: Row-Column (block or point, user preference)
Technique: User choice
Direction: Circular
Rate: 1000-1500ms
Loops: 3
Visualization: Medium borders, scale 1.1, animation optional
Error Recovery: Empty items at row ends, long-hold enabled
```

**Rationale:**
- Balance speed and accuracy
- User has preferences
- Good efficiency
- Some error tolerance

---

### Advanced/Power User Profile
**Characteristics:**
- Expert at scanning
- Fast reaction time
- Maximum efficiency desired
- Low error rate

**Recommended Configuration:**
```
Pattern: Elimination (4-switch) OR Row-Column (frequency)
Technique: Point (less clutter)
Direction: Circular or Reverse (for end items)
Rate: 500-1000ms (fast!)
Loops: 2 or infinite
Visualization: Thin borders, scale 1.0, animation OFF
Error Recovery: Minimal (long-hold only), undo limited
```

**Rationale:**
- Speed over forgiveness
- Minimal visual distraction
- User has excellent timing
- Errors are rare

**Potential efficiency:**
- 20+ words per minute possible
- Comparable to hunt-and-peck typing

---

### Special User Profiles

#### Athetosis (Involuntary Movement)
**Challenges:** Tremors, accidental activations, muscle spasms

**Configuration:**
```
Pattern: Row-Column (block, easier to track)
Technique: Block
Direction: Circular (predictable)
Rate: 1500ms (slower)
Acceptance Time: 500-800ms (filter tremors)
Dwell Time: Optional (may help)
Visualization: Thick borders (8px), high contrast, animation OFF
Error Recovery: Empty items frequent, undo generous
```

**Rationale:**
- Slower to compensate for movement
- Acceptance time filters out tremors
- Clear visualization despite motion
- Forgiving error recovery

---

#### Degenerative Condition (MND/ALS)
**Challenges:** Progressive weakness, fatigue over time

**Configuration:**
```
Pattern: Elimination (fewer presses = less fatigue)
Technique: Point
Direction: Circular
Rate: Morning: 1000ms, Afternoon: 1500ms (fatigue)
Loops: 4-5 (more chances as fatigue sets in)
Visualization: Medium (balance visibility vs clutter)
Error Recovery: Empty items, undo, long-hold cancel
Special: Switch alternation (balance motor load)
```

**Rationale:**
- Minimize presses (efficiency = less work)
- Slower in afternoon (accommodate fatigue)
- More chances (loops) as user tires
- Alternation reduces repetitive strain

**Progression planning:**
- Reassess monthly
- Adjust rate based on fatigue
- Consider dwell selection as condition progresses
- Plan for eye-tracking transition

---

#### Visual Impairment
**Challenges:** Difficulty tracking highlight, low vision

**Configuration:**
```
Pattern: Row-Column (block - easier to track)
Technique: Block (whole row visible)
Direction: Circular
Rate: 1000-1500ms
Visualization: THICK borders (8-10px), scale 1.3, HIGH CONTRAST colors
Auditory: Scan sounds, selection sounds, VOICE OUTPUT (item names)
Error Recovery: Empty items, clear audio feedback
```

**Rationale:**
- Block technique easier to see than point
- Thick borders maximize visibility
- Scale makes items larger
- Audio compensates for visual difficulty
- High contrast essential

---

#### Cognitive Impairment
**Challenges:** Overwhelmed by complexity, difficulty with hierarchies

**Configuration:**
```
Pattern: Linear or simple Row-Column
Technique: Block
Direction: Circular
Rate: 1500-2000ms (more thinking time)
Loops: 5 (more chances)
Visualization: Simple, clear, NO animation (distracting)
Error Recovery: Empty items, cancel button, generous undo
Special: Small grids (<20 items), shallow hierarchy
```

**Rationale:**
- Simplicity over efficiency
- More time for decisions
- Fewer items = less overwhelming
- Clear feedback without distraction
- Forgiving error recovery

---

## Conclusion: The Art of Configuration

### There Is No "One Size Fits All"

Every user is unique. The "best" configuration depends on:

1. **Physical abilities** - Motor control, fatigue, tremors
2. **Visual abilities** - Acuity, field, contrast sensitivity
3. **Cognitive abilities** - Memory, attention, processing speed
4. **Experience level** - Beginner, intermediate, advanced
5. **Tasks** - Email, web browsing, programming, communication
6. **Goals** - Speed vs accuracy vs comfort
7. **Preferences** - Some users just like what they like

### The Optimization Process

**Phase 1: Assessment (Week 1)**
- Observe user using default configuration
- Note strengths and challenges
- Identify pain points
- Gather user feedback

**Phase 2: Basic Optimization (Weeks 2-3)**
- Adjust scan rate based on reaction time
- Choose appropriate pattern (linear vs row-column)
- Set visualization based on visual needs
- Enable basic error recovery

**Phase 3: Advanced Optimization (Weeks 4-8)**
- Try elimination scanning (if appropriate)
- Fine-tune timing parameters
- Adjust visualization to preference
- Optimize for common tasks

**Phase 4: Maintenance (Ongoing)**
- Monthly reassessment
- Adjust for fatigue/progression
- Update as needs change
- Monitor for regression

### Key Takeaways

1. **Efficiency isn't everything** - Comfort and accuracy matter more
2. **Start conservative** - It's easier to speed up than slow down
3. **Involve the user** - They know what works for them
4. **Reassess regularly** - Needs change over time
5. **Document configurations** - Save what works for each user
6. **Consider context** - Morning ≠ afternoon ≠ evening
7. **Think holistically** - Physical + cognitive + visual + emotional

### The Ultimate Goal

**Not maximum efficiency. Maximum autonomy.**

The best scanning configuration is the one that lets the user communicate independently, comfortably, and confidently. Efficiency is just one piece of that puzzle.
