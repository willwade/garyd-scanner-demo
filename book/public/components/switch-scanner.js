var E=Object.defineProperty;var L=(d,n,e)=>n in d?E(d,n,{enumerable:!0,configurable:!0,writable:!0,value:e}):d[n]=e;var l=(d,n,e)=>L(d,typeof n!="symbol"?n+"":n,e);import{g as q,l as A,c as $}from"./chunks/vendor-KIb-L1Hk.js";const b=class b{constructor(n,e=!0){l(this,"config");l(this,"listeners",[]);this.config={...b.DEFAULTS,...n},e&&this.loadFromUrl()}loadFromUrl(){const n=new URLSearchParams(window.location.search);if(n.has("ui")&&n.get("ui")==="hidden"&&(this.config.showUI=!1),n.has("rate")){const e=parseInt(n.get("rate"),10);isNaN(e)||(this.config.scanRate=e)}if(n.has("dwell")){const e=parseInt(n.get("dwell"),10);isNaN(e)||(this.config.dwellTime=e)}if(n.has("strategy")){const e=n.get("strategy");e==="group-row-column"?this.config.scanMode="group-row-column":e==="continuous"?this.config.scanMode="continuous":e==="probability"?this.config.scanMode="probability":["row-column","column-row","linear","snake","quadrant","elimination"].includes(e)&&(this.config.scanPattern=e)}if(n.has("pattern")){const e=n.get("pattern");["row-column","column-row","linear","snake","quadrant","elimination"].includes(e)&&(this.config.scanPattern=e,this.config.scanMode=null)}if(n.has("technique")){const e=n.get("technique");(e==="block"||e==="point")&&(this.config.scanTechnique=e)}if(n.has("mode")){const e=n.get("mode");e==="group-row-column"||e==="continuous"||e==="probability"||e==="cause-effect"?this.config.scanMode=e:(e==="null"||e==="none"||e==="")&&(this.config.scanMode=null)}if(n.has("continuous-technique")){const e=n.get("continuous-technique");(e==="gliding"||e==="crosshair")&&(this.config.continuousTechnique=e)}if(n.has("content")&&n.get("content")==="keyboard"&&(this.config.gridContent="keyboard"),n.has("lang")&&(this.config.language=n.get("lang")),n.has("layout")){const e=n.get("layout");(e==="alphabetical"||e==="frequency")&&(this.config.layoutMode=e)}if(n.has("view")){const e=n.get("view");(e==="standard"||e==="cost-numbers"||e==="cost-heatmap")&&(this.config.viewMode=e)}if(n.has("heatmax")){const e=parseInt(n.get("heatmax"),10);isNaN(e)||(this.config.heatmapMax=e)}}get(){return{...this.config}}update(n){this.config={...this.config,...n},this.notify()}subscribe(n){this.listeners.push(n),n(this.config)}notify(){this.listeners.forEach(n=>n(this.config))}};l(b,"DEFAULTS",{scanRate:1e3,acceptanceTime:0,dwellTime:0,postSelectionDelay:0,initialScanDelay:500,initialItemPause:0,scanPauseDelay:300,scanLoops:4,scanInputMode:"auto",autoRepeat:!1,repeatDelay:500,repeatTime:200,scanDirection:"circular",scanPattern:"row-column",scanTechnique:"block",scanMode:null,continuousTechnique:"crosshair",compassMode:"continuous",eliminationSwitchCount:4,allowEmptyItems:!1,cancelMethod:"button",longHoldTime:1e3,criticalOverscan:{enabled:!1,fastRate:100,slowRate:1e3},colorCode:{errorRate:.1,selectThreshold:.95},gridContent:"numbers",gridSize:64,showUI:!0,soundEnabled:!1,useImageButton:!0,buttonColor:"blue",customButtonImages:{normal:void 0,pressed:void 0},language:"en",layoutMode:"alphabetical",viewMode:"standard",heatmapMax:20,highlightBorderWidth:4,highlightBorderColor:"#FF9800",highlightScale:1,highlightOpacity:1,highlightAnimation:!1});let x=b;class D{constructor(n=!0){l(this,"ctx",null);l(this,"enabled",!0);this.enabled=n}setEnabled(n){this.enabled=n}initCtx(){this.ctx||(this.ctx=new(window.AudioContext||window.webkitAudioContext))}playBeep(n=440,e=.1,t="sine"){if(!this.enabled||(this.initCtx(),!this.ctx))return;this.ctx.state==="suspended"&&this.ctx.resume();const s=this.ctx.createOscillator(),i=this.ctx.createGain();s.type=t,s.frequency.setValueAtTime(n,this.ctx.currentTime),i.gain.setValueAtTime(.1,this.ctx.currentTime),i.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+e),s.connect(i),i.connect(this.ctx.destination),s.start(),s.stop(this.ctx.currentTime+e)}playScanSound(){this.playBeep(800,.05,"square")}playSelectSound(){this.playBeep(1200,.1,"sine")}playErrorSound(){this.playBeep(200,.3,"sawtooth")}}class F extends EventTarget{constructor(e,t=window){super();l(this,"configManager");l(this,"keyMap");l(this,"activeTimers",new Map);l(this,"targetElement");this.configManager=e,this.targetElement=t,this.keyMap=new Map([[" ","select"],["Enter","select"],["1","switch-1"],["2","switch-2"],["3","switch-3"],["4","switch-4"],["5","switch-5"],["6","switch-6"],["7","switch-7"],["8","switch-8"],["r","reset"],["R","reset"],["c","cancel"],["C","cancel"],["s","menu"],["S","menu"]]),this.bindEvents()}isIgnoredEvent(e){const t=e.composedPath?e.composedPath():[];for(const i of t)if(i instanceof HTMLElement&&(i.classList.contains("settings-overlay")||i.id==="settings-overlay"||i.classList.contains("settings-btn")||i.classList.contains("controls")))return!0;const s=e.target;return!!(s&&typeof s.closest=="function"&&(s.closest(".settings-overlay")||s.closest("#settings-overlay")||s.closest(".settings-btn")||s.closest(".controls")))}bindEvents(){this.targetElement.addEventListener("keydown",this.handleKeyDown.bind(this)),this.targetElement.addEventListener("keyup",this.handleKeyUp.bind(this)),this.targetElement.addEventListener("mousedown",e=>{this.isIgnoredEvent(e)||this.handleSwitchDown("select")}),this.targetElement.addEventListener("mouseup",e=>{this.isIgnoredEvent(e)||this.handleSwitchUp("select")}),this.targetElement.addEventListener("touchstart",e=>{if(this.isIgnoredEvent(e))return;e.preventDefault(),this.handleSwitchDown("select")}),this.targetElement.addEventListener("touchend",e=>{this.isIgnoredEvent(e)||this.handleSwitchUp("select")})}handleKeyDown(e){if(!e.repeat&&this.keyMap.has(e.key)){const t=this.keyMap.get(e.key);(t==="select"||t==="step")&&e.preventDefault(),this.handleSwitchDown(t)}}handleKeyUp(e){if(this.keyMap.has(e.key)){const t=this.keyMap.get(e.key);this.handleSwitchUp(t)}}handleSwitchDown(e){const t=this.configManager.get(),s=t.acceptanceTime,i=t.longHoldTime,r=t.cancelMethod;if(r==="long-hold"&&i>0){const o=window.setTimeout(()=>{this.triggerAction("cancel"),this.activeTimers.has(e)&&(clearTimeout(this.activeTimers.get(e)),this.activeTimers.delete(e)),this.activeTimers.set(`${e}_handled`,-1)},i);this.activeTimers.set(`${e}_longhold`,o)}if(s>0){const o=window.setTimeout(()=>{this.activeTimers.has(`${e}_handled`)||(this.triggerAction(e),this.activeTimers.delete(e),this.activeTimers.has(`${e}_longhold`)&&(clearTimeout(this.activeTimers.get(`${e}_longhold`)),this.activeTimers.delete(`${e}_longhold`)))},s);this.activeTimers.set(e,o)}else if(r==="long-hold"&&i>0){const o=window.setTimeout(()=>{this.activeTimers.has(`${e}_handled`)||(this.triggerAction(e),this.activeTimers.delete(e))},i+50);this.activeTimers.set(e,o)}else this.triggerAction(e)}handleSwitchUp(e){if(this.activeTimers.has(`${e}_longhold`)&&(clearTimeout(this.activeTimers.get(`${e}_longhold`)),this.activeTimers.delete(`${e}_longhold`)),this.activeTimers.has(`${e}_handled`)){this.activeTimers.delete(`${e}_handled`);return}this.activeTimers.has(e)&&(clearTimeout(this.activeTimers.get(e)),this.activeTimers.delete(e),this.triggerAction(e))}triggerAction(e){const t=new CustomEvent("switch",{detail:{action:e}});this.dispatchEvent(t),console.log(`Switch Action: ${e}`)}}class O{constructor(n){l(this,"container");l(this,"items",[]);l(this,"elements",[]);l(this,"columns",8);if(typeof n=="string"){const e=document.getElementById(n);if(!e)throw new Error(`Container ${n} not found`);this.container=e}else this.container=n}getContainer(){return this.container}updateHighlightStyles(n){this.container.style.setProperty("--focus-border-width",`${n.highlightBorderWidth}px`),this.container.style.setProperty("--focus-color",n.highlightBorderColor),this.container.style.setProperty("--focus-scale",n.highlightScale.toString()),this.container.style.setProperty("--focus-opacity",n.highlightOpacity.toString()),this.container.style.setProperty("--focus-animation",n.highlightAnimation?"pulse":"none")}render(n,e=8){this.items=n,this.columns=e,this.container.innerHTML="",this.elements=[],this.container.style.gridTemplateColumns=`repeat(${e}, 1fr)`,n.forEach((t,s)=>{const i=document.createElement("div");if(i.className="grid-cell",t.image){const r=document.createElement("img");if(r.src=t.image,r.alt=t.label,r.style.maxWidth="100%",r.style.maxHeight="100%",r.style.objectFit="contain",i.appendChild(r),t.label){const o=document.createElement("span");o.textContent=t.label,o.style.marginTop="5px",i.appendChild(o),i.style.flexDirection="column"}}else i.textContent=t.label;i.dataset.index=s.toString(),i.dataset.id=t.id,t.backgroundColor&&(i.style.backgroundColor=t.backgroundColor),t.textColor&&(i.style.color=t.textColor),this.container.appendChild(i),this.elements.push(i)})}setFocus(n,e){e&&this.updateHighlightStyles(e),this.elements.forEach(t=>{t.classList.remove("scan-focus"),t.classList.remove("animate-pulse")}),n.forEach(t=>{if(this.elements[t]){const s=this.elements[t];s.classList.add("scan-focus"),e!=null&&e.highlightAnimation&&s.classList.add("animate-pulse")}})}setSelected(n){if(this.elements[n]){const e=this.elements[n];e.classList.add("selected"),setTimeout(()=>e.classList.remove("selected"),500)}}getElement(n){return this.elements[n]}getItem(n){return this.items[n]}getItemsCount(){return this.items.length}}class H{constructor(n,e,t){l(this,"container");l(this,"formContainer");l(this,"configManager");l(this,"alphabetManager");l(this,"isVisible",!1);this.configManager=n,this.alphabetManager=e,this.container=t,this.container.querySelector(".settings-content")?this.formContainer=this.container.querySelector("#settings-form"):this.renderStructure(),this.initUI(),this.bindEvents(),this.configManager.get().showUI||this.container.classList.add("hidden")}renderStructure(){this.container.innerHTML=`
        <div class="settings-content">
          <div class="settings-header">
            <h2>Scanner Settings</h2>
            <button id="close-settings" class="close-btn" aria-label="Close settings">&times;</button>
          </div>
          <div id="settings-form"></div>
        </div>
      `,this.formContainer=this.container.querySelector("#settings-form")}initUI(){const n=this.configManager.get(),t=this.alphabetManager.getLanguages().map(o=>`<option value="${o.code}">${o.name}</option>`).join(""),s=`
      <div class="settings-intro">
        <p><strong>Controls:</strong> Space/Enter=Select • 2=Step • 3=Reset • S=Menu</p>
      </div>

      <div class="settings-section">
        <h3>Scanning Mode</h3>

        <div class="form-group">
          <label for="scanMode">Special Mode</label>
          <select id="scanMode" class="setting-input" name="scanMode">
            <option value="null">None (use pattern below)</option>
            <option value="group-row-column">Row-Group-Column</option>
            <option value="continuous">Continuous (Gliding/Crosshair)</option>
            <option value="probability">Probability (PPM)</option>
          </select>
          <small>Special scanning modes that override standard patterns</small>
        </div>

        <div class="form-row" id="continuous-options" style="display: ${n.scanMode==="continuous"?"flex":"none"}">
          <div class="form-group">
            <label for="continuousTechnique">Continuous Technique</label>
            <select id="continuousTechnique" class="setting-input" name="continuousTechnique">
              <option value="gliding">Gliding Cursor</option>
              <option value="crosshair">Crosshair</option>
              <option value="eight-direction">Eight-Direction (Compass)</option>
            </select>
            <small>Gliding: Buffer zone | Crosshair: X-Y lines | Compass: 8-directional movement</small>
          </div>

          <div class="form-group" id="compass-mode-option" style="display: ${n.continuousTechnique==="eight-direction"?"block":"none"}">
            <label for="compassMode">Compass Mode</label>
            <select id="compassMode" class="setting-input" name="compassMode">
              <option value="continuous">Continuous (Fluid)</option>
              <option value="fixed-8">Fixed 8 Directions</option>
            </select>
            <small>Continuous: Smooth clock rotation | Fixed-8: 8 discrete directions</small>
          </div>
        </div>

      <div class="form-row" id="elimination-options" style="display: ${n.scanPattern==="elimination"?"flex":"none"}">
        <div class="form-group">
          <label for="eliminationSwitchCount">Switch Count</label>
          <select id="eliminationSwitchCount" class="setting-input" name="eliminationSwitchCount">
            <option value="2">2 Switches (Binary)</option>
            <option value="3">3 Switches</option>
            <option value="4">4 Switches (Quadrant)</option>
            <option value="5">5 Switches</option>
            <option value="6">6 Switches</option>
            <option value="7">7 Switches</option>
            <option value="8">8 Switches (Octant)</option>
          </select>
          <small>More switches = faster selection (64 cells in 3 hits with 4 switches)</small>
        </div>
      </div>

        <div class="form-row" id="pattern-options" style="display: ${n.scanMode?"none":"flex"}">
          <div class="form-group">
            <label for="scanPattern">Scan Pattern</label>
            <select id="scanPattern" class="setting-input" name="scanPattern">
              <option value="row-column">Row-Column</option>
              <option value="column-row">Column-Row</option>
              <option value="linear">Linear</option>
              <option value="snake">Snake</option>
              <option value="quadrant">Quadrant</option>
              <option value="elimination">Elimination</option>
            </select>
            <small>How the scanner moves through items</small>
          </div>

          <div class="form-group">
            <label for="scanTechnique">Scan Technique</label>
            <select id="scanTechnique" class="setting-input" name="scanTechnique">
              <option value="block">Block (Row → Item)</option>
              <option value="point">Point (Item by Item)</option>
            </select>
            <small id="techniqueHint">For row/col/linear/snake patterns only</small>
          </div>
        </div>

        <div class="form-group">
          <label for="scanDirection">Scan Direction</label>
          <select id="scanDirection" class="setting-input" name="scanDirection">
            <option value="circular">Circular (0→1→2...→n→0...)</option>
            <option value="reverse">Reverse (n→n-1...→0→n...)</option>
            <option value="oscillating">Oscillating (0→1→...→n→n-1→...→0...)</option>
          </select>
          <small>Direction of scan cycling (for linear pattern)</small>
        </div>

        <div class="form-group">
          <label for="scanRate">Scan Rate <span class="value-display">${n.scanRate}ms</span></label>
          <input type="range" id="scanRate" class="setting-input range-input" name="scanRate"
                 value="${n.scanRate}" min="100" max="5000" step="100">
          <small>Speed of scanning (lower = faster)</small>
        </div>
      </div>

      <div class="settings-section">
        <h3>Content</h3>

        <div class="form-row">
          <div class="form-group">
            <label for="gridContent">Grid Content</label>
            <select id="gridContent" class="setting-input" name="gridContent">
              <option value="numbers">Numbers</option>
              <option value="keyboard">Keyboard</option>
            </select>
            <small>What to display in the grid</small>
          </div>

          <div class="form-group">
            <label for="gridSize">Grid Size <span class="value-display">${n.gridSize}</span></label>
            <input type="number" id="gridSize" class="setting-input" name="gridSize"
                   value="${n.gridSize}" min="4" max="100"
                   ${n.gridContent==="keyboard"?"disabled":""}>
            <small>Number of items (disabled for keyboard mode)</small>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="language">Language</label>
            <select id="language" class="setting-input" name="language">
              ${t}
            </select>
          </div>

          <div class="form-group">
            <label for="layoutMode">Layout</label>
            <select id="layoutMode" class="setting-input" name="layoutMode">
              <option value="alphabetical">Alphabetical</option>
              <option value="frequency">Frequency (Common First)</option>
            </select>
            <small>Keyboard layout order</small>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>Timing & Access</h3>

        <div class="form-group">
          <label for="scanInputMode">Scan Input Mode</label>
          <select id="scanInputMode" class="setting-input" name="scanInputMode">
            <option value="auto">Auto-Scan</option>
            <option value="manual">Manual Step</option>
          </select>
          <small>Auto: Automatic advancement | Manual: User triggers each step</small>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="initialScanDelay">Initial Scan Delay <span class="value-display">${n.initialScanDelay}ms</span></label>
            <input type="range" id="initialScanDelay" class="setting-input range-input" name="initialScanDelay"
                   value="${n.initialScanDelay}" min="0" max="2000" step="100">
            <small>Delay before first scan starts</small>
          </div>

          <div class="form-group">
            <label for="scanPauseDelay">Scan Pause Delay <span class="value-display">${n.scanPauseDelay}ms</span></label>
            <input type="range" id="scanPauseDelay" class="setting-input range-input" name="scanPauseDelay"
                   value="${n.scanPauseDelay}" min="0" max="1000" step="50">
            <small>Pause between hierarchical stages</small>
          </div>
        </div>

        <div class="form-group">
          <label for="initialItemPause">Initial Item Pause <span class="value-display">${n.initialItemPause}ms</span></label>
          <input type="range" id="initialItemPause" class="setting-input range-input" name="initialItemPause"
                 value="${n.initialItemPause}" min="0" max="3000" step="100">
          <small>Extended highlight on first item (0 = normal scan rate)</small>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="autoRepeat" ${n.autoRepeat?"checked":""}>
            <span>Auto-Repeat Selections</span>
          </label>
          <small>Automatically repeat selections when holding</small>
        </div>

        <div class="form-row" id="repeat-options" style="display: ${n.autoRepeat?"flex":"none"}">
          <div class="form-group">
            <label for="repeatDelay">Repeat Delay <span class="value-display">${n.repeatDelay}ms</span></label>
            <input type="range" id="repeatDelay" class="setting-input range-input" name="repeatDelay"
                   value="${n.repeatDelay}" min="100" max="2000" step="100">
            <small>Hold time before repeat starts</small>
          </div>

          <div class="form-group">
            <label for="repeatTime">Repeat Time <span class="value-display">${n.repeatTime}ms</span></label>
            <input type="range" id="repeatTime" class="setting-input range-input" name="repeatTime"
                   value="${n.repeatTime}" min="50" max="1000" step="50">
            <small>Time between successive repeats</small>
          </div>
        </div>

        <div class="form-group">
          <label for="acceptanceTime">Acceptance Time <span class="value-display">${n.acceptanceTime}ms</span></label>
          <input type="range" id="acceptanceTime" class="setting-input range-input" name="acceptanceTime"
                 value="${n.acceptanceTime}" min="0" max="2000" step="50">
          <small>How long to highlight selection before confirming (0 = instant)</small>
        </div>

        <div class="form-group">
          <label for="dwellTime">Dwell Time <span class="value-display">${n.dwellTime}ms</span></label>
          <input type="range" id="dwellTime" class="setting-input range-input" name="dwellTime"
                 value="${n.dwellTime}" min="0" max="5000" step="100">
          <small>Auto-select on hover (0 = off)</small>
        </div>

        <div class="form-group">
          <label for="scanLoops">Scan Loops <span class="value-display">${n.scanLoops}</span></label>
          <input type="range" id="scanLoops" class="setting-input range-input" name="scanLoops"
                 value="${n.scanLoops}" min="0" max="20" step="1">
          <small>Number of complete scan cycles (0 = infinite)</small>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="allowEmptyItems" ${n.allowEmptyItems?"checked":""}>
            <span>Allow Empty Items</span>
          </label>
          <small>Enable items that skip selection and reset scan (for error recovery)</small>
        </div>

        <div class="form-group">
          <label for="cancelMethod">Cancel Method</label>
          <select id="cancelMethod" class="setting-input" name="cancelMethod">
            <option value="button">Button Press</option>
            <option value="long-hold">Long Hold</option>
          </select>
          <small>How to cancel scanning (button press or hold switch)</small>
        </div>

        <div class="form-group" id="longHoldOptions" style="display: ${n.cancelMethod==="long-hold"?"block":"none"}">
          <label for="longHoldTime">Long Hold Time <span class="value-display">${n.longHoldTime}ms</span></label>
          <input type="range" id="longHoldTime" class="setting-input range-input" name="longHoldTime"
                 value="${n.longHoldTime}" min="500" max="3000" step="100">
          <small>Hold duration to trigger cancel (500-3000ms)</small>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="criticalOverscanEnabled" ${n.criticalOverscan.enabled?"checked":""}>
            <span>Enable Critical Overscan</span>
          </label>
          <small>Two-stage scanning: fast scan → slow backward scan → select</small>
        </div>

        <div id="criticalOverscanOptions" style="display: ${n.criticalOverscan.enabled?"block":"none"}">
          <div class="form-group">
            <label for="criticalOverscanFastRate">Fast Scan Rate <span class="value-display">${n.criticalOverscan.fastRate}ms</span></label>
            <input type="range" id="criticalOverscanFastRate" class="setting-input range-input" name="criticalOverscanFastRate"
                   value="${n.criticalOverscan.fastRate}" min="50" max="500" step="10">
            <small>Speed of initial fast scan (50-500ms)</small>
          </div>

          <div class="form-group">
            <label for="criticalOverscanSlowRate">Slow Scan Rate <span class="value-display">${n.criticalOverscan.slowRate}ms</span></label>
            <input type="range" id="criticalOverscanSlowRate" class="setting-input range-input" name="criticalOverscanSlowRate"
                   value="${n.criticalOverscan.slowRate}" min="500" max="3000" step="100">
            <small>Speed of slow backward scan (500-3000ms)</small>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>Visualization</h3>

        <div class="form-row">
          <div class="form-group">
            <label for="viewMode">View Mode</label>
            <select id="viewMode" class="setting-input" name="viewMode">
              <option value="standard">Standard</option>
              <option value="cost-numbers">Cost Numbers</option>
              <option value="cost-heatmap">Cost Heatmap</option>
            </select>
            <small>Show scanning cost as colors/numbers</small>
          </div>

          <div class="form-group">
            <label for="heatmapMax">Heatmap Max</label>
            <input type="number" id="heatmapMax" class="setting-input" name="heatmapMax"
                   value="${n.heatmapMax}" min="1" max="100">
            <small>Max cost for heatmap color scale</small>
          </div>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="soundEnabled" ${n.soundEnabled?"checked":""}>
            <span>Sound Enabled</span>
          </label>
          <small>Play sounds when scanning and selecting</small>
        </div>

        <div class="form-group">
          <label for="highlightBorderWidth">Highlight Border Width <span class="value-display">${n.highlightBorderWidth}px</span></label>
          <input type="range" id="highlightBorderWidth" class="setting-input range-input" name="highlightBorderWidth"
                 value="${n.highlightBorderWidth}" min="0" max="10" step="1">
          <small>Thickness of highlight outline (0-10px)</small>
        </div>

        <div class="form-group">
          <label for="highlightBorderColor">Highlight Border Color</label>
          <input type="color" id="highlightBorderColor" class="setting-input" name="highlightBorderColor"
                 value="${n.highlightBorderColor}">
          <small>Color of highlight outline (orange by default)</small>
        </div>

        <div class="form-group">
          <label for="highlightScale">Highlight Scale <span class="value-display">${n.highlightScale}x</span></label>
          <input type="range" id="highlightScale" class="setting-input range-input" name="highlightScale"
                 value="${n.highlightScale}" min="1.0" max="1.5" step="0.05">
          <small>Size multiplier for highlighted items (1.0-1.5, 1.0 = no zoom)</small>
        </div>

        <div class="form-group">
          <label for="highlightOpacity">Highlight Opacity <span class="value-display">${n.highlightOpacity}</span></label>
          <input type="range" id="highlightOpacity" class="setting-input range-input" name="highlightOpacity"
                 value="${n.highlightOpacity}" min="0.3" max="1.0" step="0.05">
          <small>Opacity of highlighted items (0.3-1.0, 1.0 = fully opaque)</small>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="highlightAnimation" ${n.highlightAnimation?"checked":""}>
            <span>Highlight Animation</span>
          </label>
          <small>Enable pulse animation on highlighted items</small>
        </div>
      </div>
    `;this.formContainer.innerHTML=s;const i=(o,a)=>{const c=this.formContainer.querySelector(`[name="${o}"]`);c&&(c.value=a)};i("scanPattern",n.scanPattern),i("scanTechnique",n.scanTechnique),i("scanDirection",n.scanDirection),i("cancelMethod",n.cancelMethod),i("longHoldTime",n.longHoldTime.toString()),i("scanMode",n.scanMode||"null"),i("continuousTechnique",n.continuousTechnique),i("compassMode",n.compassMode),i("scanInputMode",n.scanInputMode),i("gridContent",n.gridContent),i("language",n.language),i("layoutMode",n.layoutMode),i("viewMode",n.viewMode),this.updateUIState(n);const r=this.formContainer.querySelector("#repeat-options");r&&(r.style.display=n.autoRepeat?"flex":"none")}updateUIState(n){const e=this.formContainer.querySelector('[name="scanTechnique"]'),t=this.formContainer.querySelector('[name="scanPattern"]'),s=this.formContainer.querySelector("#continuous-options"),i=this.formContainer.querySelector("#pattern-options"),r=this.formContainer.querySelector("#compass-mode-option");s&&(s.style.display=n.scanMode==="continuous"?"flex":"none"),r&&(r.style.display=n.continuousTechnique==="eight-direction"?"block":"none");const o=this.formContainer.querySelector("#elimination-options");o&&(o.style.display=n.scanPattern==="elimination"?"flex":"none"),i&&(i.style.display=n.scanMode?"none":"flex");const a=["row-column","column-row","linear","snake"],c=!n.scanMode&&a.includes(n.scanPattern);e&&(e.disabled=!c,e.style.opacity=c?"1":"0.5");const h=this.formContainer.querySelector("#techniqueHint");h&&e&&(c?h.textContent="For row/col/linear/snake patterns only":n.scanMode?h.textContent="Disabled by special mode":h.textContent="Not available for "+t.value)}bindEvents(){var n;(n=this.container.querySelector(".close-btn"))==null||n.addEventListener("click",()=>{this.toggle(!1)}),this.container.addEventListener("click",e=>{e.target===this.container&&this.toggle(!1)}),this.formContainer.addEventListener("change",e=>{const t=e.target;if(!t||!t.classList.contains("setting-input"))return;const s=t.getAttribute("name"),i={};switch(s){case"scanPattern":i.scanPattern=t.value,i.scanMode=null;break;case"scanTechnique":i.scanTechnique=t.value;break;case"scanDirection":i.scanDirection=t.value;break;case"scanMode":const r=t.value==="null"?null:t.value;i.scanMode=r;break;case"continuousTechnique":i.continuousTechnique=t.value;break;case"compassMode":i.compassMode=t.value;break;case"eliminationSwitchCount":i.eliminationSwitchCount=parseInt(t.value,10);break;case"gridContent":i.gridContent=t.value;const o=this.formContainer.querySelector('[name="gridSize"]');o&&(o.disabled=t.value==="keyboard");break;case"scanRate":i.scanRate=parseInt(t.value,10),this.updateValueDisplay("scanRate",t.value+"ms");break;case"acceptanceTime":i.acceptanceTime=parseInt(t.value,10),this.updateValueDisplay("acceptanceTime",t.value+"ms");break;case"dwellTime":i.dwellTime=parseInt(t.value,10),this.updateValueDisplay("dwellTime",t.value+"ms");break;case"allowEmptyItems":i.allowEmptyItems=t.checked;break;case"cancelMethod":i.cancelMethod=t.value;break;case"longHoldTime":i.longHoldTime=parseInt(t.value,10),this.updateValueDisplay("longHoldTime",t.value+"ms");break;case"gridSize":i.gridSize=parseInt(t.value,10),this.updateValueDisplay("gridSize",t.value);break;case"soundEnabled":i.soundEnabled=t.checked;break;case"language":i.language=t.value;break;case"layoutMode":i.layoutMode=t.value;break;case"viewMode":i.viewMode=t.value;break;case"heatmapMax":i.heatmapMax=parseInt(t.value,10);break;case"scanInputMode":i.scanInputMode=t.value;break;case"initialScanDelay":i.initialScanDelay=parseInt(t.value,10),this.updateValueDisplay("initialScanDelay",t.value+"ms");break;case"scanPauseDelay":i.scanPauseDelay=parseInt(t.value,10),this.updateValueDisplay("scanPauseDelay",t.value+"ms");break;case"initialItemPause":i.initialItemPause=parseInt(t.value,10),this.updateValueDisplay("initialItemPause",t.value+"ms");break;case"scanLoops":i.scanLoops=parseInt(t.value,10),this.updateValueDisplay("scanLoops",t.value==="0"?"Infinite":t.value);break;case"autoRepeat":i.autoRepeat=t.checked;break;case"repeatDelay":i.repeatDelay=parseInt(t.value,10),this.updateValueDisplay("repeatDelay",t.value+"ms");break;case"repeatTime":i.repeatTime=parseInt(t.value,10),this.updateValueDisplay("repeatTime",t.value+"ms");break;case"criticalOverscanEnabled":i.criticalOverscan={...this.configManager.get().criticalOverscan,enabled:t.checked};break;case"criticalOverscanFastRate":i.criticalOverscan={...this.configManager.get().criticalOverscan,fastRate:parseInt(t.value,10)},this.updateValueDisplay("criticalOverscanFastRate",t.value+"ms");break;case"criticalOverscanSlowRate":i.criticalOverscan={...this.configManager.get().criticalOverscan,slowRate:parseInt(t.value,10)},this.updateValueDisplay("criticalOverscanSlowRate",t.value+"ms");break;case"highlightBorderWidth":i.highlightBorderWidth=parseInt(t.value,10),this.updateValueDisplay("highlightBorderWidth",t.value+"px");break;case"highlightBorderColor":i.highlightBorderColor=t.value;break;case"highlightScale":i.highlightScale=parseFloat(t.value),this.updateValueDisplay("highlightScale",t.value+"x");break;case"highlightOpacity":i.highlightOpacity=parseFloat(t.value),this.updateValueDisplay("highlightOpacity",t.value);break;case"highlightAnimation":i.highlightAnimation=t.checked;break}if(this.configManager.update(i),(s==="scanPattern"||s==="scanMode"||s==="continuousTechnique"||s==="cancelMethod")&&this.updateUIState({...this.configManager.get(),...i}),s==="cancelMethod"){const r=this.formContainer.querySelector("#longHoldOptions");r&&(r.style.display=t.value==="long-hold"?"block":"none")}if(s==="autoRepeat"){const r=this.formContainer.querySelector("#repeat-options");r&&(r.style.display=t.checked?"flex":"none")}if(s==="criticalOverscanEnabled"){const r=this.formContainer.querySelector("#criticalOverscanOptions");r&&(r.style.display=t.checked?"block":"none")}}),this.formContainer.addEventListener("input",e=>{const t=e.target;if(!t||!t.classList.contains("range-input"))return;const s=t.getAttribute("name");s&&this.updateValueDisplay(s,t.value+"ms")})}updateValueDisplay(n,e){const t=this.formContainer.querySelector(`label[for="${n}"]`);if(t){const s=t.querySelector(".value-display");s&&(s.textContent=e)}}toggle(n){this.isVisible=n!==void 0?n:!this.isVisible,this.isVisible?this.container.classList.remove("hidden"):this.container.classList.add("hidden")}}class z{constructor(){l(this,"languages",[]);l(this,"initialized",!1);l(this,"currentAlphabet",null)}async init(){if(!this.initialized)try{const n=await q();console.log("AlphabetManager: Loaded Index Data",n);const e=new Intl.DisplayNames(["en"],{type:"language"});this.languages=n.filter(t=>!(t.scripts||[]).some(r=>["Hant","Hans","Jpan","Kore"].includes(r))).map(t=>{var r;let s=t["language-name"];const i=t.language;if(!s||s===i)try{const o=e.of(i);o&&o!==i?s=o:s=i}catch{s=i}return{code:i,name:s,script:(r=t.scripts)==null?void 0:r[0]}}).sort((t,s)=>(t.name||"").localeCompare(s.name||"")),this.initialized=!0}catch(n){console.error("Failed to load language index",n),this.languages=[{code:"en",name:"English",script:"Latn"}]}}getLanguages(){return this.languages}async loadLanguage(n,e){try{const t=await A(n,e);return this.currentAlphabet=t,t}catch(t){return console.error(`Failed to load alphabet for ${n}`,t),null}}getCharacters(n="alphabetical"){if(!this.currentAlphabet)return[];let e=[...this.currentAlphabet.uppercase];if(e.length===0&&(e=[...this.currentAlphabet.alphabetical]),n==="frequency"){const t=this.currentAlphabet.frequency||{};e.sort((s,i)=>{const r=s.toLowerCase(),o=i.toLowerCase(),a=t[r]||0;return(t[o]||0)-a})}return e}}class g{constructor(n,e,t){l(this,"renderer");l(this,"config");l(this,"audio");l(this,"isRunning",!1);l(this,"timer",null);l(this,"stepCount",0);l(this,"overscanState","fast");l(this,"loopCount",0);l(this,"previousIndex",-1);this.renderer=n,this.config=e,this.audio=t}start(){this.isRunning=!0,this.stepCount=0,this.loopCount=0,this.overscanState="fast",this.reset(),this.scheduleNextStep()}stop(){this.isRunning=!1,this.timer&&(clearTimeout(this.timer),this.timer=null),this.renderer.setFocus([])}handleAction(n){n==="select"?this.handleSelectAction():n==="step"?this.config.get().scanInputMode==="manual"&&(this.step(),this.stepCount++,this.audio.playScanSound()):n==="reset"&&(this.loopCount=0,this.reset(),this.stepCount=0,this.overscanState="fast",this.config.get().scanInputMode==="auto"&&(this.isRunning=!0,this.timer&&clearTimeout(this.timer),this.scheduleNextStep()))}handleSelectAction(){if(this.config.get().criticalOverscan.enabled){if(this.overscanState==="fast"){this.overscanState="slow_backward",this.timer&&clearTimeout(this.timer),this.scheduleNextStep();return}else if(this.overscanState==="slow_backward"){this.overscanState="fast",this.doSelection();return}}this.doSelection()}reportCycleCompleted(){this.loopCount++;const n=this.config.get();n.scanLoops>0&&this.loopCount>=n.scanLoops&&(this.stop(),this.loopCount=0)}scheduleNextStep(){if(!this.isRunning)return;const n=this.config.get();if(n.scanInputMode==="manual")return;let e;n.criticalOverscan.enabled&&this.overscanState==="slow_backward"?e=n.criticalOverscan.slowRate:e=this.stepCount===0&&n.initialItemPause>0?n.initialItemPause:n.criticalOverscan.enabled?n.criticalOverscan.fastRate:n.scanRate,this.timer&&clearTimeout(this.timer),this.timer=window.setTimeout(()=>{this.step(),this.audio.playScanSound(),this.stepCount++,this.scheduleNextStep()},e)}triggerSelection(n){if(n.isEmpty){this.stepCount=0,this.timer&&clearTimeout(this.timer),this.scheduleNextStep();return}const e=new CustomEvent("scanner:selection",{detail:{item:n},bubbles:!0,composed:!0});this.renderer.getContainer().dispatchEvent(e),this.audio.playSelectSound()}triggerRedraw(){const n=new CustomEvent("scanner:redraw",{bubbles:!0,composed:!0});this.renderer.getContainer().dispatchEvent(n)}mapContentToGrid(n,e,t){return n}}class P extends g{constructor(){super(...arguments);l(this,"level","rows");l(this,"currentRow",-1);l(this,"currentCol",-1);l(this,"totalRows",0);l(this,"isColumnRow",!1);l(this,"useBlockScanning",!0)}start(){const e=this.config.get();this.isColumnRow=e.scanPattern==="column-row",this.useBlockScanning=e.scanTechnique==="block",this.recalcDimensions(),super.start()}recalcDimensions(){const e=this.renderer.getItemsCount();this.isColumnRow?this.totalRows=this.renderer.columns:this.totalRows=Math.ceil(e/this.renderer.columns)}reset(){this.level=this.useBlockScanning?"rows":"cells",this.currentRow=-1,this.currentCol=-1,this.renderer.setFocus([])}step(){this.useBlockScanning&&this.level==="rows"?this.stepMajor():this.stepMinor()}stepMajor(){this.currentRow++,this.currentRow>=this.totalRows&&(this.currentRow=0),this.highlightMajor(this.currentRow)}stepMinor(){let e=0;const t=this.renderer.getItemsCount(),s=this.renderer.columns,i=Math.ceil(t/s);if(this.useBlockScanning){if(this.isColumnRow){const o=this.currentRow,a=t%s||s;o<a?e=i:e=i-1}else{const o=this.currentRow*s;e=Math.min(s,t-o)}this.currentCol++,this.currentCol>=e&&(this.currentCol=0)}else this.currentCol++,this.currentCol>=t&&(this.currentCol=0);let r=-1;if(this.useBlockScanning)this.isColumnRow?r=this.currentCol*s+this.currentRow:r=this.currentRow*s+this.currentCol;else if(this.isColumnRow){const o=Math.floor(this.currentCol/s),a=this.currentCol%s;r=o*s+a}else r=this.currentCol;r>=0&&r<t&&this.renderer.setFocus([r])}highlightMajor(e){const t=this.renderer.columns,s=this.renderer.getItemsCount(),i=[];if(this.isColumnRow){const r=Math.ceil(s/t);for(let o=0;o<r;o++){const a=o*t+e;a<s&&i.push(a)}}else{const r=e*t,o=Math.min(r+t,s);for(let a=r;a<o;a++)i.push(a)}this.renderer.setFocus(i)}handleAction(e){e==="cancel"?this.useBlockScanning&&this.level==="cells"?(this.level="rows",this.currentCol=-1,this.highlightMajor(this.currentRow),this.timer&&clearTimeout(this.timer),this.scheduleNextStep()):this.reset():super.handleAction(e)}doSelection(){if(this.useBlockScanning&&this.level==="rows")this.currentRow>=0&&(this.level="cells",this.currentCol=-1,this.renderer.setSelected(-1),this.timer&&clearTimeout(this.timer),this.scheduleNextStep());else{let e=-1;const t=this.renderer.columns;if(this.useBlockScanning)this.isColumnRow?e=this.currentCol*t+this.currentRow:e=this.currentRow*t+this.currentCol;else if(this.isColumnRow){const i=Math.floor(this.currentCol/t),r=this.currentCol%t;e=i*t+r}else e=this.currentCol;const s=this.renderer.getItem(e);s&&(this.renderer.setSelected(e),this.triggerSelection(s),this.reset(),this.timer&&clearTimeout(this.timer),this.scheduleNextStep())}}getCost(e){const t=this.renderer.columns,s=Math.floor(e/t),i=e%t;return this.useBlockScanning?this.isColumnRow?i+1+(s+1):s+1+(i+1):this.isColumnRow?i+1+s+1:e+1}mapContentToGrid(e,t,s){if(this.config.get().scanPattern!=="column-row")return e;const i=new Array(e.length);let r=0;for(let o=0;o<s;o++)for(let a=0;a<t&&!(r>=e.length);a++){const c=a*s+o;c<i.length&&(i[c]=e[r++])}return i}}class X extends g{constructor(){super(...arguments);l(this,"currentIndex",-1);l(this,"totalItems",0);l(this,"direction",1)}start(){this.totalItems=this.countItems(),this.direction=1,super.start()}countItems(){let e=0;for(;this.renderer.getItem(e);)e++;return e}reset(){this.currentIndex=-1,this.direction=1,this.loopCount=0,this.renderer.setFocus([])}step(){switch(this.config.get().scanDirection){case"circular":this.currentIndex++,this.currentIndex>=this.totalItems&&(this.currentIndex=0,this.reportCycleCompleted());break;case"reverse":this.currentIndex--,this.currentIndex<0&&(this.currentIndex=this.totalItems-1,this.reportCycleCompleted());break;case"oscillating":this.currentIndex>=this.totalItems-1&&this.direction===1?(this.direction=-1,this.reportCycleCompleted()):this.currentIndex<=0&&this.direction===-1&&(this.direction=1,this.reportCycleCompleted()),this.currentIndex+=this.direction;break}this.renderer.setFocus([this.currentIndex])}handleAction(e){e==="step"?(this.timer&&clearTimeout(this.timer),this.step(),this.audio.playScanSound(),this.scheduleNextStep()):super.handleAction(e)}doSelection(){if(this.currentIndex>=0){const e=this.renderer.getItem(this.currentIndex);e&&(this.renderer.setSelected(this.currentIndex),this.triggerSelection(e),this.reset(),this.timer&&clearTimeout(this.timer),this.scheduleNextStep())}}getCost(e){switch(this.config.get().scanDirection){case"circular":return e+1;case"reverse":return this.totalItems-e;case"oscillating":return e+1;default:return e+1}}}class N extends g{constructor(){super(...arguments);l(this,"currentRow",0);l(this,"currentCol",0);l(this,"direction",1);l(this,"maxRow",0);l(this,"maxCol",0)}start(){this.updateDimensions(),super.start()}updateDimensions(){const e=this.renderer.getItemsCount();this.maxCol=this.renderer.columns,this.maxRow=Math.ceil(e/this.maxCol)}reset(){this.currentRow=0,this.currentCol=0,this.direction=1,this.renderer.setFocus([0])}step(){this.currentCol+=this.direction,this.currentCol>=this.maxCol?(this.currentCol=this.maxCol-1,this.currentRow++,this.direction=-1):this.currentCol<0&&(this.currentCol=0,this.currentRow++,this.direction=1),this.currentRow>=this.maxRow&&(this.currentRow=0,this.currentCol=0,this.direction=1);const e=this.currentRow*this.maxCol+this.currentCol;if(e>=this.renderer.getItemsCount()){this.reset();return}this.renderer.setFocus([e])}handleAction(e){e!=="select"?super.handleAction(e):super.handleAction(e)}doSelection(){const e=this.currentRow*this.maxCol+this.currentCol,t=this.renderer.getItem(e);t&&(this.renderer.setSelected(e),this.triggerSelection(t),this.reset(),this.timer&&clearTimeout(this.timer),this.scheduleNextStep())}getCost(e){return e}mapContentToGrid(e,t,s){const i=new Array(e.length);let r=0,o=0,a=1;for(let c=0;c<e.length;c++){const h=r*s+o;if(h<i.length&&(i[h]=e[c]),o+=a,o>=s?(o=s-1,r++,a=-1):o<0&&(o=0,r++,a=1),r>=t)break}return i}}class G extends g{constructor(){super(...arguments);l(this,"level","quadrant");l(this,"currentQuad",-1);l(this,"currentRow",-1);l(this,"currentCol",-1);l(this,"quads",[])}start(){this.calcQuadrants(),super.start()}calcQuadrants(){const e=this.renderer.getItemsCount(),t=this.renderer.columns,s=Math.ceil(e/t),i=Math.ceil(s/2),r=Math.ceil(t/2);this.quads=[{rowStart:0,rowEnd:i,colStart:0,colEnd:r},{rowStart:0,rowEnd:i,colStart:r,colEnd:t},{rowStart:i,rowEnd:s,colStart:0,colEnd:r},{rowStart:i,rowEnd:s,colStart:r,colEnd:t}]}reset(){this.level="quadrant",this.currentQuad=-1,this.currentRow=-1,this.currentCol=-1,this.renderer.setFocus([])}step(){this.level==="quadrant"?this.stepQuadrant():this.level==="row"?this.stepRow():this.stepCell()}stepQuadrant(){this.currentQuad++,this.currentQuad>=4&&(this.currentQuad=0),this.highlightQuad(this.currentQuad)}stepRow(){const e=this.quads[this.currentQuad],t=e.rowEnd-e.rowStart;this.currentRow++,this.currentRow>=t&&(this.currentRow=0);const s=e.rowStart+this.currentRow;this.highlightRowSegment(s,e.colStart,e.colEnd)}stepCell(){const e=this.quads[this.currentQuad],t=e.colEnd-e.colStart;this.currentCol++,this.currentCol>=t&&(this.currentCol=0);const s=e.rowStart+this.currentRow,i=e.colStart+this.currentCol,r=s*this.renderer.columns+i;this.renderer.getItem(r)?this.renderer.setFocus([r]):this.stepCell()}highlightQuad(e){const t=this.quads[e],s=[],i=this.renderer.columns,r=this.renderer.getItemsCount();for(let o=t.rowStart;o<t.rowEnd;o++)for(let a=t.colStart;a<t.colEnd;a++){const c=o*i+a;c<r&&s.push(c)}this.renderer.setFocus(s)}highlightRowSegment(e,t,s){const i=[],r=this.renderer.columns,o=this.renderer.getItemsCount();for(let a=t;a<s;a++){const c=e*r+a;c<o&&i.push(c)}this.renderer.setFocus(i)}handleAction(e){e==="cancel"?this.level==="cell"?(this.level="row",this.currentCol=-1,this.restartTimer()):this.level==="row"?(this.level="quadrant",this.currentRow=-1,this.restartTimer()):this.reset():super.handleAction(e)}doSelection(){if(this.level==="quadrant")this.currentQuad>=0&&(this.level="row",this.currentRow=-1,this.restartTimer());else if(this.level==="row")this.currentRow>=0&&(this.level="cell",this.currentCol=-1,this.restartTimer());else{const e=this.quads[this.currentQuad],t=(e.rowStart+this.currentRow)*this.renderer.columns+(e.colStart+this.currentCol),s=this.renderer.getItem(t);s&&(this.triggerSelection(s),this.reset(),this.restartTimer())}}restartTimer(){this.timer&&clearTimeout(this.timer),this.scheduleNextStep()}getCost(e){const t=this.renderer.columns,s=this.renderer.getItemsCount(),i=Math.ceil(s/t),r=Math.ceil(i/2),o=Math.ceil(t/2),a=Math.floor(e/t),c=e%t;let h=0;a<r?c<o?h=0:h=1:c<o?h=2:h=3;let u=a;a>=r&&(u=a-r);let p=c;return c>=o&&(p=c-o),h+1+(u+1)+(p+1)}mapContentToGrid(e,t,s){const i=new Array(e.length);let r=0;const o=Math.ceil(t/2),a=Math.ceil(s/2),c=[{rS:0,rE:o,cS:0,cE:a},{rS:0,rE:o,cS:a,cE:s},{rS:o,rE:t,cS:0,cE:a},{rS:o,rE:t,cS:a,cE:s}];for(const h of c)for(let u=h.rS;u<h.rE;u++)for(let p=h.cS;p<h.cE&&!(r>=e.length);p++){const f=u*s+p;f<i.length&&(i[f]=e[r++])}return i}}class W extends g{constructor(){super(...arguments);l(this,"level","group");l(this,"currentGroup",-1);l(this,"currentRow",-1);l(this,"currentCol",-1);l(this,"groups",[])}start(){this.calcGroups(),super.start()}calcGroups(){const e=this.renderer.getItemsCount(),t=this.renderer.columns,s=Math.ceil(e/t),i=Math.ceil(s/3);this.groups=[];for(let r=0;r<s;r+=i)this.groups.push({rowStart:r,rowEnd:Math.min(r+i,s)})}reset(){this.level="group",this.currentGroup=-1,this.currentRow=-1,this.currentCol=-1,this.renderer.setFocus([])}step(){this.level==="group"?this.stepGroup():this.level==="row"?this.stepRow():this.stepCell()}stepGroup(){this.currentGroup++,this.currentGroup>=this.groups.length&&(this.currentGroup=0),this.highlightGroup(this.currentGroup)}stepRow(){const e=this.groups[this.currentGroup],t=e.rowEnd-e.rowStart;this.currentRow++,this.currentRow>=t&&(this.currentRow=0);const s=e.rowStart+this.currentRow;this.highlightRow(s)}stepCell(){const e=this.renderer.columns;this.currentCol++,this.currentCol>=e&&(this.currentCol=0);const i=(this.groups[this.currentGroup].rowStart+this.currentRow)*e+this.currentCol;this.renderer.getItem(i)?this.renderer.setFocus([i]):this.currentCol<e-1&&this.stepCell()}highlightGroup(e){const t=this.groups[e],s=[],i=this.renderer.columns,r=this.renderer.getItemsCount();for(let o=t.rowStart;o<t.rowEnd;o++)for(let a=0;a<i;a++){const c=o*i+a;c<r&&s.push(c)}this.renderer.setFocus(s)}highlightRow(e){const t=this.renderer.columns,s=this.renderer.getItemsCount(),i=[];for(let r=0;r<t;r++){const o=e*t+r;o<s&&i.push(o)}this.renderer.setFocus(i)}handleAction(e){e==="cancel"?this.level==="cell"?(this.level="row",this.currentCol=-1,this.restartTimer()):this.level==="row"?(this.level="group",this.currentRow=-1,this.restartTimer()):this.reset():super.handleAction(e)}doSelection(){if(this.level==="group")this.currentGroup>=0&&(this.level="row",this.currentRow=-1,this.restartTimer());else if(this.level==="row")this.currentRow>=0&&(this.level="cell",this.currentCol=-1,this.restartTimer());else{const t=(this.groups[this.currentGroup].rowStart+this.currentRow)*this.renderer.columns+this.currentCol,s=this.renderer.getItem(t);s&&(this.triggerSelection(s),this.reset(),this.restartTimer())}}restartTimer(){this.timer&&clearTimeout(this.timer),this.scheduleNextStep()}getCost(e){const t=this.renderer.columns,s=this.renderer.getItemsCount(),i=Math.ceil(s/t),r=Math.ceil(i/3),o=Math.floor(e/t),a=e%t,c=Math.floor(o/r),h=o%r;return c+1+(h+1)+(a+1)}}const B={"switch-1":"#2196F3","switch-2":"#F44336","switch-3":"#4CAF50","switch-4":"#FFEB3B","switch-5":"#9C27B0","switch-6":"#FF9800","switch-7":"#00BCD4","switch-8":"#E91E63"};class Z extends g{constructor(){super(...arguments);l(this,"rangeStart",0);l(this,"rangeEnd",0);l(this,"currentBlock",0);l(this,"numSwitches",4);l(this,"partitionHistory",[])}start(){const e=this.config.get();this.numSwitches=e.eliminationSwitchCount||4,this.rangeStart=0,this.rangeEnd=this.renderer.getItemsCount(),this.partitionHistory=[],super.start()}reset(){this.rangeStart=0,this.rangeEnd=this.renderer.getItemsCount(),this.currentBlock=0,this.partitionHistory=[],this.clearHighlights()}clearHighlights(){this.renderer.setFocus([]),this.renderer.getContainer().querySelectorAll(".grid-cell").forEach(s=>{s.style.backgroundColor="",s.style.boxShadow=""})}step(){this.currentBlock=(this.currentBlock+1)%this.numSwitches,this.highlightCurrentBlock()}highlightCurrentBlock(){this.clearHighlights();const t=this.calculatePartitions(this.rangeStart,this.rangeEnd,this.numSwitches)[this.currentBlock];if(!t)return;const s=this.renderer.getContainer();for(let i=t.start;i<t.end;i++){const r=s.querySelector(`[data-index="${i}"]`);if(r){const o=this.getSwitchAction(this.currentBlock),a=B[o];r.style.backgroundColor=a,r.style.opacity="0.4",r.style.boxShadow=`inset 0 0 0 3px ${a}`,r.style.border=`2px solid ${a}`}}}calculatePartitions(e,t,s){const i=[],r=t-e,o=Math.floor(r/s),a=r%s;let c=e;for(let h=0;h<s;h++){const u=o+(h<a?1:0);i.push({start:c,end:c+u}),c+=u}return i}getSwitchAction(e){return{0:"switch-1",1:"switch-2",2:"switch-3",3:"switch-4",4:"switch-5",5:"switch-6",6:"switch-7",7:"switch-8"}[e]||"switch-1"}handleAction(e){if(e==="select"){this.doSelection();return}if(e.toString().startsWith("switch-")){const t=parseInt(e.toString().split("-")[1])-1;if(t>=this.numSwitches)return;if(this.rangeEnd-this.rangeStart<=1){const i=this.renderer.getItem(this.rangeStart);i&&(this.triggerSelection(i),this.reset(),this.restartTimer());return}if(t===this.currentBlock){const r=this.calculatePartitions(this.rangeStart,this.rangeEnd,this.numSwitches)[t];if(r&&(this.partitionHistory.push({start:this.rangeStart,end:this.rangeEnd}),this.rangeStart=r.start,this.rangeEnd=r.end,this.currentBlock=0,this.rangeEnd-this.rangeStart===1)){this.clearHighlights();const o=this.renderer.getContainer().querySelector(`[data-index="${this.rangeStart}"]`);if(o){const a=B["switch-1"];o.style.backgroundColor=a,o.style.opacity="0.6",o.style.boxShadow=`inset 0 0 0 4px ${a}, 0 0 10px ${a}`}}this.restartTimer()}return}if(e==="cancel"||e==="reset"){if(this.partitionHistory.length>0){const t=this.partitionHistory.pop();this.rangeStart=t.start,this.rangeEnd=t.end,this.currentBlock=0}else this.reset();this.restartTimer()}}doSelection(){if(this.rangeEnd-this.rangeStart<=1){const t=this.renderer.getItem(this.rangeStart);t&&(this.triggerSelection(t),this.reset(),this.restartTimer())}}restartTimer(){this.timer&&clearTimeout(this.timer),this.scheduleNextStep()}getCost(e){const t=this.numSwitches;let s=0,i=this.renderer.getItemsCount(),r=0;for(;i-s>1;){const o=this.calculatePartitions(s,i,t);let a=0;for(let c=0;c<o.length;c++)if(e>=o[c].start&&e<o[c].end){a=c;break}r+=a+1,s=o[a].start,i=o[a].end}return r}scheduleNextStep(){if(!this.isRunning||this.config.get().scanInputMode==="manual")return;this.timer&&clearTimeout(this.timer);const e=this.config.get().scanRate;this.timer=window.setTimeout(()=>{this.step(),this.scheduleNextStep()},e)}}class Q extends g{constructor(){super(...arguments);l(this,"overlay",null);l(this,"hBar",null);l(this,"vBar",null);l(this,"bufferZone",null);l(this,"lockedXBar",null);l(this,"directionIndicator",null);l(this,"directionLine",null);l(this,"state","x-scan");l(this,"xPos",0);l(this,"yPos",0);l(this,"technique","crosshair");l(this,"numCols",0);l(this,"numRows",0);l(this,"bufferWidth",15);l(this,"direction",1);l(this,"pauseTimer",null);l(this,"bufferLeft",0);l(this,"bufferRight",0);l(this,"bufferTop",0);l(this,"bufferBottom",0);l(this,"fineXPos",0);l(this,"fineYPos",0);l(this,"lockedXPosition",0);l(this,"currentDirection",0);l(this,"compassAngle",0);l(this,"compassMode","continuous");l(this,"directionStepCounter",0);l(this,"directionStepsPerChange",10);l(this,"directions",[{name:"N",angle:0,dx:0,dy:-1},{name:"NE",angle:45,dx:1,dy:-1},{name:"E",angle:90,dx:1,dy:0},{name:"SE",angle:135,dx:1,dy:1},{name:"S",angle:180,dx:0,dy:1},{name:"SW",angle:225,dx:-1,dy:1},{name:"W",angle:270,dx:-1,dy:0},{name:"NW",angle:315,dx:-1,dy:-1}])}start(){try{const e=this.config.get();this.technique=e.continuousTechnique||"crosshair";const t=this.renderer.getItemsCount();this.numCols=this.renderer.columns,this.numRows=Math.ceil(t/this.numCols),console.log("[ContinuousScanner] Starting:",{technique:this.technique,numCols:this.numCols,numRows:this.numRows,totalItems:t}),console.log("[ContinuousScanner] About to create overlay..."),this.createOverlay(),console.log("[ContinuousScanner] Overlay created successfully"),this.technique==="gliding"?(this.state="x-scanning",this.xPos=0,this.yPos=0):this.technique==="eight-direction"?(this.state="direction-scan",this.xPos=50,this.yPos=50,this.compassMode=e.compassMode||"continuous",this.compassAngle=0):(this.state="x-scan",this.xPos=0,this.yPos=0),console.log("[ContinuousScanner] Initial state:",this.state),super.start()}catch(e){throw console.error("[ContinuousScanner] ERROR in start():",e),e}}stop(){super.stop(),this.pauseTimer&&(window.clearTimeout(this.pauseTimer),this.pauseTimer=null),this.removeOverlay()}reset(){this.technique==="gliding"?(this.state="x-scanning",this.xPos=0,this.yPos=0):this.technique==="eight-direction"?(this.state="direction-scan",this.xPos=50,this.yPos=50):(this.state="x-scan",this.xPos=0,this.yPos=0),this.direction=1,this.fineXPos=0,this.fineYPos=0,this.bufferLeft=0,this.bufferRight=this.bufferWidth,this.bufferTop=0,this.bufferBottom=this.bufferWidth,this.lockedXPosition=0,this.currentDirection=0,this.compassAngle=0,this.directionStepCounter=0,this.renderer.setFocus([]),this.lockedXBar&&(this.lockedXBar.style.display="none"),this.directionIndicator&&(this.directionIndicator.style.display="none"),this.directionLine&&(this.directionLine.style.display="none"),this.updateOverlay()}step(){if(this.technique==="eight-direction"){if(this.state==="direction-scan")this.compassMode==="continuous"?this.compassAngle=(this.compassAngle+2)%360:(this.directionStepCounter++,this.directionStepCounter>=this.directionStepsPerChange&&(this.currentDirection=(this.currentDirection+1)%8,this.directionStepCounter=0),this.compassAngle=this.directions[this.currentDirection].angle);else if(this.state==="moving"){const e=this.compassMode==="continuous"?this.getDirectionFromAngle(this.compassAngle):this.directions[this.currentDirection],t=.5;this.xPos+=e.dx*t,this.yPos+=e.dy*t,this.xPos=Math.max(0,Math.min(100,this.xPos)),this.yPos=Math.max(0,Math.min(100,this.yPos))}}else if(this.technique==="gliding")if(this.state==="x-scanning"){if(this.xPos+=.8*this.direction,this.xPos>=100){if(this.xPos=100,!this.pauseTimer){this.pauseTimer=window.setTimeout(()=>{this.direction=-1,this.pauseTimer=null},100);return}}else if(this.xPos<=0&&(this.xPos=0,!this.pauseTimer)){this.pauseTimer=window.setTimeout(()=>{this.direction=1,this.pauseTimer=null},100);return}this.bufferLeft=Math.max(0,this.xPos-this.bufferWidth/2),this.bufferRight=Math.min(100,this.xPos+this.bufferWidth/2)}else if(this.state==="x-capturing")this.fineXPos+=.3*this.direction,this.fineXPos>=100?(this.fineXPos=100,this.direction=-1):this.fineXPos<=0&&(this.fineXPos=0,this.direction=1);else if(this.state==="y-scanning"){if(this.yPos+=.8*this.direction,this.yPos>=100){if(this.yPos=100,!this.pauseTimer){this.pauseTimer=window.setTimeout(()=>{this.direction=-1,this.pauseTimer=null},100);return}}else if(this.yPos<=0&&(this.yPos=0,!this.pauseTimer)){this.pauseTimer=window.setTimeout(()=>{this.direction=1,this.pauseTimer=null},100);return}this.bufferTop=Math.max(0,this.yPos-this.bufferWidth/2),this.bufferBottom=Math.min(100,this.yPos+this.bufferWidth/2)}else this.state==="y-capturing"&&(this.fineYPos+=.3*this.direction,this.fineYPos>=100?(this.fineYPos=100,this.direction=-1):this.fineYPos<=0&&(this.fineYPos=0,this.direction=1));else this.state==="x-scan"?(this.xPos+=.5,this.xPos>100&&(this.xPos=0)):this.state==="y-scan"&&(this.yPos+=.5,this.yPos>100&&(this.yPos=0));Math.floor(this.xPos*2)%50===0&&console.log("[ContinuousScanner] Step:",{state:this.state,xPos:this.xPos,yPos:this.yPos,fineXPos:this.fineXPos,fineYPos:this.fineYPos,bufferLeft:this.bufferLeft,bufferRight:this.bufferRight,technique:this.technique,direction:this.direction,currentDirection:this.currentDirection}),this.updateOverlay()}calculateLineLength(e,t,s,i){return s===0&&i===-1?t:s===1&&i===-1?Math.min(100-e,t)*Math.SQRT2:s===1&&i===0?100-e:s===1&&i===1?Math.min(100-e,100-t)*Math.SQRT2:s===0&&i===1?100-t:s===-1&&i===1?Math.min(e,100-t)*Math.SQRT2:s===-1&&i===0?e:s===-1&&i===-1?Math.min(e,t)*Math.SQRT2:50}getDirectionFromAngle(e){const t=e*Math.PI/180,s=Math.cos(t),i=Math.sin(t),r=(e+22.5)%360,o=Math.floor(r/45),c=["E","SE","S","SW","W","NW","N","NE"][o]||"N";return{dx:s,dy:i,name:c}}scheduleNextStep(){if(!this.isRunning||this.config.get().scanInputMode==="manual")return;this.timer&&clearTimeout(this.timer);const e=20;this.timer=window.setTimeout(()=>{this.step(),this.scheduleNextStep()},e)}createOverlay(){if(this.overlay)return;console.log("[ContinuousScanner] Creating overlay...");const e=this.renderer.getContainer();if(console.log("[ContinuousScanner] Container:",e),!e){console.error("[ContinuousScanner] ERROR: Container is null/undefined!");return}this.overlay=document.createElement("div"),this.overlay.style.position="absolute",this.overlay.style.top="0",this.overlay.style.left="0",this.overlay.style.width="100%",this.overlay.style.height="100%",this.overlay.style.pointerEvents="none",this.overlay.style.zIndex="1000",this.bufferZone=document.createElement("div"),this.bufferZone.style.position="absolute",this.bufferZone.style.top="0",this.bufferZone.style.height="100%",this.bufferZone.style.backgroundColor="rgba(128, 128, 128, 0.4)",this.bufferZone.style.borderLeft="2px solid rgba(128, 128, 128, 0.8)",this.bufferZone.style.borderRight="2px solid rgba(128, 128, 128, 0.8)",this.bufferZone.style.pointerEvents="none",this.bufferZone.style.display="none",this.overlay.appendChild(this.bufferZone),this.vBar=document.createElement("div"),this.vBar.style.position="absolute",this.vBar.style.top="0",this.vBar.style.width="4px",this.vBar.style.height="100%",this.vBar.style.backgroundColor="rgba(255, 0, 0, 0.5)",this.vBar.style.borderLeft="1px solid red",this.vBar.style.borderRight="1px solid red",this.vBar.style.display="none",this.overlay.appendChild(this.vBar),this.hBar=document.createElement("div"),this.hBar.style.position="absolute",this.hBar.style.left="0",this.hBar.style.width="100%",this.hBar.style.height="4px",this.hBar.style.backgroundColor="rgba(255, 0, 0, 0.5)",this.hBar.style.borderTop="1px solid red",this.hBar.style.borderBottom="1px solid red",this.hBar.style.display="none",this.overlay.appendChild(this.hBar),this.lockedXBar=document.createElement("div"),this.lockedXBar.style.position="absolute",this.lockedXBar.style.top="0",this.lockedXBar.style.width="3px",this.lockedXBar.style.height="100%",this.lockedXBar.style.backgroundColor="rgba(0, 255, 0, 0.7)",this.lockedXBar.style.borderLeft="1px solid green",this.lockedXBar.style.borderRight="1px solid green",this.lockedXBar.style.display="none",this.overlay.appendChild(this.lockedXBar),this.directionIndicator=document.createElement("div"),this.directionIndicator.style.position="absolute",this.directionIndicator.style.top="10px",this.directionIndicator.style.right="10px",this.directionIndicator.style.width="80px",this.directionIndicator.style.height="80px",this.directionIndicator.style.borderRadius="50%",this.directionIndicator.style.backgroundColor="rgba(255, 255, 255, 0.9)",this.directionIndicator.style.border="3px solid #333",this.directionIndicator.style.display="none",this.directionIndicator.style.pointerEvents="none",this.overlay.appendChild(this.directionIndicator),this.directionLine=document.createElement("div"),this.directionLine.style.position="absolute",this.directionLine.style.height="2px",this.directionLine.style.backgroundColor="rgba(33, 150, 243, 0.6)",this.directionLine.style.transformOrigin="0 50%",this.directionLine.style.display="none",this.directionLine.style.pointerEvents="none",this.directionLine.style.zIndex="5",this.overlay.appendChild(this.directionLine),e.appendChild(this.overlay),console.log("[ContinuousScanner] Overlay created and appended")}removeOverlay(){this.overlay&&this.overlay.parentNode&&this.overlay.parentNode.removeChild(this.overlay),this.overlay=null,this.hBar=null,this.vBar=null,this.bufferZone=null,this.lockedXBar=null,this.directionIndicator=null,this.directionLine=null}handleAction(e){console.log("[ContinuousScanner] handleAction:",{action:e,state:this.state,technique:this.technique}),e==="cancel"?(console.log("[ContinuousScanner] Cancel - resetting"),this.reset()):super.handleAction(e)}doSelection(){if(this.technique==="eight-direction")if(this.state==="direction-scan"){const e=this.getDirectionFromAngle(this.compassAngle);console.log("[ContinuousScanner] Transition: direction-scan -> moving, direction:",e.name,"angle:",this.compassAngle),this.state="moving"}else this.state==="moving"&&(console.log("[ContinuousScanner] Transition: moving -> processing"),this.state="processing",this.selectFocusedItem());else this.technique==="gliding"?this.state==="x-scanning"?(console.log("[ContinuousScanner] Transition: x-scanning -> x-capturing"),this.state="x-capturing",this.fineXPos=0,this.direction=1):this.state==="x-capturing"?(console.log("[ContinuousScanner] Transition: x-capturing -> y-scanning"),this.state="y-scanning",this.lockedXPosition=this.bufferLeft+this.fineXPos/100*(this.bufferRight-this.bufferLeft),this.yPos=0,this.fineYPos=0,this.direction=1):this.state==="y-scanning"?(console.log("[ContinuousScanner] Transition: y-scanning -> y-capturing"),this.state="y-capturing",this.fineYPos=0,this.direction=1):this.state==="y-capturing"&&(console.log("[ContinuousScanner] Transition: y-capturing -> processing"),this.state="processing",this.selectFocusedItem()):this.state==="x-scan"?(console.log("[ContinuousScanner] Transition: x-scan -> y-scan"),this.state="y-scan",this.yPos=0):this.state==="y-scan"&&(console.log("[ContinuousScanner] Transition: y-scan -> processing"),this.state="processing",this.selectAtPoint())}selectFocusedItem(){if(!this.overlay)return;const e=this.overlay.getBoundingClientRect();let t,s;if(this.technique==="eight-direction")t=e.left+this.xPos/100*e.width,s=e.top+this.yPos/100*e.height;else{const o=this.bufferTop+this.fineYPos/100*(this.bufferBottom-this.bufferTop);t=e.left+this.lockedXPosition/100*e.width,s=e.top+o/100*e.height}this.overlay.style.display="none";const i=this.renderer.getContainer().getRootNode(),r=i.elementFromPoint?i.elementFromPoint(t,s):document.elementFromPoint(t,s);if(this.overlay.style.display="block",r){const o=r.closest(".grid-cell");if(o&&o.dataset.index){const a=parseInt(o.dataset.index,10),c=this.renderer.getItem(a);c&&(this.renderer.setSelected(a),this.triggerSelection(c))}}this.reset()}updateOverlay(){if(!this.hBar||!this.vBar||!this.bufferZone||!this.lockedXBar||!this.directionIndicator||!this.directionLine){console.error("[ContinuousScanner] updateOverlay: Missing elements!",{hBar:!!this.hBar,vBar:!!this.vBar,bufferZone:!!this.bufferZone,lockedXBar:!!this.lockedXBar,directionIndicator:!!this.directionIndicator,directionLine:!!this.directionLine,overlay:!!this.overlay});return}if(console.log("[ContinuousScanner] updateOverlay:",{technique:this.technique,state:this.state,xPos:this.xPos,yPos:this.yPos,currentDirection:this.currentDirection}),this.technique==="eight-direction"){this.vBar.style.display="none",this.hBar.style.display="none",this.bufferZone.style.display="none",this.lockedXBar.style.display="none",this.directionIndicator.style.display="block",this.directionLine.style.display="block";const e=this.compassAngle,t=this.getDirectionFromAngle(e);this.directionIndicator.innerHTML=`
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(${e}deg);
          font-size: 24px;
          font-weight: bold;
          color: #2196F3;
        ">↑</div>
        <div style="
          position: absolute;
          top: 5px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          font-weight: bold;
        ">N</div>
        <div style="
          position: absolute;
          bottom: 5px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          font-weight: bold;
        ">S</div>
        <div style="
          position: absolute;
          left: 5px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          font-weight: bold;
        ">W</div>
        <div style="
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          font-weight: bold;
        ">E</div>
        <div style="
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          color: #666;
        ">${t.name} (${Math.round(e)}°)</div>
      `,this.directionLine.style.left=`${this.xPos}%`,this.directionLine.style.top=`${this.yPos}%`;const s=this.calculateLineLength(this.xPos,this.yPos,t.dx,t.dy);this.directionLine.style.width=`${s}%`,this.directionLine.style.transformOrigin="0 50%",this.directionLine.style.transform=`rotate(${e}deg)`,this.vBar.style.display="block",this.vBar.style.width="12px",this.vBar.style.height="12px",this.vBar.style.borderRadius="50%",this.vBar.style.backgroundColor=this.state==="moving"?"#FF5722":"#2196F3",this.vBar.style.border="2px solid white",this.vBar.style.zIndex="10",this.vBar.style.left=`calc(${this.xPos}% - 6px)`,this.vBar.style.top=`calc(${this.yPos}% - 6px)`}else if(this.technique==="gliding"){if(this.state==="x-scanning"){this.vBar.style.display="none",this.hBar.style.display="none",this.lockedXBar&&(this.lockedXBar.style.display="none"),this.directionIndicator&&(this.directionIndicator.style.display="none"),this.directionLine&&(this.directionLine.style.display="none");const e=Math.max(0,this.xPos-this.bufferWidth/2),s=Math.min(100,this.xPos+this.bufferWidth/2)-e;this.bufferZone.style.left=`${e}%`,this.bufferZone.style.width=`${s}%`,this.bufferZone.style.height="100%",this.bufferZone.style.top="0",this.bufferZone.style.display="block"}else if(this.state==="x-capturing"){this.hBar.style.display="none",this.lockedXBar&&(this.lockedXBar.style.display="none"),this.directionIndicator&&(this.directionIndicator.style.display="none"),this.directionLine&&(this.directionLine.style.display="none");const e=this.bufferRight-this.bufferLeft;this.bufferZone.style.left=`${this.bufferLeft}%`,this.bufferZone.style.width=`${e}%`,this.bufferZone.style.height="100%",this.bufferZone.style.top="0",this.bufferZone.style.display="block";const t=this.bufferLeft+this.fineXPos/100*(this.bufferRight-this.bufferLeft);this.vBar.style.display="block",this.vBar.style.left=`${t}%`}else if(this.state==="y-scanning"){this.vBar.style.display="none",this.hBar.style.display="none",this.directionIndicator&&(this.directionIndicator.style.display="none"),this.directionLine&&(this.directionLine.style.display="none"),this.lockedXBar.style.display="block",this.lockedXBar.style.left=`${this.lockedXPosition}%`;const e=Math.max(0,this.yPos-this.bufferWidth/2),s=Math.min(100,this.yPos+this.bufferWidth/2)-e;this.bufferZone.style.left="0",this.bufferZone.style.width="100%",this.bufferZone.style.top=`${e}%`,this.bufferZone.style.height=`${s}%`,this.bufferZone.style.display="block"}else if(this.state==="y-capturing"){this.vBar.style.display="none",this.directionIndicator&&(this.directionIndicator.style.display="none"),this.directionLine&&(this.directionLine.style.display="none"),this.lockedXBar.style.display="block",this.lockedXBar.style.left=`${this.lockedXPosition}%`;const e=this.bufferBottom-this.bufferTop;this.bufferZone.style.left="0",this.bufferZone.style.width="100%",this.bufferZone.style.top=`${this.bufferTop}%`,this.bufferZone.style.height=`${e}%`,this.bufferZone.style.display="block";const t=this.bufferTop+this.fineYPos/100*(this.bufferBottom-this.bufferTop);this.hBar.style.display="block",this.hBar.style.top=`${t}%`}}else this.bufferZone.style.display="none",this.lockedXBar&&(this.lockedXBar.style.display="none"),this.directionIndicator&&(this.directionIndicator.style.display="none"),this.directionLine&&(this.directionLine.style.display="none"),this.state==="x-scan"?(this.vBar.style.display="block",this.vBar.style.left=`${this.xPos}%`,this.hBar.style.display="none"):this.state==="y-scan"&&(this.vBar.style.display="block",this.vBar.style.left=`${this.xPos}%`,this.hBar.style.display="block",this.hBar.style.top=`${this.yPos}%`)}selectAtPoint(){if(!this.overlay)return;const e=this.overlay.getBoundingClientRect(),t=e.left+this.xPos/100*e.width,s=e.top+this.yPos/100*e.height;this.overlay.style.display="none";const i=this.renderer.getContainer().getRootNode(),r=i.elementFromPoint?i.elementFromPoint(t,s):document.elementFromPoint(t,s);if(this.overlay.style.display="block",r){const o=r.closest(".grid-cell");if(o&&o.dataset.index){const a=parseInt(o.dataset.index,10),c=this.renderer.getItem(a);c&&(this.renderer.setSelected(a),this.triggerSelection(c))}}this.reset()}getCost(e){const t=this.renderer.columns,s=Math.floor(e/t),i=e%t;if(this.technique==="eight-direction"){const r=(i+.5)/t*100,o=(s+.5)/Math.ceil(this.renderer.getItemsCount()/t)*100,a=Math.sqrt(Math.pow(r,2)+Math.pow(o,2));return 4+Math.round(a/.5)+1}else if(this.technique==="gliding"){const r=(i+.5)/t*100;return Math.round(r/.5)+1}else{const r=(i+.5)/t*100,o=(s+.5)/Math.ceil(this.renderer.getItemsCount()/t)*100,a=Math.round(r/.5),c=Math.round(o/.5);return a+c+2}}}class U{constructor(){l(this,"predictor");this.predictor=$({adaptive:!0,maxOrder:5}),this.predictor.train("The quick brown fox jumps over the lazy dog. Hello world. How are you?")}addToContext(n){this.predictor.addToContext(n)}resetContext(){this.predictor.resetContext()}predictNext(){return this.predictor.predictNextCharacter()}}class _ extends g{constructor(e,t,s){super(e,t,s);l(this,"predictor");l(this,"scanOrder",[]);l(this,"currentIndex",-1);this.predictor=new U}start(){this.updateProbabilities(),super.start()}reset(){this.currentIndex=-1,this.renderer.setFocus([])}step(){this.currentIndex++,this.currentIndex>=this.scanOrder.length&&(this.currentIndex=0);const e=this.scanOrder[this.currentIndex];this.renderer.setFocus([e])}handleAction(e){e==="cancel"?this.reset():super.handleAction(e)}doSelection(){if(this.currentIndex>=0){const e=this.scanOrder[this.currentIndex],t=this.renderer.getItem(e);t&&(this.renderer.setSelected(e),this.triggerSelection(t),this.predictor.addToContext(t.label.toLowerCase()),this.updateProbabilities(),this.triggerRedraw(),this.reset(),this.timer&&clearTimeout(this.timer),this.scheduleNextStep())}}updateProbabilities(){const e=this.predictor.predictNext(),t=this.renderer.getItemsCount(),s=[];for(let i=0;i<t;i++){const r=this.renderer.getItem(i);let o=1e-4;if(r&&r.label){const a=e.find(c=>c.text.toLowerCase()===r.label.toLowerCase());a&&(o=a.probability)}s.push({index:i,prob:o})}s.sort((i,r)=>r.prob-i.prob),this.scanOrder=s.map(i=>i.index)}getCost(e){const t=this.scanOrder.indexOf(e);return t===-1?999:t+1}}class Y extends g{start(){this.isRunning=!0,this.reset();const n=this.renderer.getItemsCount();if(n>0){const e=Array.from({length:n},(t,s)=>s);this.renderer.setFocus(e)}}handleAction(n){n==="select"&&this.isRunning&&super.handleAction(n)}doSelection(){if(this.renderer.getItemsCount()>0){const e=this.renderer.getItem(0);e&&(this.triggerSelection(e),this.renderer.setSelected(0))}}step(){}reset(){const n=this.renderer.getItemsCount();if(n>0){const e=Array.from({length:n},(t,s)=>s);this.renderer.setFocus(e)}}getCost(n){return 1}}class j extends g{constructor(e,t,s){super(e,t,s);l(this,"probabilities",[]);l(this,"colors",[])}start(){this.isRunning=!0,this.initializeBelief(),this.assignColors(),this.applyColors()}stop(){this.isRunning=!1,this.renderer.setFocus([])}handleAction(e){if(!this.isRunning)return;let t=null;if(e==="switch-1"||e==="select")t="blue";else if(e==="switch-2"||e==="step")t="red";else if(e==="reset"){this.initializeBelief(),this.assignColors(),this.applyColors();return}else return;this.updateBelief(t),this.assignColors(),this.applyColors()}step(){}reset(){this.initializeBelief(),this.assignColors(),this.applyColors()}getCost(e){return 1}doSelection(){}initializeBelief(){const e=this.renderer.getItemsCount(),t=e>0?1/e:0;this.probabilities=new Array(e).fill(t)}assignColors(){const e=this.probabilities.map((i,r)=>({p:i,i:r})).sort((i,r)=>r.p-i.p);let t=0,s=0;this.colors=new Array(this.probabilities.length).fill("blue");for(const i of e)t<=s?(this.colors[i.i]="red",t+=i.p):(this.colors[i.i]="blue",s+=i.p)}applyColors(){const e="#f9c6c6",t="#cfe3ff";for(let s=0;s<this.colors.length;s++){const i=this.renderer.getElement(s);i&&(i.style.backgroundColor=this.colors[s]==="red"?e:t,i.style.color="#1e1e1e")}}updateBelief(e){const{errorRate:t,selectThreshold:s}=this.config.get().colorCode,i=1-t;let r=0;for(let a=0;a<this.probabilities.length;a++){const h=this.colors[a]===e?i:t;this.probabilities[a]*=h,r+=this.probabilities[a]}if(r>0)for(let a=0;a<this.probabilities.length;a++)this.probabilities[a]/=r;let o=0;for(let a=1;a<this.probabilities.length;a++)this.probabilities[a]>this.probabilities[o]&&(o=a);if(this.probabilities[o]>=s){const a=this.renderer.getItem(o);a&&(this.renderer.setSelected(o),this.triggerSelection(a)),this.initializeBelief()}}}function m(){const d=window.SWITCH_SCANNER_ASSET_BASE,n=d&&d.length>0?d:"/";return n.endsWith("/")?n:`${n}/`}const V={blue:{normal:`${m()}switches/switch-blue.png`,depressed:`${m()}switches/switch-blue-depressed.png`},green:{normal:`${m()}switches/switch-green.png`,depressed:`${m()}switches/switch-green-depressed.png`},red:{normal:`${m()}switches/switch-red.png`,depressed:`${m()}switches/switch-red-depressed.png`},yellow:{normal:`${m()}switches/switch-yellow.png`,depressed:`${m()}switches/switch-yellow-depressed.png`}};class K extends HTMLElement{constructor(){super();l(this,"configManager");l(this,"audioManager");l(this,"switchInput");l(this,"alphabetManager");l(this,"gridRenderer");l(this,"settingsUI");l(this,"currentScanner",null);l(this,"baseItems",[]);l(this,"customItems",null);l(this,"forcedGridCols",null);l(this,"outputHistory",[]);l(this,"redoStack",[]);l(this,"dwellTimer",null);l(this,"currentDwellTarget",null);this.attachShadow({mode:"open"})}async connectedCallback(){if(this.configManager)return;this.renderTemplate(),this.setupStyles();const e=this.parseAttributes();this.configManager=new x(e,!1),this.audioManager=new D(this.configManager.get().soundEnabled),this.alphabetManager=new z,await this.alphabetManager.init(),this.switchInput=new F(this.configManager,this);const t=this.shadowRoot.querySelector(".grid-container");this.gridRenderer=new O(t);const s=this.shadowRoot.querySelector(".settings-overlay");this.settingsUI=new H(this.configManager,this.alphabetManager,s);const i=this.configManager.get();this.currentScanner=this.createScanner(i),await this.updateGrid(i,!0),this.currentScanner.start(),i.viewMode!=="standard"&&this.updateGrid(i,!1),this.bindEvents(),this.hasAttribute("tabindex")||this.setAttribute("tabindex","0");const r=this.getAttribute("theme");r&&this.updateTheme(r)}static get observedAttributes(){return["scan-strategy","scan-pattern","scan-technique","scan-mode","scan-input-mode","continuous-technique","compass-mode","grid-content","grid-size","language","scan-rate","acceptance-time","dwell-time","elimination-switch-count","custom-items","grid-cols","theme","cancel-method","long-hold-time","critical-overscan-enabled","critical-overscan-fast-rate","critical-overscan-slow-rate"]}attributeChangedCallback(e,t,s){if(e==="custom-items"){this.parseCustomItems(s),this.configManager&&this.updateGrid(this.configManager.get(),!0);return}if(e==="grid-cols"){this.forcedGridCols=parseInt(s,10),this.configManager&&this.updateGrid(this.configManager.get(),!0);return}if(e==="theme"){this.updateTheme(s);return}if(!this.configManager||t===s)return;const i={};switch(e){case"scan-strategy":this.mapLegacyStrategy(s,i);break;case"scan-pattern":i.scanPattern=s,i.scanMode=null;break;case"scan-input-mode":i.scanInputMode=s;break;case"scan-technique":i.scanTechnique=s;break;case"scan-mode":i.scanMode=s==="null"?null:s;break;case"grid-content":i.gridContent=s;break;case"grid-size":i.gridSize=parseInt(s,10);break;case"language":i.language=s;break;case"scan-rate":i.scanRate=parseInt(s,10);break;case"acceptance-time":i.acceptanceTime=parseInt(s,10);break;case"dwell-time":i.dwellTime=parseInt(s,10);break;case"continuous-technique":i.continuousTechnique=s;break;case"compass-mode":i.compassMode=s;break;case"elimination-switch-count":i.eliminationSwitchCount=parseInt(s,10);break;case"cancel-method":i.cancelMethod=s;break;case"long-hold-time":i.longHoldTime=parseInt(s,10);break;case"critical-overscan-enabled":i.criticalOverscan={...this.configManager.get().criticalOverscan,enabled:s==="true"||s==="1"};break;case"critical-overscan-fast-rate":i.criticalOverscan={...this.configManager.get().criticalOverscan,fastRate:parseInt(s,10)};break;case"critical-overscan-slow-rate":i.criticalOverscan={...this.configManager.get().criticalOverscan,slowRate:parseInt(s,10)};break}this.configManager.update(i)}mapLegacyStrategy(e,t){e==="group-row-column"?t.scanMode="group-row-column":e==="continuous"?t.scanMode="continuous":e==="probability"?t.scanMode="probability":e==="color-code"?t.scanMode="color-code":["row-column","column-row","linear","snake","quadrant","elimination"].includes(e)&&(t.scanPattern=e,e==="row-column"||e==="column-row"?t.scanTechnique="block":t.scanTechnique="point")}parseAttributes(){const e={},t=this.getAttribute("scan-strategy");t&&this.mapLegacyStrategy(t,e);const s=this.getAttribute("scan-pattern");s&&(e.scanPattern=s,e.scanMode=null);const i=this.getAttribute("scan-technique");i&&(e.scanTechnique=i);const r=this.getAttribute("scan-mode");r&&(e.scanMode=r==="null"?null:r);const o=this.getAttribute("scan-input-mode");o&&(e.scanInputMode=o);const a=this.getAttribute("grid-content");a&&(e.gridContent=a);const c=this.getAttribute("grid-size");c&&(e.gridSize=parseInt(c,10));const h=this.getAttribute("language");h&&(e.language=h);const u=this.getAttribute("scan-rate");u&&(e.scanRate=parseInt(u,10));const p=this.getAttribute("acceptance-time");p&&(e.acceptanceTime=parseInt(p,10));const f=this.getAttribute("dwell-time");f&&(e.dwellTime=parseInt(f,10));const S=this.getAttribute("continuous-technique");S&&(e.continuousTechnique=S);const C=this.getAttribute("compass-mode");C&&(e.compassMode=C);const M=this.getAttribute("elimination-switch-count");M&&(e.eliminationSwitchCount=parseInt(M,10));const k=this.getAttribute("cancel-method");k&&(e.cancelMethod=k);const I=this.getAttribute("long-hold-time");I&&(e.longHoldTime=parseInt(I,10));const y=this.getAttribute("critical-overscan-enabled"),v=this.getAttribute("critical-overscan-fast-rate"),w=this.getAttribute("critical-overscan-slow-rate");(y||v||w)&&(e.criticalOverscan={enabled:y==="true"||y==="1",fastRate:v?parseInt(v,10):100,slowRate:w?parseInt(w,10):1e3});const T=this.getAttribute("custom-items");T&&this.parseCustomItems(T);const R=this.getAttribute("grid-cols");return R&&(this.forcedGridCols=parseInt(R,10)),e}parseCustomItems(e){try{this.customItems=JSON.parse(e)}catch(t){console.error("Failed to parse custom-items:",t),this.customItems=null}}updateTheme(e){const t=this.shadowRoot.querySelector(".scanner-wrapper");t&&(t.className="scanner-wrapper",e&&t.classList.add(e))}renderTemplate(){const e=this.getAttribute("scan-mode")==="color-code",t=this.getAttribute("scan-pattern")==="elimination";this.shadowRoot.innerHTML=`
      <div class="scanner-wrapper">
        <div class="status-bar">
          <span class="output-text"></span>
          <button class="settings-btn" title="Settings">⚙️</button>
        </div>
        <div class="grid-container"></div>
        <div class="controls">
           <button data-action="select">${e||t?"Blue (1)":"Select (Space)"}</button>
           <button data-action="step">${e?"Red (2)":t?"Switch 2 (2)":"Step (2)"}</button>
           <button data-action="reset">Reset (3)</button>
        </div>
        <div class="settings-overlay hidden"></div>
      </div>
    `}setupStyles(){const e=document.createElement("style");e.textContent=`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 400px;
        position: relative;
        font-family: sans-serif;
        border: 1px solid #ddd;
        box-sizing: border-box;
      }
      :host(:focus) {
        outline: 2px solid #2196F3;
      }

      .scanner-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        background: #fff;
      }

      .status-bar {
        background: #222;
        color: white;
        padding: 0.5rem 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: 40px;
      }

      .output-text {
        font-family: monospace;
        font-size: 1.2rem;
        white-space: pre-wrap;
      }

      .settings-btn {
        background: transparent;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
      }

      .grid-container {
        flex: 1;
        padding: 10px;
        display: grid;
        grid-gap: 5px;
        overflow: auto;
        position: relative; /* For absolute overlays */
      }

      .grid-cell {
        background: #f0f0f0;
        color: #333;
        border: 1px solid #ccc;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        user-select: none;
        min-height: 50px;
        overflow: hidden;
      }

      .scan-focus {
        outline: var(--focus-border-width, 4px) solid var(--focus-color, #FF9800);
        outline-offset: calc(var(--focus-border-width, 4px) * -1);
        transform: scale(var(--focus-scale, 1.0));
        opacity: var(--focus-opacity, 1.0);
        transition: transform 0.2s ease-out, opacity 0.2s ease;
      }

      @keyframes pulse {
        0%, 100% {
          transform: scale(var(--focus-scale, 1.0));
          opacity: var(--focus-opacity, 1.0);
        }
        50% {
          transform: scale(calc(var(--focus-scale, 1.0) * 1.05));
          opacity: calc(var(--focus-opacity, 1.0) * 0.8);
        }
      }

      .scan-focus.animate-pulse {
        animation: pulse 1.5s ease-in-out infinite;
      }

      .dwell-active {
         background-image: linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1));
         outline: 2px dashed #ff9800;
         outline-offset: -2px;
      }

      .selected {
        background-color: #4CAF50 !important;
        color: white;
      }

      .controls {
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem;
        background: #f0f0f0;
        justify-content: center;
        border-top: 1px solid #ddd;
        flex-shrink: 0;
      }

      .controls button {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
        cursor: pointer;
        border: 1px solid #ccc;
        background: #fff;
        border-radius: 4px;
        min-height: 44px; /* Touch friendly */
      }

      .controls button:active {
        background: #ddd;
      }

      /* Image button styling */
      .controls button img {
        display: block;
        width: 100%;
        height: auto;
        user-select: none;
        -webkit-user-select: none;
        pointer-events: none;
      }

      .settings-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
        padding: 10px;
        box-sizing: border-box;
      }
      .settings-overlay.hidden {
        display: none !important;
      }
      .settings-content {
        background: white;
        border-radius: 12px;
        width: 100%;
        max-width: 600px;
        max-height: 100%;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      }

      /* Header with close button */
      .settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #e0e0e0;
        position: sticky;
        top: 0;
        background: white;
        z-index: 10;
      }
      .settings-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #222;
      }
      .close-btn {
        background: #f5f5f5;
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        transition: all 0.2s;
        flex-shrink: 0;
      }
      .close-btn:hover {
        background: #e0e0e0;
        color: #333;
      }
      .close-btn:active {
        transform: scale(0.95);
      }

      /* Intro section */
      .settings-intro {
        padding: 1rem 1.5rem;
        background: #f8f9fa;
        border-bottom: 1px solid #e0e0e0;
      }
      .settings-intro p {
        margin: 0;
        font-size: 0.9rem;
        color: #555;
        line-height: 1.5;
      }

      /* Form sections */
      .settings-section {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #f0f0f0;
      }
      .settings-section:last-child {
        border-bottom: none;
      }
      .settings-section h3 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #333;
      }

      /* Form elements */
      .form-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }
      .form-group {
        flex: 1;
        min-width: 200px;
        margin-bottom: 0.75rem;
      }
      .form-group label {
        display: block;
        font-weight: 600;
        font-size: 0.85rem;
        color: #444;
        margin-bottom: 0.35rem;
      }
      .form-group label .value-display {
        color: #2196F3;
        font-weight: normal;
      }
      .form-group small {
        display: block;
        color: #888;
        font-size: 0.8rem;
        margin-top: 0.25rem;
        line-height: 1.3;
      }
      .form-group input[type="number"],
      .form-group select {
        width: 100%;
        padding: 0.6rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 0.95rem;
        box-sizing: border-box;
        background: white;
        transition: border-color 0.2s;
      }
      .form-group input[type="number"]:focus,
      .form-group select:focus {
        outline: none;
        border-color: #2196F3;
      }
      .form-group input:disabled,
      .form-group select:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Range inputs */
      .range-input {
        -webkit-appearance: none;
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: #ddd;
        outline: none;
        padding: 0;
        border: none;
      }
      .range-input::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #2196F3;
        cursor: pointer;
        transition: background 0.2s;
      }
      .range-input::-webkit-slider-thumb:hover {
        background: #1976D2;
      }
      .range-input::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #2196F3;
        cursor: pointer;
        border: none;
      }

      /* Checkbox group */
      .checkbox-group label {
        display: flex;
        align-items: center;
        cursor: pointer;
        font-weight: 500;
      }
      .checkbox-group input[type="checkbox"] {
        width: 20px;
        height: 20px;
        margin-right: 0.5rem;
        cursor: pointer;
      }
      .checkbox-group span {
        user-select: none;
      }

      /* Mobile responsive */
      @media (max-width: 600px) {
        .settings-content {
          max-height: 100vh;
          border-radius: 0;
        }
        .settings-header {
          padding: 1rem;
        }
        .settings-header h2 {
          font-size: 1.25rem;
        }
        .settings-section {
          padding: 1rem;
        }
        .form-group {
          min-width: 100%;
        }
        .form-row {
          flex-direction: column;
          gap: 0.75rem;
        }
        .close-btn {
          width: 32px;
          height: 32px;
          font-size: 20px;
        }
        .settings-intro p {
          font-size: 0.85rem;
        }
      }

      /* Sketch Theme */
      .scanner-wrapper.sketch {
          background-color: #fdfdfd;
          font-family: 'Patrick Hand', 'Comic Sans MS', cursive;
      }
      .scanner-wrapper.sketch .grid-cell {
          background: white;
          border: 2px solid #333;
          border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
          box-shadow: 2px 2px 5px rgba(0,0,0,0.05);
      }
      .scanner-wrapper.sketch .scan-focus {
          outline: none;
          box-shadow: 0 0 0 var(--focus-border-width, 4px) var(--focus-color, #FF9800);
          border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
          transform: scale(var(--focus-scale, 1.02));
          opacity: var(--focus-opacity, 1.0);
          transition: transform 0.1s, opacity 0.1s;
      }

      .scanner-wrapper.sketch .scan-focus.animate-pulse {
          animation: sketch-pulse 1.5s ease-in-out infinite;
      }

      @keyframes sketch-pulse {
        0%, 100% {
          transform: scale(var(--focus-scale, 1.02));
          opacity: var(--focus-opacity, 1.0);
        }
        50% {
          transform: scale(calc(var(--focus-scale, 1.02) * 1.05));
          opacity: calc(var(--focus-opacity, 1.0) * 0.8);
        }
      }
      .scanner-wrapper.sketch .controls {
          background: transparent;
          border-top: 2px dashed #ccc;
      }
      .scanner-wrapper.sketch .controls button {
          border: 2px solid #333;
          border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
          background: white;
          font-family: inherit;
          font-size: 1rem;
          padding: 5px 15px;
      }
      .scanner-wrapper.sketch .status-bar {
          background: #333;
          border-bottom: 2px solid #000;
          font-family: inherit;
      }
      /* Ensure images in cells fit well */
      .grid-cell img {
          display: block;
      }
    `,this.shadowRoot.appendChild(e)}updateControlsVisibility(e){const t=this.shadowRoot.querySelector(".controls");if(!t)return;const s=e.useImageButton;if(t.innerHTML="",e.scanPattern==="elimination"){const r=e.eliminationSwitchCount||4;for(let a=1;a<=r;a++){const c=this.createButton("switch-"+a,`${a}`,e,a);t.appendChild(c)}const o=this.createButton("reset","↺",e,5);o.style.flex="0 0 auto",t.appendChild(o);return}if(e.scanMode==="color-code"){const r=this.createButton("switch-1",s?"":"Blue (1)",e,1),o=this.createButton("switch-2",s?"":"Red (2)",e,2);t.appendChild(r),t.appendChild(o);const a=this.createButton("reset",s?"":"Reset (3)",e,3);a.style.flex="0 0 auto",t.appendChild(a);return}if(e.scanInputMode==="manual"){const r=this.createButton("step",s?"":"Step (2)",e,2);t.appendChild(r);const o=this.createButton("select",s?"":"Select (1)",e,1);t.appendChild(o);return}const i=this.createButton("select",s?"":"Select (1)",e,1);t.appendChild(i)}createButton(e,t,s,i){const r=document.createElement("button");r.setAttribute("data-action",e);const o=s.useImageButton;let a=s.buttonColor||"blue";i&&(a={1:"blue",2:"red",3:"green",4:"yellow",5:"blue",6:"green",7:"red",8:"yellow"}[i]||a);const c=s.customButtonImages;if(o&&(c!=null&&c.normal||c!=null&&c.pressed)){const h=this.getActionLabel(e);r.style.cssText=`
        flex: 1;
        padding: 10px;
        cursor: pointer;
        border: none;
        background: transparent;
        min-width: 80px;
        min-height: 100px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
      `,r.innerHTML=`
        <img src="${c.normal}" alt="${h}" style="width: 60px; height: 60px; max-width: 60px; transition: none;">
        <span style="font-size: 12px; font-weight: bold; color: #333; text-transform: uppercase;">${h}</span>
      `;const u=r.querySelector("img");r.addEventListener("mousedown",()=>{c.pressed&&(u.src=c.pressed)}),r.addEventListener("mouseup",()=>{u.src=c.normal}),r.addEventListener("mouseleave",()=>{u.src=c.normal})}else if(o){const h=V[a];r.style.cssText=`
        flex: 1;
        padding: 10px;
        cursor: pointer;
        border: none;
        background: transparent;
        min-width: 80px;
        min-height: 100px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
      `;const u=this.getActionLabel(e);r.innerHTML=`
        <img src="${h.normal}" alt="${u}" style="width: 60px; height: 60px; max-width: 60px;">
        <span style="font-size: 12px; font-weight: bold; color: #333; text-transform: uppercase;">${u}</span>
      `;const p=r.querySelector("img");r.addEventListener("mousedown",()=>{p.src=h.depressed}),r.addEventListener("mouseup",()=>{p.src=h.normal}),r.addEventListener("mouseleave",()=>{p.src=h.normal})}else r.textContent=t,r.style.cssText=`
        flex: 1;
        padding: 10px 20px;
        font-size: 1rem;
        cursor: pointer;
        border: 1px solid #ccc;
        background: ${i?this.getSwitchColor(i):"#fff"};
        color: ${i?"white":"#333"};
        border-radius: 4px;
        font-weight: ${i?"bold":"normal"};
        text-shadow: ${i?"0 1px 2px rgba(0,0,0,0.3)":"none"};
      `;return r.addEventListener("click",h=>{console.log("[SwitchScannerElement] Button clicked:",e),this.switchInput.triggerAction(e)}),r.addEventListener("mousedown",h=>h.preventDefault()),r}getSwitchColor(e){return{1:"#2196F3",2:"#F44336",3:"#4CAF50",4:"#FFEB3B",5:"#9C27B0",6:"#FF9800",7:"#00BCD4",8:"#E91E63"}[e]||"#2196F3"}getActionLabel(e){const t={select:"Choose",step:"Move",reset:"Reset",cancel:"Cancel"};return e.startsWith("switch-")?`Switch ${e.replace("switch-","")}`:t[e]||e}bindEvents(){var s;let e=this.configManager.get();this.configManager.subscribe(async i=>{this.audioManager.setEnabled(i.soundEnabled);const r=i.gridContent!==e.gridContent||i.gridSize!==e.gridSize||i.language!==e.language||i.layoutMode!==e.layoutMode,o=i.scanPattern!==e.scanPattern||i.scanTechnique!==e.scanTechnique||i.scanMode!==e.scanMode;o&&console.log("[SwitchScannerElement] Scanner changed:",{old:{scanMode:e.scanMode,scanPattern:e.scanPattern},new:{scanMode:i.scanMode,scanPattern:i.scanPattern}});const a=i.viewMode!==e.viewMode||i.heatmapMax!==e.heatmapMax;r?await this.updateGrid(i,!0):o?(this.setScanner(i),await this.updateGrid(i,!0)):a&&await this.updateGrid(i,!1),e=i}),this.switchInput.addEventListener("switch",i=>{const r=i.detail;if(r.action==="menu"){this.settingsUI.toggle();return}this.currentScanner&&this.currentScanner.handleAction(r.action)}),(s=this.shadowRoot.querySelector(".settings-btn"))==null||s.addEventListener("click",()=>{this.settingsUI.toggle()}),this.shadowRoot.querySelectorAll(".controls button").forEach(i=>{i.addEventListener("click",r=>{const o=r.target.getAttribute("data-action");o&&this.switchInput.triggerAction(o)}),i.addEventListener("mousedown",r=>r.preventDefault())}),this.updateControlsVisibility(this.configManager.get()),this.configManager.subscribe(i=>{this.updateControlsVisibility(i),this.gridRenderer.updateHighlightStyles(i)});const t=this.shadowRoot.querySelector(".grid-container");t.addEventListener("scanner:selection",i=>{const o=i.detail.item,a=this.shadowRoot.querySelector(".output-text");if(a){const c=o.label,h=a.textContent||"";if(c==="Undo"){this.outputHistory.length>0&&(this.redoStack.push(h),a.textContent=this.outputHistory.pop()||"");return}if(c==="Redo"){this.redoStack.length>0&&(this.outputHistory.push(h),a.textContent=this.redoStack.pop()||"");return}this.outputHistory.push(h),this.redoStack=[],c==="Backspace"?a.textContent=h.slice(0,-1):c==="Clear"?a.textContent="":c==="Enter"?a.textContent=h+`
`:c==="Space"?a.textContent=h+" ":a.textContent=h+c}}),t.addEventListener("scanner:redraw",()=>{const i=this.configManager.get();this.updateGrid(i,!1)}),t.addEventListener("mousemove",i=>{const r=i.target.closest(".grid-cell");this.handleDwell(r)}),t.addEventListener("mouseleave",()=>{this.handleDwell(null)})}handleDwell(e){if(this.currentDwellTarget===e)return;this.dwellTimer&&(window.clearTimeout(this.dwellTimer),this.dwellTimer=null),this.currentDwellTarget&&this.currentDwellTarget.classList.remove("dwell-active"),this.currentDwellTarget=e;const t=this.configManager.get();e&&t.dwellTime>0&&(e.classList.add("dwell-active"),this.dwellTimer=window.setTimeout(()=>{this.currentDwellTarget===e&&(this.triggerItemSelection(e),e.classList.remove("dwell-active"),this.currentDwellTarget=null)},t.dwellTime))}triggerItemSelection(e){const t=parseInt(e.dataset.index||"-1",10);if(t>=0){this.gridRenderer.setSelected(t);const s=this.gridRenderer.getItem(t);if(s){const i=new CustomEvent("scanner:selection",{bubbles:!0,composed:!0,detail:{item:s}});this.gridRenderer.getContainer().dispatchEvent(i),this.audioManager&&this.audioManager.playSelectSound()}}}generateNumbers(e){const t=[];for(let s=1;s<=e;s++)t.push({id:`item-${s}`,label:s.toString(),type:"action"});return t}async generateKeyboard(e){await this.alphabetManager.loadLanguage(e.language);const s=this.alphabetManager.getCharacters(e.layoutMode).map((i,r)=>({id:`char-${r}`,label:i,type:"char"}));return[" ",".",",","?","!","Backspace","Clear","Enter"].forEach((i,r)=>{s.push({id:`ctrl-${r}`,label:i===" "?"Space":i,type:"action"})}),s}getHeatmapColor(e,t){return`hsl(${120*(1-Math.min(e/t,1))}, 80%, 80%)`}applyVisualization(e,t){return!this.currentScanner||t.viewMode==="standard"?e:e.map((s,i)=>{if(!s)return s;const r=this.currentScanner.getCost(i),o={...s};return t.viewMode==="cost-numbers"?o.label=r.toString():t.viewMode==="cost-heatmap"&&(o.backgroundColor=this.getHeatmapColor(r,t.heatmapMax),o.textColor="#000"),o})}async updateGrid(e,t=!1){t&&(this.customItems&&this.customItems.length>0?this.baseItems=this.customItems:e.gridContent==="keyboard"?this.baseItems=await this.generateKeyboard(e):this.baseItems=this.generateNumbers(e.gridSize));const s=this.baseItems.length;let i=Math.ceil(Math.sqrt(s));this.forcedGridCols&&this.forcedGridCols>0&&(i=this.forcedGridCols);const r=Math.ceil(s/i);let o=this.baseItems;if(this.currentScanner&&(o=this.currentScanner.mapContentToGrid(this.baseItems,r,i)),this.gridRenderer.render(o,i),e.viewMode!=="standard"&&this.currentScanner){const a=this.applyVisualization(o,e);this.gridRenderer.render(a,i)}}createScanner(e){if(console.log("[SwitchScannerElement] Creating scanner with config:",{scanMode:e.scanMode,scanPattern:e.scanPattern,scanTechnique:e.scanTechnique,continuousTechnique:e.continuousTechnique}),e.scanMode==="cause-effect")return new Y(this.gridRenderer,this.configManager,this.audioManager);if(e.scanMode==="group-row-column")return new W(this.gridRenderer,this.configManager,this.audioManager);if(e.scanMode==="continuous")return console.log("[SwitchScannerElement] Creating ContinuousScanner"),new Q(this.gridRenderer,this.configManager,this.audioManager);if(e.scanMode==="probability")return new _(this.gridRenderer,this.configManager,this.audioManager);if(e.scanMode==="color-code")return new j(this.gridRenderer,this.configManager,this.audioManager);switch(e.scanPattern){case"linear":return new X(this.gridRenderer,this.configManager,this.audioManager);case"snake":return new N(this.gridRenderer,this.configManager,this.audioManager);case"quadrant":return new G(this.gridRenderer,this.configManager,this.audioManager);case"elimination":return new Z(this.gridRenderer,this.configManager,this.audioManager);case"column-row":return new P(this.gridRenderer,this.configManager,this.audioManager);case"row-column":default:return new P(this.gridRenderer,this.configManager,this.audioManager)}}setScanner(e){console.log("[SwitchScannerElement] setScanner called"),this.currentScanner&&(console.log("[SwitchScannerElement] Stopping current scanner"),this.currentScanner.stop()),this.currentScanner=this.createScanner(e),this.gridRenderer.updateHighlightStyles(e),console.log("[SwitchScannerElement] Starting new scanner:",this.currentScanner.constructor.name),this.currentScanner.start()}}customElements.get("switch-scanner")||customElements.define("switch-scanner",K);
