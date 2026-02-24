var H=Object.defineProperty;var z=(s,e,t)=>e in s?H(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var d=(s,e,t)=>z(s,typeof e!="symbol"?e+"":e,t);import{g as N,l as W,c as G,a as X,b as U}from"./chunks/vendor-BxuKZLiO.js";const y=class y{constructor(e,t=!0){d(this,"config");d(this,"listeners",[]);this.config={...y.DEFAULTS,...e},t&&this.loadFromUrl()}loadFromUrl(){const e=new URLSearchParams(window.location.search);if(e.has("ui")&&e.get("ui")==="hidden"&&(this.config.showUI=!1),e.has("rate")){const t=parseInt(e.get("rate"),10);isNaN(t)||(this.config.scanRate=t)}if(e.has("dwell")){const t=parseInt(e.get("dwell"),10);isNaN(t)||(this.config.dwellTime=t)}if(e.has("strategy")){const t=e.get("strategy");t==="group-row-column"?this.config.scanMode="group-row-column":t==="continuous"?this.config.scanMode="continuous":t==="probability"?this.config.scanMode="probability":["row-column","column-row","linear","snake","quadrant","elimination"].includes(t)&&(this.config.scanPattern=t)}if(e.has("pattern")){const t=e.get("pattern");["row-column","column-row","linear","snake","quadrant","elimination"].includes(t)&&(this.config.scanPattern=t,this.config.scanMode=null)}if(e.has("technique")){const t=e.get("technique");(t==="block"||t==="point")&&(this.config.scanTechnique=t)}if(e.has("mode")){const t=e.get("mode");t==="group-row-column"||t==="continuous"||t==="probability"||t==="cause-effect"?this.config.scanMode=t:(t==="null"||t==="none"||t==="")&&(this.config.scanMode=null)}if(e.has("continuous-technique")){const t=e.get("continuous-technique");(t==="gliding"||t==="crosshair")&&(this.config.continuousTechnique=t)}if(e.has("content")&&e.get("content")==="keyboard"&&(this.config.gridContent="keyboard"),e.has("lang")&&(this.config.language=e.get("lang")),e.has("layout")){const t=e.get("layout");(t==="alphabetical"||t==="frequency")&&(this.config.layoutMode=t)}if(e.has("view")){const t=e.get("view");(t==="standard"||t==="cost-numbers"||t==="cost-heatmap")&&(this.config.viewMode=t)}if(e.has("heatmax")){const t=parseInt(e.get("heatmax"),10);isNaN(t)||(this.config.heatmapMax=t)}}get(){return{...this.config}}update(e){this.config={...this.config,...e},this.notify()}subscribe(e){this.listeners.push(e),e(this.config)}notify(){this.listeners.forEach(e=>e(this.config))}};d(y,"DEFAULTS",{scanRate:1e3,acceptanceTime:0,dwellTime:0,postSelectionDelay:0,initialScanDelay:500,initialItemPause:0,scanPauseDelay:300,scanLoops:4,scanInputMode:"auto",autoRepeat:!1,repeatDelay:500,repeatTime:200,scanDirection:"circular",scanPattern:"row-column",scanTechnique:"block",scanMode:null,continuousTechnique:"crosshair",compassMode:"continuous",eliminationSwitchCount:4,allowEmptyItems:!1,cancelMethod:"button",longHoldTime:1e3,criticalOverscan:{enabled:!1,fastRate:100,slowRate:1e3},colorCode:{errorRate:.1,selectThreshold:.95},gridContent:"numbers",gridSize:64,showUI:!0,soundEnabled:!1,useImageButton:!0,buttonColor:"blue",customButtonImages:{normal:void 0,pressed:void 0},language:"en",layoutMode:"alphabetical",viewMode:"standard",heatmapMax:20,highlightBorderWidth:4,highlightBorderColor:"#FF9800",highlightScale:1,highlightOpacity:1,highlightAnimation:!1,highlightScanLine:!1});let k=y;class _{constructor(e=!0){d(this,"ctx",null);d(this,"enabled",!0);this.enabled=e}setEnabled(e){this.enabled=e}initCtx(){this.ctx||(this.ctx=new(window.AudioContext||window.webkitAudioContext))}playBeep(e=440,t=.1,i="sine"){if(!this.enabled||(this.initCtx(),!this.ctx))return;this.ctx.state==="suspended"&&this.ctx.resume();const a=this.ctx.createOscillator(),n=this.ctx.createGain();a.type=i,a.frequency.setValueAtTime(e,this.ctx.currentTime),n.gain.setValueAtTime(.1,this.ctx.currentTime),n.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+t),a.connect(n),n.connect(this.ctx.destination),a.start(),a.stop(this.ctx.currentTime+t)}playScanSound(){this.playBeep(800,.05,"square")}playSelectSound(){this.playBeep(1200,.1,"sine")}playErrorSound(){this.playBeep(200,.3,"sawtooth")}}class Z extends EventTarget{constructor(t,i=window){super();d(this,"configManager");d(this,"keyMap");d(this,"activeTimers",new Map);d(this,"targetElement");this.configManager=t,this.targetElement=i,this.keyMap=new Map([[" ","select"],["Enter","select"],["1","switch-1"],["2","switch-2"],["3","switch-3"],["4","switch-4"],["5","switch-5"],["6","switch-6"],["7","switch-7"],["8","switch-8"],["r","reset"],["R","reset"],["c","cancel"],["C","cancel"],["s","menu"],["S","menu"]]),this.bindEvents()}isIgnoredEvent(t){const i=t.composedPath?t.composedPath():[];for(const n of i)if(n instanceof HTMLElement&&(n.classList.contains("settings-overlay")||n.id==="settings-overlay"||n.classList.contains("settings-btn")||n.classList.contains("controls")))return!0;const a=t.target;return!!(a&&typeof a.closest=="function"&&(a.closest(".settings-overlay")||a.closest("#settings-overlay")||a.closest(".settings-btn")||a.closest(".controls")))}bindEvents(){this.targetElement.addEventListener("keydown",this.handleKeyDown.bind(this)),this.targetElement.addEventListener("keyup",this.handleKeyUp.bind(this)),this.targetElement.addEventListener("mousedown",t=>{this.isIgnoredEvent(t)||this.handleSwitchDown("select")}),this.targetElement.addEventListener("mouseup",t=>{this.isIgnoredEvent(t)||this.handleSwitchUp("select")}),this.targetElement.addEventListener("touchstart",t=>{if(this.isIgnoredEvent(t))return;t.preventDefault(),this.handleSwitchDown("select")}),this.targetElement.addEventListener("touchend",t=>{this.isIgnoredEvent(t)||this.handleSwitchUp("select")})}handleKeyDown(t){if(!t.repeat&&this.keyMap.has(t.key)){const i=this.keyMap.get(t.key);(i==="select"||i==="step")&&t.preventDefault(),this.handleSwitchDown(i)}}handleKeyUp(t){if(this.keyMap.has(t.key)){const i=this.keyMap.get(t.key);this.handleSwitchUp(i)}}handleSwitchDown(t){const i=this.configManager.get(),a=i.acceptanceTime,n=i.longHoldTime,o=i.cancelMethod;if(o==="long-hold"&&n>0){const r=window.setTimeout(()=>{this.triggerAction("cancel"),this.activeTimers.has(t)&&(clearTimeout(this.activeTimers.get(t)),this.activeTimers.delete(t)),this.activeTimers.set(`${t}_handled`,-1)},n);this.activeTimers.set(`${t}_longhold`,r)}if(a>0){const r=window.setTimeout(()=>{this.activeTimers.has(`${t}_handled`)||(this.triggerAction(t),this.activeTimers.delete(t),this.activeTimers.has(`${t}_longhold`)&&(clearTimeout(this.activeTimers.get(`${t}_longhold`)),this.activeTimers.delete(`${t}_longhold`)))},a);this.activeTimers.set(t,r)}else if(o==="long-hold"&&n>0){const r=window.setTimeout(()=>{this.activeTimers.has(`${t}_handled`)||(this.triggerAction(t),this.activeTimers.delete(t))},n+50);this.activeTimers.set(t,r)}else this.triggerAction(t)}handleSwitchUp(t){if(this.activeTimers.has(`${t}_longhold`)&&(clearTimeout(this.activeTimers.get(`${t}_longhold`)),this.activeTimers.delete(`${t}_longhold`)),this.activeTimers.has(`${t}_handled`)){this.activeTimers.delete(`${t}_handled`);return}this.activeTimers.has(t)&&(clearTimeout(this.activeTimers.get(t)),this.activeTimers.delete(t),this.triggerAction(t))}triggerAction(t){const i=new CustomEvent("switch",{detail:{action:t}});this.dispatchEvent(i),console.log(`Switch Action: ${t}`)}}class Q{constructor(e){d(this,"container");d(this,"items",[]);d(this,"elements",[]);d(this,"columns",8);d(this,"highlightConfig",null);if(typeof e=="string"){const t=document.getElementById(e);if(!t)throw new Error(`Container ${e} not found`);this.container=t}else this.container=e}getContainer(){return this.container}updateHighlightStyles(e){this.highlightConfig=e;const t=e.highlightScanLine?0:e.highlightBorderWidth;this.container.style.setProperty("--focus-border-width",`${t}px`),this.container.style.setProperty("--focus-color",e.highlightBorderColor),this.container.style.setProperty("--focus-scale",e.highlightScale.toString()),this.container.style.setProperty("--focus-opacity",e.highlightOpacity.toString()),this.container.style.setProperty("--focus-animation",e.highlightAnimation?"pulse":"none"),this.container.style.setProperty("--scan-line-enabled",e.highlightScanLine?"1":"0");const i=e.scanPattern==="column-row"?"vertical":"horizontal";this.container.style.setProperty("--scan-line-orientation",i);const a=e.scanDirection==="reverse"?"reverse":"forward";this.container.style.setProperty("--scan-line-direction",a),e.scanRate&&this.container.style.setProperty("--scan-line-duration",`${e.scanRate}ms`)}render(e,t=8){this.items=e,this.columns=t,this.container.innerHTML="",this.elements=[],this.container.style.gridTemplateColumns=`repeat(${t}, 1fr)`,e.forEach((i,a)=>{const n=document.createElement("div");if(n.className="grid-cell",i.image){const o=document.createElement("img");if(o.src=i.image,o.alt=i.label,o.style.maxWidth="100%",o.style.maxHeight="100%",o.style.objectFit="contain",n.appendChild(o),i.label){const r=document.createElement("span");r.textContent=i.label,r.style.marginTop="5px",n.appendChild(r),n.style.flexDirection="column"}}else n.textContent=i.label;n.dataset.index=a.toString(),n.dataset.id=i.id,i.backgroundColor&&(n.style.backgroundColor=i.backgroundColor),i.textColor&&(n.style.color=i.textColor),this.container.appendChild(n),this.elements.push(n)})}setFocus(e,t,i){const a=t??this.highlightConfig??void 0;t&&this.updateHighlightStyles(t),this.elements.forEach(o=>{o.classList.remove("scan-focus"),o.classList.remove("animate-pulse"),o.classList.remove("scan-line-vertical"),o.classList.remove("scan-line-reverse"),o.classList.remove("scan-line-only"),o.style.removeProperty("--scan-line-duration"),o.style.removeProperty("--scan-line-delay")});const n=a!=null&&a.scanRate&&e.length>0?Math.max(100,Math.floor(a.scanRate/e.length)):void 0;e.forEach((o,r)=>{if(this.elements[o]){const c=this.elements[o];c.classList.add("scan-focus"),a!=null&&a.highlightAnimation&&c.classList.add("animate-pulse"),a!=null&&a.highlightScanLine&&(c.classList.add("scan-line-only"),(a==null?void 0:a.scanPattern)==="column-row"&&c.classList.add("scan-line-vertical"),(a==null?void 0:a.scanDirection)==="reverse"&&c.classList.add("scan-line-reverse"),n&&(c.style.setProperty("--scan-line-duration",`${n}ms`),c.style.setProperty("--scan-line-delay",`${r*n}ms`)))}})}setSelected(e){if(this.elements[e]){const t=this.elements[e];t.classList.add("selected"),setTimeout(()=>t.classList.remove("selected"),500)}}getElement(e){return this.elements[e]}getItem(e){return this.items[e]}getItemsCount(){return this.items.length}}class Y{constructor(e,t,i){d(this,"container");d(this,"formContainer");d(this,"configManager");d(this,"alphabetManager");d(this,"isVisible",!1);this.configManager=e,this.alphabetManager=t,this.container=i,this.container.querySelector(".settings-content")?this.formContainer=this.container.querySelector("#settings-form"):this.renderStructure(),this.initUI(),this.bindEvents(),this.configManager.get().showUI||this.container.classList.add("hidden")}renderStructure(){this.container.innerHTML=`
        <div class="settings-content">
          <div class="settings-header">
            <h2>Scanner Settings</h2>
            <button id="close-settings" class="close-btn" aria-label="Close settings">&times;</button>
          </div>
          <div id="settings-form"></div>
        </div>
      `,this.formContainer=this.container.querySelector("#settings-form")}initUI(){const e=this.configManager.get(),i=this.alphabetManager.getLanguages().map(r=>`<option value="${r.code}">${r.name}</option>`).join(""),a=`
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

        <div class="form-row" id="continuous-options" style="display: ${e.scanMode==="continuous"?"flex":"none"}">
          <div class="form-group">
            <label for="continuousTechnique">Continuous Technique</label>
            <select id="continuousTechnique" class="setting-input" name="continuousTechnique">
              <option value="gliding">Gliding Cursor</option>
              <option value="crosshair">Crosshair</option>
              <option value="eight-direction">Eight-Direction (Compass)</option>
            </select>
            <small>Gliding: Buffer zone | Crosshair: X-Y lines | Compass: 8-directional movement</small>
          </div>

          <div class="form-group" id="compass-mode-option" style="display: ${e.continuousTechnique==="eight-direction"?"block":"none"}">
            <label for="compassMode">Compass Mode</label>
            <select id="compassMode" class="setting-input" name="compassMode">
              <option value="continuous">Continuous (Fluid)</option>
              <option value="fixed-8">Fixed 8 Directions</option>
            </select>
            <small>Continuous: Smooth clock rotation | Fixed-8: 8 discrete directions</small>
          </div>
        </div>

      <div class="form-row" id="elimination-options" style="display: ${e.scanPattern==="elimination"?"flex":"none"}">
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

        <div class="form-row" id="pattern-options" style="display: ${e.scanMode?"none":"flex"}">
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
          <label for="scanRate">Scan Rate <span class="value-display">${e.scanRate}ms</span></label>
          <input type="range" id="scanRate" class="setting-input range-input" name="scanRate"
                 value="${e.scanRate}" min="100" max="5000" step="100">
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
              <option value="board">AAC Board</option>
            </select>
            <small>What to display in the grid</small>
          </div>

          <div class="form-group">
            <label for="gridSize">Grid Size <span class="value-display">${e.gridSize}</span></label>
            <input type="number" id="gridSize" class="setting-input" name="gridSize"
                   value="${e.gridSize}" min="4" max="100"
                   ${e.gridContent==="keyboard"||e.gridContent==="board"?"disabled":""}>
            <small>Number of items (disabled for keyboard/board mode)</small>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="language">Language</label>
            <select id="language" class="setting-input" name="language">
              ${i}
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
            <label for="initialScanDelay">Initial Scan Delay <span class="value-display">${e.initialScanDelay}ms</span></label>
            <input type="range" id="initialScanDelay" class="setting-input range-input" name="initialScanDelay"
                   value="${e.initialScanDelay}" min="0" max="2000" step="100">
            <small>Delay before first scan starts</small>
          </div>

          <div class="form-group">
            <label for="scanPauseDelay">Scan Pause Delay <span class="value-display">${e.scanPauseDelay}ms</span></label>
            <input type="range" id="scanPauseDelay" class="setting-input range-input" name="scanPauseDelay"
                   value="${e.scanPauseDelay}" min="0" max="1000" step="50">
            <small>Pause between hierarchical stages</small>
          </div>
        </div>

        <div class="form-group">
          <label for="initialItemPause">Initial Item Pause <span class="value-display">${e.initialItemPause}ms</span></label>
          <input type="range" id="initialItemPause" class="setting-input range-input" name="initialItemPause"
                 value="${e.initialItemPause}" min="0" max="3000" step="100">
          <small>Extended highlight on first item (0 = normal scan rate)</small>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="autoRepeat" ${e.autoRepeat?"checked":""}>
            <span>Auto-Repeat Selections</span>
          </label>
          <small>Automatically repeat selections when holding</small>
        </div>

        <div class="form-row" id="repeat-options" style="display: ${e.autoRepeat?"flex":"none"}">
          <div class="form-group">
            <label for="repeatDelay">Repeat Delay <span class="value-display">${e.repeatDelay}ms</span></label>
            <input type="range" id="repeatDelay" class="setting-input range-input" name="repeatDelay"
                   value="${e.repeatDelay}" min="100" max="2000" step="100">
            <small>Hold time before repeat starts</small>
          </div>

          <div class="form-group">
            <label for="repeatTime">Repeat Time <span class="value-display">${e.repeatTime}ms</span></label>
            <input type="range" id="repeatTime" class="setting-input range-input" name="repeatTime"
                   value="${e.repeatTime}" min="50" max="1000" step="50">
            <small>Time between successive repeats</small>
          </div>
        </div>

        <div class="form-group">
          <label for="acceptanceTime">Acceptance Time <span class="value-display">${e.acceptanceTime}ms</span></label>
          <input type="range" id="acceptanceTime" class="setting-input range-input" name="acceptanceTime"
                 value="${e.acceptanceTime}" min="0" max="2000" step="50">
          <small>How long to highlight selection before confirming (0 = instant)</small>
        </div>

        <div class="form-group">
          <label for="dwellTime">Dwell Time <span class="value-display">${e.dwellTime}ms</span></label>
          <input type="range" id="dwellTime" class="setting-input range-input" name="dwellTime"
                 value="${e.dwellTime}" min="0" max="5000" step="100">
          <small>Auto-select on hover (0 = off)</small>
        </div>

        <div class="form-group">
          <label for="scanLoops">Scan Loops <span class="value-display">${e.scanLoops}</span></label>
          <input type="range" id="scanLoops" class="setting-input range-input" name="scanLoops"
                 value="${e.scanLoops}" min="0" max="20" step="1">
          <small>Number of complete scan cycles (0 = infinite)</small>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="allowEmptyItems" ${e.allowEmptyItems?"checked":""}>
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

        <div class="form-group" id="longHoldOptions" style="display: ${e.cancelMethod==="long-hold"?"block":"none"}">
          <label for="longHoldTime">Long Hold Time <span class="value-display">${e.longHoldTime}ms</span></label>
          <input type="range" id="longHoldTime" class="setting-input range-input" name="longHoldTime"
                 value="${e.longHoldTime}" min="500" max="3000" step="100">
          <small>Hold duration to trigger cancel (500-3000ms)</small>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="criticalOverscanEnabled" ${e.criticalOverscan.enabled?"checked":""}>
            <span>Enable Critical Overscan</span>
          </label>
          <small>Two-stage scanning: fast scan → slow backward scan → select</small>
        </div>

        <div id="criticalOverscanOptions" style="display: ${e.criticalOverscan.enabled?"block":"none"}">
          <div class="form-group">
            <label for="criticalOverscanFastRate">Fast Scan Rate <span class="value-display">${e.criticalOverscan.fastRate}ms</span></label>
            <input type="range" id="criticalOverscanFastRate" class="setting-input range-input" name="criticalOverscanFastRate"
                   value="${e.criticalOverscan.fastRate}" min="50" max="500" step="10">
            <small>Speed of initial fast scan (50-500ms)</small>
          </div>

          <div class="form-group">
            <label for="criticalOverscanSlowRate">Slow Scan Rate <span class="value-display">${e.criticalOverscan.slowRate}ms</span></label>
            <input type="range" id="criticalOverscanSlowRate" class="setting-input range-input" name="criticalOverscanSlowRate"
                   value="${e.criticalOverscan.slowRate}" min="500" max="3000" step="100">
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
                   value="${e.heatmapMax}" min="1" max="100">
            <small>Max cost for heatmap color scale</small>
          </div>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="soundEnabled" ${e.soundEnabled?"checked":""}>
            <span>Sound Enabled</span>
          </label>
          <small>Play sounds when scanning and selecting</small>
        </div>

        <div class="form-group">
          <label for="highlightBorderWidth">Highlight Border Width <span class="value-display">${e.highlightBorderWidth}px</span></label>
          <input type="range" id="highlightBorderWidth" class="setting-input range-input" name="highlightBorderWidth"
                 value="${e.highlightBorderWidth}" min="0" max="10" step="1">
          <small>Thickness of highlight outline (0-10px)</small>
        </div>

        <div class="form-group">
          <label for="highlightBorderColor">Highlight Border Color</label>
          <input type="color" id="highlightBorderColor" class="setting-input" name="highlightBorderColor"
                 value="${e.highlightBorderColor}">
          <small>Color of highlight outline (orange by default)</small>
        </div>

        <div class="form-group">
          <label for="highlightScale">Highlight Scale <span class="value-display">${e.highlightScale}x</span></label>
          <input type="range" id="highlightScale" class="setting-input range-input" name="highlightScale"
                 value="${e.highlightScale}" min="1.0" max="1.5" step="0.05">
          <small>Size multiplier for highlighted items (1.0-1.5, 1.0 = no zoom)</small>
        </div>

        <div class="form-group">
          <label for="highlightOpacity">Highlight Opacity <span class="value-display">${e.highlightOpacity}</span></label>
          <input type="range" id="highlightOpacity" class="setting-input range-input" name="highlightOpacity"
                 value="${e.highlightOpacity}" min="0.3" max="1.0" step="0.05">
          <small>Opacity of highlighted items (0.3-1.0, 1.0 = fully opaque)</small>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="highlightAnimation" ${e.highlightAnimation?"checked":""}>
            <span>Highlight Animation</span>
          </label>
          <small>Enable pulse animation on highlighted items</small>
        </div>
      </div>
    `;this.formContainer.innerHTML=a;const n=(r,c)=>{const h=this.formContainer.querySelector(`[name="${r}"]`);h&&(h.value=c)};n("scanPattern",e.scanPattern),n("scanTechnique",e.scanTechnique),n("scanDirection",e.scanDirection),n("cancelMethod",e.cancelMethod),n("longHoldTime",e.longHoldTime.toString()),n("scanMode",e.scanMode||"null"),n("continuousTechnique",e.continuousTechnique),n("compassMode",e.compassMode),n("scanInputMode",e.scanInputMode),n("gridContent",e.gridContent),n("language",e.language),n("layoutMode",e.layoutMode),n("viewMode",e.viewMode),this.updateUIState(e);const o=this.formContainer.querySelector("#repeat-options");o&&(o.style.display=e.autoRepeat?"flex":"none")}updateUIState(e){const t=this.formContainer.querySelector('[name="scanTechnique"]'),i=this.formContainer.querySelector('[name="scanPattern"]'),a=this.formContainer.querySelector("#continuous-options"),n=this.formContainer.querySelector("#pattern-options"),o=this.formContainer.querySelector("#compass-mode-option");a&&(a.style.display=e.scanMode==="continuous"?"flex":"none"),o&&(o.style.display=e.continuousTechnique==="eight-direction"?"block":"none");const r=this.formContainer.querySelector("#elimination-options");r&&(r.style.display=e.scanPattern==="elimination"?"flex":"none"),n&&(n.style.display=e.scanMode?"none":"flex");const c=["row-column","column-row","linear","snake"],h=!e.scanMode&&c.includes(e.scanPattern);t&&(t.disabled=!h,t.style.opacity=h?"1":"0.5");const u=this.formContainer.querySelector("#techniqueHint");u&&t&&(h?u.textContent="For row/col/linear/snake patterns only":e.scanMode?u.textContent="Disabled by special mode":u.textContent="Not available for "+i.value)}bindEvents(){var e;(e=this.container.querySelector(".close-btn"))==null||e.addEventListener("click",()=>{this.toggle(!1)}),this.container.addEventListener("click",t=>{t.target===this.container&&this.toggle(!1)}),this.formContainer.addEventListener("change",t=>{const i=t.target;if(!i||!i.classList.contains("setting-input"))return;const a=i.getAttribute("name"),n={};switch(a){case"scanPattern":n.scanPattern=i.value,n.scanMode=null;break;case"scanTechnique":n.scanTechnique=i.value;break;case"scanDirection":n.scanDirection=i.value;break;case"scanMode":const o=i.value==="null"?null:i.value;n.scanMode=o;break;case"continuousTechnique":n.continuousTechnique=i.value;break;case"compassMode":n.compassMode=i.value;break;case"eliminationSwitchCount":n.eliminationSwitchCount=parseInt(i.value,10);break;case"gridContent":n.gridContent=i.value;const r=this.formContainer.querySelector('[name="gridSize"]');r&&(r.disabled=i.value==="keyboard");break;case"scanRate":n.scanRate=parseInt(i.value,10),this.updateValueDisplay("scanRate",i.value+"ms");break;case"acceptanceTime":n.acceptanceTime=parseInt(i.value,10),this.updateValueDisplay("acceptanceTime",i.value+"ms");break;case"dwellTime":n.dwellTime=parseInt(i.value,10),this.updateValueDisplay("dwellTime",i.value+"ms");break;case"allowEmptyItems":n.allowEmptyItems=i.checked;break;case"cancelMethod":n.cancelMethod=i.value;break;case"longHoldTime":n.longHoldTime=parseInt(i.value,10),this.updateValueDisplay("longHoldTime",i.value+"ms");break;case"gridSize":n.gridSize=parseInt(i.value,10),this.updateValueDisplay("gridSize",i.value);break;case"soundEnabled":n.soundEnabled=i.checked;break;case"language":n.language=i.value;break;case"layoutMode":n.layoutMode=i.value;break;case"viewMode":n.viewMode=i.value;break;case"heatmapMax":n.heatmapMax=parseInt(i.value,10);break;case"scanInputMode":n.scanInputMode=i.value;break;case"initialScanDelay":n.initialScanDelay=parseInt(i.value,10),this.updateValueDisplay("initialScanDelay",i.value+"ms");break;case"scanPauseDelay":n.scanPauseDelay=parseInt(i.value,10),this.updateValueDisplay("scanPauseDelay",i.value+"ms");break;case"initialItemPause":n.initialItemPause=parseInt(i.value,10),this.updateValueDisplay("initialItemPause",i.value+"ms");break;case"scanLoops":n.scanLoops=parseInt(i.value,10),this.updateValueDisplay("scanLoops",i.value==="0"?"Infinite":i.value);break;case"autoRepeat":n.autoRepeat=i.checked;break;case"repeatDelay":n.repeatDelay=parseInt(i.value,10),this.updateValueDisplay("repeatDelay",i.value+"ms");break;case"repeatTime":n.repeatTime=parseInt(i.value,10),this.updateValueDisplay("repeatTime",i.value+"ms");break;case"criticalOverscanEnabled":n.criticalOverscan={...this.configManager.get().criticalOverscan,enabled:i.checked};break;case"criticalOverscanFastRate":n.criticalOverscan={...this.configManager.get().criticalOverscan,fastRate:parseInt(i.value,10)},this.updateValueDisplay("criticalOverscanFastRate",i.value+"ms");break;case"criticalOverscanSlowRate":n.criticalOverscan={...this.configManager.get().criticalOverscan,slowRate:parseInt(i.value,10)},this.updateValueDisplay("criticalOverscanSlowRate",i.value+"ms");break;case"highlightBorderWidth":n.highlightBorderWidth=parseInt(i.value,10),this.updateValueDisplay("highlightBorderWidth",i.value+"px");break;case"highlightBorderColor":n.highlightBorderColor=i.value;break;case"highlightScale":n.highlightScale=parseFloat(i.value),this.updateValueDisplay("highlightScale",i.value+"x");break;case"highlightOpacity":n.highlightOpacity=parseFloat(i.value),this.updateValueDisplay("highlightOpacity",i.value);break;case"highlightAnimation":n.highlightAnimation=i.checked;break}if(this.configManager.update(n),(a==="scanPattern"||a==="scanMode"||a==="continuousTechnique"||a==="cancelMethod")&&this.updateUIState({...this.configManager.get(),...n}),a==="cancelMethod"){const o=this.formContainer.querySelector("#longHoldOptions");o&&(o.style.display=i.value==="long-hold"?"block":"none")}if(a==="autoRepeat"){const o=this.formContainer.querySelector("#repeat-options");o&&(o.style.display=i.checked?"flex":"none")}if(a==="criticalOverscanEnabled"){const o=this.formContainer.querySelector("#criticalOverscanOptions");o&&(o.style.display=i.checked?"block":"none")}}),this.formContainer.addEventListener("input",t=>{const i=t.target;if(!i||!i.classList.contains("range-input"))return;const a=i.getAttribute("name");a&&this.updateValueDisplay(a,i.value+"ms")})}updateValueDisplay(e,t){const i=this.formContainer.querySelector(`label[for="${e}"]`);if(i){const a=i.querySelector(".value-display");a&&(a.textContent=t)}}toggle(e){this.isVisible=e!==void 0?e:!this.isVisible,this.isVisible?this.container.classList.remove("hidden"):this.container.classList.add("hidden")}}class j{constructor(){d(this,"languages",[]);d(this,"initialized",!1);d(this,"currentAlphabet",null)}async init(){if(!this.initialized)try{const e=await N();console.log("AlphabetManager: Loaded Index Data",e);const t=new Intl.DisplayNames(["en"],{type:"language"});this.languages=e.filter(i=>!(i.scripts||[]).some(o=>["Hant","Hans","Jpan","Kore"].includes(o))).map(i=>{var o;let a=i["language-name"];const n=i.language;if(!a||a===n)try{const r=t.of(n);r&&r!==n?a=r:a=n}catch{a=n}return{code:n,name:a,script:(o=i.scripts)==null?void 0:o[0]}}).sort((i,a)=>(i.name||"").localeCompare(a.name||"")),this.initialized=!0}catch(e){console.error("Failed to load language index",e),this.languages=[{code:"en",name:"English",script:"Latn"}]}}getLanguages(){return this.languages}async loadLanguage(e,t){try{const i=await W(e,t);return this.currentAlphabet=i,i}catch(i){return console.error(`Failed to load alphabet for ${e}`,i),null}}getCharacters(e="alphabetical"){if(!this.currentAlphabet)return[];let t=[...this.currentAlphabet.uppercase];if(t.length===0&&(t=[...this.currentAlphabet.alphabetical]),e==="frequency"){const i=this.currentAlphabet.frequency||{};t.sort((a,n)=>{const o=a.toLowerCase(),r=n.toLowerCase(),c=i[o]||0;return(i[r]||0)-c})}return t}}var K=Object.defineProperty,J=(s,e,t)=>e in s?K(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t,l=(s,e,t)=>J(s,typeof e!="symbol"?e+"":e,t),m=class{constructor(s,e,t={}){l(this,"surface"),l(this,"config"),l(this,"callbacks"),l(this,"isRunning",!1),l(this,"timer",null),l(this,"stepCount",0),l(this,"overscanState","fast"),l(this,"loopCount",0),this.surface=s,this.config=e,this.callbacks=t}start(){this.isRunning=!0,this.stepCount=0,this.loopCount=0,this.overscanState="fast",this.reset(),this.scheduleNextStep()}stop(){this.isRunning=!1,this.timer&&(clearTimeout(this.timer),this.timer=null),this.surface.setFocus([])}handleAction(s){var e,t;s==="select"?this.handleSelectAction():s==="step"?this.config.get().scanInputMode==="manual"&&(this.step(),this.stepCount++,(t=(e=this.callbacks).onScanStep)==null||t.call(e)):s==="reset"&&(this.loopCount=0,this.reset(),this.stepCount=0,this.overscanState="fast",this.config.get().scanInputMode==="auto"&&(this.isRunning=!0,this.timer&&clearTimeout(this.timer),this.scheduleNextStep()))}handleSelectAction(){if(this.config.get().criticalOverscan.enabled){if(this.overscanState==="fast"){this.overscanState="slow_backward",this.timer&&clearTimeout(this.timer),this.scheduleNextStep();return}else if(this.overscanState==="slow_backward"){this.overscanState="fast",this.doSelection();return}}this.doSelection()}reportCycleCompleted(){this.loopCount++;const s=this.config.get();s.scanLoops>0&&this.loopCount>=s.scanLoops&&(this.stop(),this.loopCount=0)}scheduleNextStep(){if(!this.isRunning)return;const s=this.config.get();if(s.scanInputMode==="manual")return;let e;s.criticalOverscan.enabled&&this.overscanState==="slow_backward"?e=s.criticalOverscan.slowRate:e=this.stepCount===0&&s.initialItemPause>0?s.initialItemPause:s.criticalOverscan.enabled?s.criticalOverscan.fastRate:s.scanRate,this.timer&&clearTimeout(this.timer),this.timer=window.setTimeout(()=>{var t,i;this.step(),(i=(t=this.callbacks).onScanStep)==null||i.call(t),this.stepCount++,this.scheduleNextStep()},e)}triggerSelection(s){var t,i,a,n;const e=(i=(t=this.surface).getItemData)==null?void 0:i.call(t,s);if(e!=null&&e.isEmpty){this.stepCount=0,this.timer&&clearTimeout(this.timer),this.scheduleNextStep();return}this.surface.setSelected(s),(n=(a=this.callbacks).onSelect)==null||n.call(a,s)}triggerRedraw(){var s,e;(e=(s=this.callbacks).onRedraw)==null||e.call(s)}mapContentToGrid(s,e,t){return s}},F=class extends m{constructor(){super(...arguments),l(this,"level","rows"),l(this,"currentRow",-1),l(this,"currentCol",-1),l(this,"totalRows",0),l(this,"isColumnRow",!1),l(this,"useBlockScanning",!0)}start(){const s=this.config.get();this.isColumnRow=s.scanPattern==="column-row",this.useBlockScanning=s.scanTechnique==="block",this.recalcDimensions(),super.start()}recalcDimensions(){const s=this.surface.getItemsCount();this.isColumnRow?this.totalRows=this.surface.getColumns():this.totalRows=Math.ceil(s/this.surface.getColumns())}reset(){this.level=this.useBlockScanning?"rows":"cells",this.currentRow=-1,this.currentCol=-1,this.surface.setFocus([])}step(){this.useBlockScanning&&this.level==="rows"?this.stepMajor():this.stepMinor()}stepMajor(){this.currentRow++,this.currentRow>=this.totalRows&&(this.currentRow=0),this.highlightMajor(this.currentRow)}stepMinor(){let s=0;const e=this.surface.getItemsCount(),t=this.surface.getColumns(),i=Math.ceil(e/t);if(this.useBlockScanning){if(this.isColumnRow){const n=this.currentRow,o=e%t||t;n<o?s=i:s=i-1}else{const n=this.currentRow*t;s=Math.min(t,e-n)}this.currentCol++,this.currentCol>=s&&(this.currentCol=0)}else this.currentCol++,this.currentCol>=e&&(this.currentCol=0);let a=-1;if(this.useBlockScanning)this.isColumnRow?a=this.currentCol*t+this.currentRow:a=this.currentRow*t+this.currentCol;else if(this.isColumnRow){const n=Math.floor(this.currentCol/t),o=this.currentCol%t;a=n*t+o}else a=this.currentCol;if(a>=0&&a<e){const n=this.config.get();this.surface.setFocus([a],{phase:this.useBlockScanning?"minor":"item",scanRate:n.scanRate,scanPattern:n.scanPattern,scanTechnique:n.scanTechnique,scanDirection:n.scanDirection})}}highlightMajor(s){const e=this.surface.getColumns(),t=this.surface.getItemsCount(),i=[];if(this.isColumnRow){const n=Math.ceil(t/e);for(let o=0;o<n;o++){const r=o*e+s;r<t&&i.push(r)}}else{const n=s*e,o=Math.min(n+e,t);for(let r=n;r<o;r++)i.push(r)}const a=this.config.get();this.surface.setFocus(i,{phase:"major",scanRate:a.scanRate,scanPattern:a.scanPattern,scanTechnique:a.scanTechnique,scanDirection:a.scanDirection})}handleAction(s){s==="cancel"?this.useBlockScanning&&this.level==="cells"?(this.level="rows",this.currentCol=-1,this.highlightMajor(this.currentRow),this.timer&&clearTimeout(this.timer),this.scheduleNextStep()):this.reset():super.handleAction(s)}doSelection(){if(this.useBlockScanning&&this.level==="rows")this.currentRow>=0&&(this.level="cells",this.currentCol=-1,this.surface.setSelected(-1),this.timer&&clearTimeout(this.timer),this.scheduleNextStep());else{let s=-1;const e=this.surface.getColumns();if(this.useBlockScanning)this.isColumnRow?s=this.currentCol*e+this.currentRow:s=this.currentRow*e+this.currentCol;else if(this.isColumnRow){const t=Math.floor(this.currentCol/e),i=this.currentCol%e;s=t*e+i}else s=this.currentCol;s>=0&&(this.triggerSelection(s),this.reset(),this.timer&&clearTimeout(this.timer),this.scheduleNextStep())}}getCost(s){const e=this.surface.getColumns(),t=Math.floor(s/e),i=s%e;return this.useBlockScanning?this.isColumnRow?i+1+(t+1):t+1+(i+1):this.isColumnRow?i+1+t+1:s+1}mapContentToGrid(s,e,t){if(this.config.get().scanPattern!=="column-row")return s;const i=new Array(s.length);let a=0;for(let n=0;n<t;n++)for(let o=0;o<e&&!(a>=s.length);o++){const r=o*t+n;r<i.length&&(i[r]=s[a++])}return i}},V=class extends m{constructor(){super(...arguments),l(this,"currentIndex",-1),l(this,"totalItems",0),l(this,"direction",1)}start(){this.totalItems=this.countItems(),this.direction=1,super.start()}countItems(){return this.surface.getItemsCount()}reset(){this.currentIndex=-1,this.direction=1,this.loopCount=0,this.surface.setFocus([])}step(){const s=this.config.get();if(s.criticalOverscan.enabled&&this.overscanState==="slow_backward"){this.currentIndex--,this.currentIndex<0&&(this.currentIndex=this.totalItems-1,this.reportCycleCompleted());const t=this.config.get();this.surface.setFocus([this.currentIndex],{phase:"item",scanRate:t.scanRate,scanPattern:t.scanPattern,scanTechnique:t.scanTechnique,scanDirection:t.scanDirection});return}switch(s.scanDirection){case"circular":this.currentIndex++,this.currentIndex>=this.totalItems&&(this.currentIndex=0,this.reportCycleCompleted());break;case"reverse":this.currentIndex--,this.currentIndex<0&&(this.currentIndex=this.totalItems-1,this.reportCycleCompleted());break;case"oscillating":this.currentIndex>=this.totalItems-1&&this.direction===1?(this.direction=-1,this.reportCycleCompleted()):this.currentIndex<=0&&this.direction===-1&&(this.direction=1,this.reportCycleCompleted()),this.currentIndex+=this.direction;break}const e=this.config.get();this.surface.setFocus([this.currentIndex],{phase:"item",scanRate:e.scanRate,scanPattern:e.scanPattern,scanTechnique:e.scanTechnique,scanDirection:e.scanDirection})}handleAction(s){var e,t;s==="step"?(this.timer&&clearTimeout(this.timer),this.step(),(t=(e=this.callbacks).onScanStep)==null||t.call(e),this.scheduleNextStep()):super.handleAction(s)}doSelection(){this.currentIndex>=0&&this.currentIndex>=0&&(this.triggerSelection(this.currentIndex),this.reset(),this.timer&&clearTimeout(this.timer),this.scheduleNextStep())}getCost(s){switch(this.config.get().scanDirection){case"circular":return s+1;case"reverse":return this.totalItems-s;case"oscillating":return s+1;default:return s+1}}},tt=class extends m{constructor(){super(...arguments),l(this,"currentRow",0),l(this,"currentCol",0),l(this,"direction",1),l(this,"maxRow",0),l(this,"maxCol",0)}start(){this.updateDimensions(),super.start()}updateDimensions(){const s=this.surface.getItemsCount();this.maxCol=this.surface.getColumns(),this.maxRow=Math.ceil(s/this.maxCol)}reset(){this.currentRow=0,this.currentCol=0,this.direction=1;const s=this.config.get();this.surface.setFocus([0],{phase:"item",scanRate:s.scanRate,scanPattern:s.scanPattern,scanTechnique:s.scanTechnique,scanDirection:s.scanDirection})}step(){this.currentCol+=this.direction,this.currentCol>=this.maxCol?(this.currentCol=this.maxCol-1,this.currentRow++,this.direction=-1):this.currentCol<0&&(this.currentCol=0,this.currentRow++,this.direction=1),this.currentRow>=this.maxRow&&(this.currentRow=0,this.currentCol=0,this.direction=1);const s=this.currentRow*this.maxCol+this.currentCol;if(s>=this.surface.getItemsCount()){this.reset();return}const e=this.config.get();this.surface.setFocus([s],{phase:"item",scanRate:e.scanRate,scanPattern:e.scanPattern,scanTechnique:e.scanTechnique,scanDirection:e.scanDirection})}handleAction(s){s!=="select"?super.handleAction(s):super.handleAction(s)}doSelection(){const s=this.currentRow*this.maxCol+this.currentCol;s>=0&&(this.triggerSelection(s),this.reset(),this.timer&&clearTimeout(this.timer),this.scheduleNextStep())}getCost(s){return s}mapContentToGrid(s,e,t){const i=new Array(s.length);let a=0,n=0,o=1;for(let r=0;r<s.length;r++){const c=a*t+n;if(c<i.length&&(i[c]=s[r]),n+=o,n>=t?(n=t-1,a++,o=-1):n<0&&(n=0,a++,o=1),a>=e)break}return i}},et=class extends m{constructor(){super(...arguments),l(this,"level","quadrant"),l(this,"currentQuad",-1),l(this,"currentRow",-1),l(this,"currentCol",-1),l(this,"quads",[])}start(){this.calcQuadrants(),super.start()}calcQuadrants(){const s=this.surface.getItemsCount(),e=this.surface.getColumns(),t=Math.ceil(s/e),i=Math.ceil(t/2),a=Math.ceil(e/2);this.quads=[{rowStart:0,rowEnd:i,colStart:0,colEnd:a},{rowStart:0,rowEnd:i,colStart:a,colEnd:e},{rowStart:i,rowEnd:t,colStart:0,colEnd:a},{rowStart:i,rowEnd:t,colStart:a,colEnd:e}]}reset(){this.level="quadrant",this.currentQuad=-1,this.currentRow=-1,this.currentCol=-1,this.surface.setFocus([])}step(){this.level==="quadrant"?this.stepQuadrant():this.level==="row"?this.stepRow():this.stepCell()}stepQuadrant(){this.currentQuad++,this.currentQuad>=4&&(this.currentQuad=0),this.highlightQuad(this.currentQuad)}stepRow(){const s=this.quads[this.currentQuad],e=s.rowEnd-s.rowStart;this.currentRow++,this.currentRow>=e&&(this.currentRow=0);const t=s.rowStart+this.currentRow;this.highlightRowSegment(t,s.colStart,s.colEnd)}stepCell(){const s=this.quads[this.currentQuad],e=s.colEnd-s.colStart;this.currentCol++,this.currentCol>=e&&(this.currentCol=0);const t=s.rowStart+this.currentRow,i=s.colStart+this.currentCol,a=t*this.surface.getColumns()+i;if(a<this.surface.getItemsCount()){const n=this.config.get();this.surface.setFocus([a],{phase:"item",scanRate:n.scanRate,scanPattern:n.scanPattern,scanTechnique:n.scanTechnique,scanDirection:n.scanDirection})}else this.stepCell()}highlightQuad(s){const e=this.quads[s],t=[],i=this.surface.getColumns(),a=this.surface.getItemsCount();for(let o=e.rowStart;o<e.rowEnd;o++)for(let r=e.colStart;r<e.colEnd;r++){const c=o*i+r;c<a&&t.push(c)}const n=this.config.get();this.surface.setFocus(t,{phase:"major",scanRate:n.scanRate,scanPattern:n.scanPattern,scanTechnique:n.scanTechnique,scanDirection:n.scanDirection})}highlightRowSegment(s,e,t){const i=[],a=this.surface.getColumns(),n=this.surface.getItemsCount();for(let r=e;r<t;r++){const c=s*a+r;c<n&&i.push(c)}const o=this.config.get();this.surface.setFocus(i,{phase:"minor",scanRate:o.scanRate,scanPattern:o.scanPattern,scanTechnique:o.scanTechnique,scanDirection:o.scanDirection})}handleAction(s){s==="cancel"?this.level==="cell"?(this.level="row",this.currentCol=-1,this.restartTimer()):this.level==="row"?(this.level="quadrant",this.currentRow=-1,this.restartTimer()):this.reset():super.handleAction(s)}doSelection(){if(this.level==="quadrant")this.currentQuad>=0&&(this.level="row",this.currentRow=-1,this.restartTimer());else if(this.level==="row")this.currentRow>=0&&(this.level="cell",this.currentCol=-1,this.restartTimer());else{const s=this.quads[this.currentQuad],e=(s.rowStart+this.currentRow)*this.surface.getColumns()+(s.colStart+this.currentCol);e>=0&&(this.triggerSelection(e),this.reset(),this.restartTimer())}}restartTimer(){this.timer&&clearTimeout(this.timer),this.scheduleNextStep()}getCost(s){const e=this.surface.getColumns(),t=this.surface.getItemsCount(),i=Math.ceil(t/e),a=Math.ceil(i/2),n=Math.ceil(e/2),o=Math.floor(s/e),r=s%e;let c=0;o<a?r<n?c=0:c=1:r<n?c=2:c=3;let h=o;o>=a&&(h=o-a);let u=r;return r>=n&&(u=r-n),c+1+(h+1)+(u+1)}mapContentToGrid(s,e,t){const i=new Array(s.length);let a=0;const n=Math.ceil(e/2),o=Math.ceil(t/2),r=[{rS:0,rE:n,cS:0,cE:o},{rS:0,rE:n,cS:o,cE:t},{rS:n,rE:e,cS:0,cE:o},{rS:n,rE:e,cS:o,cE:t}];for(const c of r)for(let h=c.rS;h<c.rE;h++)for(let u=c.cS;u<c.cE&&!(a>=s.length);u++){const p=h*t+u;p<i.length&&(i[p]=s[a++])}return i}},it=class extends m{constructor(){super(...arguments),l(this,"level","group"),l(this,"currentGroup",-1),l(this,"currentRow",-1),l(this,"currentCol",-1),l(this,"groups",[])}start(){this.calcGroups(),super.start()}calcGroups(){const s=this.surface.getItemsCount(),e=this.surface.getColumns(),t=Math.ceil(s/e),i=Math.ceil(t/3);this.groups=[];for(let a=0;a<t;a+=i)this.groups.push({rowStart:a,rowEnd:Math.min(a+i,t)})}reset(){this.level="group",this.currentGroup=-1,this.currentRow=-1,this.currentCol=-1,this.surface.setFocus([])}step(){this.level==="group"?this.stepGroup():this.level==="row"?this.stepRow():this.stepCell()}stepGroup(){this.currentGroup++,this.currentGroup>=this.groups.length&&(this.currentGroup=0),this.highlightGroup(this.currentGroup)}stepRow(){const s=this.groups[this.currentGroup],e=s.rowEnd-s.rowStart;this.currentRow++,this.currentRow>=e&&(this.currentRow=0);const t=s.rowStart+this.currentRow;this.highlightRow(t)}stepCell(){const s=this.surface.getColumns();this.currentCol++,this.currentCol>=s&&(this.currentCol=0);const i=(this.groups[this.currentGroup].rowStart+this.currentRow)*s+this.currentCol;if(i<this.surface.getItemsCount()){const a=this.config.get();this.surface.setFocus([i],{phase:"item",scanRate:a.scanRate,scanPattern:a.scanPattern,scanTechnique:a.scanTechnique,scanDirection:a.scanDirection})}else this.currentCol<s-1&&this.stepCell()}highlightGroup(s){const e=this.groups[s],t=[],i=this.surface.getColumns(),a=this.surface.getItemsCount();for(let o=e.rowStart;o<e.rowEnd;o++)for(let r=0;r<i;r++){const c=o*i+r;c<a&&t.push(c)}const n=this.config.get();this.surface.setFocus(t,{phase:"major",scanRate:n.scanRate,scanPattern:n.scanPattern,scanTechnique:n.scanTechnique,scanDirection:n.scanDirection})}highlightRow(s){const e=this.surface.getColumns(),t=this.surface.getItemsCount(),i=[];for(let n=0;n<e;n++){const o=s*e+n;o<t&&i.push(o)}const a=this.config.get();this.surface.setFocus(i,{phase:"minor",scanRate:a.scanRate,scanPattern:a.scanPattern,scanTechnique:a.scanTechnique,scanDirection:a.scanDirection})}handleAction(s){s==="cancel"?this.level==="cell"?(this.level="row",this.currentCol=-1,this.restartTimer()):this.level==="row"?(this.level="group",this.currentRow=-1,this.restartTimer()):this.reset():super.handleAction(s)}doSelection(){if(this.level==="group")this.currentGroup>=0&&(this.level="row",this.currentRow=-1,this.restartTimer());else if(this.level==="row")this.currentRow>=0&&(this.level="cell",this.currentCol=-1,this.restartTimer());else{const e=(this.groups[this.currentGroup].rowStart+this.currentRow)*this.surface.getColumns()+this.currentCol;e>=0&&(this.triggerSelection(e),this.reset(),this.restartTimer())}}restartTimer(){this.timer&&clearTimeout(this.timer),this.scheduleNextStep()}getCost(s){const e=this.surface.getColumns(),t=this.surface.getItemsCount(),i=Math.ceil(t/e),a=Math.ceil(i/3),n=Math.floor(s/e),o=s%e,r=Math.floor(n/a),c=n%a;return r+1+(c+1)+(o+1)}},O={"switch-1":"#2196F3","switch-2":"#F44336","switch-3":"#4CAF50","switch-4":"#FFEB3B","switch-5":"#9C27B0","switch-6":"#FF9800","switch-7":"#00BCD4","switch-8":"#E91E63"},st=class extends m{constructor(){super(...arguments),l(this,"rangeStart",0),l(this,"rangeEnd",0),l(this,"currentBlock",0),l(this,"numSwitches",4),l(this,"partitionHistory",[])}start(){const s=this.config.get();this.numSwitches=s.eliminationSwitchCount||4,this.rangeStart=0,this.rangeEnd=this.surface.getItemsCount(),this.partitionHistory=[],super.start(),s.scanInputMode==="manual"&&this.highlightCurrentBlock()}reset(){this.rangeStart=0,this.rangeEnd=this.surface.getItemsCount(),this.currentBlock=0,this.partitionHistory=[],this.clearHighlights()}clearHighlights(){this.surface.setFocus([]),this.surface.clearItemStyles&&this.surface.clearItemStyles()}step(){this.currentBlock=(this.currentBlock+1)%this.numSwitches,this.highlightCurrentBlock()}highlightCurrentBlock(){var t,i;this.clearHighlights();const e=this.calculatePartitions(this.rangeStart,this.rangeEnd,this.numSwitches)[this.currentBlock];if(e)for(let a=e.start;a<e.end;a++){const n=this.getSwitchAction(this.currentBlock),o=O[n];(i=(t=this.surface).setItemStyle)==null||i.call(t,a,{backgroundColor:o,opacity:.4,borderColor:o,borderWidth:2,boxShadow:`inset 0 0 0 3px ${o}`})}}calculatePartitions(s,e,t){const i=[],a=e-s,n=Math.floor(a/t),o=a%t;let r=s;for(let c=0;c<t;c++){const h=n+(c<o?1:0);i.push({start:r,end:r+h}),r+=h}return i}getSwitchAction(s){return{0:"switch-1",1:"switch-2",2:"switch-3",3:"switch-4",4:"switch-5",5:"switch-6",6:"switch-7",7:"switch-8"}[s]||"switch-1"}handleAction(s){var e,t;if(s==="select"){this.doSelection();return}if(s.toString().startsWith("switch-")){const i=parseInt(s.toString().split("-")[1])-1,a=this.config.get().scanInputMode==="manual";if(i>=this.numSwitches)return;if(this.rangeEnd-this.rangeStart<=1){this.rangeStart>=0&&(this.triggerSelection(this.rangeStart),this.reset(),this.restartTimer());return}if(a||i===this.currentBlock){a&&(this.currentBlock=i);const r=this.calculatePartitions(this.rangeStart,this.rangeEnd,this.numSwitches)[i];if(r&&(this.partitionHistory.push({start:this.rangeStart,end:this.rangeEnd}),this.rangeStart=r.start,this.rangeEnd=r.end,this.currentBlock=0,this.rangeEnd-this.rangeStart===1)){this.clearHighlights();const c=O["switch-1"];(t=(e=this.surface).setItemStyle)==null||t.call(e,this.rangeStart,{backgroundColor:c,opacity:.6,boxShadow:`inset 0 0 0 4px ${c}, 0 0 10px ${c}`,borderColor:c,borderWidth:2})}this.restartTimer(),a&&this.rangeEnd-this.rangeStart>1&&this.highlightCurrentBlock()}return}if(s==="cancel"||s==="reset"){if(this.partitionHistory.length>0){const i=this.partitionHistory.pop();this.rangeStart=i.start,this.rangeEnd=i.end,this.currentBlock=0}else this.reset();this.restartTimer(),this.config.get().scanInputMode==="manual"&&this.highlightCurrentBlock()}}doSelection(){this.rangeEnd-this.rangeStart<=1&&this.rangeStart>=0&&(this.triggerSelection(this.rangeStart),this.reset(),this.restartTimer())}restartTimer(){this.timer&&clearTimeout(this.timer),this.scheduleNextStep()}getCost(s){const e=this.numSwitches;let t=0,i=this.surface.getItemsCount(),a=0;for(;i-t>1;){const n=this.calculatePartitions(t,i,e);let o=0;for(let r=0;r<n.length;r++)if(s>=n[r].start&&s<n[r].end){o=r;break}a+=o+1,t=n[o].start,i=n[o].end}return a}scheduleNextStep(){if(!this.isRunning||this.config.get().scanInputMode==="manual")return;this.timer&&clearTimeout(this.timer);const s=this.config.get().scanRate;this.timer=window.setTimeout(()=>{this.step(),this.scheduleNextStep()},s)}},nt=class extends m{constructor(){super(...arguments),l(this,"state","x-scan"),l(this,"xPos",0),l(this,"yPos",0),l(this,"technique","crosshair"),l(this,"numCols",0),l(this,"numRows",0),l(this,"bufferWidth",15),l(this,"direction",1),l(this,"pauseTimer",null),l(this,"bufferLeft",0),l(this,"bufferRight",0),l(this,"bufferTop",0),l(this,"bufferBottom",0),l(this,"fineXPos",0),l(this,"fineYPos",0),l(this,"lockedXPosition",0),l(this,"currentDirection",0),l(this,"compassAngle",0),l(this,"compassMode","continuous"),l(this,"directionStepCounter",0),l(this,"directionStepsPerChange",10),l(this,"directions",[{name:"N",angle:0,dx:0,dy:-1},{name:"NE",angle:45,dx:1,dy:-1},{name:"E",angle:90,dx:1,dy:0},{name:"SE",angle:135,dx:1,dy:1},{name:"S",angle:180,dx:0,dy:1},{name:"SW",angle:225,dx:-1,dy:1},{name:"W",angle:270,dx:-1,dy:0},{name:"NW",angle:315,dx:-1,dy:-1}])}start(){try{const s=this.config.get();this.technique=s.continuousTechnique||"crosshair";const e=this.surface.getItemsCount();this.numCols=this.surface.getColumns(),this.numRows=Math.ceil(e/this.numCols),console.log("[ContinuousScanner] Starting:",{technique:this.technique,numCols:this.numCols,numRows:this.numRows,totalItems:e}),this.technique==="gliding"?(this.state="x-scanning",this.xPos=0,this.yPos=0):this.technique==="eight-direction"?(this.state="direction-scan",this.xPos=50,this.yPos=50,this.compassMode=s.compassMode||"continuous",this.compassAngle=0):(this.state="x-scan",this.xPos=0,this.yPos=0),console.log("[ContinuousScanner] Initial state:",this.state),this.emitUpdate(),super.start()}catch(s){throw console.error("[ContinuousScanner] ERROR in start():",s),s}}stop(){super.stop(),this.pauseTimer&&(window.clearTimeout(this.pauseTimer),this.pauseTimer=null)}reset(){this.technique==="gliding"?(this.state="x-scanning",this.xPos=0,this.yPos=0):this.technique==="eight-direction"?(this.state="direction-scan",this.xPos=50,this.yPos=50):(this.state="x-scan",this.xPos=0,this.yPos=0),this.direction=1,this.fineXPos=0,this.fineYPos=0,this.bufferLeft=0,this.bufferRight=this.bufferWidth,this.bufferTop=0,this.bufferBottom=this.bufferWidth,this.lockedXPosition=0,this.currentDirection=0,this.compassAngle=0,this.directionStepCounter=0,this.surface.setFocus([]),this.emitUpdate()}step(){if(this.technique==="eight-direction"){if(this.state==="direction-scan")this.compassMode==="continuous"?this.compassAngle=(this.compassAngle+2)%360:(this.directionStepCounter++,this.directionStepCounter>=this.directionStepsPerChange&&(this.currentDirection=(this.currentDirection+1)%8,this.directionStepCounter=0),this.compassAngle=this.directions[this.currentDirection].angle);else if(this.state==="moving"){const s=this.compassMode==="continuous"?this.getDirectionFromAngle(this.compassAngle):this.directions[this.currentDirection],e=.5;this.xPos+=s.dx*e,this.yPos+=s.dy*e,this.xPos=Math.max(0,Math.min(100,this.xPos)),this.yPos=Math.max(0,Math.min(100,this.yPos))}}else if(this.technique==="gliding")if(this.state==="x-scanning"){if(this.xPos+=.8*this.direction,this.xPos>=100){if(this.xPos=100,!this.pauseTimer){this.pauseTimer=window.setTimeout(()=>{this.direction=-1,this.pauseTimer=null},100);return}}else if(this.xPos<=0&&(this.xPos=0,!this.pauseTimer)){this.pauseTimer=window.setTimeout(()=>{this.direction=1,this.pauseTimer=null},100);return}this.bufferLeft=Math.max(0,this.xPos-this.bufferWidth/2),this.bufferRight=Math.min(100,this.xPos+this.bufferWidth/2)}else if(this.state==="x-capturing")this.fineXPos+=.3*this.direction,this.fineXPos>=100?(this.fineXPos=100,this.direction=-1):this.fineXPos<=0&&(this.fineXPos=0,this.direction=1);else if(this.state==="y-scanning"){if(this.yPos+=.8*this.direction,this.yPos>=100){if(this.yPos=100,!this.pauseTimer){this.pauseTimer=window.setTimeout(()=>{this.direction=-1,this.pauseTimer=null},100);return}}else if(this.yPos<=0&&(this.yPos=0,!this.pauseTimer)){this.pauseTimer=window.setTimeout(()=>{this.direction=1,this.pauseTimer=null},100);return}this.bufferTop=Math.max(0,this.yPos-this.bufferWidth/2),this.bufferBottom=Math.min(100,this.yPos+this.bufferWidth/2)}else this.state==="y-capturing"&&(this.fineYPos+=.3*this.direction,this.fineYPos>=100?(this.fineYPos=100,this.direction=-1):this.fineYPos<=0&&(this.fineYPos=0,this.direction=1));else this.state==="x-scan"?(this.xPos+=.5,this.xPos>100&&(this.xPos=0)):this.state==="y-scan"&&(this.yPos+=.5,this.yPos>100&&(this.yPos=0));Math.floor(this.xPos*2)%50===0&&console.log("[ContinuousScanner] Step:",{state:this.state,xPos:this.xPos,yPos:this.yPos,fineXPos:this.fineXPos,fineYPos:this.fineYPos,bufferLeft:this.bufferLeft,bufferRight:this.bufferRight,technique:this.technique,direction:this.direction,currentDirection:this.currentDirection}),this.emitUpdate()}getDirectionFromAngle(s){const e=s*Math.PI/180,t=Math.cos(e),i=Math.sin(e),a=(s+22.5)%360,n=Math.floor(a/45),r=["E","SE","S","SW","W","NW","N","NE"][n]||"N";return{dx:t,dy:i,name:r}}scheduleNextStep(){if(!this.isRunning||this.config.get().scanInputMode==="manual")return;this.timer&&clearTimeout(this.timer);const s=20;this.timer=window.setTimeout(()=>{this.step(),this.scheduleNextStep()},s)}handleAction(s){console.log("[ContinuousScanner] handleAction:",{action:s,state:this.state,technique:this.technique}),s==="cancel"?(console.log("[ContinuousScanner] Cancel - resetting"),this.reset()):super.handleAction(s)}doSelection(){if(this.technique==="eight-direction")if(this.state==="direction-scan"){const s=this.getDirectionFromAngle(this.compassAngle);console.log("[ContinuousScanner] Transition: direction-scan -> moving, direction:",s.name,"angle:",this.compassAngle),this.state="moving"}else this.state==="moving"&&(console.log("[ContinuousScanner] Transition: moving -> processing"),this.state="processing",this.selectFocusedItem());else this.technique==="gliding"?this.state==="x-scanning"?(console.log("[ContinuousScanner] Transition: x-scanning -> x-capturing"),this.state="x-capturing",this.fineXPos=0,this.direction=1):this.state==="x-capturing"?(console.log("[ContinuousScanner] Transition: x-capturing -> y-scanning"),this.state="y-scanning",this.lockedXPosition=this.bufferLeft+this.fineXPos/100*(this.bufferRight-this.bufferLeft),this.yPos=0,this.fineYPos=0,this.direction=1):this.state==="y-scanning"?(console.log("[ContinuousScanner] Transition: y-scanning -> y-capturing"),this.state="y-capturing",this.fineYPos=0,this.direction=1):this.state==="y-capturing"&&(console.log("[ContinuousScanner] Transition: y-capturing -> processing"),this.state="processing",this.selectFocusedItem()):this.state==="x-scan"?(console.log("[ContinuousScanner] Transition: x-scan -> y-scan"),this.state="y-scan",this.yPos=0):this.state==="y-scan"&&(console.log("[ContinuousScanner] Transition: y-scan -> processing"),this.state="processing",this.selectAtPoint())}selectFocusedItem(){if(this.technique==="eight-direction"){this.selectAtPercent(this.xPos,this.yPos);return}const s=this.bufferTop+this.fineYPos/100*(this.bufferBottom-this.bufferTop);this.selectAtPercent(this.lockedXPosition,s)}selectAtPoint(){this.selectAtPercent(this.xPos,this.yPos)}selectAtPercent(s,e){let t=null;this.surface.resolveIndexAtPoint?t=this.surface.resolveIndexAtPoint(s,e):t=this.estimateIndexAtPercent(s,e),t!==null&&t>=0&&this.triggerSelection(t),this.reset()}estimateIndexAtPercent(s,e){const t=this.surface.getItemsCount();if(!t)return null;const i=Math.max(1,this.surface.getColumns()),a=Math.max(1,Math.ceil(t/i)),n=Math.min(i-1,Math.max(0,Math.floor(s/100*i))),r=Math.min(a-1,Math.max(0,Math.floor(e/100*a)))*i+n;return r>=t?t-1:r}emitUpdate(){var t,i;const s=this.getDirectionFromAngle(this.compassAngle),e={technique:this.technique,state:this.state,xPos:this.xPos,yPos:this.yPos,bufferLeft:this.bufferLeft,bufferRight:this.bufferRight,bufferTop:this.bufferTop,bufferBottom:this.bufferBottom,fineXPos:this.fineXPos,fineYPos:this.fineYPos,lockedXPosition:this.lockedXPosition,compassAngle:this.compassAngle,currentDirection:this.currentDirection,directionName:s.name,directionDx:s.dx,directionDy:s.dy};(i=(t=this.callbacks).onContinuousUpdate)==null||i.call(t,e)}getCost(s){const e=this.surface.getColumns(),t=Math.floor(s/e),i=s%e;if(this.technique==="eight-direction"){const a=(i+.5)/e*100,n=(t+.5)/Math.ceil(this.surface.getItemsCount()/e)*100,o=Math.sqrt(Math.pow(a,2)+Math.pow(n,2));return 4+Math.round(o/.5)+1}else if(this.technique==="gliding"){const a=(i+.5)/e*100;return Math.round(a/.5)+1}else{const a=(i+.5)/e*100,n=(t+.5)/Math.ceil(this.surface.getItemsCount()/e)*100,o=Math.round(a/.5),r=Math.round(n/.5);return o+r+2}}},at=class{constructor(){l(this,"predictor"),this.predictor=G({adaptive:!0,maxOrder:5}),this.predictor.train("The quick brown fox jumps over the lazy dog. Hello world. How are you?")}addToContext(s){this.predictor.addToContext(s)}resetContext(){this.predictor.resetContext()}predictNext(){return this.predictor.predictNextCharacter()}},ot=class extends m{constructor(){super(...arguments),l(this,"predictor",new at),l(this,"scanOrder",[]),l(this,"currentIndex",-1)}start(){this.updateProbabilities(),super.start()}reset(){this.currentIndex=-1,this.surface.setFocus([])}step(){this.currentIndex++,this.currentIndex>=this.scanOrder.length&&(this.currentIndex=0);const s=this.scanOrder[this.currentIndex],e=this.config.get();this.surface.setFocus([s],{phase:"item",scanRate:e.scanRate,scanPattern:e.scanPattern,scanTechnique:e.scanTechnique,scanDirection:e.scanDirection})}handleAction(s){s==="cancel"?this.reset():super.handleAction(s)}doSelection(){var s,e;if(this.currentIndex>=0){const t=this.scanOrder[this.currentIndex];if(t>=0){this.triggerSelection(t);const i=(e=(s=this.surface).getItemData)==null?void 0:e.call(s,t);i!=null&&i.label&&this.predictor.addToContext(i.label.toLowerCase()),this.updateProbabilities(),this.triggerRedraw(),this.reset(),this.timer&&clearTimeout(this.timer),this.scheduleNextStep()}}}updateProbabilities(){var i,a;const s=this.predictor.predictNext(),e=this.surface.getItemsCount(),t=[];for(let n=0;n<e;n++){let o=1e-4;const r=(a=(i=this.surface).getItemData)==null?void 0:a.call(i,n);if(r!=null&&r.label){const c=r.label.toLowerCase(),h=s.find(u=>u.text.toLowerCase()===c);h&&(o=h.probability)}t.push({index:n,prob:o})}t.sort((n,o)=>o.prob-n.prob),this.scanOrder=t.map(n=>n.index)}getCost(s){const e=this.scanOrder.indexOf(s);return e===-1?999:e+1}},rt=class extends m{start(){this.isRunning=!0,this.reset();const s=this.surface.getItemsCount();if(s>0){const e=Array.from({length:s},(i,a)=>a),t=this.config.get();this.surface.setFocus(e,{phase:"major",scanRate:t.scanRate,scanPattern:t.scanPattern,scanTechnique:t.scanTechnique,scanDirection:t.scanDirection})}}handleAction(s){s==="select"&&this.isRunning&&super.handleAction(s)}doSelection(){this.surface.getItemsCount()>0&&this.triggerSelection(0)}step(){}reset(){const s=this.surface.getItemsCount();if(s>0){const e=Array.from({length:s},(i,a)=>a),t=this.config.get();this.surface.setFocus(e,{phase:"major",scanRate:t.scanRate,scanPattern:t.scanPattern,scanTechnique:t.scanTechnique,scanDirection:t.scanDirection})}}getCost(s){return 1}},ct=class extends m{constructor(){super(...arguments),l(this,"probabilities",[]),l(this,"colors",[])}start(){this.isRunning=!0,this.initializeBelief(),this.assignColors(),this.applyColors()}stop(){this.isRunning=!1,this.surface.setFocus([])}handleAction(s){if(!this.isRunning)return;let e=null;if(s==="switch-1"||s==="select")e="blue";else if(s==="switch-2"||s==="step")e="red";else if(s==="reset"){this.initializeBelief(),this.assignColors(),this.applyColors();return}else return;this.updateBelief(e),this.assignColors(),this.applyColors()}step(){}reset(){this.initializeBelief(),this.assignColors(),this.applyColors()}getCost(s){return 1}doSelection(){}initializeBelief(){const s=this.surface.getItemsCount(),e=s>0?1/s:0;this.probabilities=new Array(s).fill(e)}assignColors(){const s=this.probabilities.map((i,a)=>({p:i,i:a})).sort((i,a)=>a.p-i.p);let e=0,t=0;this.colors=new Array(this.probabilities.length).fill("blue");for(const i of s)e<=t?(this.colors[i.i]="red",e+=i.p):(this.colors[i.i]="blue",t+=i.p)}applyColors(){var t,i;const s="#f9c6c6",e="#cfe3ff";for(let a=0;a<this.colors.length;a++)(i=(t=this.surface).setItemStyle)==null||i.call(t,a,{backgroundColor:this.colors[a]==="red"?s:e,textColor:"#1e1e1e"})}updateBelief(s){const{errorRate:e,selectThreshold:t}=this.config.get().colorCode,i=1-e;let a=0;for(let o=0;o<this.probabilities.length;o++){const c=this.colors[o]===s?i:e;this.probabilities[o]*=c,a+=this.probabilities[o]}if(a>0)for(let o=0;o<this.probabilities.length;o++)this.probabilities[o]/=a;let n=0;for(let o=1;o<this.probabilities.length;o++)this.probabilities[o]>this.probabilities[n]&&(n=o);this.probabilities[n]>=t&&(this.triggerSelection(n),this.initializeBelief())}},lt=Object.defineProperty,ht=(s,e,t)=>e in s?lt(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t,b=(s,e,t)=>ht(s,typeof e!="symbol"?e+"":e,t),ut=class{constructor(s){this.container=s,b(this,"overlay"),b(this,"hBar"),b(this,"vBar"),b(this,"bufferZone"),b(this,"lockedXBar"),b(this,"directionIndicator"),b(this,"directionLine"),this.overlay=document.createElement("div"),this.overlay.style.position="absolute",this.overlay.style.top="0",this.overlay.style.left="0",this.overlay.style.width="100%",this.overlay.style.height="100%",this.overlay.style.pointerEvents="none",this.overlay.style.zIndex="1000",this.bufferZone=document.createElement("div"),this.bufferZone.style.position="absolute",this.bufferZone.style.top="0",this.bufferZone.style.height="100%",this.bufferZone.style.backgroundColor="rgba(128, 128, 128, 0.4)",this.bufferZone.style.borderLeft="2px solid rgba(128, 128, 128, 0.8)",this.bufferZone.style.borderRight="2px solid rgba(128, 128, 128, 0.8)",this.bufferZone.style.pointerEvents="none",this.bufferZone.style.display="none",this.overlay.appendChild(this.bufferZone),this.vBar=document.createElement("div"),this.vBar.style.position="absolute",this.vBar.style.top="0",this.vBar.style.width="4px",this.vBar.style.height="100%",this.vBar.style.backgroundColor="rgba(255, 0, 0, 0.5)",this.vBar.style.borderLeft="1px solid red",this.vBar.style.borderRight="1px solid red",this.vBar.style.display="none",this.overlay.appendChild(this.vBar),this.hBar=document.createElement("div"),this.hBar.style.position="absolute",this.hBar.style.left="0",this.hBar.style.width="100%",this.hBar.style.height="4px",this.hBar.style.backgroundColor="rgba(255, 0, 0, 0.5)",this.hBar.style.borderTop="1px solid red",this.hBar.style.borderBottom="1px solid red",this.hBar.style.display="none",this.overlay.appendChild(this.hBar),this.lockedXBar=document.createElement("div"),this.lockedXBar.style.position="absolute",this.lockedXBar.style.top="0",this.lockedXBar.style.width="3px",this.lockedXBar.style.height="100%",this.lockedXBar.style.backgroundColor="rgba(0, 255, 0, 0.7)",this.lockedXBar.style.borderLeft="1px solid green",this.lockedXBar.style.borderRight="1px solid green",this.lockedXBar.style.display="none",this.overlay.appendChild(this.lockedXBar),this.directionIndicator=document.createElement("div"),this.directionIndicator.style.position="absolute",this.directionIndicator.style.top="10px",this.directionIndicator.style.right="10px",this.directionIndicator.style.width="80px",this.directionIndicator.style.height="80px",this.directionIndicator.style.borderRadius="50%",this.directionIndicator.style.backgroundColor="rgba(255, 255, 255, 0.9)",this.directionIndicator.style.border="3px solid #333",this.directionIndicator.style.display="none",this.directionIndicator.style.pointerEvents="none",this.overlay.appendChild(this.directionIndicator),this.directionLine=document.createElement("div"),this.directionLine.style.position="absolute",this.directionLine.style.height="2px",this.directionLine.style.backgroundColor="rgba(33, 150, 243, 0.6)",this.directionLine.style.transformOrigin="0 50%",this.directionLine.style.display="none",this.directionLine.style.pointerEvents="none",this.directionLine.style.zIndex="5",this.overlay.appendChild(this.directionLine),this.container.appendChild(this.overlay)}destroy(){this.overlay.parentNode&&this.overlay.parentNode.removeChild(this.overlay)}update(s){if(s.technique==="eight-direction"){this.vBar.style.display="none",this.hBar.style.display="none",this.bufferZone.style.display="none",this.lockedXBar.style.display="none",this.directionIndicator.style.display="block",this.directionLine.style.display="block";const e=s.compassAngle;this.directionIndicator.innerHTML=`
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
        ">${s.directionName} (${Math.round(e)}°)</div>
      `,this.directionLine.style.left=`${s.xPos}%`,this.directionLine.style.top=`${s.yPos}%`;const t=this.calculateLineLength(s.xPos,s.yPos,s.directionDx,s.directionDy);this.directionLine.style.width=`${t}%`,this.directionLine.style.transformOrigin="0 50%",this.directionLine.style.transform=`rotate(${e}deg)`,this.vBar.style.display="block",this.vBar.style.width="12px",this.vBar.style.height="12px",this.vBar.style.borderRadius="50%",this.vBar.style.backgroundColor=s.state==="moving"?"#FF5722":"#2196F3",this.vBar.style.border="2px solid white",this.vBar.style.zIndex="10",this.vBar.style.left=`calc(${s.xPos}% - 6px)`,this.vBar.style.top=`calc(${s.yPos}% - 6px)`;return}if(s.technique==="gliding"){if(s.state==="x-scanning"){this.vBar.style.display="none",this.hBar.style.display="none",this.lockedXBar.style.display="none",this.directionIndicator.style.display="none",this.directionLine.style.display="none";const e=s.bufferRight-s.bufferLeft;this.bufferZone.style.left=`${s.bufferLeft}%`,this.bufferZone.style.width=`${e}%`,this.bufferZone.style.height="100%",this.bufferZone.style.top="0",this.bufferZone.style.display="block"}else if(s.state==="x-capturing"){this.hBar.style.display="none",this.lockedXBar.style.display="none",this.directionIndicator.style.display="none",this.directionLine.style.display="none";const e=s.bufferRight-s.bufferLeft;this.bufferZone.style.left=`${s.bufferLeft}%`,this.bufferZone.style.width=`${e}%`,this.bufferZone.style.height="100%",this.bufferZone.style.top="0",this.bufferZone.style.display="block";const t=s.bufferLeft+s.fineXPos/100*(s.bufferRight-s.bufferLeft);this.vBar.style.display="block",this.vBar.style.left=`${t}%`}else if(s.state==="y-scanning"){this.vBar.style.display="none",this.hBar.style.display="none",this.directionIndicator.style.display="none",this.directionLine.style.display="none",this.lockedXBar.style.display="block",this.lockedXBar.style.left=`${s.lockedXPosition}%`;const e=s.bufferBottom-s.bufferTop;this.bufferZone.style.left="0",this.bufferZone.style.width="100%",this.bufferZone.style.top=`${s.bufferTop}%`,this.bufferZone.style.height=`${e}%`,this.bufferZone.style.display="block"}else if(s.state==="y-capturing"){this.vBar.style.display="none",this.directionIndicator.style.display="none",this.directionLine.style.display="none",this.lockedXBar.style.display="block",this.lockedXBar.style.left=`${s.lockedXPosition}%`;const e=s.bufferBottom-s.bufferTop;this.bufferZone.style.left="0",this.bufferZone.style.width="100%",this.bufferZone.style.top=`${s.bufferTop}%`,this.bufferZone.style.height=`${e}%`,this.bufferZone.style.display="block";const t=s.bufferTop+s.fineYPos/100*(s.bufferBottom-s.bufferTop);this.hBar.style.display="block",this.hBar.style.top=`${t}%`}return}this.bufferZone.style.display="none",this.lockedXBar.style.display="none",this.directionIndicator.style.display="none",this.directionLine.style.display="none",s.state==="x-scan"?(this.vBar.style.display="block",this.vBar.style.left=`${s.xPos}%`,this.hBar.style.display="none"):s.state==="y-scan"&&(this.vBar.style.display="block",this.vBar.style.left=`${s.xPos}%`,this.hBar.style.display="block",this.hBar.style.top=`${s.yPos}%`)}calculateLineLength(s,e,t,i){return t===0&&i===-1?e:t===1&&i===-1?Math.min(100-s,e)*Math.SQRT2:t===1&&i===0?100-s:t===1&&i===1?Math.min(100-s,100-e)*Math.SQRT2:t===0&&i===1?100-e:t===-1&&i===1?Math.min(s,100-e)*Math.SQRT2:t===-1&&i===0?s:t===-1&&i===-1?Math.min(s,e)*Math.SQRT2:50}};function dt(s,e,t){const i=s.getBoundingClientRect(),a=i.left+e/100*i.width,n=i.top+t/100*i.height,o=s.getRootNode(),r=o.elementFromPoint?o.elementFromPoint(a,n):document.elementFromPoint(a,n);if(!r)return null;const c=r.closest(".grid-cell");if(!c||!c.dataset.index)return null;const h=parseInt(c.dataset.index,10);return Number.isNaN(h)?null:h}function f(){const s=window.SWITCH_SCANNER_ASSET_BASE,e=s&&s.length>0?s:"/";return e.endsWith("/")?e:`${e}/`}const pt={blue:{normal:`${f()}switches/switch-blue.png`,depressed:`${f()}switches/switch-blue-depressed.png`},green:{normal:`${f()}switches/switch-green.png`,depressed:`${f()}switches/switch-green-depressed.png`},red:{normal:`${f()}switches/switch-red.png`,depressed:`${f()}switches/switch-red-depressed.png`},yellow:{normal:`${f()}switches/switch-yellow.png`,depressed:`${f()}switches/switch-yellow-depressed.png`}};class gt extends HTMLElement{constructor(){super();d(this,"configManager");d(this,"audioManager");d(this,"switchInput");d(this,"alphabetManager");d(this,"gridRenderer");d(this,"settingsUI");d(this,"scanSurface");d(this,"scanCallbacks");d(this,"currentScanner",null);d(this,"continuousOverlay",null);d(this,"baseItems",[]);d(this,"customItems",null);d(this,"forcedGridCols",null);d(this,"outputHistory",[]);d(this,"redoStack",[]);d(this,"boardTree",null);d(this,"boardPageId",null);d(this,"dwellTimer",null);d(this,"currentDwellTarget",null);this.attachShadow({mode:"open"})}async connectedCallback(){if(this.configManager)return;this.renderTemplate(),this.setupStyles();const t=this.parseAttributes();this.configManager=new k(t,!1),this.audioManager=new _(this.configManager.get().soundEnabled),this.alphabetManager=new j,await this.alphabetManager.init(),this.switchInput=new Z(this.configManager,this);const i=this.shadowRoot.querySelector(".grid-container");this.gridRenderer=new Q(i),this.scanSurface={getItemsCount:()=>this.gridRenderer.getItemsCount(),getColumns:()=>this.gridRenderer.columns,setFocus:(r,c)=>this.gridRenderer.setFocus(r,void 0,c),setSelected:r=>this.gridRenderer.setSelected(r),getItemData:r=>{const c=this.gridRenderer.getItem(r);return c?{label:c.label,isEmpty:c.isEmpty}:null},setItemStyle:(r,c)=>{const h=this.gridRenderer.getElement(r);h&&(c.backgroundColor!==void 0&&(h.style.backgroundColor=c.backgroundColor),c.textColor!==void 0&&(h.style.color=c.textColor),c.borderColor!==void 0&&(h.style.borderColor=c.borderColor),c.borderWidth!==void 0&&(h.style.borderWidth=`${c.borderWidth}px`),c.boxShadow!==void 0&&(h.style.boxShadow=c.boxShadow),c.opacity!==void 0&&(h.style.opacity=String(c.opacity)))},clearItemStyles:()=>{this.gridRenderer.getContainer().querySelectorAll(".grid-cell").forEach(r=>{const c=r;c.style.backgroundColor="",c.style.color="",c.style.borderColor="",c.style.borderWidth="",c.style.boxShadow="",c.style.opacity=""})},getContainerElement:()=>this.gridRenderer.getContainer(),resolveIndexAtPoint:(r,c)=>dt(this.gridRenderer.getContainer(),r,c)},this.scanCallbacks={onScanStep:()=>{var r;return(r=this.audioManager)==null?void 0:r.playScanSound()},onSelect:r=>{var u;const c=this.gridRenderer.getItem(r);if(!c)return;const h=new CustomEvent("scanner:selection",{bubbles:!0,composed:!0,detail:{item:c}});this.gridRenderer.getContainer().dispatchEvent(h),(u=this.audioManager)==null||u.playSelectSound()},onRedraw:()=>{const r=new CustomEvent("scanner:redraw",{bubbles:!0,composed:!0});this.gridRenderer.getContainer().dispatchEvent(r)},onContinuousUpdate:r=>{this.continuousOverlay&&this.continuousOverlay.update(r)}};const a=this.shadowRoot.querySelector(".settings-overlay");this.settingsUI=new Y(this.configManager,this.alphabetManager,a),this.setupBoardControls();const n=this.configManager.get();this.currentScanner=this.createScanner(n),await this.initBoardIfNeeded(),await this.updateGrid(n,!0),this.updateContinuousOverlay(n),this.currentScanner.start(),n.viewMode!=="standard"&&this.updateGrid(n,!1),this.bindEvents(),this.hasAttribute("tabindex")||this.setAttribute("tabindex","0");const o=this.getAttribute("theme");o&&this.updateTheme(o)}static get observedAttributes(){return["scan-strategy","scan-pattern","scan-technique","scan-mode","scan-input-mode","continuous-technique","compass-mode","grid-content","grid-size","board-src","board-upload","board-page","language","scan-rate","acceptance-time","dwell-time","elimination-switch-count","custom-items","grid-cols","theme","cancel-method","long-hold-time","critical-overscan-enabled","critical-overscan-fast-rate","critical-overscan-slow-rate","highlight-scan-line","highlight-border-width","highlight-border-color","highlight-scale","highlight-opacity","highlight-animation"]}attributeChangedCallback(t,i,a){if(t==="custom-items"){this.parseCustomItems(a),this.configManager&&this.updateGrid(this.configManager.get(),!0);return}if(t==="grid-cols"){this.forcedGridCols=parseInt(a,10),this.configManager&&this.updateGrid(this.configManager.get(),!0);return}if(t==="theme"){this.updateTheme(a);return}if(!this.configManager||i===a)return;const n={};switch(t){case"scan-strategy":this.mapLegacyStrategy(a,n);break;case"scan-pattern":n.scanPattern=a,n.scanMode=null;break;case"scan-input-mode":n.scanInputMode=a;break;case"scan-technique":n.scanTechnique=a;break;case"scan-mode":n.scanMode=a==="null"?null:a;break;case"grid-content":n.gridContent=a;break;case"grid-size":n.gridSize=parseInt(a,10);break;case"board-src":a&&(this.configManager.update({gridContent:"board"}),this.loadBoardFromUrl(a));break;case"board-page":a&&this.setBoardPage(a);break;case"board-upload":this.hasAttribute("board-upload")&&this.configManager.update({gridContent:"board"}),this.updateBoardControlsVisibility();break;case"language":n.language=a;break;case"scan-rate":n.scanRate=parseInt(a,10);break;case"acceptance-time":n.acceptanceTime=parseInt(a,10);break;case"dwell-time":n.dwellTime=parseInt(a,10);break;case"continuous-technique":n.continuousTechnique=a;break;case"compass-mode":n.compassMode=a;break;case"elimination-switch-count":n.eliminationSwitchCount=parseInt(a,10);break;case"cancel-method":n.cancelMethod=a;break;case"long-hold-time":n.longHoldTime=parseInt(a,10);break;case"highlight-scan-line":n.highlightScanLine=a==="true"||a==="1";break;case"highlight-border-width":n.highlightBorderWidth=parseInt(a,10);break;case"highlight-border-color":n.highlightBorderColor=a;break;case"highlight-scale":n.highlightScale=parseFloat(a);break;case"highlight-opacity":n.highlightOpacity=parseFloat(a);break;case"highlight-animation":n.highlightAnimation=a==="true"||a==="1";break;case"critical-overscan-enabled":n.criticalOverscan={...this.configManager.get().criticalOverscan,enabled:a==="true"||a==="1"};break;case"critical-overscan-fast-rate":n.criticalOverscan={...this.configManager.get().criticalOverscan,fastRate:parseInt(a,10)};break;case"critical-overscan-slow-rate":n.criticalOverscan={...this.configManager.get().criticalOverscan,slowRate:parseInt(a,10)};break}this.configManager.update(n)}mapLegacyStrategy(t,i){t==="group-row-column"?i.scanMode="group-row-column":t==="continuous"?i.scanMode="continuous":t==="probability"?i.scanMode="probability":t==="color-code"?i.scanMode="color-code":["row-column","column-row","linear","snake","quadrant","elimination"].includes(t)&&(i.scanPattern=t,t==="row-column"||t==="column-row"?i.scanTechnique="block":i.scanTechnique="point")}parseAttributes(){const t={},i=this.getAttribute("scan-strategy");i&&this.mapLegacyStrategy(i,t);const a=this.getAttribute("scan-pattern");a&&(t.scanPattern=a,t.scanMode=null);const n=this.getAttribute("scan-technique");n&&(t.scanTechnique=n);const o=this.getAttribute("scan-mode");o&&(t.scanMode=o==="null"?null:o);const r=this.getAttribute("scan-input-mode");r&&(t.scanInputMode=r);const c=this.getAttribute("grid-content");c&&(t.gridContent=c);const h=this.getAttribute("grid-size");h&&(t.gridSize=parseInt(h,10));const u=this.getAttribute("language");u&&(t.language=u);const p=this.getAttribute("scan-rate");p&&(t.scanRate=parseInt(p,10));const g=this.getAttribute("acceptance-time");g&&(t.acceptanceTime=parseInt(g,10));const M=this.getAttribute("dwell-time");M&&(t.dwellTime=parseInt(M,10));const I=this.getAttribute("continuous-technique");I&&(t.continuousTechnique=I);const T=this.getAttribute("compass-mode");T&&(t.compassMode=T);const R=this.getAttribute("elimination-switch-count");R&&(t.eliminationSwitchCount=parseInt(R,10));const P=this.getAttribute("cancel-method");P&&(t.cancelMethod=P);const B=this.getAttribute("long-hold-time");B&&(t.longHoldTime=parseInt(B,10));const v=this.getAttribute("highlight-scan-line");v&&(t.highlightScanLine=v==="true"||v==="1");const E=this.getAttribute("highlight-border-width");E&&(t.highlightBorderWidth=parseInt(E,10));const q=this.getAttribute("highlight-border-color");q&&(t.highlightBorderColor=q);const A=this.getAttribute("highlight-scale");A&&(t.highlightScale=parseFloat(A));const L=this.getAttribute("highlight-opacity");L&&(t.highlightOpacity=parseFloat(L));const w=this.getAttribute("highlight-animation");w&&(t.highlightAnimation=w==="true"||w==="1");const C=this.getAttribute("critical-overscan-enabled"),S=this.getAttribute("critical-overscan-fast-rate"),x=this.getAttribute("critical-overscan-slow-rate");(C||S||x)&&(t.criticalOverscan={enabled:C==="true"||C==="1",fastRate:S?parseInt(S,10):100,slowRate:x?parseInt(x,10):1e3});const D=this.getAttribute("custom-items");D&&this.parseCustomItems(D);const $=this.getAttribute("grid-cols");return $&&(this.forcedGridCols=parseInt($,10)),t}parseCustomItems(t){try{this.customItems=JSON.parse(t)}catch(i){console.error("Failed to parse custom-items:",i),this.customItems=null}}updateBoardControlsVisibility(){var a;const t=(a=this.shadowRoot)==null?void 0:a.querySelector(".board-controls");if(!t)return;const i=this.hasAttribute("board-upload");t.classList.toggle("hidden",!i)}async initBoardIfNeeded(){if(!this.configManager)return;const t=this.configManager.get(),i=this.getAttribute("board-src");(t.gridContent==="board"||i||this.hasAttribute("board-upload"))&&(t.gridContent!=="board"&&this.configManager.update({gridContent:"board"}),this.updateBoardControlsVisibility(),i&&await this.loadBoardFromUrl(i))}async loadBoardFromUrl(t){try{this.setBoardStatus("Loading board…");const i=this.resolveBoardUrl(t),a=await fetch(i);if(!a.ok)throw new Error(`Failed to load board: ${a.status}`);const n=await a.blob(),o=i.split("/").pop()||"board",r=new File([n],o,{type:n.type||"application/octet-stream"});await this.loadBoardFromFile(r)}catch(i){console.error(i),this.setBoardStatus("Failed to load board.")}}async loadBoardFromFile(t){var i,a;try{this.setBoardStatus(`Parsing ${t.name}…`);const n=await X(t);this.boardTree=n,this.boardPageId=this.resolveBoardPageId(n),this.setBoardStatus((i=n.metadata)!=null&&i.name?n.metadata.name:t.name),await this.updateGrid(this.configManager.get(),!0),(a=this.currentScanner)==null||a.start()}catch(n){console.error(n),this.setBoardStatus("Failed to parse board.")}}resolveBoardPageId(t){const a=(t.metadata||{}).defaultHomePageId||t.rootId;if(a&&t.pages[a])return a;const n=t.toolbarId,o=Object.values(t.pages).find(r=>r.id!==n);return o?o.id:Object.keys(t.pages)[0]||null}setBoardStatus(t){var a;const i=(a=this.shadowRoot)==null?void 0:a.querySelector(".board-status");i&&(i.textContent=t)}resolveBoardUrl(t){if(!t.startsWith("/"))return t;const i=f();return i==="/"?t:`${i}${t.replace(/^\//,"")}`}getCurrentBoardPage(){return!this.boardTree||!this.boardPageId?null:this.boardTree.pages[this.boardPageId]||null}resolveBoardImage(t){const i=t.resolvedImageEntry;if(i&&typeof i=="string"&&i.startsWith("data:image/"))return i;const a=t.image;if(a&&typeof a=="string")return a}buildBoardGrid(){var o,r,c,h;const t=this.getCurrentBoardPage();if(!t)return null;const i=t.grid.length,a=t.grid.reduce((u,p)=>Math.max(u,p.length),0),n=[];for(let u=0;u<i;u++)for(let p=0;p<a;p++){const g=((o=t.grid[u])==null?void 0:o[p])??null;if(!g||g.visibility==="Hidden"||g.visibility==="Disabled"||g.visibility==="Empty"){n.push({id:`empty-${u}-${p}`,label:"",type:"action",isEmpty:!0});continue}n.push({id:g.id||`btn-${u}-${p}`,label:g.label||"",message:g.message||"",targetPageId:g.targetPageId,scanBlock:g.scanBlock??((r=g.scanBlocks)==null?void 0:r[0]),image:this.resolveBoardImage(g),type:g.targetPageId?"action":"word",backgroundColor:(c=g.style)==null?void 0:c.backgroundColor,textColor:(h=g.style)==null?void 0:h.fontColor})}return{items:n,cols:a}}async setBoardPage(t){var i;!this.boardTree||!this.boardTree.pages[t]||(this.boardPageId=t,await this.updateGrid(this.configManager.get(),!0),(i=this.currentScanner)==null||i.start())}updateTheme(t){const i=this.shadowRoot.querySelector(".scanner-wrapper");i&&(i.className="scanner-wrapper",t&&i.classList.add(t))}setupBoardControls(){var i,a;const t=(i=this.shadowRoot)==null?void 0:i.querySelector(".board-file");if(t){try{const n=((a=U)==null?void 0:a())||[];if(n.length>0){const o=n.map(r=>r.startsWith(".")?r:`.${r}`).join(",");t.accept=o}}catch(n){console.warn("Unable to set board file accept list.",n)}t.addEventListener("change",async()=>{var o;const n=(o=t.files)==null?void 0:o[0];n&&(await this.loadBoardFromFile(n),t.value="")})}}renderTemplate(){const t=this.getAttribute("scan-mode")==="color-code",i=this.getAttribute("scan-pattern")==="elimination";this.shadowRoot.innerHTML=`
      <div class="scanner-wrapper">
        <div class="status-bar">
          <span class="output-text"></span>
          <button class="settings-btn" title="Settings">⚙️</button>
        </div>
        <div class="grid-container"></div>
        <div class="controls">
           <button data-action="select">${t||i?"Blue (1)":"Select (Space)"}</button>
           <button data-action="step">${t?"Red (2)":i?"Switch 2 (2)":"Step (2)"}</button>
           <button data-action="reset">Reset (3)</button>
        </div>
        <div class="board-controls hidden">
          <label class="board-upload">
            <input class="board-file" type="file" />
            Load AAC Board
          </label>
          <span class="board-status"></span>
        </div>
        <div class="settings-overlay hidden"></div>
      </div>
    `}setupStyles(){const t=document.createElement("style");t.textContent=`
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
        position: relative;
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

      .scan-focus::after {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        opacity: 0;
        pointer-events: none;
        animation-duration: var(--scan-line-duration, 1000ms);
        animation-delay: var(--scan-line-delay, 0ms);
        animation-timing-function: linear;
        animation-iteration-count: 1;
        animation-fill-mode: both;
        animation-name: scan-line-horizontal;
        background: rgba(255,152,0,0.9);
        width: 2px;
        height: 100%;
      }

      .scan-focus.scan-line-vertical::after {
        animation-name: scan-line-vertical;
        width: 100%;
        height: 2px;
      }

      .scan-focus.scan-line-reverse::after {
        animation-direction: reverse;
      }

      @keyframes scan-line-horizontal {
        0% { left: 0; opacity: 0; }
        5% { opacity: var(--scan-line-enabled, 0); }
        95% { opacity: var(--scan-line-enabled, 0); }
        100% { left: calc(100% - 2px); opacity: 0; }
      }

      @keyframes scan-line-vertical {
        0% { top: 0; opacity: 0; }
        5% { opacity: var(--scan-line-enabled, 0); }
        95% { opacity: var(--scan-line-enabled, 0); }
        100% { top: calc(100% - 2px); opacity: 0; }
      }

      .scan-focus.scan-line-only {
        outline: none;
        outline-offset: 0;
        transform: none;
        opacity: 1;
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

      .board-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 16px;
        border-top: 1px solid #eee;
        background: #fafafa;
        font-size: 0.85rem;
        color: #333;
      }

      .board-controls.hidden {
        display: none;
      }

      .board-upload {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border: 1px solid #ccc;
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
        font-weight: 600;
      }

      .board-upload input {
        display: none;
      }

      .board-status {
        font-style: italic;
        color: #666;
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

      .scanner-wrapper.sketch .scan-focus.scan-line-only {
          box-shadow: none;
          transform: none;
          opacity: 1;
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
    `,this.shadowRoot.appendChild(t)}updateControlsVisibility(t){const i=this.shadowRoot.querySelector(".controls");if(!i)return;const a=t.useImageButton;if(i.innerHTML="",t.scanPattern==="elimination"){const o=t.eliminationSwitchCount||4;for(let c=1;c<=o;c++){const h=this.createButton("switch-"+c,`${c}`,t,c);i.appendChild(h)}const r=this.createButton("reset","↺",t,5);r.style.flex="0 0 auto",i.appendChild(r);return}if(t.scanMode==="color-code"){const o=this.createButton("switch-1",a?"":"Blue (1)",t,1),r=this.createButton("switch-2",a?"":"Red (2)",t,2);i.appendChild(o),i.appendChild(r);const c=this.createButton("reset",a?"":"Reset (3)",t,3);c.style.flex="0 0 auto",i.appendChild(c);return}if(t.scanInputMode==="manual"){const o=this.createButton("step",a?"":"Step (2)",t,2);i.appendChild(o);const r=this.createButton("select",a?"":"Select (1)",t,1);i.appendChild(r);return}const n=this.createButton("select",a?"":"Select (1)",t,1);i.appendChild(n)}createButton(t,i,a,n){const o=document.createElement("button");o.setAttribute("data-action",t);const r=a.useImageButton;let c=a.buttonColor||"blue";n&&(c={1:"blue",2:"red",3:"green",4:"yellow",5:"blue",6:"green",7:"red",8:"yellow"}[n]||c);const h=a.customButtonImages;if(r&&(h!=null&&h.normal||h!=null&&h.pressed)){const u=this.getActionLabel(t);o.style.cssText=`
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
      `,o.innerHTML=`
        <img src="${h.normal}" alt="${u}" style="width: 60px; height: 60px; max-width: 60px; transition: none;">
        <span style="font-size: 12px; font-weight: bold; color: #333; text-transform: uppercase;">${u}</span>
      `;const p=o.querySelector("img");o.addEventListener("mousedown",()=>{h.pressed&&(p.src=h.pressed)}),o.addEventListener("mouseup",()=>{p.src=h.normal}),o.addEventListener("mouseleave",()=>{p.src=h.normal})}else if(r){const u=pt[c];o.style.cssText=`
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
      `;const p=this.getActionLabel(t);o.innerHTML=`
        <img src="${u.normal}" alt="${p}" style="width: 60px; height: 60px; max-width: 60px;">
        <span style="font-size: 12px; font-weight: bold; color: #333; text-transform: uppercase;">${p}</span>
      `;const g=o.querySelector("img");o.addEventListener("mousedown",()=>{g.src=u.depressed}),o.addEventListener("mouseup",()=>{g.src=u.normal}),o.addEventListener("mouseleave",()=>{g.src=u.normal})}else o.textContent=i,o.style.cssText=`
        flex: 1;
        padding: 10px 20px;
        font-size: 1rem;
        cursor: pointer;
        border: 1px solid #ccc;
        background: ${n?this.getSwitchColor(n):"#fff"};
        color: ${n?"white":"#333"};
        border-radius: 4px;
        font-weight: ${n?"bold":"normal"};
        text-shadow: ${n?"0 1px 2px rgba(0,0,0,0.3)":"none"};
      `;return o.addEventListener("click",u=>{console.log("[SwitchScannerElement] Button clicked:",t),this.switchInput.triggerAction(t)}),o.addEventListener("mousedown",u=>u.preventDefault()),o}getSwitchColor(t){return{1:"#2196F3",2:"#F44336",3:"#4CAF50",4:"#FFEB3B",5:"#9C27B0",6:"#FF9800",7:"#00BCD4",8:"#E91E63"}[t]||"#2196F3"}getActionLabel(t){const i={select:"Choose",step:"Move",reset:"Reset",cancel:"Cancel"};return t.startsWith("switch-")?`Switch ${t.replace("switch-","")}`:i[t]||t}bindEvents(){var a;let t=this.configManager.get();this.configManager.subscribe(async n=>{this.audioManager.setEnabled(n.soundEnabled);const o=n.gridContent!==t.gridContent||n.gridSize!==t.gridSize||n.language!==t.language||n.layoutMode!==t.layoutMode,r=n.scanPattern!==t.scanPattern||n.scanTechnique!==t.scanTechnique||n.scanMode!==t.scanMode;r&&console.log("[SwitchScannerElement] Scanner changed:",{old:{scanMode:t.scanMode,scanPattern:t.scanPattern},new:{scanMode:n.scanMode,scanPattern:n.scanPattern}});const c=n.viewMode!==t.viewMode||n.heatmapMax!==t.heatmapMax;o?await this.updateGrid(n,!0):r?(this.setScanner(n),await this.updateGrid(n,!0)):c&&await this.updateGrid(n,!1),t=n}),this.switchInput.addEventListener("switch",n=>{const o=n.detail;if(o.action==="menu"){this.settingsUI.toggle();return}this.currentScanner&&this.currentScanner.handleAction(o.action)}),(a=this.shadowRoot.querySelector(".settings-btn"))==null||a.addEventListener("click",()=>{this.settingsUI.toggle()}),this.shadowRoot.querySelectorAll(".controls button").forEach(n=>{n.addEventListener("click",o=>{const r=o.target.getAttribute("data-action");r&&this.switchInput.triggerAction(r)}),n.addEventListener("mousedown",o=>o.preventDefault())}),this.updateControlsVisibility(this.configManager.get()),this.configManager.subscribe(n=>{this.updateControlsVisibility(n),this.gridRenderer.updateHighlightStyles(n)});const i=this.shadowRoot.querySelector(".grid-container");i.addEventListener("scanner:selection",n=>{const r=n.detail.item,c=this.shadowRoot.querySelector(".output-text");if(c){if(this.configManager.get().gridContent==="board"){if(r.targetPageId){this.setBoardPage(r.targetPageId);return}const g=r.message||r.label;g&&(c.textContent=(c.textContent||"")+g);return}const u=r.label,p=c.textContent||"";if(u==="Undo"){this.outputHistory.length>0&&(this.redoStack.push(p),c.textContent=this.outputHistory.pop()||"");return}if(u==="Redo"){this.redoStack.length>0&&(this.outputHistory.push(p),c.textContent=this.redoStack.pop()||"");return}this.outputHistory.push(p),this.redoStack=[],u==="Backspace"?c.textContent=p.slice(0,-1):u==="Clear"?c.textContent="":u==="Enter"?c.textContent=p+`
`:u==="Space"?c.textContent=p+" ":c.textContent=p+u}}),i.addEventListener("scanner:redraw",()=>{const n=this.configManager.get();this.updateGrid(n,!1)}),i.addEventListener("mousemove",n=>{const o=n.target.closest(".grid-cell");this.handleDwell(o)}),i.addEventListener("mouseleave",()=>{this.handleDwell(null)})}handleDwell(t){if(this.currentDwellTarget===t)return;this.dwellTimer&&(window.clearTimeout(this.dwellTimer),this.dwellTimer=null),this.currentDwellTarget&&this.currentDwellTarget.classList.remove("dwell-active"),this.currentDwellTarget=t;const i=this.configManager.get();t&&i.dwellTime>0&&(t.classList.add("dwell-active"),this.dwellTimer=window.setTimeout(()=>{this.currentDwellTarget===t&&(this.triggerItemSelection(t),t.classList.remove("dwell-active"),this.currentDwellTarget=null)},i.dwellTime))}triggerItemSelection(t){const i=parseInt(t.dataset.index||"-1",10);if(i>=0){this.gridRenderer.setSelected(i);const a=this.gridRenderer.getItem(i);if(a){const n=new CustomEvent("scanner:selection",{bubbles:!0,composed:!0,detail:{item:a}});this.gridRenderer.getContainer().dispatchEvent(n),this.audioManager&&this.audioManager.playSelectSound()}}}generateNumbers(t){const i=[];for(let a=1;a<=t;a++)i.push({id:`item-${a}`,label:a.toString(),type:"action"});return i}async generateKeyboard(t){await this.alphabetManager.loadLanguage(t.language);const a=this.alphabetManager.getCharacters(t.layoutMode).map((n,o)=>({id:`char-${o}`,label:n,type:"char"}));return[" ",".",",","?","!","Backspace","Clear","Enter"].forEach((n,o)=>{a.push({id:`ctrl-${o}`,label:n===" "?"Space":n,type:"action"})}),a}getHeatmapColor(t,i){return`hsl(${120*(1-Math.min(t/i,1))}, 80%, 80%)`}applyVisualization(t,i){return!this.currentScanner||i.viewMode==="standard"?t:t.map((a,n)=>{if(!a)return a;const o=this.currentScanner.getCost(n),r={...a};return i.viewMode==="cost-numbers"?r.label=o.toString():i.viewMode==="cost-heatmap"&&(r.backgroundColor=this.getHeatmapColor(o,i.heatmapMax),r.textColor="#000"),r})}async updateGrid(t,i=!1){if(t.gridContent==="board"){const c=this.buildBoardGrid(),h=(c==null?void 0:c.items)||[],u=(c==null?void 0:c.cols)||0;if(this.gridRenderer.render(h,u||1),t.viewMode!=="standard"&&this.currentScanner){const p=this.applyVisualization(h,t);this.gridRenderer.render(p,u||1)}this.gridRenderer.updateHighlightStyles({highlightBorderWidth:t.highlightBorderWidth,highlightBorderColor:t.highlightBorderColor,highlightScale:t.highlightScale,highlightOpacity:t.highlightOpacity,highlightAnimation:t.highlightAnimation,highlightScanLine:t.highlightScanLine,scanDirection:t.scanDirection,scanPattern:t.scanPattern,scanRate:t.scanRate}),this.updateContinuousOverlay(t);return}i&&(this.customItems&&this.customItems.length>0?this.baseItems=this.customItems:t.gridContent==="keyboard"?this.baseItems=await this.generateKeyboard(t):this.baseItems=this.generateNumbers(t.gridSize));const a=this.baseItems.length;let n=Math.ceil(Math.sqrt(a));this.forcedGridCols&&this.forcedGridCols>0&&(n=this.forcedGridCols);const o=Math.ceil(a/n);let r=this.baseItems;if(this.currentScanner&&(r=this.currentScanner.mapContentToGrid(this.baseItems,o,n)),this.gridRenderer.render(r,n),t.viewMode!=="standard"&&this.currentScanner){const c=this.applyVisualization(r,t);this.gridRenderer.render(c,n)}this.gridRenderer.updateHighlightStyles({highlightBorderWidth:t.highlightBorderWidth,highlightBorderColor:t.highlightBorderColor,highlightScale:t.highlightScale,highlightOpacity:t.highlightOpacity,highlightAnimation:t.highlightAnimation,highlightScanLine:t.highlightScanLine,scanDirection:t.scanDirection,scanPattern:t.scanPattern,scanRate:t.scanRate}),this.updateContinuousOverlay(t)}createScanner(t){if(console.log("[SwitchScannerElement] Creating scanner with config:",{scanMode:t.scanMode,scanPattern:t.scanPattern,scanTechnique:t.scanTechnique,continuousTechnique:t.continuousTechnique}),t.scanMode==="cause-effect")return new rt(this.scanSurface,this.configManager,this.scanCallbacks);if(t.scanMode==="group-row-column")return new it(this.scanSurface,this.configManager,this.scanCallbacks);if(t.scanMode==="continuous")return console.log("[SwitchScannerElement] Creating ContinuousScanner"),new nt(this.scanSurface,this.configManager,this.scanCallbacks);if(t.scanMode==="probability")return new ot(this.scanSurface,this.configManager,this.scanCallbacks);if(t.scanMode==="color-code")return new ct(this.scanSurface,this.configManager,this.scanCallbacks);switch(t.scanPattern){case"linear":return new V(this.scanSurface,this.configManager,this.scanCallbacks);case"snake":return new tt(this.scanSurface,this.configManager,this.scanCallbacks);case"quadrant":return new et(this.scanSurface,this.configManager,this.scanCallbacks);case"elimination":return new st(this.scanSurface,this.configManager,this.scanCallbacks);case"column-row":return new F(this.scanSurface,this.configManager,this.scanCallbacks);case"row-column":default:return new F(this.scanSurface,this.configManager,this.scanCallbacks)}}setScanner(t){console.log("[SwitchScannerElement] setScanner called"),this.currentScanner&&(console.log("[SwitchScannerElement] Stopping current scanner"),this.currentScanner.stop()),this.currentScanner=this.createScanner(t),this.updateContinuousOverlay(t),this.gridRenderer.updateHighlightStyles({highlightBorderWidth:t.highlightBorderWidth,highlightBorderColor:t.highlightBorderColor,highlightScale:t.highlightScale,highlightOpacity:t.highlightOpacity,highlightAnimation:t.highlightAnimation,highlightScanLine:t.highlightScanLine,scanDirection:t.scanDirection,scanPattern:t.scanPattern,scanRate:t.scanRate}),console.log("[SwitchScannerElement] Starting new scanner:",this.currentScanner.constructor.name),this.currentScanner.start()}updateContinuousOverlay(t){if(t.scanMode==="continuous"){this.continuousOverlay||(this.continuousOverlay=new ut(this.gridRenderer.getContainer()));return}this.continuousOverlay&&(this.continuousOverlay.destroy(),this.continuousOverlay=null)}}customElements.get("switch-scanner")||customElements.define("switch-scanner",gt);
