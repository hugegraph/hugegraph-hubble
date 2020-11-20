import React, { useContext, createContext } from 'react';
import { observer } from 'mobx-react';
import { Button, Radio, Input, Select, Switch } from '@baidu/one-ui';
import { useTranslation } from 'react-i18next';
import { styles } from '../QueryAndAlgorithmLibrary';
import { Tooltip as CustomTooltip } from '../../../common';
import DataAnalyzeStore from '../../../../stores/GraphManagementStore/dataAnalyzeStore/dataAnalyzeStore';
import { Algorithm } from '../../../../stores/factory/dataAnalyzeStore/algorithmStore';

import QuestionMarkIcon from '../../../../assets/imgs/ic_question_mark.svg';

const KHop = observer(() => {
  const dataAnalyzeStore = useContext(DataAnalyzeStore);
  const { t } = useTranslation();
  const algorithmAnalyzerStore = dataAnalyzeStore.algorithmAnalyzerStore;

  const isValidExec =
    Object.values(algorithmAnalyzerStore.validateKHopParamsErrorMessage).every(
      (value) => value === ''
    ) &&
    algorithmAnalyzerStore.kHopParams.source !== '' &&
    algorithmAnalyzerStore.kHopParams.max_depth !== '';

  return (
    <div className="query-tab-content-form">
      <div className="query-tab-content-form-row">
        <div className="query-tab-content-form-item">
          <div className="query-tab-content-form-item-title">
            <i>*</i>
            <span>{t('data-analyze.algorithm-forms.kHop.options.source')}</span>
          </div>
          <Input
            width={400}
            size="medium"
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            placeholder={t(
              'data-analyze.algorithm-forms.kHop.placeholder.input-source-id'
            )}
            errorLocation="layer"
            errorMessage={
              algorithmAnalyzerStore.validateKHopParamsErrorMessage.source
            }
            value={algorithmAnalyzerStore.kHopParams.source}
            onChange={(e: any) => {
              algorithmAnalyzerStore.mutateKHopParams(
                'source',
                e.value as string
              );

              algorithmAnalyzerStore.validateKHopParams('source');
            }}
            originInputProps={{
              onBlur() {
                algorithmAnalyzerStore.validateKHopParams('source');
              }
            }}
          />
        </div>
        <div className="query-tab-content-form-item">
          <div className="query-tab-content-form-item-title">
            <span>{t('data-analyze.algorithm-forms.kHop.options.label')}</span>
          </div>
          <Select
            size="medium"
            trigger="click"
            value={algorithmAnalyzerStore.kHopParams.label}
            notFoundContent={t(
              'data-analyze.algorithm-forms.kHop.placeholder.no-edge-types'
            )}
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            width={400}
            onChange={(value: string) => {
              algorithmAnalyzerStore.mutateKHopParams('label', value);
            }}
          >
            <Select.Option value="__all__" key="__all__">
              {t('data-analyze.algorithm-forms.kHop.pre-value')}
            </Select.Option>
            {dataAnalyzeStore.edgeTypes.map(({ name }) => (
              <Select.Option value={name} key={name}>
                {name}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
      <div className="query-tab-content-form-row">
        <div className="query-tab-content-form-item">
          <div className="query-tab-content-form-item-title">
            <i>*</i>
            <span>
              {t('data-analyze.algorithm-forms.kHop.options.direction')}
            </span>
          </div>
          <Radio.Group
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            value={algorithmAnalyzerStore.kHopParams.direction}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              algorithmAnalyzerStore.mutateKHopParams(
                'direction',
                e.target.value
              );
            }}
          >
            <Radio value="BOTH">both</Radio>
            <Radio value="OUT">out</Radio>
            <Radio value="IN">in</Radio>
          </Radio.Group>
        </div>
        <div className="query-tab-content-form-item">
          <div className="query-tab-content-form-item-title">
            <span>
              {t('data-analyze.algorithm-forms.kHop.options.max_degree')}
            </span>
            <CustomTooltip
              trigger="hover"
              placement="bottom-start"
              modifiers={{
                offset: {
                  offset: '0, 8'
                }
              }}
              tooltipWrapperProps={{
                className: 'tooltips-dark',
                style: {
                  zIndex: 7
                }
              }}
              tooltipWrapper={t(
                'data-analyze.algorithm-forms.kHop.hint.max-degree'
              )}
              childrenProps={{
                src: QuestionMarkIcon,
                alt: 'hint',
                style: {
                  marginLeft: 5
                }
              }}
              childrenWrapperElement="img"
            />
          </div>
          <Input
            width={400}
            size="medium"
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            placeholder={t(
              'data-analyze.algorithm-forms.kHop.placeholder.input-integer'
            )}
            errorLocation="layer"
            errorMessage={
              algorithmAnalyzerStore.validateKHopParamsErrorMessage.max_degree
            }
            value={algorithmAnalyzerStore.kHopParams.max_degree}
            onChange={(e: any) => {
              algorithmAnalyzerStore.mutateKHopParams(
                'max_degree',
                e.value as string
              );

              algorithmAnalyzerStore.validateKHopParams('max_degree');
            }}
            originInputProps={{
              onBlur() {
                algorithmAnalyzerStore.validateKHopParams('max_degree');
              }
            }}
          />
        </div>
      </div>
      <div className="query-tab-content-form-row">
        <div className="query-tab-content-form-item">
          <div className="query-tab-content-form-item-title">
            <i>*</i>
            <span>
              {t('data-analyze.algorithm-forms.kHop.options.max_depth')}
            </span>
            <CustomTooltip
              trigger="hover"
              placement="bottom-start"
              modifiers={{
                offset: {
                  offset: '0, 8'
                }
              }}
              tooltipWrapperProps={{
                className: 'tooltips-dark',
                style: {
                  zIndex: 7
                }
              }}
              tooltipWrapper={t(
                'data-analyze.algorithm-forms.kHop.hint.max-depth'
              )}
              childrenProps={{
                src: QuestionMarkIcon,
                alt: 'hint',
                style: {
                  marginLeft: 5
                }
              }}
              childrenWrapperElement="img"
            />
          </div>
          <Input
            width={400}
            size="medium"
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            placeholder={t(
              'data-analyze.algorithm-forms.kHop.placeholder.input-positive-integer'
            )}
            errorLocation="layer"
            errorMessage={
              algorithmAnalyzerStore.validateKHopParamsErrorMessage.max_depth
            }
            value={algorithmAnalyzerStore.kHopParams.max_depth}
            onChange={(e: any) => {
              algorithmAnalyzerStore.mutateKHopParams(
                'max_depth',
                e.value as string
              );

              algorithmAnalyzerStore.validateKHopParams('max_depth');
            }}
            originInputProps={{
              onBlur() {
                algorithmAnalyzerStore.validateKHopParams('max_depth');
              }
            }}
          />
        </div>
        <div className="query-tab-content-form-item">
          <div className="query-tab-content-form-item-title">
            <span>{t('data-analyze.algorithm-forms.kHop.options.limit')}</span>
          </div>
          <Input
            width={400}
            size="medium"
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            placeholder={t(
              'data-analyze.algorithm-forms.kHop.placeholder.input-positive-integer'
            )}
            errorLocation="layer"
            errorMessage={
              algorithmAnalyzerStore.validateKHopParamsErrorMessage.limit
            }
            value={algorithmAnalyzerStore.kHopParams.limit}
            onChange={(e: any) => {
              algorithmAnalyzerStore.mutateKHopParams(
                'limit',
                e.value as string
              );

              algorithmAnalyzerStore.validateKHopParams('limit');
            }}
            originInputProps={{
              onBlur() {
                algorithmAnalyzerStore.validateKHopParams('limit');
              }
            }}
          />
        </div>
      </div>
      <div className="query-tab-content-form-row">
        <div className="query-tab-content-form-item">
          <div className="query-tab-content-form-item-title">
            <span>
              {t('data-analyze.algorithm-forms.kHop.options.nearest')}
            </span>
            <CustomTooltip
              trigger="hover"
              placement="bottom-start"
              modifiers={{
                offset: {
                  offset: '0, 8'
                }
              }}
              tooltipWrapperProps={{
                className: 'tooltips-dark',
                style: {
                  zIndex: 7
                }
              }}
              tooltipWrapper={t(
                'data-analyze.algorithm-forms.kHop.hint.shortest-path'
              )}
              childrenProps={{
                src: QuestionMarkIcon,
                alt: 'hint',
                style: {
                  marginLeft: 5
                }
              }}
              childrenWrapperElement="img"
            />
          </div>
          <Switch
            width={400}
            size="medium"
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            checked={algorithmAnalyzerStore.kHopParams.nearest}
            onChange={(checked: boolean) => {
              algorithmAnalyzerStore.mutateKHopParams('nearest', checked);
            }}
          />
        </div>
        <div className="query-tab-content-form-item">
          <div className="query-tab-content-form-item-title">
            <span>
              {t('data-analyze.algorithm-forms.kHop.options.capacity')}
            </span>
          </div>
          <Input
            width={400}
            size="medium"
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            placeholder={t(
              'data-analyze.algorithm-forms.kHop.placeholder.input-positive-integer'
            )}
            errorLocation="layer"
            errorMessage={
              algorithmAnalyzerStore.validateKHopParamsErrorMessage.capacity
            }
            value={algorithmAnalyzerStore.kHopParams.capacity}
            onChange={(e: any) => {
              algorithmAnalyzerStore.mutateKHopParams(
                'capacity',
                e.value as string
              );

              algorithmAnalyzerStore.validateKHopParams('capacity');
            }}
            originInputProps={{
              onBlur() {
                algorithmAnalyzerStore.validateKHopParams('capacity');
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
              url: 'kout',
              type: Algorithm.kHop
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
            algorithmAnalyzerStore.resetKHopParams();
          }}
        >
          {t('data-analyze.manipulations.reset')}
        </Button>
      </div>
    </div>
  );
});

export default KHop;
