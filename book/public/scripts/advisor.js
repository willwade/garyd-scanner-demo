export function initSettingsAdvisor(root = document) {
  const advisorRun = root.getElementById('advisorRun');
  const advisorSummary = root.getElementById('advisorSummary');
  const advisorResults = root.getElementById('advisorResults');
  
  // Wizard tab elements
  const advisorTabStep1 = root.getElementById('advisorTabStep1');
  const advisorTabStep2 = root.getElementById('advisorTabStep2');
  const advisorTabStep3 = root.getElementById('advisorTabStep3');
  const advisorPaneStep1 = root.getElementById('advisorPaneStep1');
  const advisorPaneStep2 = root.getElementById('advisorPaneStep2');
  const advisorPaneStep3 = root.getElementById('advisorPaneStep3');
  const btnAdvisorToStep2 = root.getElementById('btnAdvisorToStep2');
  const btnAdvisorBackToStep1 = root.getElementById('btnAdvisorBackToStep1');
  const btnAdvisorBackToStep2 = root.getElementById('btnAdvisorBackToStep2');

  if (!advisorRun) return;

  const switchStep = (step) => {
    [advisorTabStep1, advisorTabStep2, advisorTabStep3].forEach((tab, idx) => {
      tab?.classList.toggle('active', idx + 1 === step);
    });
    [advisorPaneStep1, advisorPaneStep2, advisorPaneStep3].forEach((pane, idx) => {
      pane?.classList.toggle('active', idx + 1 === step);
    });
  };

  advisorTabStep1?.addEventListener('click', () => switchStep(1));
  advisorTabStep2?.addEventListener('click', () => switchStep(2));
  advisorTabStep3?.addEventListener('click', () => switchStep(3));
  btnAdvisorToStep2?.addEventListener('click', () => switchStep(2));
  btnAdvisorBackToStep1?.addEventListener('click', () => switchStep(1));
  btnAdvisorBackToStep2?.addEventListener('click', () => switchStep(2));

  const readInput = () => ({
    performanceOk: root.getElementById('advisorPerformance')?.value === 'yes',
    terCanImprove: root.getElementById('advisorImprove')?.value === 'yes',
    scanningErrorsPct: parseFloat(root.getElementById('advisorErrors')?.value || '0'),
    currentScanDelayMs: parseFloat(root.getElementById('advisorCurrentDelay')?.value || '1000'),
    meanReactionTimeMs: parseFloat(root.getElementById('advisorMeanRt')?.value || '0'),
    firstPressLate: root.getElementById('advisorFirstLate')?.checked || false,
    nextPressLate: root.getElementById('advisorNextLate')?.checked || false,
    unintentionalPresses: root.getElementById('advisorUnintentional')?.checked || false,
    missingFirstRow: root.getElementById('advisorMissingRow')?.checked || false,
    deadTime: root.getElementById('advisorDeadTime')?.checked || false,
    inefficientWordPrediction: root.getElementById('advisorWordPred')?.checked || false,
    inefficientLayout: root.getElementById('advisorLayout')?.checked || false
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
            'Add 1st-Item Pause to stabilize row selections'
          ],
          note: 'Error rate exceeds 25%. Prioritize error reduction before attempting to increase scanning speed.'
        });
      }

      return { recommendations, summary: `Scanning error rate (${input.scanningErrorsPct}%) exceeds the 25% threshold. Prioritize error reduction before optimizing speed.` };
    }

    if (input.deadTime) {
      const fasterDelay = Math.max(300, Math.round(currentDelay * 0.85));
      recommendations.push({
        category: 'Dead Time Reduction',
        actions: [
          `Decrease scan delay from ${currentDelay} ms to ~${fasterDelay} ms`,
          'Reduce post-selection pause duration'
        ],
        note: 'Error rate is low (<=25%). Gradually increasing scan speed will safely increase Text Entry Rate.'
      });
    }

    if (input.inefficientWordPrediction) {
      recommendations.push({
        category: 'Word Prediction Optimization',
        actions: [
          'Adjust word prediction list size (3–6 candidates)',
          'Position prediction candidates at top of initial scan row',
          'Enable inline word completion'
        ],
        note: 'Optimal prediction list length balances keystroke savings against visual search overhead.'
      });
    }

    if (input.inefficientLayout) {
      recommendations.push({
        category: 'Layout & Pattern Selection',
        actions: [
          'Switch from alphabetical to ETAOIN SHRDLU frequency-ordered grid',
          'Upgrade from Linear to Row-Column or Group Elimination scanning'
        ],
        note: 'Frequency-based layouts reduce average scan steps per character by 30–50%.'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        category: 'Efficiency Maintenance',
        actions: [
          'Maintain current scanning settings',
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
    if (advisorSummary) advisorSummary.textContent = result.summary || '—';
    if (advisorResults) {
      if (!result.recommendations || result.recommendations.length === 0) {
        advisorResults.innerHTML = '<p>No recommendations.</p>';
      } else {
        advisorResults.innerHTML = result.recommendations.map((rec) => {
          const actions = rec.actions.map((a) => `<li>${a}</li>`).join('');
          const note = rec.note ? `<p style="margin: 6px 0 0; color: var(--ink-soft);"><em>${rec.note}</em></p>` : '';
          return `
            <div class="glossary-term" style="margin-bottom: 12px; padding: 16px; background: #ffffff; border: 1.5px solid var(--accent); border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <strong style="color: var(--accent); font-size: 1.05rem;">${rec.category}</strong>
              <ul style="margin: 8px 0 0; padding-left: 20px;">${actions}</ul>
              ${note}
            </div>
          `;
        }).join('');
      }
    }

    // Switch to Step 3 tab to present results cleanly!
    switchStep(3);
  };

  advisorRun?.addEventListener('click', render);
}
