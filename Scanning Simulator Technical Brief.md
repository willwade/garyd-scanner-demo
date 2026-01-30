# **Technical Specification: Comprehensive Scanning Simulator (v7.0)**

## **1\. Project Overview**

A client-side, responsive web application designed to demonstrate the mechanics, efficiency, and clinical application of switch scanning. The tool is built for embeddability (iframes) in educational blogs and training platforms.

## **2\. Interface & Grid Requirements**

* **Grid Layout:** A fixed ![][image1] grid of interactive buttons.  
* **Scalability:** The interface must use fluid units (vw/vh or Flexbox/Grid) to ensure it fills the container or window without horizontal scrolling.  
* **Target Content:** Each button should represent a selectable target (labeled 1–63). In "Predictive/PPM" mode, these may represent characters (A–Z, Space, etc.).  
* **Iframe Mode:** A URL parameter ?ui=hidden must hide the settings panel for a clean presentation. A keyboard shortcut (e.g., 'S') toggles the settings overlay.

## **3\. Input & Interaction (Switch Mapping)**

The system must support "Single Switch" and "Multi-Switch" configurations:

* **Switch 1 (Primary):** Space, Enter, or UI Tap. Performs "Select" or "Hold."  
* **Switch 2 (Secondary):** 2 or UI Tap. Performs "Step" or "Back-up."  
* **Switch 3 (Restart/Utility):** 3 or UI Tap. Performs "Home/Reset."  
* **Switch 4 (Clear/Cancel):** 4 or UI Tap. Cancels current scan sequence.  
* **Dwell Activation:** Optional "zero-switch" mode where hovering/focusing for a set time triggers a selection.

## **4\. Movement Pattern Catalog**

The developer must implement the following patterns, as defined in literature (Ntoa et al., 2004; Felzer & Rinderknecht, 2009):

### **A. Block & Hierarchical Scanning**

* **Row-Column:** Scans rows ![][image2] then columns within the selected row.  
* **Column-Row:** Scans columns ![][image2] then rows within the selected column.  
* **Row-Group-Column:** Groups rows into blocks (e.g., Top/Middle/Bottom) to reduce steps.  
* **Quadrant (3D Scanning):** The grid is divided into four quadrants. Select Quadrant ![][image2] Select Row ![][image2] Select Item.  
* **Cluster Scanning:** Location-based clusters (e.g., ![][image3] zones) are highlighted based on proximity.

### **B. Linear & Snake Scanning**

* **Linear (Row-Major):** Item-by-item from top-left to bottom-right.  
* **Snake (Boustrophedon):** Scans L-R on Row 1, R-L on Row 2 to prevent visual "jumps."

### **C. Continuous / Mouse Emulation Patterns**

* **Two-Directional Scanning:** A vertical line sweeps top-to-bottom (![][image4]). Once stopped, a horizontal pointer sweeps along that line (![][image5]).  
* **Eight-Directional Scanning:** Used for mouse emulation. A pointer indicator rotates through 8 cardinal directions. The user selects a direction, and the cursor moves until stopped.

### **D. Elimination Scanning (Grid 3 Protocol)**

* **Two-Way (Binary):** Splits active targets into halves (Top/Bottom or Left/Right). User chooses the half containing the target.  
* **Four-Way (Quaternary):** Splits active targets into quarters.  
* **Refinements:** "Grey out" eliminated cells to reduce visual search load.

### **E. Adaptive & Predictive Scanning (PPM)**

* **PPM Predictive Pathing:** Based on the ppmpredictor library. Items are reordered in the scan path based on probability. High-probability items (e.g., common letters) are scanned first.  
* **Error Correction Logic:** The scan path dynamically inserts a "Back/Undo" option immediately after a low-probability selection (Wade, 2024).

## **5\. Timing & Acceptance Parameters (ACE Centre Standard)**

* **Scan Rate:** Duration (ms) the focus stays on an item.  
* **Acceptance Time (Dwell):** The switch must be held for this duration before the press is registered (prevents misfires).  
* **Post-Selection Delay:** A refractory period (ms) after selection where input is ignored.  
* **Inverse Scanning:** Movement occurs on switch **hold**, selection occurs on switch **release**.  
* **Reverse Scanning:** If enabled, the first press stops forward movement, and the next press starts a slower backward scan to correct overshoots.

## **6\. Feedback Mechanisms**

* **Visual Focus:** A high-contrast marker (e.g., 4px yellow border) around the current group/item.  
* **Auditory Focus:** A short "click" or "tick" generated via Web Audio API on every scan step.  
* **Selection State:** The button color changes (e.g., to Green) and/or pulses when successfully selected.  
* **Empty Cell Skipping:** If configured, the scanner skips grid positions that contain no data/label.

## **7\. Global Controls (The "Half Switch")**

The app must support "Utility Switch" functions to simulate professional AAC setups:

* **Back up one level:** Reverts to the previous level in a hierarchy (e.g., from Item back to Row).  
* **Clear Input:** A dedicated action to clear the simulated text buffer.  
* **Long-Hold Reset:** Holding Switch 1 for \>1000ms forces the scanner back to the "Home" level.

