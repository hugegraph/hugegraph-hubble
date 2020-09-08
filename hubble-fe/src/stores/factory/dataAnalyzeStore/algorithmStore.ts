export enum Algorithm {
  loopDetection = 'loop-detection',
  focusDetection = 'focus-detection',
  shortestPath = 'shortest-path',
  shortestPathAll = 'shortest-path-all',
  relativePathOrAllPath = 'relative-path-or-all-path',
  modelSimilarityAlgorithm = 'model-similarity-algorithm',
  realTimeRecommendation = 'real-time-recommendation',
  kStepNeighbor = 'k-step-neighbor',
  kHopAlgorithm = 'k-hop-algorithm',
  customPath = 'custom-path',
  customIntersectionDetection = 'custom-intersection-detection',
  radiographicInspection = 'radiographic-inspection',
  commonNeighbor = 'common-neighbor',
  weightedShortestPath = 'weighted-shortest-path',
  singleSourceWeightedPath = 'single-source-weighted-path',
  jaccardSimilarity = 'jaccard-similarity',
  personalRankRecommendationAlgorithm = 'personal-rank-recommendation-algorithm'
}

export function initializeRequestStatus() {
  return {
    fetchAlgorithmResult: 'standby'
  };
}

export function initializeErrorInfo() {
  return {
    fetchAlgorithmResult: {
      code: NaN,
      message: ''
    }
  };
}

export function createShortestPathDefaultParams() {
  return {
    source: '',
    target: '',
    direction: 'BOTH',
    max_depth: '',
    label: '__all__',
    max_degree: '10000',
    skip_degree: '0',
    capacity: '10000000',
    limit: '1000000'
  };
}

export function createValidateShortestPathParamsErrorMessage() {
  return {
    source: '',
    target: '',
    direction: '',
    max_depth: '',
    label: '',
    max_degree: '',
    skip_degree: '',
    capacity: '',
    limit: ''
  };
}

export function createLoopDetectionDefaultParams() {
  return {
    source: '',
    direction: 'BOTH',
    max_depth: '',
    label: '__all__',
    max_degree: '10000',
    has_source: '1',
    capacity: '10',
    max_capacity: '10000000'
  }
}

export function createValidateLoopDetectionParamsErrorMessage() {
  return {
    source: '',
    direction: '',
    max_depth: '',
    label: '',
    max_degree: '',
    capacity: '',
    limit: ''
  };
}

export function createFocusDetectionDefaultParams() {
  return {
    source: '',
    target: '',
    direction: 'BOTH',
    max_depth: '',
    label: '__all__',
    max_degree: '10000',
    has_source: '1',
    capacity: '10',
    max_capacity: '10000000'
  }
}

export function createValidateFocusDetectionParamsErrorMessage() {
  return {
    source: '',
    target: '',
    direction: '',
    max_depth: '',
    label: '',
    max_degree: '',
    skip_degree: '',
    capacity: '',
    limit: ''
  };
}
