export function initSettingsAdvisor(root = document) {
  const advisorRun = root.getElementById('advisorRun');
  const advisorSummary = root.getElementById('advisorSummary');
  const advisorResults = root.getElementById('advisorResults');
  if (!advisorRun) return;

  const readInput = () => ({
    performanceOk: root.getElementById('advisorPerformance').value === 'yes',
    terCanImprove: root.getElementById('advisorImprove').value === 'yes',
    scanningErrorsPct: parseFloat(root.getElementById('advisorErrors').value || '0'),
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
    const errorThreshold = 25;

    if (!input.performanceOk) {
      recommendations.push({
        category: 'Switch',
        actions: ['Revise switch location or type', 'Adjust acceptance delay'],
        note: 'Switch activation consistency must be addressed before scanning optimization.'
      });
      return { recommendations, summary: 'Switch performance issues detected. Fix switch activation first.' };
    }

    if (!input.terCanImprove) {
      return { recommendations, summary: 'No measurable improvement opportunity indicated.' };
    }

    if (input.scanningErrorsPct > errorThreshold) {
      if (input.firstPressLate) {
        recommendations.push({
          category: 'Timing',
          actions: ['Increase scan delay (slower scan rate)'],
          note: 'Late first press suggests scan rate is too fast.'
        });
      } else if (input.nextPressLate) {
        recommendations.push({
          category: 'Timing',
          actions: ['Increase 1st-item delay'],
          note: 'Late next press suggests more time is needed at the first item.'
        });
      } else if (input.unintentionalPresses) {
        recommendations.push({
          category: 'Timing',
          actions: ['Increase acceptance delay'],
          note: 'Filters unintended presses or bounce.'
        });
      } else if (input.missingFirstRow) {
        recommendations.push({
          category: 'Control',
          actions: ['Switch manual/auto initiation mode'],
          note: 'Missing first-row selections may indicate initiation timing issues.'
        });
      } else {
        recommendations.push({
          category: 'Timing',
          actions: ['Review scan delay', 'Review 1st-item delay', 'Review acceptance delay'],
          note: 'High error rate suggests timing adjustments.'
        });
      }
      return { recommendations, summary: 'Error rate above 25%. Focus on error reduction before efficiency.' };
    }

    if (input.deadTime) {
      recommendations.push({
        category: 'Dead Time',
        actions: ['Reduce manual/auto initiation dead time', 'Adjust 1st-item delay', 'Optimize scan order'],
        note: 'Remove unnecessary waits between selections.'
      });
    } else if (input.inefficientWordPrediction) {
      recommendations.push({
        category: 'Language Features',
        actions: ['Tune word prediction list size', 'Ensure time to scan prediction list', 'Review scan pattern & group layout'],
        note: 'Prediction should save more scan steps than it adds.'
      });
    } else if (input.inefficientLayout) {
      recommendations.push({
        category: 'Layout',
        actions: ['Use frequency-based layout', 'Optimize scan pattern', 'Adjust scan order'],
        note: 'Reduce scan distance for frequent items.'
      });
    } else {
      recommendations.push({
        category: 'Efficiency',
        actions: ['Consider faster scan delay if accuracy is stable', 'Re-check dead time and layout'],
        note: 'Efficiency tuning after errors are controlled.'
      });
    }

    return { recommendations, summary: 'Error rate below 25%. Focus on efficiency improvements.' };
  };

  const render = () => {
    const result = adviseSettings(readInput());
    advisorSummary.textContent = result.summary || '—';
    if (!result.recommendations || result.recommendations.length === 0) {
      advisorResults.innerHTML = '<p>No recommendations.</p>';
      return;
    }
    advisorResults.innerHTML = result.recommendations.map((rec) => {
      const actions = rec.actions.map((a) => `<li>${a}</li>`).join('');
      const note = rec.note ? `<p style="margin: 6px 0 0; color: var(--ink-soft);"><em>${rec.note}</em></p>` : '';
      return `
        <div class="glossary-term">
          <strong>${rec.category}</strong>
          <ul style="margin: 8px 0 0; padding-left: 18px;">${actions}</ul>
          ${note}
        </div>
      `;
    }).join('');
  };

  advisorRun.addEventListener('click', render);
}
