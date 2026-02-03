export function initScanEstimator(root = document) {
  const estimateScanRate = root.getElementById('estimateScanRate');
  const estimateGridSize = root.getElementById('estimateGridSize');
  const estimatePattern = root.getElementById('estimatePattern');
  const estimateSwitches = root.getElementById('estimateSwitches');
  const estimatePresses = root.getElementById('estimatePresses');
  const estimateTime = root.getElementById('estimateTime');
  const estimateUseReaction = root.getElementById('estimateUseReaction');
  const estimateReset = root.getElementById('estimateReset');

  if (!estimateScanRate) return;

  const calcAveragePresses = () => {
    const n = Math.max(1, parseInt(estimateGridSize.value, 10) || 1);
    const pattern = estimatePattern.value;
    if (pattern === 'linear') return (n + 1) / 2;
    if (pattern === 'row-column') {
      const rows = Math.ceil(Math.sqrt(n));
      const cols = Math.ceil(n / rows);
      return (rows + 1) / 2 + (cols + 1) / 2;
    }
    const switches = Math.max(2, parseInt(estimateSwitches.value, 10) || 2);
    return Math.max(1, Math.log(n) / Math.log(switches));
  };

  const update = () => {
    const rate = Math.max(100, parseInt(estimateScanRate.value, 10) || 1000);
    const presses = calcAveragePresses();
    const timeMs = presses * rate;
    estimatePresses.textContent = `${presses.toFixed(2)} presses`;
    estimateTime.textContent = `${(timeMs / 1000).toFixed(2)} seconds`;
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
    el.addEventListener('input', update);
    el.addEventListener('change', update);
  });

  update();
}
