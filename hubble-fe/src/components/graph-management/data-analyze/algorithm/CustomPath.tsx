import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { size, last } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { styles } from '../QueryAndAlgorithmLibrary';
import { Button, Radio, Input, Select } from '@baidu/one-ui';

import { Tooltip as CustomTooltip } from '../../../common';
import DataAnalyzeStore from '../../../../stores/GraphManagementStore/dataAnalyzeStore/dataAnalyzeStore';

import QuestionMarkIcon from '../../../../assets/imgs/ic_question_mark.svg';
import { Algorithm } from '../../../../stores/factory/dataAnalyzeStore/algorithmStore';
import { NeighborRankRule } from '../../../../stores/types/GraphManagementStore/dataAnalyzeStore';

const CustomPath = observer(() => {
  const { t } = useTranslation();
  const dataAnalyzeStore = useContext(DataAnalyzeStore);
  const algorithmAnalyzerStore = dataAnalyzeStore.algorithmAnalyzerStore;

  const sourceType = algorithmAnalyzerStore.modelSimilarityParams.method;

  const isValidExec =
    Object.values(
      algorithmAnalyzerStore.validateNeighborRankParamsParamsErrorMessage
    ).every((value) => Array.isArray(value) || value === '') &&
    algorithmAnalyzerStore.validateNeighborRankParamsParamsErrorMessage.steps.every(
      (step) => Object.values(step).every((value) => value === '')
    ) &&
    algorithmAnalyzerStore.neighborRankParams.source !== '' &&
    algorithmAnalyzerStore.neighborRankParams.alpha !== '';

  const isValidAddRule =
    algorithmAnalyzerStore.validateNeighborRankParamsParamsErrorMessage.steps.every(
      (step) => Object.values(step).every((value) => value === '')
    ) && algorithmAnalyzerStore.duplicateNeighborRankRuleSet.size === 0;

  const invalidExtendFormClassname = (flag: boolean) => {
    return classnames({
      'query-tab-content-form-expand-items': true,
      'query-tab-content-form-expand-items-invalid': flag
    });
  };

  return (
    <div style={{ display: 'flex' }}>
      <div className="query-tab-content-form" style={{ width: '50%' }}>
        <div className="query-tab-content-form-row">
          <div className="query-tab-content-form-item">
            <div className="query-tab-content-form-item-title large">
              <i>*</i>
              <span>
                {t('data-analyze.algorithm-forms.custom-path.options.method')}
              </span>
            </div>
            <Radio.Group
              disabled={
                dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
              }
              value={algorithmAnalyzerStore.modelSimilarityParams.method}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                algorithmAnalyzerStore.switchModelSimilarityMethod(
                  e.target.value
                );
              }}
            >
              <Radio value="id">
                {t(
                  'data-analyze.algorithm-forms.custom-path.radio-value.specific-id'
                )}
              </Radio>
              <Radio value="property">
                {t(
                  'data-analyze.algorithm-forms.custom-path.radio-value.filtered-type-property'
                )}
              </Radio>
            </Radio.Group>
          </div>
        </div>
        <div className="query-tab-content-form-row">
          <div className="query-tab-content-form-item">
            <div className="query-tab-content-form-item-title large">
              {sourceType === 'id' && <i>*</i>}
              <span>
                {sourceType === 'id'
                  ? t('data-analyze.algorithm-forms.custom-path.options.source')
                  : t(
                      'data-analyze.algorithm-forms.custom-path.options.vertex-type'
                    )}
              </span>
            </div>
            {sourceType === 'id' ? (
              <Input
                width={390}
                size="medium"
                disabled={
                  dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
                }
                placeholder={t(
                  'data-analyze.algorithm-forms.custom-path.placeholder.input-source-id'
                )}
                errorLocation="layer"
                errorMessage={
                  algorithmAnalyzerStore
                    .validateModelSimilartiyParamsErrorMessage.source
                }
                value={algorithmAnalyzerStore.modelSimilarityParams.source}
                onChange={(e: any) => {
                  algorithmAnalyzerStore.mutateModelSimilarityParams(
                    'source',
                    e.value as string
                  );

                  algorithmAnalyzerStore.validateModelSimilarityParams(
                    'source'
                  );
                }}
                originInputProps={{
                  onBlur() {
                    algorithmAnalyzerStore.validateModelSimilarityParams(
                      'source'
                    );
                  }
                }}
              />
            ) : (
              <Select
                size="medium"
                trigger="click"
                selectorName={t(
                  'data-analyze.algorithm-forms.model-similarity.placeholder.input-vertex-type'
                )}
                value={algorithmAnalyzerStore.modelSimilarityParams.vertexType}
                notFoundContent={t(
                  'data-analyze.algorithm-forms.model-similarity.placeholder.no-vertex-type'
                )}
                disabled={
                  dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
                }
                width={390}
                onChange={(value: string) => {
                  algorithmAnalyzerStore.mutateModelSimilarityParams(
                    'vertexType',
                    value
                  );
                }}
              >
                {dataAnalyzeStore.vertexTypes.map(({ name }) => (
                  <Select.Option value={name} key={name}>
                    {name}
                  </Select.Option>
                ))}
              </Select>
            )}
          </div>
        </div>
        <div className="query-tab-content-form-row">
          <div className="query-tab-content-form-item">
            <div className="query-tab-content-form-item-title large">
              <i>*</i>
              <span>
                {t(
                  'data-analyze.algorithm-forms.custom-path.options.default_weight'
                )}
              </span>
            </div>
            <Radio.Group
              disabled={
                dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
              }
              value={algorithmAnalyzerStore.neighborRankParams.direction}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                algorithmAnalyzerStore.mutateNeighborRankParams(
                  'direction',
                  e.target.value
                );
              }}
            >
              <Radio value="BOTH">
                {t('data-analyze.algorithm-forms.custom-path.radio-value.none')}
              </Radio>
              <Radio value="OUT">
                {t(
                  'data-analyze.algorithm-forms.custom-path.radio-value.ascend'
                )}
              </Radio>
              <Radio value="IN">
                {t(
                  'data-analyze.algorithm-forms.custom-path.radio-value.descend'
                )}
              </Radio>
            </Radio.Group>
          </div>
        </div>
        <div className="query-tab-content-form-row">
          <div className="query-tab-content-form-item">
            <div className="query-tab-content-form-item-title large">
              <span>
                {t('data-analyze.algorithm-forms.custom-path.options.capacity')}
              </span>
            </div>
            <Input
              width={390}
              size="medium"
              disabled={
                dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
              }
              placeholder={t(
                'data-analyze.algorithm-forms.custom-path.placeholder.input-positive-integer'
              )}
              errorLocation="layer"
              errorMessage={
                algorithmAnalyzerStore
                  .validateNeighborRankParamsParamsErrorMessage.capacity
              }
              value={algorithmAnalyzerStore.neighborRankParams.capacity}
              onChange={(e: any) => {
                algorithmAnalyzerStore.mutateNeighborRankParams(
                  'capacity',
                  e.value as string
                );

                algorithmAnalyzerStore.validateNeighborRankParams('capacity');
              }}
              originInputProps={{
                onBlur() {
                  algorithmAnalyzerStore.validateNeighborRankParams('capacity');
                }
              }}
            />
          </div>
        </div>
        <div className="query-tab-content-form-row">
          <div className="query-tab-content-form-item">
            <div className="query-tab-content-form-item-title large">
              <span>
                {t('data-analyze.algorithm-forms.custom-path.options.limit')}
              </span>
            </div>
            <Input
              width={390}
              size="medium"
              disabled={
                dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
              }
              placeholder={t(
                'data-analyze.algorithm-forms.custom-path.placeholder.input-integer'
              )}
              errorLocation="layer"
              errorMessage={
                algorithmAnalyzerStore.validateModelSimilartiyParamsErrorMessage
                  .limit
              }
              value={algorithmAnalyzerStore.modelSimilarityParams.limit}
              onChange={(e: any) => {
                algorithmAnalyzerStore.mutateModelSimilarityParams(
                  'limit',
                  e.value as string
                );

                algorithmAnalyzerStore.validateModelSimilarityParams('limit');
              }}
              originInputProps={{
                onBlur() {
                  algorithmAnalyzerStore.validateModelSimilarityParams('limit');
                }
              }}
            />
          </div>
        </div>
        <div
          className="query-tab-content-form-row"
          style={{ marginLeft: 92, justifyContent: 'flex-start' }}
        >
          <Button
            type="primary"
            style={styles.primaryButton}
            disabled={
              !isValidExec ||
              dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
            }
            onClick={async () => {
              algorithmAnalyzerStore.switchCollapse(true);
              dataAnalyzeStore.switchGraphLoaded(false);

              const timerId = dataAnalyzeStore.addTempExecLog();
              await dataAnalyzeStore.fetchGraphs({
                url: 'neighborrank',
                type: Algorithm.neighborRankRecommendation
              });
              await dataAnalyzeStore.fetchExecutionLogs();
              window.clearTimeout(timerId);
            }}
          >
            {t('data-analyze.manipulations.execution')}
          </Button>
          <Button
            style={styles.primaryButton}
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            onClick={() => {
              algorithmAnalyzerStore.resetNeighborRankParams();
            }}
          >
            {t('data-analyze.manipulations.reset')}
          </Button>
        </div>
      </div>

      <div
        className="query-tab-content-form-expand-wrapper"
        style={{ width: '50%' }}
      >
        {algorithmAnalyzerStore.neighborRankParams.steps.map(
          ({ uuid, direction, label, degree, top }, ruleIndex) => {
            return (
              <div
                className={invalidExtendFormClassname(
                  algorithmAnalyzerStore.duplicateNeighborRankRuleSet.has(uuid)
                )}
              >
                <div className="query-tab-content-form-expand-item">
                  <div className="query-tab-content-form-item-title query-tab-content-form-expand-title">
                    <i>*</i>
                    <span>
                      {t(
                        'data-analyze.algorithm-forms.neighbor-rank.options.direction'
                      )}
                    </span>
                  </div>
                  <Radio.Group
                    disabled={
                      dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
                    }
                    value={direction}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      algorithmAnalyzerStore.mutateNeighborRankRuleParams(
                        'direction',
                        e.target.value,
                        ruleIndex
                      );

                      algorithmAnalyzerStore.validateDuplicateNeighborRankRules(
                        uuid
                      );
                    }}
                  >
                    <Radio value="BOTH">both</Radio>
                    <Radio value="OUT">out</Radio>
                    <Radio value="IN">in</Radio>
                  </Radio.Group>
                  {size(algorithmAnalyzerStore.neighborRankParams.steps) >
                    1 && (
                    <div
                      style={{
                        marginLeft: 198,
                        fontSize: 14,
                        color: '#2b65ff',
                        cursor: 'pointer',
                        lineHeight: '22px'
                      }}
                      onClick={() => {
                        algorithmAnalyzerStore.removeNeighborRankRule(
                          ruleIndex
                        );

                        algorithmAnalyzerStore.validateDuplicateNeighborRankRules(
                          uuid
                        );
                      }}
                    >
                      删除
                    </div>
                  )}
                </div>
                <div className="query-tab-content-form-expand-item">
                  <div className="query-tab-content-form-item-title query-tab-content-form-expand-title">
                    <span>
                      {t(
                        'data-analyze.algorithm-forms.custom-path.options.label'
                      )}
                    </span>
                  </div>
                  <Select
                    size="medium"
                    trigger="click"
                    value={label}
                    notFoundContent={t(
                      'data-analyze.algorithm-forms.custom-path.placeholder.no-edge-types'
                    )}
                    disabled={
                      dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
                    }
                    width={380}
                    onChange={(value: string) => {
                      algorithmAnalyzerStore.mutateNeighborRankRuleParams(
                        'label',
                        value,
                        ruleIndex
                      );

                      algorithmAnalyzerStore.validateDuplicateNeighborRankRules(
                        uuid
                      );
                    }}
                  >
                    <Select.Option value="__all__" key="__all__">
                      {t(
                        'data-analyze.algorithm-forms.neighbor-rank.pre-value'
                      )}
                    </Select.Option>
                    {dataAnalyzeStore.edgeTypes.map(({ name }) => (
                      <Select.Option value={name} key={name}>
                        {name}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
                <div className="query-tab-content-form-expand-item">
                  <div className="query-tab-content-form-item-title query-tab-content-form-expand-title">
                    <span>
                      {t(
                        'data-analyze.algorithm-forms.custom-path.options.properties'
                      )}
                    </span>
                  </div>
                  <Input
                    width={380}
                    size="medium"
                    disabled={
                      dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
                    }
                    placeholder={t(
                      'data-analyze.algorithm-forms.custom-path.placeholder.input-property'
                    )}
                    errorLocation="layer"
                    errorMessage={
                      algorithmAnalyzerStore
                        .validateNeighborRankParamsParamsErrorMessage.steps[
                        ruleIndex
                      ].degree
                    }
                    value={degree}
                    onChange={(e: any) => {
                      algorithmAnalyzerStore.mutateNeighborRankRuleParams(
                        'degree',
                        e.value as string,
                        ruleIndex
                      );

                      algorithmAnalyzerStore.validateNeighborRankRules(
                        'degree',
                        ruleIndex
                      );

                      algorithmAnalyzerStore.validateDuplicateNeighborRankRules(
                        uuid
                      );
                    }}
                    originInputProps={{
                      onBlur() {
                        algorithmAnalyzerStore.validateNeighborRankRules(
                          'degree',
                          ruleIndex
                        );
                      }
                    }}
                  />
                </div>
                <div className="query-tab-content-form-expand-item">
                  <div className="query-tab-content-form-item-title query-tab-content-form-expand-title">
                    <span>
                      {t(
                        'data-analyze.algorithm-forms.custom-path.options.weight_by'
                      )}
                    </span>
                  </div>
                  <Select
                    size="medium"
                    trigger="click"
                    value={label}
                    notFoundContent={t(
                      'data-analyze.algorithm-forms.custom-path.placeholder.select-property'
                    )}
                    disabled={
                      dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
                    }
                    width={380}
                    onChange={(value: string) => {
                      algorithmAnalyzerStore.mutateNeighborRankRuleParams(
                        'label',
                        value,
                        ruleIndex
                      );

                      algorithmAnalyzerStore.validateDuplicateNeighborRankRules(
                        uuid
                      );
                    }}
                  >
                    <Select.Option value="__all__" key="__all__">
                      {t(
                        'data-analyze.algorithm-forms.neighbor-rank.pre-value'
                      )}
                    </Select.Option>
                    {dataAnalyzeStore.edgeTypes.map(({ name }) => (
                      <Select.Option value={name} key={name}>
                        {name}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
                <div className="query-tab-content-form-expand-item">
                  <div className="query-tab-content-form-item-title query-tab-content-form-expand-title">
                    <span>
                      {t(
                        'data-analyze.algorithm-forms.custom-path.options.degree'
                      )}
                    </span>
                  </div>
                  <Input
                    width={380}
                    size="medium"
                    disabled={
                      dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
                    }
                    placeholder={t(
                      'data-analyze.algorithm-forms.custom-path.placeholder.input-integer'
                    )}
                    errorLocation="layer"
                    errorMessage={
                      algorithmAnalyzerStore
                        .validateNeighborRankParamsParamsErrorMessage.steps[
                        ruleIndex
                      ].degree
                    }
                    value={degree}
                    onChange={(e: any) => {
                      algorithmAnalyzerStore.mutateNeighborRankRuleParams(
                        'degree',
                        e.value as string,
                        ruleIndex
                      );

                      algorithmAnalyzerStore.validateNeighborRankRules(
                        'degree',
                        ruleIndex
                      );

                      algorithmAnalyzerStore.validateDuplicateNeighborRankRules(
                        uuid
                      );
                    }}
                    originInputProps={{
                      onBlur() {
                        algorithmAnalyzerStore.validateNeighborRankRules(
                          'degree',
                          ruleIndex
                        );
                      }
                    }}
                  />
                </div>
                <div className="query-tab-content-form-expand-item">
                  <div className="query-tab-content-form-item-title query-tab-content-form-expand-title">
                    <span>
                      {t(
                        'data-analyze.algorithm-forms.custom-path.options.sample'
                      )}
                    </span>
                  </div>
                  <Input
                    width={380}
                    size="medium"
                    disabled={
                      dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
                    }
                    placeholder={t(
                      'data-analyze.algorithm-forms.custom-path.placeholder.input-integer'
                    )}
                    errorLocation="layer"
                    errorMessage={
                      algorithmAnalyzerStore
                        .validateNeighborRankParamsParamsErrorMessage.steps[
                        ruleIndex
                      ].top
                    }
                    value={top}
                    onChange={(e: any) => {
                      algorithmAnalyzerStore.mutateNeighborRankRuleParams(
                        'top',
                        e.value as string,
                        ruleIndex
                      );

                      algorithmAnalyzerStore.validateNeighborRankRules(
                        'top',
                        ruleIndex
                      );

                      algorithmAnalyzerStore.validateDuplicateNeighborRankRules(
                        uuid
                      );
                    }}
                    originInputProps={{
                      onBlur() {
                        algorithmAnalyzerStore.validateNeighborRankRules(
                          'top',
                          ruleIndex
                        );
                      }
                    }}
                  />
                </div>
              </div>
            );
          }
        )}
        <div
          style={{
            width: 'fix-content',
            fontSize: 14,
            color: isValidAddRule ? '#2b65ff' : '#999',
            marginTop: 8
          }}
        >
          {algorithmAnalyzerStore.duplicateNeighborRankRuleSet.size === 0 ? (
            <span
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (isValidAddRule) {
                  algorithmAnalyzerStore.addNeighborRankRule();

                  algorithmAnalyzerStore.validateDuplicateNeighborRankRules(
                    (last(
                      algorithmAnalyzerStore.neighborRankParams.steps
                    ) as NeighborRankRule).uuid
                  );
                }
              }}
            >
              {t('data-analyze.algorithm-forms.neighbor-rank.add-new-rule')}
            </span>
          ) : (
            <div
              style={{
                width: 150,
                boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.15)',
                lineHeight: '18px',
                padding: '16px',
                color: '#e64552',
                fontSize: 14,
                textAlign: 'center'
              }}
            >
              {t(
                'data-analyze.algorithm-forms.neighbor-rank.validations.input-chars'
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default CustomPath;
