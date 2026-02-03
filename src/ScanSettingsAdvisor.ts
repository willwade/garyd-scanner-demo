export type AdvisorInput = {
  performanceOk: boolean;
  terCanImprove: boolean;
  scanningErrorsPct: number;
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
};

export type AdvisorResult = {
  recommendations: AdvisorRecommendation[];
  summary: string;
};

export function adviseSettings(input: AdvisorInput): AdvisorResult {
  const recommendations: AdvisorRecommendation[] = [];
  const errorThreshold = 25;

  if (!input.performanceOk) {
    recommendations.push({
      category: 'Switch',
      actions: ['Revise switch location or type', 'Adjust acceptance delay'],
      note: 'Switch activation consistency must be addressed before scanning optimization.'
    });
    return {
      recommendations,
      summary: 'Switch performance issues detected. Fix switch activation first.'
    };
  }

  if (!input.terCanImprove) {
    return {
      recommendations,
      summary: 'No measurable improvement opportunity indicated.'
    };
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
    return {
      recommendations,
      summary: 'Error rate above 25%. Focus on error reduction before efficiency.'
    };
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

  return {
    recommendations,
    summary: 'Error rate below 25%. Focus on efficiency improvements.'
  };
}
