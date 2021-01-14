import { isUndefined, cloneDeep, trimEnd, isEmpty, isObject } from 'lodash-es';

import type { TFunction } from 'i18next';
import type { NeighborRankParams } from '../stores/types/GraphManagementStore/dataAnalyzeStore';

export const AlgorithmInternalNameMapping: Record<string, string> = {
  rings: 'loop-detection',
  crosspoints: 'focus-detection',
  shortpath: 'shortest-path',
  allshortpath: 'shortest-path-all',
  paths: 'all-path',
  fsimilarity: 'model-similarity',
  neighborrank: 'neighbor-rank',
  kneighbor: 'k-step-neighbor',
  kout: 'kHop',
  customizedpaths: 'custom-path',
  rays: 'radiographic-inspection',
  sameneighbors: 'same-neighbor',
  weightedshortpath: 'weighted-shortest-path',
  singleshortpath: 'single-source-weighted-shortest-path',
  jaccardsimilarity: 'jaccard',
  personalrank: 'personal-rank'
};

export function formatAlgorithmStatement(
  content: string,
  algorithmType: string | undefined,
  translator: TFunction
) {
  if (isUndefined(algorithmType)) {
    return [''];
  }

  const algorithmName = translator(
    `data-analyze.algorithm-forms.api-name-mapping.${algorithmType}`
  );
  let algorithmParams = JSON.parse(content);
  const statements: string[] = [algorithmName];

  if (algorithmType === 'fsimilarity') {
    let convertedParams: Record<string, string>;

    if (!isUndefined(algorithmParams.sources)) {
      convertedParams = {
        source: algorithmParams.sources.ids ?? [],
        'vertex-type': algorithmParams.sources.label ?? '',
        'vertex-property': algorithmParams.sources.properties ?? [],
        direction: algorithmParams.direction,
        least_neighbor: algorithmParams.min_neighbors,
        similarity: algorithmParams.alpha,
        label:
          algorithmParams.label === null || algorithmParams.label === '__all__'
            ? translator(
                `data-analyze.algorithm-forms.model-similarity.pre-value`
              )
            : algorithmParams.label,
        max_similar: algorithmParams.top,
        least_similar: algorithmParams.min_similars,
        property_filter: algorithmParams.group_property,
        least_property_number: algorithmParams.min_groups,
        max_degree: algorithmParams.max_degree,
        capacity: algorithmParams.capacity,
        limit: algorithmParams.limit,
        return_common_connection: algorithmParams.with_intermediary,
        return_complete_info: algorithmParams.with_vertex
      };
    } else {
      // no need to convert relative fields in temp log (which sources field is undefined)
      convertedParams = { ...algorithmParams };
      convertedParams['vertex-type'] = convertedParams.vertexType;
      convertedParams['vertex-property'] = convertedParams.vertexProperty;
      convertedParams.label =
        algorithmParams.label === null || algorithmParams.label === '__all__'
          ? translator(
              `data-analyze.algorithm-forms.model-similarity.pre-value`
            )
          : algorithmParams.label;

      delete convertedParams.vertexType;
      delete convertedParams.vertexProperty;
    }

    algorithmParams = convertedParams;
  }

  if (algorithmType === 'neighborrank') {
    const convertedParams = cloneDeep(algorithmParams);

    convertedParams.steps = [];

    (algorithmParams as NeighborRankParams).steps.forEach(
      ({ degree, direction, labels, top }, stepIndex) => {
        const step: Record<string, any> = {};

        step[
          trimEnd(
            translator(
              'data-analyze.algorithm-forms.neighbor-rank.options.degree'
            ),
            ':'
          )
        ] = degree;
        step[
          trimEnd(
            translator(
              'data-analyze.algorithm-forms.neighbor-rank.options.direction'
            ),
            ':'
          )
        ] = direction;
        step[
          trimEnd(
            translator(
              'data-analyze.algorithm-forms.neighbor-rank.options.label'
            ),
            ':'
          )
        ] = isEmpty(labels)
          ? translator('data-analyze.algorithm-forms.neighbor-rank.pre-value')
          : labels.map((label) =>
              // value may be "__all__" from temp log (local)
              label === '__all__'
                ? translator(
                    'data-analyze.algorithm-forms.neighbor-rank.pre-value'
                  )
                : label
            );
        step[
          trimEnd(
            translator(
              'data-analyze.algorithm-forms.neighbor-rank.options.top'
            ),
            ':'
          )
        ] = top;

        convertedParams.steps[stepIndex] = step;
      }
    );

    algorithmParams = convertedParams;
  }

  Object.entries(algorithmParams).forEach(([key, value]) => {
    value = isObject(value) ? JSON.stringify(value, null, 4) : value;

    // label value could be null when it means all
    if (key === 'label' && (value === null || value === '__all__')) {
      value = translator(
        `data-analyze.algorithm-forms.${AlgorithmInternalNameMapping[algorithmType]}.pre-value`
      );
    }

    key = translator(
      `data-analyze.algorithm-forms.${AlgorithmInternalNameMapping[algorithmType]}.options.${key}`
    );

    statements.push(`${key} ${value}`);
  });

  return statements;
}
