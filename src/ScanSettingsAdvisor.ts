export type AdvisorInput = {
  performanceOk: boolean;
  terCanImprove: boolean;
  scanningErrorsPct: number;
  currentScanDelayMs?: number;
  meanReactionTimeMs?: number;
  reactionTimeSdMs?: number;
  firstPressLate?: boolean;
  nextPressLate?: boolean;
  unintentionalPresses?: boolean;
  missingFirstRow?: boolean;
  deadTime?: boolean;
  inefficientWordPrediction?: boolean;
  inefficientLayout?: boolean;
};

export type AdvisorRecommendation = {
  category: string;
  actions: string[];
  note?: string;
  suggestedScanDelayMs?: number;
  suggestedFirstItemDelayMs?: number;
  suggestedAcceptanceDelayMs?: number;
};

export type AdvisorResult = {
  recommendations: AdvisorRecommendation[];
  summary: string;
  targetFocus: 'error-reduction' | 'efficiency' | 'switch-hardware' | 'none';
  estimatedTerWpm?: number;
};

/**
 * Implements the clinical decision model from Koester & Simpson (2014)
 * "Method for enhancing text entry rate with single-switch scanning" (JRRD).
 */
export function adviseSettings(input: AdvisorInput): AdvisorResult {
  const recommendations: AdvisorRecommendation[] = [];
  const errorThreshold = 25; // Koester & Simpson 2014 25% error threshold
  const currentDelay = input.currentScanDelayMs || 1000;
  const meanRt = input.meanReactionTimeMs || 0;
  const rtSd = input.reactionTimeSdMs || 0;

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
    return {
      recommendations,
      summary: 'Switch performance issues detected. Resolve switch activation stability first.',
      targetFocus: 'switch-hardware'
    };
  }

  if (!input.terCanImprove) {
    return {
      recommendations,
      summary: 'No measurable improvement opportunity indicated. Current settings are performing optimally.',
      targetFocus: 'none'
    };
  }

  // Calculate recommended scan rate via the .65 Rule (Simpson & Koester, 1999)
  let calculatedScanDelay = currentDelay;
  if (meanRt > 0) {
    const cv = meanRt > 0 ? rtSd / meanRt : 0;
    // Add extra variance buffer if Coefficient of Variation > 0.3
    const rtWithBuffer = cv > 0.3 ? meanRt + 1.65 * rtSd : meanRt;
    calculatedScanDelay = Math.round(rtWithBuffer / 0.65);
  }

  if (input.scanningErrorsPct > errorThreshold) {
    // Branch A: High Error Rate (> 25%) -> Priority: Error Reduction
    if (input.firstPressLate) {
      const newDelay = Math.max(Math.round(currentDelay * 1.2), calculatedScanDelay || 1200);
      recommendations.push({
        category: 'Scan Timing (Scan Delay)',
        actions: [
          `Increase scan delay from ${currentDelay} ms to ~${newDelay} ms (slower scan rate)`,
          'Add or increase Scan-Initiation Delay (500–1000 ms pause before 1st step)'
        ],
        note: 'Late first press indicates the scan rate exceeds visual search + motor initiation reaction time.',
        suggestedScanDelayMs: newDelay
      });
    }

    if (input.nextPressLate) {
      recommendations.push({
        category: 'Group/Column Timing (1st-Item Delay)',
        actions: [
          'Add or increase 1st-Item Delay (+250–500 ms extended pause on first item of each row/column)'
        ],
        note: 'Late next press occurs when changing scan levels (e.g., entering a row). Extra time at item 1 prevents missed column selections.',
        suggestedFirstItemDelayMs: 300
      });
    }

    if (input.unintentionalPresses) {
      recommendations.push({
        category: 'Input Filtering (Acceptance Delay & Debounce)',
        actions: [
          'Increase Acceptance Delay (+150–300 ms hold duration)',
          'Enable mechanical Debounce Filter (50–100 ms)'
        ],
        note: 'Filters unintentional rapid taps, spasms, or switch contact bounce without missing intentional presses.',
        suggestedAcceptanceDelayMs: 250
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
          `Increase scan delay to ~${newDelay} ms`,
          'Review 1st-item delay and acceptance delay parameters'
        ],
        note: 'High error rate (>25%) significantly penalizes Text Entry Rate. Reduce errors before optimizing speed.',
        suggestedScanDelayMs: newDelay
      });
    }

    return {
      recommendations,
      summary: `Scanning error rate is high (${input.scanningErrorsPct}% > 25% threshold). Focus exclusively on error reduction before attempting efficiency changes.`,
      targetFocus: 'error-reduction'
    };
  }

  // Branch B: Low/Moderate Error Rate (<= 25%) -> Priority: Efficiency & Dead Time
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
      note: 'Error rate is within safe bounds (<=25%). Fine-tune timing and layout for maximum Text Entry Rate.',
      suggestedScanDelayMs: fasterDelay
    });
  }

  // Estimate Text Entry Rate (WPM)
  const avgPressesPerChar = input.inefficientLayout ? 12 : 6;
  const scanTimePerChar = (avgPressesPerChar * currentDelay) / 1000;
  const estimatedWpm = Number((60 / (scanTimePerChar * 5)).toFixed(2));

  return {
    recommendations,
    summary: `Scanning error rate is within acceptable bounds (${input.scanningErrorsPct}% <= 25%). Focus on efficiency tuning and dead time reduction.`,
    targetFocus: 'efficiency',
    estimatedTerWpm: estimatedWpm
  };
}
