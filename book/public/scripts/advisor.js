export function initSettingsAdvisor(root = document) {
  const advisorRun = root.getElementById('advisorRun');
  const advisorSummary = root.getElementById('advisorSummary');
  const advisorResults = root.getElementById('advisorResults');
  if (!advisorRun) return;

  const readInput = () => ({
    performanceOk: root.getElementById('advisorPerformance').value === 'yes',
    terCanImprove: root.getElementById('advisorImprove').value === 'yes',
    scanningErrorsPct: parseFloat(root.getElementById('advisorErrors').value || '0'),
    currentScanDelayMs: parseFloat(root.getElementById('advisorCurrentDelay')?.value || '1000'),
    meanReactionTimeMs: parseFloat(root.getElementById('advisorMeanRt')?.value || '0'),
    firstPressLate: root.getElementById('advisorFirstLate').checked,
    nextPressLate: root.getElementById('advisorNextLate').checked,
    unintentionalPresses: root.getElementById('advisorUnintentional').checked,
    missingFirstRow: root.getElementById('advisorMissingRow').checked,
    deadTime: root.getElementById('advisorDeadTime').checked,
    inefficientWordPrediction: root.getElementById('advisorWordPred').checked,
    inefficientLayout: root.getElementById('advisorLayout').checked
  });

  const adviseSettings = (input) => {
    const recommendations = [];
    const errorThreshold = 25; // Koester & Simpson 2014 25% threshold
    const currentDelay = input.currentScanDelayMs || 1000;
    const meanRt = input.meanReactionTimeMs || 0;

    if (!input.performanceOk) {
      recommendations.push({
        category: 'Switch Activation',
        actions: [
          'Revise switch physical mounting location or switch type',
          'Assess muscle fatigue and motor consistency',
          'Adjust initial acceptance delay (150–300 ms)'
        ],
        note: 'Switch activation consistency must be resolved before optimizing scanning parameters (Koester & Simpson, 2014).'
      });
      return { recommendations, summary: 'Switch performance issues detected. Resolve switch activation stability first.' };
    }

    if (!input.terCanImprove) {
      return { recommendations, summary: 'No measurable improvement opportunity indicated. Current settings are performing optimally.' };
    }

    let calculatedScanDelay = currentDelay;
    if (meanRt > 0) {
      calculatedScanDelay = Math.round(meanRt / 0.65);
    }

    if (input.scanningErrorsPct > errorThreshold) {
      if (input.firstPressLate) {
        const newDelay = Math.max(Math.round(currentDelay * 1.25), calculatedScanDelay || 1200);
        recommendations.push({
          category: 'Scan Timing (Scan Delay)',
          actions: [
            `Increase scan delay from ${currentDelay} ms to ~${newDelay} ms (slower scan rate)`,
            'Add or increase Scan-Initiation Delay (500–1000 ms pause before 1st step)'
          ],
          note: 'Late first press indicates the scan rate exceeds visual search + motor initiation reaction time.'
        });
      }

      if (input.nextPressLate) {
        recommendations.push({
          category: 'Group/Column Timing (1st-Item Delay)',
          actions: [
            'Add or increase 1st-Item Delay (+250–500 ms extended pause on first item of each row/column)'
          ],
          note: 'Late next press occurs when entering a row. Extra time at item 1 prevents missed column selections.'
        });
      }

      if (input.unintentionalPresses) {
        recommendations.push({
          category: 'Input Filtering (Acceptance Delay & Debounce)',
          actions: [
            'Increase Acceptance Delay (+150–300 ms hold duration)',
            'Enable mechanical Debounce Filter (50–100 ms)'
          ],
          note: 'Filters unintentional rapid taps or contact bounce without missing intentional presses.'
        });
      }

      if (input.missingFirstRow) {
        recommendations.push({
          category: 'Scan Initiation Mode',
          actions: [
            'Switch to Manual Scan Initiation mode',
            'Increase initial auto-scan pause on row 1'
          ],
          note: 'Allowing the user to trigger the start of each scan cycle eliminates missed first-row penalties.'
        });
      }

      if (recommendations.length === 0) {
        const newDelay = Math.round(currentDelay * 1.2);
        recommendations.push({
          category: 'General Timing Adjustment',
          actions: [
            `Increase scan delay from ${currentDelay} ms to ~${newDelay} ms`,
            'Review 1st-item delay and acceptance delay parameters'
          ],
          note: 'High error rate (>25%) significantly penalizes Text Entry Rate. Reduce errors before optimizing speed.'
        });
      }

      return { recommendations, summary: `Scanning error rate is high (${input.scanningErrorsPct}% > 25% threshold). Focus exclusively on error reduction before attempting efficiency changes.` };
    }

    if (input.deadTime) {
      recommendations.push({
        category: 'Dead Time Reduction',
        actions: [
          'Reduce scan-initiation pause and 1st-item delay to minimal safe values (100–250 ms)',
          'Optimize scan matrix ordering to eliminate empty scan steps'
        ],
        note: 'Minimizing idle waiting between selections directly increases Text Entry Rate (TER).'
      });
    }

    if (input.inefficientWordPrediction) {
      recommendations.push({
        category: 'Word Prediction Optimization',
        actions: [
          'Limit word prediction candidate list to 3–6 items',
          'Verify that selecting word prediction requires fewer scan steps than spelling directly',
          'Place word prediction candidates at top scan priority'
        ],
        note: 'Overly long prediction lists add visual search overhead and extra scan steps, offsetting keystroke savings.'
      });
    }

    if (input.inefficientLayout) {
      recommendations.push({
        category: 'Layout & Pattern Optimization',
        actions: [
          'Switch from alphabetical to frequency-based letter order (ETAOIN SHRDLU)',
          'Upgrade scan pattern (e.g., from Linear to Row-Column or Elimination for large grids)'
        ],
        note: 'Frequency layout reduces average scan distance per character by up to 45%.'
      });
    }

    if (recommendations.length === 0) {
      const fasterDelay = Math.max(400, Math.round(currentDelay * 0.9));
      recommendations.push({
        category: 'Scan Speed Tuning',
        actions: [
          `Optionally test a 10% faster scan delay (~${fasterDelay} ms) while monitoring error rate`,
          'Re-evaluate layout and prediction list efficiency'
        ],
        note: 'Error rate is within safe bounds (<=25%). Fine-tune timing and layout for maximum Text Entry Rate.'
      });
    }

    return { recommendations, summary: `Scanning error rate is within acceptable bounds (${input.scanningErrorsPct}% <= 25%). Focus on efficiency tuning and dead time reduction.` };
  };

  const render = () => {
    const input = readInput();
    const result = adviseSettings(input);
    advisorSummary.textContent = result.summary || '—';
    if (!result.recommendations || result.recommendations.length === 0) {
      advisorResults.innerHTML = '<p>No recommendations.</p>';
      return;
    }
    advisorResults.innerHTML = result.recommendations.map((rec) => {
      const actions = rec.actions.map((a) => `<li>${a}</li>`).join('');
      const note = rec.note ? `<p style="margin: 6px 0 0; color: var(--ink-soft);"><em>${rec.note}</em></p>` : '';
      return `
        <div class="glossary-term" style="margin-bottom: 12px; padding: 12px; background: #ffffff; border: 1px solid var(--line); border-radius: 8px;">
          <strong>${rec.category}</strong>
          <ul style="margin: 8px 0 0; padding-left: 18px;">${actions}</ul>
          ${note}
        </div>
      `;
    }).join('');
  };

  advisorRun.addEventListener('click', render);
}
