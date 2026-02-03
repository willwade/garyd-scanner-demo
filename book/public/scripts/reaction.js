export function initReactionTest(root = document) {
  const reactionDisplay = root.getElementById('reactionDisplay');
  const reactionStart = root.getElementById('reactionStart');
  const reactionReset = root.getElementById('reactionReset');
  const reactionTrial = root.getElementById('reactionTrial');
  const reactionLast = root.getElementById('reactionLast');
  const reactionAvg = root.getElementById('reactionAvg');
  const reactionRate = root.getElementById('reactionRate');

  if (!reactionDisplay) return;

  const state = {
    trial: 0,
    times: [],
    waiting: false,
    startTime: 0,
    timer: null,
    audioCtx: null
  };

  const update = () => {
    reactionTrial.textContent = String(state.trial);
    const last = state.times[state.times.length - 1];
    reactionLast.textContent = last ? `${last.toFixed(0)} ms` : '—';
    if (state.times.length) {
      const avg = state.times.reduce((a, b) => a + b, 0) / state.times.length;
      reactionAvg.textContent = `${avg.toFixed(0)} ms`;
      const recommended = avg / 0.65;
      reactionRate.textContent = `${recommended.toFixed(0)} ms per item`;
    } else {
      reactionAvg.textContent = '—';
      reactionRate.textContent = '—';
    }
  };

  const playBeep = () => {
    try {
      if (!state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = state.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => osc.stop(), 120);
    } catch (err) {
      // ignore audio failures
    }
  };

  const scheduleCue = () => {
    state.waiting = false;
    reactionDisplay.textContent = '⏳ Wait...';
    const delay = 1000 + Math.random() * 2000;
    state.timer = setTimeout(() => {
      state.timer = null;
      reactionDisplay.textContent = '🙂 Ding!';
      playBeep();
      state.startTime = performance.now();
      state.waiting = true;
    }, delay);
  };

  const startTest = () => {
    if (state.trial >= 3 || state.timer || state.waiting) return;
    state.trial += 1;
    update();
    scheduleCue();
  };

  const resetTest = () => {
    state.trial = 0;
    state.times = [];
    state.waiting = false;
    if (state.timer) clearTimeout(state.timer);
    state.timer = null;
    reactionDisplay.textContent = '🙂 Ready?';
    update();
  };

  const registerHit = () => {
    if (!state.waiting) return;
    state.waiting = false;
    const elapsed = performance.now() - state.startTime;
    state.times.push(elapsed);
    update();
    if (state.trial < 3) {
      scheduleCue();
    } else {
      reactionDisplay.textContent = '✅ Done!';
    }
  };

  reactionStart?.addEventListener('click', startTest);
  reactionReset?.addEventListener('click', resetTest);
  reactionDisplay.addEventListener('click', registerHit);

  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
    if (state.trial > 0) registerHit();
  });

  update();
}
