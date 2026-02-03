var O=Object.defineProperty;var H=(n,i,t)=>i in n?O(n,i,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[i]=t;var d=(n,i,t)=>H(n,typeof i!="symbol"?i+"":i,t);import{g as z,l as W,c as N,a as X,b as G}from"./chunks/vendor-BxuKZLiO.js";const b=class b{constructor(i,t=!0){d(this,"config");d(this,"listeners",[]);this.config={...b.DEFAULTS,...i},t&&this.loadFromUrl()}loadFromUrl(){const i=new URLSearchParams(window.location.search);if(i.has("ui")&&i.get("ui")==="hidden"&&(this.config.showUI=!1),i.has("rate")){const t=parseInt(i.get("rate"),10);isNaN(t)||(this.config.scanRate=t)}if(i.has("dwell")){const t=parseInt(i.get("dwell"),10);isNaN(t)||(this.config.dwellTime=t)}if(i.has("strategy")){const t=i.get("strategy");t==="group-row-column"?this.config.scanMode="group-row-column":t==="continuous"?this.config.scanMode="continuous":t==="probability"?this.config.scanMode="probability":["row-column","column-row","linear","snake","quadrant","elimination"].includes(t)&&(this.config.scanPattern=t)}if(i.has("pattern")){const t=i.get("pattern");["row-column","column-row","linear","snake","quadrant","elimination"].includes(t)&&(this.config.scanPattern=t,this.config.scanMode=null)}if(i.has("technique")){const t=i.get("technique");(t==="block"||t==="point")&&(this.config.scanTechnique=t)}if(i.has("mode")){const t=i.get("mode");t==="group-row-column"||t==="continuous"||t==="probability"||t==="cause-effect"?this.config.scanMode=t:(t==="null"||t==="none"||t==="")&&(this.config.scanMode=null)}if(i.has("continuous-technique")){const t=i.get("continuous-technique");(t==="gliding"||t==="crosshair")&&(this.config.continuousTechnique=t)}if(i.has("content")&&i.get("content")==="keyboard"&&(this.config.gridContent="keyboard"),i.has("lang")&&(this.config.language=i.get("lang")),i.has("layout")){const t=i.get("layout");(t==="alphabetical"||t==="frequency")&&(this.config.layoutMode=t)}if(i.has("view")){const t=i.get("view");(t==="standard"||t==="cost-numbers"||t==="cost-heatmap")&&(this.config.viewMode=t)}if(i.has("heatmax")){const t=parseInt(i.get("heatmax"),10);isNaN(t)||(this.config.heatmapMax=t)}}get(){return{...this.config}}update(i){this.config={...this.config,...i},this.notify()}subscribe(i){this.listeners.push(i),i(this.config)}notify(){this.listeners.forEach(i=>i(this.config))}};d(b,"DEFAULTS",{scanRate:1e3,acceptanceTime:0,dwellTime:0,postSelectionDelay:0,initialScanDelay:500,initialItemPause:0,scanPauseDelay:300,scanLoops:4,scanInputMode:"auto",autoRepeat:!1,repeatDelay:500,repeatTime:200,scanDirection:"circular",scanPattern:"row-column",scanTechnique:"block",scanMode:null,continuousTechnique:"crosshair",compassMode:"continuous",eliminationSwitchCount:4,allowEmptyItems:!1,cancelMethod:"button",longHoldTime:1e3,criticalOverscan:{enabled:!1,fastRate:100,slowRate:1e3},colorCode:{errorRate:.1,selectThreshold:.95},gridContent:"numbers",gridSize:64,showUI:!0,soundEnabled:!1,useImageButton:!0,buttonColor:"blue",customButtonImages:{normal:void 0,pressed:void 0},language:"en",layoutMode:"alphabetical",viewMode:"standard",heatmapMax:20,highlightBorderWidth:4,highlightBorderColor:"#FF9800",highlightScale:1,highlightOpacity:1,highlightAnimation:!1,highlightScanLine:!1});let x=b;class Z{constructor(i=!0){d(this,"ctx",null);d(this,"enabled",!0);this.enabled=i}setEnabled(i){this.enabled=i}initCtx(){this.ctx||(this.ctx=new(window.AudioContext||window.webkitAudioContext))}playBeep(i=440,t=.1,e="sine"){if(!this.enabled||(this.initCtx(),!this.ctx))return;this.ctx.state==="suspended"&&this.ctx.resume();const o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type=e,o.frequency.setValueAtTime(i,this.ctx.currentTime),s.gain.setValueAtTime(.1,this.ctx.currentTime),s.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+t),o.connect(s),s.connect(this.ctx.destination),o.start(),o.stop(this.ctx.currentTime+t)}playScanSound(){this.playBeep(800,.05,"square")}playSelectSound(){this.playBeep(1200,.1,"sine")}playErrorSound(){this.playBeep(200,.3,"sawtooth")}}class U extends EventTarget{constructor(t,e=window){super();d(this,"configManager");d(this,"keyMap");d(this,"activeTimers",new Map);d(this,"targetElement");this.configManager=t,this.targetElement=e,this.keyMap=new Map([[" ","select"],["Enter","select"],["1","switch-1"],["2","switch-2"],["3","switch-3"],["4","switch-4"],["5","switch-5"],["6","switch-6"],["7","switch-7"],["8","switch-8"],["r","reset"],["R","reset"],["c","cancel"],["C","cancel"],["s","menu"],["S","menu"]]),this.bindEvents()}isIgnoredEvent(t){const e=t.composedPath?t.composedPath():[];for(const s of e)if(s instanceof HTMLElement&&(s.classList.contains("settings-overlay")||s.id==="settings-overlay"||s.classList.contains("settings-btn")||s.classList.contains("controls")))return!0;const o=t.target;return!!(o&&typeof o.closest=="function"&&(o.closest(".settings-overlay")||o.closest("#settings-overlay")||o.closest(".settings-btn")||o.closest(".controls")))}bindEvents(){this.targetElement.addEventListener("keydown",this.handleKeyDown.bind(this)),this.targetElement.addEventListener("keyup",this.handleKeyUp.bind(this)),this.targetElement.addEventListener("mousedown",t=>{this.isIgnoredEvent(t)||this.handleSwitchDown("select")}),this.targetElement.addEventListener("mouseup",t=>{this.isIgnoredEvent(t)||this.handleSwitchUp("select")}),this.targetElement.addEventListener("touchstart",t=>{if(this.isIgnoredEvent(t))return;t.preventDefault(),this.handleSwitchDown("select")}),this.targetElement.addEventListener("touchend",t=>{this.isIgnoredEvent(t)||this.handleSwitchUp("select")})}handleKeyDown(t){if(!t.repeat&&this.keyMap.has(t.key)){const e=this.keyMap.get(t.key);(e==="select"||e==="step")&&t.preventDefault(),this.handleSwitchDown(e)}}handleKeyUp(t){if(this.keyMap.has(t.key)){const e=this.keyMap.get(t.key);this.handleSwitchUp(e)}}handleSwitchDown(t){const e=this.configManager.get(),o=e.acceptanceTime,s=e.longHoldTime,a=e.cancelMethod;if(a==="long-hold"&&s>0){const r=window.setTimeout(()=>{this.triggerAction("cancel"),this.activeTimers.has(t)&&(clearTimeout(this.activeTimers.get(t)),this.activeTimers.delete(t)),this.activeTimers.set(`${t}_handled`,-1)},s);this.activeTimers.set(`${t}_longhold`,r)}if(o>0){const r=window.setTimeout(()=>{this.activeTimers.has(`${t}_handled`)||(this.triggerAction(t),this.activeTimers.delete(t),this.activeTimers.has(`${t}_longhold`)&&(clearTimeout(this.activeTimers.get(`${t}_longhold`)),this.activeTimers.delete(`${t}_longhold`)))},o);this.activeTimers.set(t,r)}else if(a==="long-hold"&&s>0){const r=window.setTimeout(()=>{this.activeTimers.has(`${t}_handled`)||(this.triggerAction(t),this.activeTimers.delete(t))},s+50);this.activeTimers.set(t,r)}else this.triggerAction(t)}handleSwitchUp(t){if(this.activeTimers.has(`${t}_longhold`)&&(clearTimeout(this.activeTimers.get(`${t}_longhold`)),this.activeTimers.delete(`${t}_longhold`)),this.activeTimers.has(`${t}_handled`)){this.activeTimers.delete(`${t}_handled`);return}this.activeTimers.has(t)&&(clearTimeout(this.activeTimers.get(t)),this.activeTimers.delete(t),this.triggerAction(t))}triggerAction(t){const e=new CustomEvent("switch",{detail:{action:t}});this.dispatchEvent(e),console.log(`Switch Action: ${t}`)}}class _{constructor(i){d(this,"container");d(this,"items",[]);d(this,"elements",[]);d(this,"columns",8);d(this,"highlightConfig",null);if(typeof i=="string"){const t=document.getElementById(i);if(!t)throw new Error(`Container ${i} not found`);this.container=t}else this.container=i}getContainer(){return this.container}updateHighlightStyles(i){this.highlightConfig=i;const t=i.highlightScanLine?0:i.highlightBorderWidth;this.container.style.setProperty("--focus-border-width",`${t}px`),this.container.style.setProperty("--focus-color",i.highlightBorderColor),this.container.style.setProperty("--focus-scale",i.highlightScale.toString()),this.container.style.setProperty("--focus-opacity",i.highlightOpacity.toString()),this.container.style.setProperty("--focus-animation",i.highlightAnimation?"pulse":"none"),this.container.style.setProperty("--scan-line-enabled",i.highlightScanLine?"1":"0");const e=i.scanPattern==="column-row"?"vertical":"horizontal";this.container.style.setProperty("--scan-line-orientation",e);const o=i.scanDirection==="reverse"?"reverse":"forward";this.container.style.setProperty("--scan-line-direction",o),i.scanRate&&this.container.style.setProperty("--scan-line-duration",`${i.scanRate}ms`)}render(i,t=8){this.items=i,this.columns=t,this.container.innerHTML="",this.elements=[],this.container.style.gridTemplateColumns=`repeat(${t}, 1fr)`,i.forEach((e,o)=>{const s=document.createElement("div");if(s.className="grid-cell",e.image){const a=document.createElement("img");if(a.src=e.image,a.alt=e.label,a.style.maxWidth="100%",a.style.maxHeight="100%",a.style.objectFit="contain",s.appendChild(a),e.label){const r=document.createElement("span");r.textContent=e.label,r.style.marginTop="5px",s.appendChild(r),s.style.flexDirection="column"}}else s.textContent=e.label;s.dataset.index=o.toString(),s.dataset.id=e.id,e.backgroundColor&&(s.style.backgroundColor=e.backgroundColor),e.textColor&&(s.style.color=e.textColor),this.container.appendChild(s),this.elements.push(s)})}setFocus(i,t){const e=t??this.highlightConfig??void 0;t&&this.updateHighlightStyles(t),this.elements.forEach(s=>{s.classList.remove("scan-focus"),s.classList.remove("animate-pulse"),s.classList.remove("scan-line-vertical"),s.classList.remove("scan-line-reverse"),s.classList.remove("scan-line-only"),s.style.removeProperty("--scan-line-duration"),s.style.removeProperty("--scan-line-delay")});const o=e!=null&&e.scanRate&&i.length>0?Math.max(100,Math.floor(e.scanRate/i.length)):void 0;i.forEach((s,a)=>{if(this.elements[s]){const r=this.elements[s];r.classList.add("scan-focus"),e!=null&&e.highlightAnimation&&r.classList.add("animate-pulse"),e!=null&&e.highlightScanLine&&(r.classList.add("scan-line-only"),(e==null?void 0:e.scanPattern)==="column-row"&&r.classList.add("scan-line-vertical"),(e==null?void 0:e.scanDirection)==="reverse"&&r.classList.add("scan-line-reverse"),o&&(r.style.setProperty("--scan-line-duration",`${o}ms`),r.style.setProperty("--scan-line-delay",`${a*o}ms`)))}})}setSelected(i){if(this.elements[i]){const t=this.elements[i];t.classList.add("selected"),setTimeout(()=>t.classList.remove("selected"),500)}}getElement(i){return this.elements[i]}getItem(i){return this.items[i]}getItemsCount(){return this.items.length}}class Q{constructor(i,t,e){d(this,"container");d(this,"formContainer");d(this,"configManager");d(this,"alphabetManager");d(this,"isVisible",!1);this.configManager=i,this.alphabetManager=t,this.container=e,this.container.querySelector(".settings-content")?this.formContainer=this.container.querySelector("#settings-form"):this.renderStructure(),this.initUI(),this.bindEvents(),this.configManager.get().showUI||this.container.classList.add("hidden")}renderStructure(){this.container.innerHTML=`
        <div class="settings-content">
          <div class="settings-header">
            <h2>Scanner Settings</h2>
            <button id="close-settings" class="close-btn" aria-label="Close settings">&times;</button>
          </div>
          <div id="settings-form"></div>
        </div>
      `,this.formContainer=this.container.querySelector("#settings-form")}initUI(){const i=this.configManager.get(),e=this.alphabetManager.getLanguages().map(r=>`<option value="${r.code}">${r.name}</option>`).join(""),o=`
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

        <div class="form-row" id="continuous-options" style="display: ${i.scanMode==="continuous"?"flex":"none"}">
          <div class="form-group">
            <label for="continuousTechnique">Continuous Technique</label>
            <select id="continuousTechnique" class="setting-input" name="continuousTechnique">
              <option value="gliding">Gliding Cursor</option>
              <option value="crosshair">Crosshair</option>
              <option value="eight-direction">Eight-Direction (Compass)</option>
            </select>
            <small>Gliding: Buffer zone | Crosshair: X-Y lines | Compass: 8-directional movement</small>
          </div>

          <div class="form-group" id="compass-mode-option" style="display: ${i.continuousTechnique==="eight-direction"?"block":"none"}">
            <label for="compassMode">Compass Mode</label>
            <select id="compassMode" class="setting-input" name="compassMode">
              <option value="continuous">Continuous (Fluid)</option>
              <option value="fixed-8">Fixed 8 Directions</option>
            </select>
            <small>Continuous: Smooth clock rotation | Fixed-8: 8 discrete directions</small>
          </div>
        </div>

      <div class="form-row" id="elimination-options" style="display: ${i.scanPattern==="elimination"?"flex":"none"}">
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

        <div class="form-row" id="pattern-options" style="display: ${i.scanMode?"none":"flex"}">
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
          <label for="scanRate">Scan Rate <span class="value-display">${i.scanRate}ms</span></label>
          <input type="range" id="scanRate" class="setting-input range-input" name="scanRate"
                 value="${i.scanRate}" min="100" max="5000" step="100">
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
            <label for="gridSize">Grid Size <span class="value-display">${i.gridSize}</span></label>
            <input type="number" id="gridSize" class="setting-input" name="gridSize"
                   value="${i.gridSize}" min="4" max="100"
                   ${i.gridContent==="keyboard"||i.gridContent==="board"?"disabled":""}>
            <small>Number of items (disabled for keyboard/board mode)</small>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="language">Language</label>
            <select id="language" class="setting-input" name="language">
              ${e}
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
            <label for="initialScanDelay">Initial Scan Delay <span class="value-display">${i.initialScanDelay}ms</span></label>
            <input type="range" id="initialScanDelay" class="setting-input range-input" name="initialScanDelay"
                   value="${i.initialScanDelay}" min="0" max="2000" step="100">
            <small>Delay before first scan starts</small>
          </div>

          <div class="form-group">
            <label for="scanPauseDelay">Scan Pause Delay <span class="value-display">${i.scanPauseDelay}ms</span></label>
            <input type="range" id="scanPauseDelay" class="setting-input range-input" name="scanPauseDelay"
                   value="${i.scanPauseDelay}" min="0" max="1000" step="50">
            <small>Pause between hierarchical stages</small>
          </div>
        </div>

        <div class="form-group">
          <label for="initialItemPause">Initial Item Pause <span class="value-display">${i.initialItemPause}ms</span></label>
          <input type="range" id="initialItemPause" class="setting-input range-input" name="initialItemPause"
                 value="${i.initialItemPause}" min="0" max="3000" step="100">
          <small>Extended highlight on first item (0 = normal scan rate)</small>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="autoRepeat" ${i.autoRepeat?"checked":""}>
            <span>Auto-Repeat Selections</span>
          </label>
          <small>Automatically repeat selections when holding</small>
        </div>

        <div class="form-row" id="repeat-options" style="display: ${i.autoRepeat?"flex":"none"}">
          <div class="form-group">
            <label for="repeatDelay">Repeat Delay <span class="value-display">${i.repeatDelay}ms</span></label>
            <input type="range" id="repeatDelay" class="setting-input range-input" name="repeatDelay"
                   value="${i.repeatDelay}" min="100" max="2000" step="100">
            <small>Hold time before repeat starts</small>
          </div>

          <div class="form-group">
            <label for="repeatTime">Repeat Time <span class="value-display">${i.repeatTime}ms</span></label>
            <input type="range" id="repeatTime" class="setting-input range-input" name="repeatTime"
                   value="${i.repeatTime}" min="50" max="1000" step="50">
            <small>Time between successive repeats</small>
          </div>
        </div>

        <div class="form-group">
          <label for="acceptanceTime">Acceptance Time <span class="value-display">${i.acceptanceTime}ms</span></label>
          <input type="range" id="acceptanceTime" class="setting-input range-input" name="acceptanceTime"
                 value="${i.acceptanceTime}" min="0" max="2000" step="50">
          <small>How long to highlight selection before confirming (0 = instant)</small>
        </div>

        <div class="form-group">
          <label for="dwellTime">Dwell Time <span class="value-display">${i.dwellTime}ms</span></label>
          <input type="range" id="dwellTime" class="setting-input range-input" name="dwellTime"
                 value="${i.dwellTime}" min="0" max="5000" step="100">
          <small>Auto-select on hover (0 = off)</small>
        </div>

        <div class="form-group">
          <label for="scanLoops">Scan Loops <span class="value-display">${i.scanLoops}</span></label>
          <input type="range" id="scanLoops" class="setting-input range-input" name="scanLoops"
                 value="${i.scanLoops}" min="0" max="20" step="1">
          <small>Number of complete scan cycles (0 = infinite)</small>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="allowEmptyItems" ${i.allowEmptyItems?"checked":""}>
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

        <div class="form-group" id="longHoldOptions" style="display: ${i.cancelMethod==="long-hold"?"block":"none"}">
          <label for="longHoldTime">Long Hold Time <span class="value-display">${i.longHoldTime}ms</span></label>
          <input type="range" id="longHoldTime" class="setting-input range-input" name="longHoldTime"
                 value="${i.longHoldTime}" min="500" max="3000" step="100">
          <small>Hold duration to trigger cancel (500-3000ms)</small>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="criticalOverscanEnabled" ${i.criticalOverscan.enabled?"checked":""}>
            <span>Enable Critical Overscan</span>
          </label>
          <small>Two-stage scanning: fast scan → slow backward scan → select</small>
        </div>

        <div id="criticalOverscanOptions" style="display: ${i.criticalOverscan.enabled?"block":"none"}">
          <div class="form-group">
            <label for="criticalOverscanFastRate">Fast Scan Rate <span class="value-display">${i.criticalOverscan.fastRate}ms</span></label>
            <input type="range" id="criticalOverscanFastRate" class="setting-input range-input" name="criticalOverscanFastRate"
                   value="${i.criticalOverscan.fastRate}" min="50" max="500" step="10">
            <small>Speed of initial fast scan (50-500ms)</small>
          </div>

          <div class="form-group">
            <label for="criticalOverscanSlowRate">Slow Scan Rate <span class="value-display">${i.criticalOverscan.slowRate}ms</span></label>
            <input type="range" id="criticalOverscanSlowRate" class="setting-input range-input" name="criticalOverscanSlowRate"
                   value="${i.criticalOverscan.slowRate}" min="500" max="3000" step="100">
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
                   value="${i.heatmapMax}" min="1" max="100">
            <small>Max cost for heatmap color scale</small>
          </div>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="soundEnabled" ${i.soundEnabled?"checked":""}>
            <span>Sound Enabled</span>
          </label>
          <small>Play sounds when scanning and selecting</small>
        </div>

        <div class="form-group">
          <label for="highlightBorderWidth">Highlight Border Width <span class="value-display">${i.highlightBorderWidth}px</span></label>
          <input type="range" id="highlightBorderWidth" class="setting-input range-input" name="highlightBorderWidth"
                 value="${i.highlightBorderWidth}" min="0" max="10" step="1">
          <small>Thickness of highlight outline (0-10px)</small>
        </div>

        <div class="form-group">
          <label for="highlightBorderColor">Highlight Border Color</label>
          <input type="color" id="highlightBorderColor" class="setting-input" name="highlightBorderColor"
                 value="${i.highlightBorderColor}">
          <small>Color of highlight outline (orange by default)</small>
        </div>

        <div class="form-group">
          <label for="highlightScale">Highlight Scale <span class="value-display">${i.highlightScale}x</span></label>
          <input type="range" id="highlightScale" class="setting-input range-input" name="highlightScale"
                 value="${i.highlightScale}" min="1.0" max="1.5" step="0.05">
          <small>Size multiplier for highlighted items (1.0-1.5, 1.0 = no zoom)</small>
        </div>

        <div class="form-group">
          <label for="highlightOpacity">Highlight Opacity <span class="value-display">${i.highlightOpacity}</span></label>
          <input type="range" id="highlightOpacity" class="setting-input range-input" name="highlightOpacity"
                 value="${i.highlightOpacity}" min="0.3" max="1.0" step="0.05">
          <small>Opacity of highlighted items (0.3-1.0, 1.0 = fully opaque)</small>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="setting-input" name="highlightAnimation" ${i.highlightAnimation?"checked":""}>
            <span>Highlight Animation</span>
          </label>
          <small>Enable pulse animation on highlighted items</small>
        </div>
      </div>
    `;this.formContainer.innerHTML=o;const s=(r,l)=>{const h=this.formContainer.querySelector(`[name="${r}"]`);h&&(h.value=l)};s("scanPattern",i.scanPattern),s("scanTechnique",i.scanTechnique),s("scanDirection",i.scanDirection),s("cancelMethod",i.cancelMethod),s("longHoldTime",i.longHoldTime.toString()),s("scanMode",i.scanMode||"null"),s("continuousTechnique",i.continuousTechnique),s("compassMode",i.compassMode),s("scanInputMode",i.scanInputMode),s("gridContent",i.gridContent),s("language",i.language),s("layoutMode",i.layoutMode),s("viewMode",i.viewMode),this.updateUIState(i);const a=this.formContainer.querySelector("#repeat-options");a&&(a.style.display=i.autoRepeat?"flex":"none")}updateUIState(i){const t=this.formContainer.querySelector('[name="scanTechnique"]'),e=this.formContainer.querySelector('[name="scanPattern"]'),o=this.formContainer.querySelector("#continuous-options"),s=this.formContainer.querySelector("#pattern-options"),a=this.formContainer.querySelector("#compass-mode-option");o&&(o.style.display=i.scanMode==="continuous"?"flex":"none"),a&&(a.style.display=i.continuousTechnique==="eight-direction"?"block":"none");const r=this.formContainer.querySelector("#elimination-options");r&&(r.style.display=i.scanPattern==="elimination"?"flex":"none"),s&&(s.style.display=i.scanMode?"none":"flex");const l=["row-column","column-row","linear","snake"],h=!i.scanMode&&l.includes(i.scanPattern);t&&(t.disabled=!h,t.style.opacity=h?"1":"0.5");const u=this.formContainer.querySelector("#techniqueHint");u&&t&&(h?u.textContent="For row/col/linear/snake patterns only":i.scanMode?u.textContent="Disabled by special mode":u.textContent="Not available for "+e.value)}bindEvents(){var i;(i=this.container.querySelector(".close-btn"))==null||i.addEventListener("click",()=>{this.toggle(!1)}),this.container.addEventListener("click",t=>{t.target===this.container&&this.toggle(!1)}),this.formContainer.addEventListener("change",t=>{const e=t.target;if(!e||!e.classList.contains("setting-input"))return;const o=e.getAttribute("name"),s={};switch(o){case"scanPattern":s.scanPattern=e.value,s.scanMode=null;break;case"scanTechnique":s.scanTechnique=e.value;break;case"scanDirection":s.scanDirection=e.value;break;case"scanMode":const a=e.value==="null"?null:e.value;s.scanMode=a;break;case"continuousTechnique":s.continuousTechnique=e.value;break;case"compassMode":s.compassMode=e.value;break;case"eliminationSwitchCount":s.eliminationSwitchCount=parseInt(e.value,10);break;case"gridContent":s.gridContent=e.value;const r=this.formContainer.querySelector('[name="gridSize"]');r&&(r.disabled=e.value==="keyboard");break;case"scanRate":s.scanRate=parseInt(e.value,10),this.updateValueDisplay("scanRate",e.value+"ms");break;case"acceptanceTime":s.acceptanceTime=parseInt(e.value,10),this.updateValueDisplay("acceptanceTime",e.value+"ms");break;case"dwellTime":s.dwellTime=parseInt(e.value,10),this.updateValueDisplay("dwellTime",e.value+"ms");break;case"allowEmptyItems":s.allowEmptyItems=e.checked;break;case"cancelMethod":s.cancelMethod=e.value;break;case"longHoldTime":s.longHoldTime=parseInt(e.value,10),this.updateValueDisplay("longHoldTime",e.value+"ms");break;case"gridSize":s.gridSize=parseInt(e.value,10),this.updateValueDisplay("gridSize",e.value);break;case"soundEnabled":s.soundEnabled=e.checked;break;case"language":s.language=e.value;break;case"layoutMode":s.layoutMode=e.value;break;case"viewMode":s.viewMode=e.value;break;case"heatmapMax":s.heatmapMax=parseInt(e.value,10);break;case"scanInputMode":s.scanInputMode=e.value;break;case"initialScanDelay":s.initialScanDelay=parseInt(e.value,10),this.updateValueDisplay("initialScanDelay",e.value+"ms");break;case"scanPauseDelay":s.scanPauseDelay=parseInt(e.value,10),this.updateValueDisplay("scanPauseDelay",e.value+"ms");break;case"initialItemPause":s.initialItemPause=parseInt(e.value,10),this.updateValueDisplay("initialItemPause",e.value+"ms");break;case"scanLoops":s.scanLoops=parseInt(e.value,10),this.updateValueDisplay("scanLoops",e.value==="0"?"Infinite":e.value);break;case"autoRepeat":s.autoRepeat=e.checked;break;case"repeatDelay":s.repeatDelay=parseInt(e.value,10),this.updateValueDisplay("repeatDelay",e.value+"ms");break;case"repeatTime":s.repeatTime=parseInt(e.value,10),this.updateValueDisplay("repeatTime",e.value+"ms");break;case"criticalOverscanEnabled":s.criticalOverscan={...this.configManager.get().criticalOverscan,enabled:e.checked};break;case"criticalOverscanFastRate":s.criticalOverscan={...this.configManager.get().criticalOverscan,fastRate:parseInt(e.value,10)},this.updateValueDisplay("criticalOverscanFastRate",e.value+"ms");break;case"criticalOverscanSlowRate":s.criticalOverscan={...this.configManager.get().criticalOverscan,slowRate:parseInt(e.value,10)},this.updateValueDisplay("criticalOverscanSlowRate",e.value+"ms");break;case"highlightBorderWidth":s.highlightBorderWidth=parseInt(e.value,10),this.updateValueDisplay("highlightBorderWidth",e.value+"px");break;case"highlightBorderColor":s.highlightBorderColor=e.value;break;case"highlightScale":s.highlightScale=parseFloat(e.value),this.updateValueDisplay("highlightScale",e.value+"x");break;case"highlightOpacity":s.highlightOpacity=parseFloat(e.value),this.updateValueDisplay("highlightOpacity",e.value);break;case"highlightAnimation":s.highlightAnimation=e.checked;break}if(this.configManager.update(s),(o==="scanPattern"||o==="scanMode"||o==="continuousTechnique"||o==="cancelMethod")&&this.updateUIState({...this.configManager.get(),...s}),o==="cancelMethod"){const a=this.formContainer.querySelector("#longHoldOptions");a&&(a.style.display=e.value==="long-hold"?"block":"none")}if(o==="autoRepeat"){const a=this.formContainer.querySelector("#repeat-options");a&&(a.style.display=e.checked?"flex":"none")}if(o==="criticalOverscanEnabled"){const a=this.formContainer.querySelector("#criticalOverscanOptions");a&&(a.style.display=e.checked?"block":"none")}}),this.formContainer.addEventListener("input",t=>{const e=t.target;if(!e||!e.classList.contains("range-input"))return;const o=e.getAttribute("name");o&&this.updateValueDisplay(o,e.value+"ms")})}updateValueDisplay(i,t){const e=this.formContainer.querySelector(`label[for="${i}"]`);if(e){const o=e.querySelector(".value-display");o&&(o.textContent=t)}}toggle(i){this.isVisible=i!==void 0?i:!this.isVisible,this.isVisible?this.container.classList.remove("hidden"):this.container.classList.add("hidden")}}class Y{constructor(){d(this,"languages",[]);d(this,"initialized",!1);d(this,"currentAlphabet",null)}async init(){if(!this.initialized)try{const i=await z();console.log("AlphabetManager: Loaded Index Data",i);const t=new Intl.DisplayNames(["en"],{type:"language"});this.languages=i.filter(e=>!(e.scripts||[]).some(a=>["Hant","Hans","Jpan","Kore"].includes(a))).map(e=>{var a;let o=e["language-name"];const s=e.language;if(!o||o===s)try{const r=t.of(s);r&&r!==s?o=r:o=s}catch{o=s}return{code:s,name:o,script:(a=e.scripts)==null?void 0:a[0]}}).sort((e,o)=>(e.name||"").localeCompare(o.name||"")),this.initialized=!0}catch(i){console.error("Failed to load language index",i),this.languages=[{code:"en",name:"English",script:"Latn"}]}}getLanguages(){return this.languages}async loadLanguage(i,t){try{const e=await W(i,t);return this.currentAlphabet=e,e}catch(e){return console.error(`Failed to load alphabet for ${i}`,e),null}}getCharacters(i="alphabetical"){if(!this.currentAlphabet)return[];let t=[...this.currentAlphabet.uppercase];if(t.length===0&&(t=[...this.currentAlphabet.alphabetical]),i==="frequency"){const e=this.currentAlphabet.frequency||{};t.sort((o,s)=>{const a=o.toLowerCase(),r=s.toLowerCase(),l=e[a]||0;return(e[r]||0)-l})}return t}}var j=Object.defineProperty,K=(n,i,t)=>i in n?j(n,i,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[i]=t,c=(n,i,t)=>K(n,typeof i!="symbol"?i+"":i,t),m=class{constructor(n,i,t={}){c(this,"surface"),c(this,"config"),c(this,"callbacks"),c(this,"isRunning",!1),c(this,"timer",null),c(this,"stepCount",0),c(this,"overscanState","fast"),c(this,"loopCount",0),this.surface=n,this.config=i,this.callbacks=t}start(){this.isRunning=!0,this.stepCount=0,this.loopCount=0,this.overscanState="fast",this.reset(),this.scheduleNextStep()}stop(){this.isRunning=!1,this.timer&&(clearTimeout(this.timer),this.timer=null),this.surface.setFocus([])}handleAction(n){var i,t;n==="select"?this.handleSelectAction():n==="step"?this.config.get().scanInputMode==="manual"&&(this.step(),this.stepCount++,(t=(i=this.callbacks).onScanStep)==null||t.call(i)):n==="reset"&&(this.loopCount=0,this.reset(),this.stepCount=0,this.overscanState="fast",this.config.get().scanInputMode==="auto"&&(this.isRunning=!0,this.timer&&clearTimeout(this.timer),this.scheduleNextStep()))}handleSelectAction(){if(this.config.get().criticalOverscan.enabled){if(this.overscanState==="fast"){this.overscanState="slow_backward",this.timer&&clearTimeout(this.timer),this.scheduleNextStep();return}else if(this.overscanState==="slow_backward"){this.overscanState="fast",this.doSelection();return}}this.doSelection()}reportCycleCompleted(){this.loopCount++;const n=this.config.get();n.scanLoops>0&&this.loopCount>=n.scanLoops&&(this.stop(),this.loopCount=0)}scheduleNextStep(){if(!this.isRunning)return;const n=this.config.get();if(n.scanInputMode==="manual")return;let i;n.criticalOverscan.enabled&&this.overscanState==="slow_backward"?i=n.criticalOverscan.slowRate:i=this.stepCount===0&&n.initialItemPause>0?n.initialItemPause:n.criticalOverscan.enabled?n.criticalOverscan.fastRate:n.scanRate,this.timer&&clearTimeout(this.timer),this.timer=window.setTimeout(()=>{var t,e;this.step(),(e=(t=this.callbacks).onScanStep)==null||e.call(t),this.stepCount++,this.scheduleNextStep()},i)}triggerSelection(n){var t,e,o,s;const i=(e=(t=this.surface).getItemData)==null?void 0:e.call(t,n);if(i!=null&&i.isEmpty){this.stepCount=0,this.timer&&clearTimeout(this.timer),this.scheduleNextStep();return}this.surface.setSelected(n),(s=(o=this.callbacks).onSelect)==null||s.call(o,n)}triggerRedraw(){var n,i;(i=(n=this.callbacks).onRedraw)==null||i.call(n)}mapContentToGrid(n,i,t){return n}},D=class extends m{constructor(){super(...arguments),c(this,"level","rows"),c(this,"currentRow",-1),c(this,"currentCol",-1),c(this,"totalRows",0),c(this,"isColumnRow",!1),c(this,"useBlockScanning",!0)}start(){const n=this.config.get();this.isColumnRow=n.scanPattern==="column-row",this.useBlockScanning=n.scanTechnique==="block",this.recalcDimensions(),super.start()}recalcDimensions(){const n=this.surface.getItemsCount();this.isColumnRow?this.totalRows=this.surface.getColumns():this.totalRows=Math.ceil(n/this.surface.getColumns())}reset(){this.level=this.useBlockScanning?"rows":"cells",this.currentRow=-1,this.currentCol=-1,this.surface.setFocus([])}step(){this.useBlockScanning&&this.level==="rows"?this.stepMajor():this.stepMinor()}stepMajor(){this.currentRow++,this.currentRow>=this.totalRows&&(this.currentRow=0),this.highlightMajor(this.currentRow)}stepMinor(){let n=0;const i=this.surface.getItemsCount(),t=this.surface.getColumns(),e=Math.ceil(i/t);if(this.useBlockScanning){if(this.isColumnRow){const s=this.currentRow,a=i%t||t;s<a?n=e:n=e-1}else{const s=this.currentRow*t;n=Math.min(t,i-s)}this.currentCol++,this.currentCol>=n&&(this.currentCol=0)}else this.currentCol++,this.currentCol>=i&&(this.currentCol=0);let o=-1;if(this.useBlockScanning)this.isColumnRow?o=this.currentCol*t+this.currentRow:o=this.currentRow*t+this.currentCol;else if(this.isColumnRow){const s=Math.floor(this.currentCol/t),a=this.currentCol%t;o=s*t+a}else o=this.currentCol;o>=0&&o<i&&this.surface.setFocus([o])}highlightMajor(n){const i=this.surface.getColumns(),t=this.surface.getItemsCount(),e=[];if(this.isColumnRow){const o=Math.ceil(t/i);for(let s=0;s<o;s++){const a=s*i+n;a<t&&e.push(a)}}else{const o=n*i,s=Math.min(o+i,t);for(let a=o;a<s;a++)e.push(a)}this.surface.setFocus(e)}handleAction(n){n==="cancel"?this.useBlockScanning&&this.level==="cells"?(this.level="rows",this.currentCol=-1,this.highlightMajor(this.currentRow),this.timer&&clearTimeout(this.timer),this.scheduleNextStep()):this.reset():super.handleAction(n)}doSelection(){if(this.useBlockScanning&&this.level==="rows")this.currentRow>=0&&(this.level="cells",this.currentCol=-1,this.surface.setSelected(-1),this.timer&&clearTimeout(this.timer),this.scheduleNextStep());else{let n=-1;const i=this.surface.getColumns();if(this.useBlockScanning)this.isColumnRow?n=this.currentCol*i+this.currentRow:n=this.currentRow*i+this.currentCol;else if(this.isColumnRow){const t=Math.floor(this.currentCol/i),e=this.currentCol%i;n=t*i+e}else n=this.currentCol;n>=0&&(this.triggerSelection(n),this.reset(),this.timer&&clearTimeout(this.timer),this.scheduleNextStep())}}getCost(n){const i=this.surface.getColumns(),t=Math.floor(n/i),e=n%i;return this.useBlockScanning?this.isColumnRow?e+1+(t+1):t+1+(e+1):this.isColumnRow?e+1+t+1:n+1}mapContentToGrid(n,i,t){if(this.config.get().scanPattern!=="column-row")return n;const e=new Array(n.length);let o=0;for(let s=0;s<t;s++)for(let a=0;a<i&&!(o>=n.length);a++){const r=a*t+s;r<e.length&&(e[r]=n[o++])}return e}},J=class extends m{constructor(){super(...arguments),c(this,"currentIndex",-1),c(this,"totalItems",0),c(this,"direction",1)}start(){this.totalItems=this.countItems(),this.direction=1,super.start()}countItems(){return this.surface.getItemsCount()}reset(){this.currentIndex=-1,this.direction=1,this.loopCount=0,this.surface.setFocus([])}step(){const n=this.config.get();if(n.criticalOverscan.enabled&&this.overscanState==="slow_backward"){this.currentIndex--,this.currentIndex<0&&(this.currentIndex=this.totalItems-1,this.reportCycleCompleted()),this.surface.setFocus([this.currentIndex]);return}switch(n.scanDirection){case"circular":this.currentIndex++,this.currentIndex>=this.totalItems&&(this.currentIndex=0,this.reportCycleCompleted());break;case"reverse":this.currentIndex--,this.currentIndex<0&&(this.currentIndex=this.totalItems-1,this.reportCycleCompleted());break;case"oscillating":this.currentIndex>=this.totalItems-1&&this.direction===1?(this.direction=-1,this.reportCycleCompleted()):this.currentIndex<=0&&this.direction===-1&&(this.direction=1,this.reportCycleCompleted()),this.currentIndex+=this.direction;break}this.surface.setFocus([this.currentIndex])}handleAction(n){var i,t;n==="step"?(this.timer&&clearTimeout(this.timer),this.step(),(t=(i=this.callbacks).onScanStep)==null||t.call(i),this.scheduleNextStep()):super.handleAction(n)}doSelection(){this.currentIndex>=0&&this.currentIndex>=0&&(this.triggerSelection(this.currentIndex),this.reset(),this.timer&&clearTimeout(this.timer),this.scheduleNextStep())}getCost(n){switch(this.config.get().scanDirection){case"circular":return n+1;case"reverse":return this.totalItems-n;case"oscillating":return n+1;default:return n+1}}},V=class extends m{constructor(){super(...arguments),c(this,"currentRow",0),c(this,"currentCol",0),c(this,"direction",1),c(this,"maxRow",0),c(this,"maxCol",0)}start(){this.updateDimensions(),super.start()}updateDimensions(){const n=this.surface.getItemsCount();this.maxCol=this.surface.getColumns(),this.maxRow=Math.ceil(n/this.maxCol)}reset(){this.currentRow=0,this.currentCol=0,this.direction=1,this.surface.setFocus([0])}step(){this.currentCol+=this.direction,this.currentCol>=this.maxCol?(this.currentCol=this.maxCol-1,this.currentRow++,this.direction=-1):this.currentCol<0&&(this.currentCol=0,this.currentRow++,this.direction=1),this.currentRow>=this.maxRow&&(this.currentRow=0,this.currentCol=0,this.direction=1);const n=this.currentRow*this.maxCol+this.currentCol;if(n>=this.surface.getItemsCount()){this.reset();return}this.surface.setFocus([n])}handleAction(n){n!=="select"?super.handleAction(n):super.handleAction(n)}doSelection(){const n=this.currentRow*this.maxCol+this.currentCol;n>=0&&(this.triggerSelection(n),this.reset(),this.timer&&clearTimeout(this.timer),this.scheduleNextStep())}getCost(n){return n}mapContentToGrid(n,i,t){const e=new Array(n.length);let o=0,s=0,a=1;for(let r=0;r<n.length;r++){const l=o*t+s;if(l<e.length&&(e[l]=n[r]),s+=a,s>=t?(s=t-1,o++,a=-1):s<0&&(s=0,o++,a=1),o>=i)break}return e}},tt=class extends m{constructor(){super(...arguments),c(this,"level","quadrant"),c(this,"currentQuad",-1),c(this,"currentRow",-1),c(this,"currentCol",-1),c(this,"quads",[])}start(){this.calcQuadrants(),super.start()}calcQuadrants(){const n=this.surface.getItemsCount(),i=this.surface.getColumns(),t=Math.ceil(n/i),e=Math.ceil(t/2),o=Math.ceil(i/2);this.quads=[{rowStart:0,rowEnd:e,colStart:0,colEnd:o},{rowStart:0,rowEnd:e,colStart:o,colEnd:i},{rowStart:e,rowEnd:t,colStart:0,colEnd:o},{rowStart:e,rowEnd:t,colStart:o,colEnd:i}]}reset(){this.level="quadrant",this.currentQuad=-1,this.currentRow=-1,this.currentCol=-1,this.surface.setFocus([])}step(){this.level==="quadrant"?this.stepQuadrant():this.level==="row"?this.stepRow():this.stepCell()}stepQuadrant(){this.currentQuad++,this.currentQuad>=4&&(this.currentQuad=0),this.highlightQuad(this.currentQuad)}stepRow(){const n=this.quads[this.currentQuad],i=n.rowEnd-n.rowStart;this.currentRow++,this.currentRow>=i&&(this.currentRow=0);const t=n.rowStart+this.currentRow;this.highlightRowSegment(t,n.colStart,n.colEnd)}stepCell(){const n=this.quads[this.currentQuad],i=n.colEnd-n.colStart;this.currentCol++,this.currentCol>=i&&(this.currentCol=0);const t=n.rowStart+this.currentRow,e=n.colStart+this.currentCol,o=t*this.surface.getColumns()+e;o<this.surface.getItemsCount()?this.surface.setFocus([o]):this.stepCell()}highlightQuad(n){const i=this.quads[n],t=[],e=this.surface.getColumns(),o=this.surface.getItemsCount();for(let s=i.rowStart;s<i.rowEnd;s++)for(let a=i.colStart;a<i.colEnd;a++){const r=s*e+a;r<o&&t.push(r)}this.surface.setFocus(t)}highlightRowSegment(n,i,t){const e=[],o=this.surface.getColumns(),s=this.surface.getItemsCount();for(let a=i;a<t;a++){const r=n*o+a;r<s&&e.push(r)}this.surface.setFocus(e)}handleAction(n){n==="cancel"?this.level==="cell"?(this.level="row",this.currentCol=-1,this.restartTimer()):this.level==="row"?(this.level="quadrant",this.currentRow=-1,this.restartTimer()):this.reset():super.handleAction(n)}doSelection(){if(this.level==="quadrant")this.currentQuad>=0&&(this.level="row",this.currentRow=-1,this.restartTimer());else if(this.level==="row")this.currentRow>=0&&(this.level="cell",this.currentCol=-1,this.restartTimer());else{const n=this.quads[this.currentQuad],i=(n.rowStart+this.currentRow)*this.surface.getColumns()+(n.colStart+this.currentCol);i>=0&&(this.triggerSelection(i),this.reset(),this.restartTimer())}}restartTimer(){this.timer&&clearTimeout(this.timer),this.scheduleNextStep()}getCost(n){const i=this.surface.getColumns(),t=this.surface.getItemsCount(),e=Math.ceil(t/i),o=Math.ceil(e/2),s=Math.ceil(i/2),a=Math.floor(n/i),r=n%i;let l=0;a<o?r<s?l=0:l=1:r<s?l=2:l=3;let h=a;a>=o&&(h=a-o);let u=r;return r>=s&&(u=r-s),l+1+(h+1)+(u+1)}mapContentToGrid(n,i,t){const e=new Array(n.length);let o=0;const s=Math.ceil(i/2),a=Math.ceil(t/2),r=[{rS:0,rE:s,cS:0,cE:a},{rS:0,rE:s,cS:a,cE:t},{rS:s,rE:i,cS:0,cE:a},{rS:s,rE:i,cS:a,cE:t}];for(const l of r)for(let h=l.rS;h<l.rE;h++)for(let u=l.cS;u<l.cE&&!(o>=n.length);u++){const p=h*t+u;p<e.length&&(e[p]=n[o++])}return e}},et=class extends m{constructor(){super(...arguments),c(this,"level","group"),c(this,"currentGroup",-1),c(this,"currentRow",-1),c(this,"currentCol",-1),c(this,"groups",[])}start(){this.calcGroups(),super.start()}calcGroups(){const n=this.surface.getItemsCount(),i=this.surface.getColumns(),t=Math.ceil(n/i),e=Math.ceil(t/3);this.groups=[];for(let o=0;o<t;o+=e)this.groups.push({rowStart:o,rowEnd:Math.min(o+e,t)})}reset(){this.level="group",this.currentGroup=-1,this.currentRow=-1,this.currentCol=-1,this.surface.setFocus([])}step(){this.level==="group"?this.stepGroup():this.level==="row"?this.stepRow():this.stepCell()}stepGroup(){this.currentGroup++,this.currentGroup>=this.groups.length&&(this.currentGroup=0),this.highlightGroup(this.currentGroup)}stepRow(){const n=this.groups[this.currentGroup],i=n.rowEnd-n.rowStart;this.currentRow++,this.currentRow>=i&&(this.currentRow=0);const t=n.rowStart+this.currentRow;this.highlightRow(t)}stepCell(){const n=this.surface.getColumns();this.currentCol++,this.currentCol>=n&&(this.currentCol=0);const e=(this.groups[this.currentGroup].rowStart+this.currentRow)*n+this.currentCol;e<this.surface.getItemsCount()?this.surface.setFocus([e]):this.currentCol<n-1&&this.stepCell()}highlightGroup(n){const i=this.groups[n],t=[],e=this.surface.getColumns(),o=this.surface.getItemsCount();for(let s=i.rowStart;s<i.rowEnd;s++)for(let a=0;a<e;a++){const r=s*e+a;r<o&&t.push(r)}this.surface.setFocus(t)}highlightRow(n){const i=this.surface.getColumns(),t=this.surface.getItemsCount(),e=[];for(let o=0;o<i;o++){const s=n*i+o;s<t&&e.push(s)}this.surface.setFocus(e)}handleAction(n){n==="cancel"?this.level==="cell"?(this.level="row",this.currentCol=-1,this.restartTimer()):this.level==="row"?(this.level="group",this.currentRow=-1,this.restartTimer()):this.reset():super.handleAction(n)}doSelection(){if(this.level==="group")this.currentGroup>=0&&(this.level="row",this.currentRow=-1,this.restartTimer());else if(this.level==="row")this.currentRow>=0&&(this.level="cell",this.currentCol=-1,this.restartTimer());else{const i=(this.groups[this.currentGroup].rowStart+this.currentRow)*this.surface.getColumns()+this.currentCol;i>=0&&(this.triggerSelection(i),this.reset(),this.restartTimer())}}restartTimer(){this.timer&&clearTimeout(this.timer),this.scheduleNextStep()}getCost(n){const i=this.surface.getColumns(),t=this.surface.getItemsCount(),e=Math.ceil(t/i),o=Math.ceil(e/3),s=Math.floor(n/i),a=n%i,r=Math.floor(s/o),l=s%o;return r+1+(l+1)+(a+1)}},F={"switch-1":"#2196F3","switch-2":"#F44336","switch-3":"#4CAF50","switch-4":"#FFEB3B","switch-5":"#9C27B0","switch-6":"#FF9800","switch-7":"#00BCD4","switch-8":"#E91E63"},it=class extends m{constructor(){super(...arguments),c(this,"rangeStart",0),c(this,"rangeEnd",0),c(this,"currentBlock",0),c(this,"numSwitches",4),c(this,"partitionHistory",[])}start(){const n=this.config.get();this.numSwitches=n.eliminationSwitchCount||4,this.rangeStart=0,this.rangeEnd=this.surface.getItemsCount(),this.partitionHistory=[],super.start()}reset(){this.rangeStart=0,this.rangeEnd=this.surface.getItemsCount(),this.currentBlock=0,this.partitionHistory=[],this.clearHighlights()}clearHighlights(){this.surface.setFocus([]),this.surface.clearItemStyles&&this.surface.clearItemStyles()}step(){this.currentBlock=(this.currentBlock+1)%this.numSwitches,this.highlightCurrentBlock()}highlightCurrentBlock(){var t,e;this.clearHighlights();const i=this.calculatePartitions(this.rangeStart,this.rangeEnd,this.numSwitches)[this.currentBlock];if(i)for(let o=i.start;o<i.end;o++){const s=this.getSwitchAction(this.currentBlock),a=F[s];(e=(t=this.surface).setItemStyle)==null||e.call(t,o,{backgroundColor:a,opacity:.4,borderColor:a,borderWidth:2,boxShadow:`inset 0 0 0 3px ${a}`})}}calculatePartitions(n,i,t){const e=[],o=i-n,s=Math.floor(o/t),a=o%t;let r=n;for(let l=0;l<t;l++){const h=s+(l<a?1:0);e.push({start:r,end:r+h}),r+=h}return e}getSwitchAction(n){return{0:"switch-1",1:"switch-2",2:"switch-3",3:"switch-4",4:"switch-5",5:"switch-6",6:"switch-7",7:"switch-8"}[n]||"switch-1"}handleAction(n){var i,t;if(n==="select"){this.doSelection();return}if(n.toString().startsWith("switch-")){const e=parseInt(n.toString().split("-")[1])-1;if(e>=this.numSwitches)return;if(this.rangeEnd-this.rangeStart<=1){this.rangeStart>=0&&(this.triggerSelection(this.rangeStart),this.reset(),this.restartTimer());return}if(e===this.currentBlock){const a=this.calculatePartitions(this.rangeStart,this.rangeEnd,this.numSwitches)[e];if(a&&(this.partitionHistory.push({start:this.rangeStart,end:this.rangeEnd}),this.rangeStart=a.start,this.rangeEnd=a.end,this.currentBlock=0,this.rangeEnd-this.rangeStart===1)){this.clearHighlights();const r=F["switch-1"];(t=(i=this.surface).setItemStyle)==null||t.call(i,this.rangeStart,{backgroundColor:r,opacity:.6,boxShadow:`inset 0 0 0 4px ${r}, 0 0 10px ${r}`,borderColor:r,borderWidth:2})}this.restartTimer()}return}if(n==="cancel"||n==="reset"){if(this.partitionHistory.length>0){const e=this.partitionHistory.pop();this.rangeStart=e.start,this.rangeEnd=e.end,this.currentBlock=0}else this.reset();this.restartTimer()}}doSelection(){this.rangeEnd-this.rangeStart<=1&&this.rangeStart>=0&&(this.triggerSelection(this.rangeStart),this.reset(),this.restartTimer())}restartTimer(){this.timer&&clearTimeout(this.timer),this.scheduleNextStep()}getCost(n){const i=this.numSwitches;let t=0,e=this.surface.getItemsCount(),o=0;for(;e-t>1;){const s=this.calculatePartitions(t,e,i);let a=0;for(let r=0;r<s.length;r++)if(n>=s[r].start&&n<s[r].end){a=r;break}o+=a+1,t=s[a].start,e=s[a].end}return o}scheduleNextStep(){if(!this.isRunning||this.config.get().scanInputMode==="manual")return;this.timer&&clearTimeout(this.timer);const n=this.config.get().scanRate;this.timer=window.setTimeout(()=>{this.step(),this.scheduleNextStep()},n)}},st=class extends m{constructor(){super(...arguments),c(this,"overlay",null),c(this,"hBar",null),c(this,"vBar",null),c(this,"bufferZone",null),c(this,"lockedXBar",null),c(this,"directionIndicator",null),c(this,"directionLine",null),c(this,"state","x-scan"),c(this,"xPos",0),c(this,"yPos",0),c(this,"technique","crosshair"),c(this,"numCols",0),c(this,"numRows",0),c(this,"bufferWidth",15),c(this,"direction",1),c(this,"pauseTimer",null),c(this,"bufferLeft",0),c(this,"bufferRight",0),c(this,"bufferTop",0),c(this,"bufferBottom",0),c(this,"fineXPos",0),c(this,"fineYPos",0),c(this,"lockedXPosition",0),c(this,"currentDirection",0),c(this,"compassAngle",0),c(this,"compassMode","continuous"),c(this,"directionStepCounter",0),c(this,"directionStepsPerChange",10),c(this,"directions",[{name:"N",angle:0,dx:0,dy:-1},{name:"NE",angle:45,dx:1,dy:-1},{name:"E",angle:90,dx:1,dy:0},{name:"SE",angle:135,dx:1,dy:1},{name:"S",angle:180,dx:0,dy:1},{name:"SW",angle:225,dx:-1,dy:1},{name:"W",angle:270,dx:-1,dy:0},{name:"NW",angle:315,dx:-1,dy:-1}])}start(){try{const n=this.config.get();this.technique=n.continuousTechnique||"crosshair";const i=this.surface.getItemsCount();this.numCols=this.surface.getColumns(),this.numRows=Math.ceil(i/this.numCols),console.log("[ContinuousScanner] Starting:",{technique:this.technique,numCols:this.numCols,numRows:this.numRows,totalItems:i}),console.log("[ContinuousScanner] About to create overlay..."),this.createOverlay(),console.log("[ContinuousScanner] Overlay created successfully"),this.technique==="gliding"?(this.state="x-scanning",this.xPos=0,this.yPos=0):this.technique==="eight-direction"?(this.state="direction-scan",this.xPos=50,this.yPos=50,this.compassMode=n.compassMode||"continuous",this.compassAngle=0):(this.state="x-scan",this.xPos=0,this.yPos=0),console.log("[ContinuousScanner] Initial state:",this.state),super.start()}catch(n){throw console.error("[ContinuousScanner] ERROR in start():",n),n}}stop(){super.stop(),this.pauseTimer&&(window.clearTimeout(this.pauseTimer),this.pauseTimer=null),this.removeOverlay()}reset(){this.technique==="gliding"?(this.state="x-scanning",this.xPos=0,this.yPos=0):this.technique==="eight-direction"?(this.state="direction-scan",this.xPos=50,this.yPos=50):(this.state="x-scan",this.xPos=0,this.yPos=0),this.direction=1,this.fineXPos=0,this.fineYPos=0,this.bufferLeft=0,this.bufferRight=this.bufferWidth,this.bufferTop=0,this.bufferBottom=this.bufferWidth,this.lockedXPosition=0,this.currentDirection=0,this.compassAngle=0,this.directionStepCounter=0,this.surface.setFocus([]),this.lockedXBar&&(this.lockedXBar.style.display="none"),this.directionIndicator&&(this.directionIndicator.style.display="none"),this.directionLine&&(this.directionLine.style.display="none"),this.updateOverlay()}step(){if(this.technique==="eight-direction"){if(this.state==="direction-scan")this.compassMode==="continuous"?this.compassAngle=(this.compassAngle+2)%360:(this.directionStepCounter++,this.directionStepCounter>=this.directionStepsPerChange&&(this.currentDirection=(this.currentDirection+1)%8,this.directionStepCounter=0),this.compassAngle=this.directions[this.currentDirection].angle);else if(this.state==="moving"){const n=this.compassMode==="continuous"?this.getDirectionFromAngle(this.compassAngle):this.directions[this.currentDirection],i=.5;this.xPos+=n.dx*i,this.yPos+=n.dy*i,this.xPos=Math.max(0,Math.min(100,this.xPos)),this.yPos=Math.max(0,Math.min(100,this.yPos))}}else if(this.technique==="gliding")if(this.state==="x-scanning"){if(this.xPos+=.8*this.direction,this.xPos>=100){if(this.xPos=100,!this.pauseTimer){this.pauseTimer=window.setTimeout(()=>{this.direction=-1,this.pauseTimer=null},100);return}}else if(this.xPos<=0&&(this.xPos=0,!this.pauseTimer)){this.pauseTimer=window.setTimeout(()=>{this.direction=1,this.pauseTimer=null},100);return}this.bufferLeft=Math.max(0,this.xPos-this.bufferWidth/2),this.bufferRight=Math.min(100,this.xPos+this.bufferWidth/2)}else if(this.state==="x-capturing")this.fineXPos+=.3*this.direction,this.fineXPos>=100?(this.fineXPos=100,this.direction=-1):this.fineXPos<=0&&(this.fineXPos=0,this.direction=1);else if(this.state==="y-scanning"){if(this.yPos+=.8*this.direction,this.yPos>=100){if(this.yPos=100,!this.pauseTimer){this.pauseTimer=window.setTimeout(()=>{this.direction=-1,this.pauseTimer=null},100);return}}else if(this.yPos<=0&&(this.yPos=0,!this.pauseTimer)){this.pauseTimer=window.setTimeout(()=>{this.direction=1,this.pauseTimer=null},100);return}this.bufferTop=Math.max(0,this.yPos-this.bufferWidth/2),this.bufferBottom=Math.min(100,this.yPos+this.bufferWidth/2)}else this.state==="y-capturing"&&(this.fineYPos+=.3*this.direction,this.fineYPos>=100?(this.fineYPos=100,this.direction=-1):this.fineYPos<=0&&(this.fineYPos=0,this.direction=1));else this.state==="x-scan"?(this.xPos+=.5,this.xPos>100&&(this.xPos=0)):this.state==="y-scan"&&(this.yPos+=.5,this.yPos>100&&(this.yPos=0));Math.floor(this.xPos*2)%50===0&&console.log("[ContinuousScanner] Step:",{state:this.state,xPos:this.xPos,yPos:this.yPos,fineXPos:this.fineXPos,fineYPos:this.fineYPos,bufferLeft:this.bufferLeft,bufferRight:this.bufferRight,technique:this.technique,direction:this.direction,currentDirection:this.currentDirection}),this.updateOverlay()}calculateLineLength(n,i,t,e){return t===0&&e===-1?i:t===1&&e===-1?Math.min(100-n,i)*Math.SQRT2:t===1&&e===0?100-n:t===1&&e===1?Math.min(100-n,100-i)*Math.SQRT2:t===0&&e===1?100-i:t===-1&&e===1?Math.min(n,100-i)*Math.SQRT2:t===-1&&e===0?n:t===-1&&e===-1?Math.min(n,i)*Math.SQRT2:50}getDirectionFromAngle(n){const i=n*Math.PI/180,t=Math.cos(i),e=Math.sin(i),o=(n+22.5)%360,s=Math.floor(o/45),r=["E","SE","S","SW","W","NW","N","NE"][s]||"N";return{dx:t,dy:e,name:r}}scheduleNextStep(){if(!this.isRunning||this.config.get().scanInputMode==="manual")return;this.timer&&clearTimeout(this.timer);const n=20;this.timer=window.setTimeout(()=>{this.step(),this.scheduleNextStep()},n)}createOverlay(){var i,t;if(this.overlay)return;console.log("[ContinuousScanner] Creating overlay...");const n=(t=(i=this.surface).getContainerElement)==null?void 0:t.call(i);if(console.log("[ContinuousScanner] Container:",n),!n){console.error("[ContinuousScanner] ERROR: Container is null/undefined!");return}this.overlay=document.createElement("div"),this.overlay.style.position="absolute",this.overlay.style.top="0",this.overlay.style.left="0",this.overlay.style.width="100%",this.overlay.style.height="100%",this.overlay.style.pointerEvents="none",this.overlay.style.zIndex="1000",this.bufferZone=document.createElement("div"),this.bufferZone.style.position="absolute",this.bufferZone.style.top="0",this.bufferZone.style.height="100%",this.bufferZone.style.backgroundColor="rgba(128, 128, 128, 0.4)",this.bufferZone.style.borderLeft="2px solid rgba(128, 128, 128, 0.8)",this.bufferZone.style.borderRight="2px solid rgba(128, 128, 128, 0.8)",this.bufferZone.style.pointerEvents="none",this.bufferZone.style.display="none",this.overlay.appendChild(this.bufferZone),this.vBar=document.createElement("div"),this.vBar.style.position="absolute",this.vBar.style.top="0",this.vBar.style.width="4px",this.vBar.style.height="100%",this.vBar.style.backgroundColor="rgba(255, 0, 0, 0.5)",this.vBar.style.borderLeft="1px solid red",this.vBar.style.borderRight="1px solid red",this.vBar.style.display="none",this.overlay.appendChild(this.vBar),this.hBar=document.createElement("div"),this.hBar.style.position="absolute",this.hBar.style.left="0",this.hBar.style.width="100%",this.hBar.style.height="4px",this.hBar.style.backgroundColor="rgba(255, 0, 0, 0.5)",this.hBar.style.borderTop="1px solid red",this.hBar.style.borderBottom="1px solid red",this.hBar.style.display="none",this.overlay.appendChild(this.hBar),this.lockedXBar=document.createElement("div"),this.lockedXBar.style.position="absolute",this.lockedXBar.style.top="0",this.lockedXBar.style.width="3px",this.lockedXBar.style.height="100%",this.lockedXBar.style.backgroundColor="rgba(0, 255, 0, 0.7)",this.lockedXBar.style.borderLeft="1px solid green",this.lockedXBar.style.borderRight="1px solid green",this.lockedXBar.style.display="none",this.overlay.appendChild(this.lockedXBar),this.directionIndicator=document.createElement("div"),this.directionIndicator.style.position="absolute",this.directionIndicator.style.top="10px",this.directionIndicator.style.right="10px",this.directionIndicator.style.width="80px",this.directionIndicator.style.height="80px",this.directionIndicator.style.borderRadius="50%",this.directionIndicator.style.backgroundColor="rgba(255, 255, 255, 0.9)",this.directionIndicator.style.border="3px solid #333",this.directionIndicator.style.display="none",this.directionIndicator.style.pointerEvents="none",this.overlay.appendChild(this.directionIndicator),this.directionLine=document.createElement("div"),this.directionLine.style.position="absolute",this.directionLine.style.height="2px",this.directionLine.style.backgroundColor="rgba(33, 150, 243, 0.6)",this.directionLine.style.transformOrigin="0 50%",this.directionLine.style.display="none",this.directionLine.style.pointerEvents="none",this.directionLine.style.zIndex="5",this.overlay.appendChild(this.directionLine),n.appendChild(this.overlay),console.log("[ContinuousScanner] Overlay created and appended")}removeOverlay(){this.overlay&&this.overlay.parentNode&&this.overlay.parentNode.removeChild(this.overlay),this.overlay=null,this.hBar=null,this.vBar=null,this.bufferZone=null,this.lockedXBar=null,this.directionIndicator=null,this.directionLine=null}handleAction(n){console.log("[ContinuousScanner] handleAction:",{action:n,state:this.state,technique:this.technique}),n==="cancel"?(console.log("[ContinuousScanner] Cancel - resetting"),this.reset()):super.handleAction(n)}doSelection(){if(this.technique==="eight-direction")if(this.state==="direction-scan"){const n=this.getDirectionFromAngle(this.compassAngle);console.log("[ContinuousScanner] Transition: direction-scan -> moving, direction:",n.name,"angle:",this.compassAngle),this.state="moving"}else this.state==="moving"&&(console.log("[ContinuousScanner] Transition: moving -> processing"),this.state="processing",this.selectFocusedItem());else this.technique==="gliding"?this.state==="x-scanning"?(console.log("[ContinuousScanner] Transition: x-scanning -> x-capturing"),this.state="x-capturing",this.fineXPos=0,this.direction=1):this.state==="x-capturing"?(console.log("[ContinuousScanner] Transition: x-capturing -> y-scanning"),this.state="y-scanning",this.lockedXPosition=this.bufferLeft+this.fineXPos/100*(this.bufferRight-this.bufferLeft),this.yPos=0,this.fineYPos=0,this.direction=1):this.state==="y-scanning"?(console.log("[ContinuousScanner] Transition: y-scanning -> y-capturing"),this.state="y-capturing",this.fineYPos=0,this.direction=1):this.state==="y-capturing"&&(console.log("[ContinuousScanner] Transition: y-capturing -> processing"),this.state="processing",this.selectFocusedItem()):this.state==="x-scan"?(console.log("[ContinuousScanner] Transition: x-scan -> y-scan"),this.state="y-scan",this.yPos=0):this.state==="y-scan"&&(console.log("[ContinuousScanner] Transition: y-scan -> processing"),this.state="processing",this.selectAtPoint())}selectFocusedItem(){var a,r;if(!this.overlay)return;const n=this.overlay.getBoundingClientRect();let i,t;if(this.technique==="eight-direction")i=n.left+this.xPos/100*n.width,t=n.top+this.yPos/100*n.height;else{const l=this.bufferTop+this.fineYPos/100*(this.bufferBottom-this.bufferTop);i=n.left+this.lockedXPosition/100*n.width,t=n.top+l/100*n.height}this.overlay.style.display="none";const e=(r=(a=this.surface).getContainerElement)==null?void 0:r.call(a);if(!e)return;const o=e.getRootNode(),s=o.elementFromPoint?o.elementFromPoint(i,t):document.elementFromPoint(i,t);if(this.overlay.style.display="block",s){const l=s.closest(".grid-cell");if(l&&l.dataset.index){const h=parseInt(l.dataset.index,10);h>=0&&this.triggerSelection(h)}}this.reset()}updateOverlay(){if(!this.hBar||!this.vBar||!this.bufferZone||!this.lockedXBar||!this.directionIndicator||!this.directionLine){console.error("[ContinuousScanner] updateOverlay: Missing elements!",{hBar:!!this.hBar,vBar:!!this.vBar,bufferZone:!!this.bufferZone,lockedXBar:!!this.lockedXBar,directionIndicator:!!this.directionIndicator,directionLine:!!this.directionLine,overlay:!!this.overlay});return}if(console.log("[ContinuousScanner] updateOverlay:",{technique:this.technique,state:this.state,xPos:this.xPos,yPos:this.yPos,currentDirection:this.currentDirection}),this.technique==="eight-direction"){this.vBar.style.display="none",this.hBar.style.display="none",this.bufferZone.style.display="none",this.lockedXBar.style.display="none",this.directionIndicator.style.display="block",this.directionLine.style.display="block";const n=this.compassAngle,i=this.getDirectionFromAngle(n);this.directionIndicator.innerHTML=`
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(${n}deg);
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
        ">${i.name} (${Math.round(n)}°)</div>
      `,this.directionLine.style.left=`${this.xPos}%`,this.directionLine.style.top=`${this.yPos}%`;const t=this.calculateLineLength(this.xPos,this.yPos,i.dx,i.dy);this.directionLine.style.width=`${t}%`,this.directionLine.style.transformOrigin="0 50%",this.directionLine.style.transform=`rotate(${n}deg)`,this.vBar.style.display="block",this.vBar.style.width="12px",this.vBar.style.height="12px",this.vBar.style.borderRadius="50%",this.vBar.style.backgroundColor=this.state==="moving"?"#FF5722":"#2196F3",this.vBar.style.border="2px solid white",this.vBar.style.zIndex="10",this.vBar.style.left=`calc(${this.xPos}% - 6px)`,this.vBar.style.top=`calc(${this.yPos}% - 6px)`}else if(this.technique==="gliding"){if(this.state==="x-scanning"){this.vBar.style.display="none",this.hBar.style.display="none",this.lockedXBar&&(this.lockedXBar.style.display="none"),this.directionIndicator&&(this.directionIndicator.style.display="none"),this.directionLine&&(this.directionLine.style.display="none");const n=Math.max(0,this.xPos-this.bufferWidth/2),t=Math.min(100,this.xPos+this.bufferWidth/2)-n;this.bufferZone.style.left=`${n}%`,this.bufferZone.style.width=`${t}%`,this.bufferZone.style.height="100%",this.bufferZone.style.top="0",this.bufferZone.style.display="block"}else if(this.state==="x-capturing"){this.hBar.style.display="none",this.lockedXBar&&(this.lockedXBar.style.display="none"),this.directionIndicator&&(this.directionIndicator.style.display="none"),this.directionLine&&(this.directionLine.style.display="none");const n=this.bufferRight-this.bufferLeft;this.bufferZone.style.left=`${this.bufferLeft}%`,this.bufferZone.style.width=`${n}%`,this.bufferZone.style.height="100%",this.bufferZone.style.top="0",this.bufferZone.style.display="block";const i=this.bufferLeft+this.fineXPos/100*(this.bufferRight-this.bufferLeft);this.vBar.style.display="block",this.vBar.style.left=`${i}%`}else if(this.state==="y-scanning"){this.vBar.style.display="none",this.hBar.style.display="none",this.directionIndicator&&(this.directionIndicator.style.display="none"),this.directionLine&&(this.directionLine.style.display="none"),this.lockedXBar.style.display="block",this.lockedXBar.style.left=`${this.lockedXPosition}%`;const n=Math.max(0,this.yPos-this.bufferWidth/2),t=Math.min(100,this.yPos+this.bufferWidth/2)-n;this.bufferZone.style.left="0",this.bufferZone.style.width="100%",this.bufferZone.style.top=`${n}%`,this.bufferZone.style.height=`${t}%`,this.bufferZone.style.display="block"}else if(this.state==="y-capturing"){this.vBar.style.display="none",this.directionIndicator&&(this.directionIndicator.style.display="none"),this.directionLine&&(this.directionLine.style.display="none"),this.lockedXBar.style.display="block",this.lockedXBar.style.left=`${this.lockedXPosition}%`;const n=this.bufferBottom-this.bufferTop;this.bufferZone.style.left="0",this.bufferZone.style.width="100%",this.bufferZone.style.top=`${this.bufferTop}%`,this.bufferZone.style.height=`${n}%`,this.bufferZone.style.display="block";const i=this.bufferTop+this.fineYPos/100*(this.bufferBottom-this.bufferTop);this.hBar.style.display="block",this.hBar.style.top=`${i}%`}}else this.bufferZone.style.display="none",this.lockedXBar&&(this.lockedXBar.style.display="none"),this.directionIndicator&&(this.directionIndicator.style.display="none"),this.directionLine&&(this.directionLine.style.display="none"),this.state==="x-scan"?(this.vBar.style.display="block",this.vBar.style.left=`${this.xPos}%`,this.hBar.style.display="none"):this.state==="y-scan"&&(this.vBar.style.display="block",this.vBar.style.left=`${this.xPos}%`,this.hBar.style.display="block",this.hBar.style.top=`${this.yPos}%`)}selectAtPoint(){var a,r;if(!this.overlay)return;const n=this.overlay.getBoundingClientRect(),i=n.left+this.xPos/100*n.width,t=n.top+this.yPos/100*n.height;this.overlay.style.display="none";const e=(r=(a=this.surface).getContainerElement)==null?void 0:r.call(a);if(!e)return;const o=e.getRootNode(),s=o.elementFromPoint?o.elementFromPoint(i,t):document.elementFromPoint(i,t);if(this.overlay.style.display="block",s){const l=s.closest(".grid-cell");if(l&&l.dataset.index){const h=parseInt(l.dataset.index,10);h>=0&&this.triggerSelection(h)}}this.reset()}getCost(n){const i=this.surface.getColumns(),t=Math.floor(n/i),e=n%i;if(this.technique==="eight-direction"){const o=(e+.5)/i*100,s=(t+.5)/Math.ceil(this.surface.getItemsCount()/i)*100,a=Math.sqrt(Math.pow(o,2)+Math.pow(s,2));return 4+Math.round(a/.5)+1}else if(this.technique==="gliding"){const o=(e+.5)/i*100;return Math.round(o/.5)+1}else{const o=(e+.5)/i*100,s=(t+.5)/Math.ceil(this.surface.getItemsCount()/i)*100,a=Math.round(o/.5),r=Math.round(s/.5);return a+r+2}}},nt=class{constructor(){c(this,"predictor"),this.predictor=N({adaptive:!0,maxOrder:5}),this.predictor.train("The quick brown fox jumps over the lazy dog. Hello world. How are you?")}addToContext(n){this.predictor.addToContext(n)}resetContext(){this.predictor.resetContext()}predictNext(){return this.predictor.predictNextCharacter()}},ot=class extends m{constructor(){super(...arguments),c(this,"predictor",new nt),c(this,"scanOrder",[]),c(this,"currentIndex",-1)}start(){this.updateProbabilities(),super.start()}reset(){this.currentIndex=-1,this.surface.setFocus([])}step(){this.currentIndex++,this.currentIndex>=this.scanOrder.length&&(this.currentIndex=0);const n=this.scanOrder[this.currentIndex];this.surface.setFocus([n])}handleAction(n){n==="cancel"?this.reset():super.handleAction(n)}doSelection(){var n,i;if(this.currentIndex>=0){const t=this.scanOrder[this.currentIndex];if(t>=0){this.triggerSelection(t);const e=(i=(n=this.surface).getItemData)==null?void 0:i.call(n,t);e!=null&&e.label&&this.predictor.addToContext(e.label.toLowerCase()),this.updateProbabilities(),this.triggerRedraw(),this.reset(),this.timer&&clearTimeout(this.timer),this.scheduleNextStep()}}}updateProbabilities(){var e,o;const n=this.predictor.predictNext(),i=this.surface.getItemsCount(),t=[];for(let s=0;s<i;s++){let a=1e-4;const r=(o=(e=this.surface).getItemData)==null?void 0:o.call(e,s);if(r!=null&&r.label){const l=r.label.toLowerCase(),h=n.find(u=>u.text.toLowerCase()===l);h&&(a=h.probability)}t.push({index:s,prob:a})}t.sort((s,a)=>a.prob-s.prob),this.scanOrder=t.map(s=>s.index)}getCost(n){const i=this.scanOrder.indexOf(n);return i===-1?999:i+1}},at=class extends m{start(){this.isRunning=!0,this.reset();const n=this.surface.getItemsCount();if(n>0){const i=Array.from({length:n},(t,e)=>e);this.surface.setFocus(i)}}handleAction(n){n==="select"&&this.isRunning&&super.handleAction(n)}doSelection(){this.surface.getItemsCount()>0&&this.triggerSelection(0)}step(){}reset(){const n=this.surface.getItemsCount();if(n>0){const i=Array.from({length:n},(t,e)=>e);this.surface.setFocus(i)}}getCost(n){return 1}},rt=class extends m{constructor(){super(...arguments),c(this,"probabilities",[]),c(this,"colors",[])}start(){this.isRunning=!0,this.initializeBelief(),this.assignColors(),this.applyColors()}stop(){this.isRunning=!1,this.surface.setFocus([])}handleAction(n){if(!this.isRunning)return;let i=null;if(n==="switch-1"||n==="select")i="blue";else if(n==="switch-2"||n==="step")i="red";else if(n==="reset"){this.initializeBelief(),this.assignColors(),this.applyColors();return}else return;this.updateBelief(i),this.assignColors(),this.applyColors()}step(){}reset(){this.initializeBelief(),this.assignColors(),this.applyColors()}getCost(n){return 1}doSelection(){}initializeBelief(){const n=this.surface.getItemsCount(),i=n>0?1/n:0;this.probabilities=new Array(n).fill(i)}assignColors(){const n=this.probabilities.map((e,o)=>({p:e,i:o})).sort((e,o)=>o.p-e.p);let i=0,t=0;this.colors=new Array(this.probabilities.length).fill("blue");for(const e of n)i<=t?(this.colors[e.i]="red",i+=e.p):(this.colors[e.i]="blue",t+=e.p)}applyColors(){var t,e;const n="#f9c6c6",i="#cfe3ff";for(let o=0;o<this.colors.length;o++)(e=(t=this.surface).setItemStyle)==null||e.call(t,o,{backgroundColor:this.colors[o]==="red"?n:i,textColor:"#1e1e1e"})}updateBelief(n){const{errorRate:i,selectThreshold:t}=this.config.get().colorCode,e=1-i;let o=0;for(let a=0;a<this.probabilities.length;a++){const l=this.colors[a]===n?e:i;this.probabilities[a]*=l,o+=this.probabilities[a]}if(o>0)for(let a=0;a<this.probabilities.length;a++)this.probabilities[a]/=o;let s=0;for(let a=1;a<this.probabilities.length;a++)this.probabilities[a]>this.probabilities[s]&&(s=a);this.probabilities[s]>=t&&(this.triggerSelection(s),this.initializeBelief())}};function f(){const n=window.SWITCH_SCANNER_ASSET_BASE,i=n&&n.length>0?n:"/";return i.endsWith("/")?i:`${i}/`}const lt={blue:{normal:`${f()}switches/switch-blue.png`,depressed:`${f()}switches/switch-blue-depressed.png`},green:{normal:`${f()}switches/switch-green.png`,depressed:`${f()}switches/switch-green-depressed.png`},red:{normal:`${f()}switches/switch-red.png`,depressed:`${f()}switches/switch-red-depressed.png`},yellow:{normal:`${f()}switches/switch-yellow.png`,depressed:`${f()}switches/switch-yellow-depressed.png`}};class ct extends HTMLElement{constructor(){super();d(this,"configManager");d(this,"audioManager");d(this,"switchInput");d(this,"alphabetManager");d(this,"gridRenderer");d(this,"settingsUI");d(this,"scanSurface");d(this,"scanCallbacks");d(this,"currentScanner",null);d(this,"baseItems",[]);d(this,"customItems",null);d(this,"forcedGridCols",null);d(this,"outputHistory",[]);d(this,"redoStack",[]);d(this,"boardTree",null);d(this,"boardPageId",null);d(this,"dwellTimer",null);d(this,"currentDwellTarget",null);this.attachShadow({mode:"open"})}async connectedCallback(){if(this.configManager)return;this.renderTemplate(),this.setupStyles();const t=this.parseAttributes();this.configManager=new x(t,!1),this.audioManager=new Z(this.configManager.get().soundEnabled),this.alphabetManager=new Y,await this.alphabetManager.init(),this.switchInput=new U(this.configManager,this);const e=this.shadowRoot.querySelector(".grid-container");this.gridRenderer=new _(e),this.scanSurface={getItemsCount:()=>this.gridRenderer.getItemsCount(),getColumns:()=>this.gridRenderer.columns,setFocus:r=>this.gridRenderer.setFocus(r),setSelected:r=>this.gridRenderer.setSelected(r),getItemData:r=>{const l=this.gridRenderer.getItem(r);return l?{label:l.label,isEmpty:l.isEmpty}:null},setItemStyle:(r,l)=>{const h=this.gridRenderer.getElement(r);h&&(l.backgroundColor!==void 0&&(h.style.backgroundColor=l.backgroundColor),l.textColor!==void 0&&(h.style.color=l.textColor),l.borderColor!==void 0&&(h.style.borderColor=l.borderColor),l.borderWidth!==void 0&&(h.style.borderWidth=`${l.borderWidth}px`),l.boxShadow!==void 0&&(h.style.boxShadow=l.boxShadow),l.opacity!==void 0&&(h.style.opacity=String(l.opacity)))},clearItemStyles:()=>{this.gridRenderer.getContainer().querySelectorAll(".grid-cell").forEach(r=>{const l=r;l.style.backgroundColor="",l.style.color="",l.style.borderColor="",l.style.borderWidth="",l.style.boxShadow="",l.style.opacity=""})},getContainerElement:()=>this.gridRenderer.getContainer()},this.scanCallbacks={onScanStep:()=>{var r;return(r=this.audioManager)==null?void 0:r.playScanSound()},onSelect:r=>{var u;const l=this.gridRenderer.getItem(r);if(!l)return;const h=new CustomEvent("scanner:selection",{bubbles:!0,composed:!0,detail:{item:l}});this.gridRenderer.getContainer().dispatchEvent(h),(u=this.audioManager)==null||u.playSelectSound()},onRedraw:()=>{const r=new CustomEvent("scanner:redraw",{bubbles:!0,composed:!0});this.gridRenderer.getContainer().dispatchEvent(r)}};const o=this.shadowRoot.querySelector(".settings-overlay");this.settingsUI=new Q(this.configManager,this.alphabetManager,o),this.setupBoardControls();const s=this.configManager.get();this.currentScanner=this.createScanner(s),await this.initBoardIfNeeded(),await this.updateGrid(s,!0),this.currentScanner.start(),s.viewMode!=="standard"&&this.updateGrid(s,!1),this.bindEvents(),this.hasAttribute("tabindex")||this.setAttribute("tabindex","0");const a=this.getAttribute("theme");a&&this.updateTheme(a)}static get observedAttributes(){return["scan-strategy","scan-pattern","scan-technique","scan-mode","scan-input-mode","continuous-technique","compass-mode","grid-content","grid-size","board-src","board-upload","board-page","language","scan-rate","acceptance-time","dwell-time","elimination-switch-count","custom-items","grid-cols","theme","cancel-method","long-hold-time","critical-overscan-enabled","critical-overscan-fast-rate","critical-overscan-slow-rate","highlight-scan-line","highlight-border-width","highlight-border-color","highlight-scale","highlight-opacity","highlight-animation"]}attributeChangedCallback(t,e,o){if(t==="custom-items"){this.parseCustomItems(o),this.configManager&&this.updateGrid(this.configManager.get(),!0);return}if(t==="grid-cols"){this.forcedGridCols=parseInt(o,10),this.configManager&&this.updateGrid(this.configManager.get(),!0);return}if(t==="theme"){this.updateTheme(o);return}if(!this.configManager||e===o)return;const s={};switch(t){case"scan-strategy":this.mapLegacyStrategy(o,s);break;case"scan-pattern":s.scanPattern=o,s.scanMode=null;break;case"scan-input-mode":s.scanInputMode=o;break;case"scan-technique":s.scanTechnique=o;break;case"scan-mode":s.scanMode=o==="null"?null:o;break;case"grid-content":s.gridContent=o;break;case"grid-size":s.gridSize=parseInt(o,10);break;case"board-src":o&&(this.configManager.update({gridContent:"board"}),this.loadBoardFromUrl(o));break;case"board-page":o&&this.setBoardPage(o);break;case"board-upload":this.hasAttribute("board-upload")&&this.configManager.update({gridContent:"board"}),this.updateBoardControlsVisibility();break;case"language":s.language=o;break;case"scan-rate":s.scanRate=parseInt(o,10);break;case"acceptance-time":s.acceptanceTime=parseInt(o,10);break;case"dwell-time":s.dwellTime=parseInt(o,10);break;case"continuous-technique":s.continuousTechnique=o;break;case"compass-mode":s.compassMode=o;break;case"elimination-switch-count":s.eliminationSwitchCount=parseInt(o,10);break;case"cancel-method":s.cancelMethod=o;break;case"long-hold-time":s.longHoldTime=parseInt(o,10);break;case"highlight-scan-line":s.highlightScanLine=o==="true"||o==="1";break;case"highlight-border-width":s.highlightBorderWidth=parseInt(o,10);break;case"highlight-border-color":s.highlightBorderColor=o;break;case"highlight-scale":s.highlightScale=parseFloat(o);break;case"highlight-opacity":s.highlightOpacity=parseFloat(o);break;case"highlight-animation":s.highlightAnimation=o==="true"||o==="1";break;case"critical-overscan-enabled":s.criticalOverscan={...this.configManager.get().criticalOverscan,enabled:o==="true"||o==="1"};break;case"critical-overscan-fast-rate":s.criticalOverscan={...this.configManager.get().criticalOverscan,fastRate:parseInt(o,10)};break;case"critical-overscan-slow-rate":s.criticalOverscan={...this.configManager.get().criticalOverscan,slowRate:parseInt(o,10)};break}this.configManager.update(s)}mapLegacyStrategy(t,e){t==="group-row-column"?e.scanMode="group-row-column":t==="continuous"?e.scanMode="continuous":t==="probability"?e.scanMode="probability":t==="color-code"?e.scanMode="color-code":["row-column","column-row","linear","snake","quadrant","elimination"].includes(t)&&(e.scanPattern=t,t==="row-column"||t==="column-row"?e.scanTechnique="block":e.scanTechnique="point")}parseAttributes(){const t={},e=this.getAttribute("scan-strategy");e&&this.mapLegacyStrategy(e,t);const o=this.getAttribute("scan-pattern");o&&(t.scanPattern=o,t.scanMode=null);const s=this.getAttribute("scan-technique");s&&(t.scanTechnique=s);const a=this.getAttribute("scan-mode");a&&(t.scanMode=a==="null"?null:a);const r=this.getAttribute("scan-input-mode");r&&(t.scanInputMode=r);const l=this.getAttribute("grid-content");l&&(t.gridContent=l);const h=this.getAttribute("grid-size");h&&(t.gridSize=parseInt(h,10));const u=this.getAttribute("language");u&&(t.language=u);const p=this.getAttribute("scan-rate");p&&(t.scanRate=parseInt(p,10));const g=this.getAttribute("acceptance-time");g&&(t.acceptanceTime=parseInt(g,10));const k=this.getAttribute("dwell-time");k&&(t.dwellTime=parseInt(k,10));const M=this.getAttribute("continuous-technique");M&&(t.continuousTechnique=M);const I=this.getAttribute("compass-mode");I&&(t.compassMode=I);const T=this.getAttribute("elimination-switch-count");T&&(t.eliminationSwitchCount=parseInt(T,10));const B=this.getAttribute("cancel-method");B&&(t.cancelMethod=B);const R=this.getAttribute("long-hold-time");R&&(t.longHoldTime=parseInt(R,10));const y=this.getAttribute("highlight-scan-line");y&&(t.highlightScanLine=y==="true"||y==="1");const P=this.getAttribute("highlight-border-width");P&&(t.highlightBorderWidth=parseInt(P,10));const E=this.getAttribute("highlight-border-color");E&&(t.highlightBorderColor=E);const L=this.getAttribute("highlight-scale");L&&(t.highlightScale=parseFloat(L));const A=this.getAttribute("highlight-opacity");A&&(t.highlightOpacity=parseFloat(A));const v=this.getAttribute("highlight-animation");v&&(t.highlightAnimation=v==="true"||v==="1");const w=this.getAttribute("critical-overscan-enabled"),S=this.getAttribute("critical-overscan-fast-rate"),C=this.getAttribute("critical-overscan-slow-rate");(w||S||C)&&(t.criticalOverscan={enabled:w==="true"||w==="1",fastRate:S?parseInt(S,10):100,slowRate:C?parseInt(C,10):1e3});const q=this.getAttribute("custom-items");q&&this.parseCustomItems(q);const $=this.getAttribute("grid-cols");return $&&(this.forcedGridCols=parseInt($,10)),t}parseCustomItems(t){try{this.customItems=JSON.parse(t)}catch(e){console.error("Failed to parse custom-items:",e),this.customItems=null}}updateBoardControlsVisibility(){var o;const t=(o=this.shadowRoot)==null?void 0:o.querySelector(".board-controls");if(!t)return;const e=this.hasAttribute("board-upload");t.classList.toggle("hidden",!e)}async initBoardIfNeeded(){if(!this.configManager)return;const t=this.configManager.get(),e=this.getAttribute("board-src");(t.gridContent==="board"||e||this.hasAttribute("board-upload"))&&(t.gridContent!=="board"&&this.configManager.update({gridContent:"board"}),this.updateBoardControlsVisibility(),e&&await this.loadBoardFromUrl(e))}async loadBoardFromUrl(t){try{this.setBoardStatus("Loading board…");const e=this.resolveBoardUrl(t),o=await fetch(e);if(!o.ok)throw new Error(`Failed to load board: ${o.status}`);const s=await o.blob(),a=e.split("/").pop()||"board",r=new File([s],a,{type:s.type||"application/octet-stream"});await this.loadBoardFromFile(r)}catch(e){console.error(e),this.setBoardStatus("Failed to load board.")}}async loadBoardFromFile(t){var e,o;try{this.setBoardStatus(`Parsing ${t.name}…`);const s=await X(t);this.boardTree=s,this.boardPageId=this.resolveBoardPageId(s),this.setBoardStatus((e=s.metadata)!=null&&e.name?s.metadata.name:t.name),await this.updateGrid(this.configManager.get(),!0),(o=this.currentScanner)==null||o.start()}catch(s){console.error(s),this.setBoardStatus("Failed to parse board.")}}resolveBoardPageId(t){const o=(t.metadata||{}).defaultHomePageId||t.rootId;if(o&&t.pages[o])return o;const s=t.toolbarId,a=Object.values(t.pages).find(r=>r.id!==s);return a?a.id:Object.keys(t.pages)[0]||null}setBoardStatus(t){var o;const e=(o=this.shadowRoot)==null?void 0:o.querySelector(".board-status");e&&(e.textContent=t)}resolveBoardUrl(t){if(!t.startsWith("/"))return t;const e=f();return e==="/"?t:`${e}${t.replace(/^\//,"")}`}getCurrentBoardPage(){return!this.boardTree||!this.boardPageId?null:this.boardTree.pages[this.boardPageId]||null}resolveBoardImage(t){const e=t.resolvedImageEntry;if(e&&typeof e=="string"&&e.startsWith("data:image/"))return e;const o=t.image;if(o&&typeof o=="string")return o}buildBoardGrid(){var a,r,l,h;const t=this.getCurrentBoardPage();if(!t)return null;const e=t.grid.length,o=t.grid.reduce((u,p)=>Math.max(u,p.length),0),s=[];for(let u=0;u<e;u++)for(let p=0;p<o;p++){const g=((a=t.grid[u])==null?void 0:a[p])??null;if(!g||g.visibility==="Hidden"||g.visibility==="Disabled"||g.visibility==="Empty"){s.push({id:`empty-${u}-${p}`,label:"",type:"action",isEmpty:!0});continue}s.push({id:g.id||`btn-${u}-${p}`,label:g.label||"",message:g.message||"",targetPageId:g.targetPageId,scanBlock:g.scanBlock??((r=g.scanBlocks)==null?void 0:r[0]),image:this.resolveBoardImage(g),type:g.targetPageId?"action":"word",backgroundColor:(l=g.style)==null?void 0:l.backgroundColor,textColor:(h=g.style)==null?void 0:h.fontColor})}return{items:s,cols:o}}async setBoardPage(t){var e;!this.boardTree||!this.boardTree.pages[t]||(this.boardPageId=t,await this.updateGrid(this.configManager.get(),!0),(e=this.currentScanner)==null||e.start())}updateTheme(t){const e=this.shadowRoot.querySelector(".scanner-wrapper");e&&(e.className="scanner-wrapper",t&&e.classList.add(t))}setupBoardControls(){var e,o;const t=(e=this.shadowRoot)==null?void 0:e.querySelector(".board-file");if(t){try{const s=((o=G)==null?void 0:o())||[];if(s.length>0){const a=s.map(r=>r.startsWith(".")?r:`.${r}`).join(",");t.accept=a}}catch(s){console.warn("Unable to set board file accept list.",s)}t.addEventListener("change",async()=>{var a;const s=(a=t.files)==null?void 0:a[0];s&&(await this.loadBoardFromFile(s),t.value="")})}}renderTemplate(){const t=this.getAttribute("scan-mode")==="color-code",e=this.getAttribute("scan-pattern")==="elimination";this.shadowRoot.innerHTML=`
      <div class="scanner-wrapper">
        <div class="status-bar">
          <span class="output-text"></span>
          <button class="settings-btn" title="Settings">⚙️</button>
        </div>
        <div class="grid-container"></div>
        <div class="controls">
           <button data-action="select">${t||e?"Blue (1)":"Select (Space)"}</button>
           <button data-action="step">${t?"Red (2)":e?"Switch 2 (2)":"Step (2)"}</button>
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
    `,this.shadowRoot.appendChild(t)}updateControlsVisibility(t){const e=this.shadowRoot.querySelector(".controls");if(!e)return;const o=t.useImageButton;if(e.innerHTML="",t.scanPattern==="elimination"){const a=t.eliminationSwitchCount||4;for(let l=1;l<=a;l++){const h=this.createButton("switch-"+l,`${l}`,t,l);e.appendChild(h)}const r=this.createButton("reset","↺",t,5);r.style.flex="0 0 auto",e.appendChild(r);return}if(t.scanMode==="color-code"){const a=this.createButton("switch-1",o?"":"Blue (1)",t,1),r=this.createButton("switch-2",o?"":"Red (2)",t,2);e.appendChild(a),e.appendChild(r);const l=this.createButton("reset",o?"":"Reset (3)",t,3);l.style.flex="0 0 auto",e.appendChild(l);return}if(t.scanInputMode==="manual"){const a=this.createButton("step",o?"":"Step (2)",t,2);e.appendChild(a);const r=this.createButton("select",o?"":"Select (1)",t,1);e.appendChild(r);return}const s=this.createButton("select",o?"":"Select (1)",t,1);e.appendChild(s)}createButton(t,e,o,s){const a=document.createElement("button");a.setAttribute("data-action",t);const r=o.useImageButton;let l=o.buttonColor||"blue";s&&(l={1:"blue",2:"red",3:"green",4:"yellow",5:"blue",6:"green",7:"red",8:"yellow"}[s]||l);const h=o.customButtonImages;if(r&&(h!=null&&h.normal||h!=null&&h.pressed)){const u=this.getActionLabel(t);a.style.cssText=`
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
      `,a.innerHTML=`
        <img src="${h.normal}" alt="${u}" style="width: 60px; height: 60px; max-width: 60px; transition: none;">
        <span style="font-size: 12px; font-weight: bold; color: #333; text-transform: uppercase;">${u}</span>
      `;const p=a.querySelector("img");a.addEventListener("mousedown",()=>{h.pressed&&(p.src=h.pressed)}),a.addEventListener("mouseup",()=>{p.src=h.normal}),a.addEventListener("mouseleave",()=>{p.src=h.normal})}else if(r){const u=lt[l];a.style.cssText=`
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
      `;const p=this.getActionLabel(t);a.innerHTML=`
        <img src="${u.normal}" alt="${p}" style="width: 60px; height: 60px; max-width: 60px;">
        <span style="font-size: 12px; font-weight: bold; color: #333; text-transform: uppercase;">${p}</span>
      `;const g=a.querySelector("img");a.addEventListener("mousedown",()=>{g.src=u.depressed}),a.addEventListener("mouseup",()=>{g.src=u.normal}),a.addEventListener("mouseleave",()=>{g.src=u.normal})}else a.textContent=e,a.style.cssText=`
        flex: 1;
        padding: 10px 20px;
        font-size: 1rem;
        cursor: pointer;
        border: 1px solid #ccc;
        background: ${s?this.getSwitchColor(s):"#fff"};
        color: ${s?"white":"#333"};
        border-radius: 4px;
        font-weight: ${s?"bold":"normal"};
        text-shadow: ${s?"0 1px 2px rgba(0,0,0,0.3)":"none"};
      `;return a.addEventListener("click",u=>{console.log("[SwitchScannerElement] Button clicked:",t),this.switchInput.triggerAction(t)}),a.addEventListener("mousedown",u=>u.preventDefault()),a}getSwitchColor(t){return{1:"#2196F3",2:"#F44336",3:"#4CAF50",4:"#FFEB3B",5:"#9C27B0",6:"#FF9800",7:"#00BCD4",8:"#E91E63"}[t]||"#2196F3"}getActionLabel(t){const e={select:"Choose",step:"Move",reset:"Reset",cancel:"Cancel"};return t.startsWith("switch-")?`Switch ${t.replace("switch-","")}`:e[t]||t}bindEvents(){var o;let t=this.configManager.get();this.configManager.subscribe(async s=>{this.audioManager.setEnabled(s.soundEnabled);const a=s.gridContent!==t.gridContent||s.gridSize!==t.gridSize||s.language!==t.language||s.layoutMode!==t.layoutMode,r=s.scanPattern!==t.scanPattern||s.scanTechnique!==t.scanTechnique||s.scanMode!==t.scanMode;r&&console.log("[SwitchScannerElement] Scanner changed:",{old:{scanMode:t.scanMode,scanPattern:t.scanPattern},new:{scanMode:s.scanMode,scanPattern:s.scanPattern}});const l=s.viewMode!==t.viewMode||s.heatmapMax!==t.heatmapMax;a?await this.updateGrid(s,!0):r?(this.setScanner(s),await this.updateGrid(s,!0)):l&&await this.updateGrid(s,!1),t=s}),this.switchInput.addEventListener("switch",s=>{const a=s.detail;if(a.action==="menu"){this.settingsUI.toggle();return}this.currentScanner&&this.currentScanner.handleAction(a.action)}),(o=this.shadowRoot.querySelector(".settings-btn"))==null||o.addEventListener("click",()=>{this.settingsUI.toggle()}),this.shadowRoot.querySelectorAll(".controls button").forEach(s=>{s.addEventListener("click",a=>{const r=a.target.getAttribute("data-action");r&&this.switchInput.triggerAction(r)}),s.addEventListener("mousedown",a=>a.preventDefault())}),this.updateControlsVisibility(this.configManager.get()),this.configManager.subscribe(s=>{this.updateControlsVisibility(s),this.gridRenderer.updateHighlightStyles(s)});const e=this.shadowRoot.querySelector(".grid-container");e.addEventListener("scanner:selection",s=>{const r=s.detail.item,l=this.shadowRoot.querySelector(".output-text");if(l){if(this.configManager.get().gridContent==="board"){if(r.targetPageId){this.setBoardPage(r.targetPageId);return}const g=r.message||r.label;g&&(l.textContent=(l.textContent||"")+g);return}const u=r.label,p=l.textContent||"";if(u==="Undo"){this.outputHistory.length>0&&(this.redoStack.push(p),l.textContent=this.outputHistory.pop()||"");return}if(u==="Redo"){this.redoStack.length>0&&(this.outputHistory.push(p),l.textContent=this.redoStack.pop()||"");return}this.outputHistory.push(p),this.redoStack=[],u==="Backspace"?l.textContent=p.slice(0,-1):u==="Clear"?l.textContent="":u==="Enter"?l.textContent=p+`
`:u==="Space"?l.textContent=p+" ":l.textContent=p+u}}),e.addEventListener("scanner:redraw",()=>{const s=this.configManager.get();this.updateGrid(s,!1)}),e.addEventListener("mousemove",s=>{const a=s.target.closest(".grid-cell");this.handleDwell(a)}),e.addEventListener("mouseleave",()=>{this.handleDwell(null)})}handleDwell(t){if(this.currentDwellTarget===t)return;this.dwellTimer&&(window.clearTimeout(this.dwellTimer),this.dwellTimer=null),this.currentDwellTarget&&this.currentDwellTarget.classList.remove("dwell-active"),this.currentDwellTarget=t;const e=this.configManager.get();t&&e.dwellTime>0&&(t.classList.add("dwell-active"),this.dwellTimer=window.setTimeout(()=>{this.currentDwellTarget===t&&(this.triggerItemSelection(t),t.classList.remove("dwell-active"),this.currentDwellTarget=null)},e.dwellTime))}triggerItemSelection(t){const e=parseInt(t.dataset.index||"-1",10);if(e>=0){this.gridRenderer.setSelected(e);const o=this.gridRenderer.getItem(e);if(o){const s=new CustomEvent("scanner:selection",{bubbles:!0,composed:!0,detail:{item:o}});this.gridRenderer.getContainer().dispatchEvent(s),this.audioManager&&this.audioManager.playSelectSound()}}}generateNumbers(t){const e=[];for(let o=1;o<=t;o++)e.push({id:`item-${o}`,label:o.toString(),type:"action"});return e}async generateKeyboard(t){await this.alphabetManager.loadLanguage(t.language);const o=this.alphabetManager.getCharacters(t.layoutMode).map((s,a)=>({id:`char-${a}`,label:s,type:"char"}));return[" ",".",",","?","!","Backspace","Clear","Enter"].forEach((s,a)=>{o.push({id:`ctrl-${a}`,label:s===" "?"Space":s,type:"action"})}),o}getHeatmapColor(t,e){return`hsl(${120*(1-Math.min(t/e,1))}, 80%, 80%)`}applyVisualization(t,e){return!this.currentScanner||e.viewMode==="standard"?t:t.map((o,s)=>{if(!o)return o;const a=this.currentScanner.getCost(s),r={...o};return e.viewMode==="cost-numbers"?r.label=a.toString():e.viewMode==="cost-heatmap"&&(r.backgroundColor=this.getHeatmapColor(a,e.heatmapMax),r.textColor="#000"),r})}async updateGrid(t,e=!1){if(t.gridContent==="board"){const l=this.buildBoardGrid(),h=(l==null?void 0:l.items)||[],u=(l==null?void 0:l.cols)||0;if(this.gridRenderer.render(h,u||1),t.viewMode!=="standard"&&this.currentScanner){const p=this.applyVisualization(h,t);this.gridRenderer.render(p,u||1)}this.gridRenderer.updateHighlightStyles({highlightBorderWidth:t.highlightBorderWidth,highlightBorderColor:t.highlightBorderColor,highlightScale:t.highlightScale,highlightOpacity:t.highlightOpacity,highlightAnimation:t.highlightAnimation,highlightScanLine:t.highlightScanLine,scanDirection:t.scanDirection,scanPattern:t.scanPattern,scanRate:t.scanRate});return}e&&(this.customItems&&this.customItems.length>0?this.baseItems=this.customItems:t.gridContent==="keyboard"?this.baseItems=await this.generateKeyboard(t):this.baseItems=this.generateNumbers(t.gridSize));const o=this.baseItems.length;let s=Math.ceil(Math.sqrt(o));this.forcedGridCols&&this.forcedGridCols>0&&(s=this.forcedGridCols);const a=Math.ceil(o/s);let r=this.baseItems;if(this.currentScanner&&(r=this.currentScanner.mapContentToGrid(this.baseItems,a,s)),this.gridRenderer.render(r,s),t.viewMode!=="standard"&&this.currentScanner){const l=this.applyVisualization(r,t);this.gridRenderer.render(l,s)}this.gridRenderer.updateHighlightStyles({highlightBorderWidth:t.highlightBorderWidth,highlightBorderColor:t.highlightBorderColor,highlightScale:t.highlightScale,highlightOpacity:t.highlightOpacity,highlightAnimation:t.highlightAnimation,highlightScanLine:t.highlightScanLine,scanDirection:t.scanDirection,scanPattern:t.scanPattern,scanRate:t.scanRate})}createScanner(t){if(console.log("[SwitchScannerElement] Creating scanner with config:",{scanMode:t.scanMode,scanPattern:t.scanPattern,scanTechnique:t.scanTechnique,continuousTechnique:t.continuousTechnique}),t.scanMode==="cause-effect")return new at(this.scanSurface,this.configManager,this.scanCallbacks);if(t.scanMode==="group-row-column")return new et(this.scanSurface,this.configManager,this.scanCallbacks);if(t.scanMode==="continuous")return console.log("[SwitchScannerElement] Creating ContinuousScanner"),new st(this.scanSurface,this.configManager,this.scanCallbacks);if(t.scanMode==="probability")return new ot(this.scanSurface,this.configManager,this.scanCallbacks);if(t.scanMode==="color-code")return new rt(this.scanSurface,this.configManager,this.scanCallbacks);switch(t.scanPattern){case"linear":return new J(this.scanSurface,this.configManager,this.scanCallbacks);case"snake":return new V(this.scanSurface,this.configManager,this.scanCallbacks);case"quadrant":return new tt(this.scanSurface,this.configManager,this.scanCallbacks);case"elimination":return new it(this.scanSurface,this.configManager,this.scanCallbacks);case"column-row":return new D(this.scanSurface,this.configManager,this.scanCallbacks);case"row-column":default:return new D(this.scanSurface,this.configManager,this.scanCallbacks)}}setScanner(t){console.log("[SwitchScannerElement] setScanner called"),this.currentScanner&&(console.log("[SwitchScannerElement] Stopping current scanner"),this.currentScanner.stop()),this.currentScanner=this.createScanner(t),this.gridRenderer.updateHighlightStyles({highlightBorderWidth:t.highlightBorderWidth,highlightBorderColor:t.highlightBorderColor,highlightScale:t.highlightScale,highlightOpacity:t.highlightOpacity,highlightAnimation:t.highlightAnimation,highlightScanLine:t.highlightScanLine,scanDirection:t.scanDirection,scanPattern:t.scanPattern,scanRate:t.scanRate}),console.log("[SwitchScannerElement] Starting new scanner:",this.currentScanner.constructor.name),this.currentScanner.start()}}customElements.get("switch-scanner")||customElements.define("switch-scanner",ct);
