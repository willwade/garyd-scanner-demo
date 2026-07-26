export function initScanEstimator(root = document) {
  const estimateScanRate = root.getElementById('estimateScanRate');
  const estimateGridSize = root.getElementById('estimateGridSize');
  const estimatePattern = root.getElementById('estimatePattern');
  const estimateSwitches = root.getElementById('estimateSwitches');
  const estimatePresses = root.getElementById('estimatePresses');
  const estimateTime = root.getElementById('estimateTime');
  const estimateWpm = root.getElementById('estimateWpm');
  const estimateUseReaction = root.getElementById('estimateUseReaction');
  const estimateReset = root.getElementById('estimateReset');

  if (!estimateScanRate) return;

  const calcAveragePresses = (gridSize, pattern, numSwitches) => {
    const n = Math.max(1, gridSize || 1);
    if (pattern === 'linear') return (n + 1) / 2;
    if (pattern === 'row-column') {
      const rows = Math.ceil(Math.sqrt(n));
      const cols = Math.ceil(n / rows);
      return (rows + 1) / 2 + (cols + 1) / 2;
    }
    const switches = Math.max(2, numSwitches || 2);
    // Elimination scanning steps = depth = log_m(N)
    return Math.max(1, Math.ceil(Math.log(n) / Math.log(switches)));
  };

  const update = () => {
    const rate = Math.max(100, parseInt(estimateScanRate.value, 10) || 1000);
    const n = Math.max(1, parseInt(estimateGridSize.value, 10) || 36);
    const pattern = estimatePattern.value;
    const switches = Math.max(2, parseInt(estimateSwitches.value, 10) || 4);

    const presses = calcAveragePresses(n, pattern, switches);
    const timeMs = presses * rate;
    const timeSec = timeMs / 1000;

    // Text Entry Rate (TER) in WPM = (60 s / (time_per_char * 5 chars_per_word))
    const wpm = (60 / (timeSec * 5)).toFixed(2);

    if (estimatePresses) estimatePresses.textContent = `${presses.toFixed(2)} presses`;
    if (estimateTime) estimateTime.textContent = `${timeSec.toFixed(2)} seconds`;
    if (estimateWpm) estimateWpm.textContent = `${wpm} WPM`;
  };

  estimateUseReaction?.addEventListener('click', () => {
    const avgEl = root.getElementById('reactionAvg');
    if (!avgEl) return;
    const raw = avgEl.textContent?.replace(' ms', '').trim();
    const avg = raw && raw !== '—' ? parseFloat(raw) : null;
    if (avg) {
      estimateScanRate.value = Math.round(avg / 0.65);
      update();
    }
  });

  estimateReset?.addEventListener('click', () => {
    estimateScanRate.value = 1000;
    estimateGridSize.value = 36;
    estimatePattern.value = 'row-column';
    estimateSwitches.value = 4;
    update();
  });

  [estimateScanRate, estimateGridSize, estimatePattern, estimateSwitches].forEach((el) => {
    el?.addEventListener('input', update);
    el?.addEventListener('change', update);
  });

  update();
}
