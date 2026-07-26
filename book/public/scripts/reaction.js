export function initReactionTest(root = document) {
  const reactionDisplay = root.getElementById('reactionDisplay');
  const reactionEmoji = root.getElementById('reactionEmoji');
  const reactionLabel = root.getElementById('reactionLabel');
  const reactionSubtext = root.getElementById('reactionSubtext');
  const reactionStart = root.getElementById('reactionStart');
  const reactionReset = root.getElementById('reactionReset');
  const reactionTrial = root.getElementById('reactionTrial');
  const reactionLast = root.getElementById('reactionLast');
  const reactionAvg = root.getElementById('reactionAvg');
  const reactionRate = root.getElementById('reactionRate');
  const reactionSd = root.getElementById('reactionSd');
  const trialDotsContainer = root.getElementById('trialDots');

  // Wizard tab elements
  const tabStep1 = root.getElementById('tabStep1');
  const tabStep2 = root.getElementById('tabStep2');
  const paneStep1 = root.getElementById('paneStep1');
  const paneStep2 = root.getElementById('paneStep2');
  const btnProceedToStep2 = root.getElementById('btnProceedToStep2');
  const btnBackToStep1 = root.getElementById('btnBackToStep1');
  const estimateScanRate = root.getElementById('estimateScanRate');

  if (!reactionDisplay) return;

  const state = {
    trial: 0,
    times: [],
    phase: 'idle', // 'idle' | 'ready' | 'active' | 'early' | 'result' | 'complete'
    startTime: 0,
    readyStartTime: 0,
    timer: null,
    audioCtx: null,
    lastHitTime: 0,
    recommendedRate: null
  };

  const switchStep = (step) => {
    if (step === 1) {
      tabStep1?.classList.add('active');
      tabStep2?.classList.remove('active');
      paneStep1?.classList.add('active');
      paneStep2?.classList.remove('active');
    } else {
      tabStep1?.classList.remove('active');
      tabStep2?.classList.add('active');
      paneStep1?.classList.remove('active');
      paneStep2?.classList.add('active');

      if (state.recommendedRate && estimateScanRate) {
        estimateScanRate.value = String(Math.round(state.recommendedRate));
        estimateScanRate.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  };

  tabStep1?.addEventListener('click', () => switchStep(1));
  tabStep2?.addEventListener('click', () => switchStep(2));
  btnProceedToStep2?.addEventListener('click', () => switchStep(2));
  btnBackToStep1?.addEventListener('click', () => switchStep(1));

  const setCardState = (phase, emoji, label, subtext) => {
    state.phase = phase;
    reactionDisplay.className = `reaction-display-card state-${phase}`;
    if (reactionEmoji) reactionEmoji.textContent = emoji;
    if (reactionLabel) reactionLabel.textContent = label;
    if (reactionSubtext) reactionSubtext.textContent = subtext;
  };

  const updateDots = () => {
    if (!trialDotsContainer) return;
    const dots = trialDotsContainer.querySelectorAll('.trial-dot');
    dots.forEach((dot, index) => {
      dot.className = 'trial-dot';
      if (index < state.times.length) {
        dot.classList.add('completed');
      } else if (index === state.trial - 1 && state.phase !== 'idle' && state.phase !== 'complete') {
        dot.classList.add('active');
      }
    });
  };

  const updateStats = () => {
    if (reactionTrial) reactionTrial.textContent = String(state.trial);
    const last = state.times[state.times.length - 1];
    if (reactionLast) reactionLast.textContent = last ? `${last.toFixed(0)} ms` : '—';

    if (state.times.length) {
      const avg = state.times.reduce((a, b) => a + b, 0) / state.times.length;
      if (reactionAvg) reactionAvg.textContent = `${avg.toFixed(0)} ms`;

      let sd = 0;
      if (state.times.length > 1) {
        const variance = state.times.reduce((acc, t) => acc + Math.pow(t - avg, 2), 0) / (state.times.length - 1);
        sd = Math.sqrt(variance);
      }
      if (reactionSd) reactionSd.textContent = `${sd.toFixed(0)} ms`;

      const cv = avg > 0 ? sd / avg : 0;
      const bufferedRt = cv > 0.3 ? avg + 1.65 * sd : avg;
      const recommended = bufferedRt / 0.65;
      state.recommendedRate = recommended;

      const bufferNote = cv > 0.3 ? ' (variance buffer)' : '';
      if (reactionRate) reactionRate.textContent = `${recommended.toFixed(0)} ms${bufferNote}`;
    } else {
      if (reactionAvg) reactionAvg.textContent = '—';
      if (reactionSd) reactionSd.textContent = '—';
      if (reactionRate) reactionRate.textContent = '—';
      state.recommendedRate = null;
    }
    updateDots();
  };

  const playBeep = () => {
    try {
      if (!state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = state.audioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.12;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => osc.stop(), 120);
    } catch (err) {
      // Audio context fallback
    }
  };

  const scheduleCue = () => {
    state.readyStartTime = performance.now();
    setCardState('ready', '😐', `Trial ${state.trial} of 5: Get Ready...`, 'Don\'t press yet! Wait for GREEN.');
    const delay = 1500 + Math.random() * 2000;
    
    if (state.timer) clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      state.timer = null;
      state.startTime = performance.now();
      setCardState('active', '😄', 'PRESS NOW!', 'Tap SPACE or Click as fast as you can!');
      playBeep();
    }, delay);
  };

  const nextTrial = () => {
    if (state.trial >= 5) {
      setCardState('complete', '🎉', 'Test Complete!', 'Click "Proceed to Step 2" below to estimate WPM.');
      updateStats();
      return;
    }
    state.trial += 1;
    updateStats();
    scheduleCue();
  };

  const resetTest = () => {
    if (state.timer) clearTimeout(state.timer);
    state.timer = null;
    state.trial = 0;
    state.times = [];
    state.lastHitTime = 0;
    setCardState('idle', '😴', 'Click or Press SPACE to Start', 'Step 1: Complete 5 quick trials to measure your reaction speed.');
    updateStats();
  };

  const handleInput = () => {
    const now = performance.now();
    // Refractory buffer: ignore extra presses within 300 ms of last hit
    if (now - state.lastHitTime < 300) return;

    if (state.phase === 'idle') {
      resetTest();
      nextTrial();
    } else if (state.phase === 'ready') {
      // Ignore presses within the first 350ms of entering ready state
      if (now - state.readyStartTime < 350) return;

      if (state.timer) clearTimeout(state.timer);
      state.timer = null;
      setCardState('early', '⚠️', 'Too Early!', 'Wait for the green face before pressing!');
      state.lastHitTime = now;

      state.timer = setTimeout(() => {
        state.timer = null;
        if (state.phase === 'early') {
          scheduleCue();
        }
      }, 1400);
    } else if (state.phase === 'active') {
      const elapsed = now - state.startTime;
      state.times.push(elapsed);
      state.lastHitTime = now;
      updateStats();

      const isFinal = state.trial >= 5;
      setCardState(
        'result',
        '⚡',
        `${elapsed.toFixed(0)} ms!`,
        isFinal ? '🎉 All 5 trials completed!' : 'Nice hit! Next trial starting in a moment...'
      );

      state.timer = setTimeout(() => {
        state.timer = null;
        nextTrial();
      }, 1400);
    } else if (state.phase === 'result' || state.phase === 'early') {
      if (state.timer) clearTimeout(state.timer);
      state.timer = null;
      state.lastHitTime = now;
      nextTrial();
    } else if (state.phase === 'complete') {
      resetTest();
      nextTrial();
    }
  };

  reactionStart?.addEventListener('click', () => {
    resetTest();
    nextTrial();
  });
  reactionReset?.addEventListener('click', resetTest);
  reactionDisplay?.addEventListener('click', handleInput);

  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'BUTTON')) return;
    e.preventDefault();
    handleInput();
  });

  resetTest();
}