## **8\. Technical References & Citations**

1. **ACE Centre.** *Switch Scanning Fundamentals*. [acecentre.org.uk](https://acecentre.org.uk/api/download?download_file=923&free=1).  
2. **Smartbox (Grid 3).** *Using Switch Elimination*. [thinksmartbox.com](https://hub.thinksmartbox.com/knowledgebase/using-switch-elimination-in-grid-3/).  
3. **Wade, W.** *Letter-by-Letter AAC: Error Correction & PPM*. [github.com/willwade/letter-by-letter-AAC](https://github.com/willwade/letter-by-letter-AAC/tree/error-correction-improvements).  
4. **Ntoa, S., et al. (2004).** *Scanning-Based Interaction Techniques*. (Cited for block, quadrant, and hierarchical movement logic).  
5. **Lesher, G. W. (2000).** *Adaptive Scanning Delays*. (Cited for performance-based real-time delay adjustment).

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAXCAYAAACS5bYWAAABcUlEQVR4Xu2WvytFYRjHnwxWg2Qk2ZASizKZjCxIUq6kZDCJP8BstpkMFBkMFEV+DAzIwKBkZzMJ3+e+z+G9X+dncku9n/rkns979D73OOdEJBD4v9TCI/gB92itGlzBczgLx+EoHIHD5hdd4oass+MeO64mul+SL9555aDfjNsNtb9E9+uDbbAVtpgVF63BwqofwaX1LOY4EN0cEtD9mDPY7ocJcUOt+BEcWM9iHq5zNAbhIcec9MINjk0Sf2UfrddTj2MRblEbgsfUipB4oXThOqap+rDlYQlu22cd9MRbK8qaGUu/uMH09aUsiHu4tNVEJ+VABz4V9wr6DbpvM0efRnHv11vYAR8k5U+RQAnewV1eKMCUFN+3/AvvHFPQQaN7dAbueGtFuJeMYaP7k5s+zXmYlJ8Pkw4c3cNFiJulAl189Y4v4LN3nMYY3OdoTMNNjhlkDtsp7oQn+6n/I+RlmQMxwCED3f+NYyAQCHzzCWgwW97V59IjAAAAAElFTkSuQmCC>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAXCAYAAADpwXTaAAAAVUlEQVR4XmNgGAWjgKpgL7oAJeAfugAlwAaIy9AFKQHngNgcXRAETMjEt4B4HwMa8CMTX4NiFgYKwUQg9kYXJAcoAnEnuiC54BO6ACXgMLrAKBhuAACnlhESw2iRqwAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAXCAYAAACS5bYWAAABM0lEQVR4Xu2UsUoDQRRFH1jYBlv/wYBY2llpZWJppyA2Fpb6AalsFKxsA4EgJASxsbAQxV+wt9RPUHMfMwuz1xn3bcIK4hy4kD3vhdxsJiuSyfxd2sg78oU8I63y+FcwdThELoLrvrg3rAauacwdVGqqXJPEPi/m5DUio4sRjlgQaywSzNzhVNzSFg8iHCMDlp4Ocs/SiKnDtrilcx78wAkyItdFHshZMXU4Q4bIB7JBsyr0Toz9ay36GMzqULvDsrhvdsODCrTwk7jHzrzU6mA63MQ+8oLc8mBGoh30ll+RKxbXyafQosUZ1WfmJJhZMHXYCWRI4RbIx9iT738mLVyc4SpqdVCxGFyveGf5OXeRO5aeA+SaZQJzhyXk0+dN3NJlaSNNjwWxySLBPB0ymcy/Ygq0u2D0RRQaYwAAAABJRU5ErkJggg==>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAXCAYAAAAC9s/ZAAAAmElEQVR4XmNgGAUgsAyIfwDxfyR8E0UFAwMjkhwIf0GVhoADDBDJGjRxGJgBxJvRBZGBEAPCBnRgB8Rn0QWxAWwGgAz+jCaGEyxigBgwEUkM3UC8gIUB1RX/gJgZIU0cgBnwHohl0eSIAv0MEAPC0CWIBdgCkiQA0vwBXZBYoM8AMaAEXYIQiAHiIwwI54NccABZwSgY1gAAzGwoiimZM7IAAAAASUVORK5CYII=>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAXCAYAAAAGAx/kAAAAp0lEQVR4XmNgGAWkgmgg/gnE/5HwGyT5X2hyt5HksAI3BojCp2ji3ED8D4i50MTxApit6GIkg5UMEI3NUD6IzYyQJh4wMiBc9Q2IBVClSQO/GSAG2aNLkApOMkAMuocuQQqYBcTlDNgDnWjwF4hZoWxnBohBdxDSxIHPQCyKJkayq54AsQm6IAMiKdSgSyCDFgbUpP8SVZphLZIcCJ8D4kIUFaNgpAMAXYMxGjJZzX0AAAAASUVORK5CYII=>