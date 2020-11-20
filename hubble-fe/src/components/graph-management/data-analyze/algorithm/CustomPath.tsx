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
import { CustomPathRule } from '../../../../stores/types/GraphManagementStore/dataAnalyzeStore';

const CustomPath = observer(() => {
  const { t } = useTranslation();
  const dataAnalyzeStore = useContext(DataAnalyzeStore);
  const algorithmAnalyzerStore = dataAnalyzeStore.algorithmAnalyzerStore;

  const sourceType = algorithmAnalyzerStore.customPathParams.method;

  const isValidExec =
    Object.values(
      algorithmAnalyzerStore.validateCustomPathParmasErrorMessage
    ).every((value) => Array.isArray(value) || value === '') &&
    algorithmAnalyzerStore.validateCustomPathParmasErrorMessage.steps.every(
      (step) => Object.values(step).every((value) => value === '')
    ) &&
    (algorithmAnalyzerStore.customPathParams.method === 'id'
      ? algorithmAnalyzerStore.customPathParams.source !== ''
      : true);

  const isValidAddRule =
    algorithmAnalyzerStore.validateCustomPathParmasErrorMessage.steps.every(
      (step) => Object.values(step).every((value) => value === '')
    ) && algorithmAnalyzerStore.duplicateCustomPathRuleSet.size === 0;

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
              value={algorithmAnalyzerStore.customPathParams.method}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                algorithmAnalyzerStore.switchCustomPathMethod(e.target.value);
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
                  algorithmAnalyzerStore.validateCustomPathParmasErrorMessage
                    .source
                }
                value={algorithmAnalyzerStore.customPathParams.source}
                onChange={(e: any) => {
                  algorithmAnalyzerStore.mutateCustomPathParams(
                    'source',
                    e.value as string
                  );

                  algorithmAnalyzerStore.validateCustomPathParams('source');
                }}
                originInputProps={{
                  onBlur() {
                    algorithmAnalyzerStore.validateCustomPathParams('source');
                  }
                }}
              />
            ) : (
              <Select
                size="medium"
                trigger="click"
                selectorName={t(
                  'data-analyze.algorithm-forms.custom-path.placeholder.input-vertex-type'
                )}
                value={algorithmAnalyzerStore.customPathParams.vertexType}
                notFoundContent={t(
                  'data-analyze.algorithm-forms.custom-path.placeholder.no-vertex-type'
                )}
                disabled={
                  dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
                }
                width={390}
                onChange={(value: string) => {
                  algorithmAnalyzerStore.mutateCustomPathParams(
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
        {sourceType !== 'id' && (
          <div className="query-tab-content-form-row">
            <div className="query-tab-content-form-item">
              <div className="query-tab-content-form-item-title large">
                <span>
                  {t(
                    'data-analyze.algorithm-forms.custom-path.options.vertex-property'
                  )}
                </span>
              </div>
              <Select
                size="medium"
                trigger="click"
                selectorName={t(
                  'data-analyze.algorithm-forms.custom-path.placeholder.input-vertex-property'
                )}
                value={algorithmAnalyzerStore.customPathParams.vertexType}
                notFoundContent={t(
                  'data-analyze.algorithm-forms.custom-path.placeholder.no-vertex-property'
                )}
                disabled={
                  dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
                }
                width={390}
                onChange={(value: string) => {
                  algorithmAnalyzerStore.mutateCustomPathParams(
                    'vertexProperty',
                    [value]
                  );
                }}
              >
                {dataAnalyzeStore.vertexTypes.map(({ name }) => (
                  <Select.Option value={name} key={name}>
                    {name}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </div>
        )}
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
              value={algorithmAnalyzerStore.customPathParams.default_weight}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                algorithmAnalyzerStore.mutateCustomPathParams(
                  'default_weight',
                  e.target.value
                );
              }}
            >
              <Radio value="NONE">
                {t('data-analyze.algorithm-forms.custom-path.radio-value.none')}
              </Radio>
              <Radio value="INCR">
                {t(
                  'data-analyze.algorithm-forms.custom-path.radio-value.ascend'
                )}
              </Radio>
              <Radio value="DECR">
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
                algorithmAnalyzerStore.validateCustomPathParmasErrorMessage
                  .capacity
              }
              value={algorithmAnalyzerStore.customPathParams.capacity}
              onChange={(e: any) => {
                algorithmAnalyzerStore.mutateCustomPathParams(
                  'capacity',
                  e.value as string
                );

                algorithmAnalyzerStore.validateCustomPathParams('capacity');
              }}
              originInputProps={{
                onBlur() {
                  algorithmAnalyzerStore.validateCustomPathParams('capacity');
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
                algorithmAnalyzerStore.validateCustomPathParmasErrorMessage
                  .limit
              }
              value={algorithmAnalyzerStore.customPathParams.limit}
              onChange={(e: any) => {
                algorithmAnalyzerStore.mutateCustomPathParams(
                  'limit',
                  e.value as string
                );

                algorithmAnalyzerStore.validateCustomPathParams('limit');
              }}
              originInputProps={{
                onBlur() {
                  algorithmAnalyzerStore.validateCustomPathParams('limit');
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
                url: 'customizedpaths',
                type: Algorithm.customPath
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
              algorithmAnalyzerStore.resetCustomPathParams();
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
        {algorithmAnalyzerStore.customPathParams.steps.map(
          (
            { uuid, direction, labels, degree, sample, properties, weight_by },
            ruleIndex
          ) => {
            return (
              <div
                className={invalidExtendFormClassname(
                  algorithmAnalyzerStore.duplicateCustomPathRuleSet.has(uuid)
                )}
              >
                <div className="query-tab-content-form-expand-item">
                  <div className="query-tab-content-form-item-title query-tab-content-form-expand-title">
                    <i>*</i>
                    <span>
                      {t(
                        'data-analyze.algorithm-forms.custom-path.options.direction'
                      )}
                    </span>
                  </div>
                  <Radio.Group
                    disabled={
                      dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
                    }
                    value={direction}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      algorithmAnalyzerStore.mutateCustomPathRuleParams(
                        'direction',
                        e.target.value,
                        ruleIndex
                      );

                      algorithmAnalyzerStore.validateDuplicateCustomPathRules(
                        uuid
                      );
                    }}
                  >
                    <Radio value="BOTH">both</Radio>
                    <Radio value="OUT">out</Radio>
                    <Radio value="IN">in</Radio>
                  </Radio.Group>
                  {size(algorithmAnalyzerStore.customPathParams.steps) > 1 && (
                    <div
                      style={{
                        marginLeft: 198,
                        fontSize: 14,
                        color: '#2b65ff',
                        cursor: 'pointer',
                        lineHeight: '22px'
                      }}
                      onClick={() => {
                        algorithmAnalyzerStore.removeCustomPathRule(ruleIndex);

                        algorithmAnalyzerStore.validateDuplicateCustomPathRules(
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
                    value={labels[0]}
                    notFoundContent={t(
                      'data-analyze.algorithm-forms.custom-path.placeholder.no-edge-types'
                    )}
                    disabled={
                      dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
                    }
                    width={380}
                    onChange={(value: string) => {
                      algorithmAnalyzerStore.mutateCustomPathRuleParams(
                        'labels',
                        [value],
                        ruleIndex
                      );

                      algorithmAnalyzerStore.validateDuplicateCustomPathRules(
                        uuid
                      );
                    }}
                  >
                    <Select.Option value="__all__" key="__all__">
                      {t('data-analyze.algorithm-forms.custom-path.pre-value')}
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
                        .validateCustomPathParmasErrorMessage.steps[ruleIndex]
                        .properties
                    }
                    value={properties}
                    onChange={(e: any) => {
                      algorithmAnalyzerStore.mutateCustomPathRuleParams(
                        'properties',
                        e.value as string,
                        ruleIndex
                      );

                      algorithmAnalyzerStore.validateCustomPathRules(
                        'properties',
                        ruleIndex
                      );

                      algorithmAnalyzerStore.validateDuplicateCustomPathRules(
                        uuid
                      );
                    }}
                    originInputProps={{
                      onBlur() {
                        algorithmAnalyzerStore.validateCustomPathRules(
                          'properties',
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
                    value={weight_by}
                    selectorName={t(
                      'data-analyze.algorithm-forms.custom-path.placeholder.select-property'
                    )}
                    notFoundContent={t(
                      'data-analyze.algorithm-forms.custom-path.placeholder.no-property'
                    )}
                    disabled={
                      dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
                    }
                    width={380}
                    onChange={(value: string) => {
                      algorithmAnalyzerStore.mutateCustomPathRuleParams(
                        'weight_by',
                        value,
                        ruleIndex
                      );

                      algorithmAnalyzerStore.validateDuplicateCustomPathRules(
                        uuid
                      );
                    }}
                  >
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
                        .validateCustomPathParmasErrorMessage.steps[ruleIndex]
                        .degree
                    }
                    value={degree}
                    onChange={(e: any) => {
                      algorithmAnalyzerStore.mutateCustomPathRuleParams(
                        'degree',
                        e.value as string,
                        ruleIndex
                      );

                      algorithmAnalyzerStore.validateCustomPathRules(
                        'degree',
                        ruleIndex
                      );

                      algorithmAnalyzerStore.validateDuplicateCustomPathRules(
                        uuid
                      );
                    }}
                    originInputProps={{
                      onBlur() {
                        algorithmAnalyzerStore.validateCustomPathRules(
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
                        .validateCustomPathParmasErrorMessage.steps[ruleIndex]
                        .sample
                    }
                    value={sample}
                    onChange={(e: any) => {
                      algorithmAnalyzerStore.mutateCustomPathRuleParams(
                        'sample',
                        e.value as string,
                        ruleIndex
                      );

                      algorithmAnalyzerStore.validateCustomPathRules(
                        'sample',
                        ruleIndex
                      );

                      algorithmAnalyzerStore.validateDuplicateCustomPathRules(
                        uuid
                      );
                    }}
                    originInputProps={{
                      onBlur() {
                        algorithmAnalyzerStore.validateCustomPathRules(
                          'sample',
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
          {algorithmAnalyzerStore.duplicateCustomPathRuleSet.size === 0 ? (
            <span
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (isValidAddRule) {
                  algorithmAnalyzerStore.addCustomPathRule();

                  algorithmAnalyzerStore.validateDuplicateCustomPathRules(
                    (last(
                      algorithmAnalyzerStore.customPathParams.steps
                    ) as CustomPathRule).uuid
                  );
                }
              }}
            >
              {t('data-analyze.algorithm-forms.custom-path.add-new-rule')}
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
                'data-analyze.algorithm-forms.custom-path.validations.input-chars'
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default CustomPath;
