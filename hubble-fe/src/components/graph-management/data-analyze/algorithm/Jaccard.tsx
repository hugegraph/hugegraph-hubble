import React, { useContext, createContext } from 'react';
import { observer } from 'mobx-react';
import { Button, Radio, Input, Select, Switch } from '@baidu/one-ui';
import { useTranslation } from 'react-i18next';
import { styles } from '../QueryAndAlgorithmLibrary';
import { Tooltip as CustomTooltip } from '../../../common';
import DataAnalyzeStore from '../../../../stores/GraphManagementStore/dataAnalyzeStore/dataAnalyzeStore';
import { Algorithm } from '../../../../stores/factory/dataAnalyzeStore/algorithmStore';

import QuestionMarkIcon from '../../../../assets/imgs/ic_question_mark.svg';

const Jaccard = observer(() => {
  const dataAnalyzeStore = useContext(DataAnalyzeStore);
  const { t } = useTranslation();
  const algorithmAnalyzerStore = dataAnalyzeStore.algorithmAnalyzerStore;

  const isValidExec =
    Object.values(
      algorithmAnalyzerStore.validateJaccardParamsErrorMessage
    ).every((value) => value === '') &&
    algorithmAnalyzerStore.jaccardParams.vertex !== '' &&
    algorithmAnalyzerStore.jaccardParams.other !== '';

  return (
    <div className="query-tab-content-form">
      <div className="query-tab-content-form-row">
        <div className="query-tab-content-form-item">
          <div className="query-tab-content-form-item-title">
            <i>*</i>
            <span>
              {t('data-analyze.algorithm-forms.jaccard.options.vertex')}
            </span>
          </div>
          <Input
            width={400}
            size="medium"
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            placeholder={t(
              'data-analyze.algorithm-forms.jaccard.placeholder.input-source-id'
            )}
            errorLocation="layer"
            errorMessage={
              algorithmAnalyzerStore.validateJaccardParamsErrorMessage.vertex
            }
            value={algorithmAnalyzerStore.loopDetectionParams.source}
            onChange={(e: any) => {
              algorithmAnalyzerStore.mutateJaccardParams(
                'vertex',
                e.value as string
              );

              algorithmAnalyzerStore.validateJaccardParams('vertex');
            }}
            originInputProps={{
              onBlur() {
                algorithmAnalyzerStore.validateJaccardParams('vertex');
              }
            }}
          />
        </div>
        <div className="query-tab-content-form-item">
          <div className="query-tab-content-form-item-title">
            <span>
              {t('data-analyze.algorithm-forms.jaccard.options.label')}
            </span>
          </div>
          <Select
            size="medium"
            trigger="click"
            value={algorithmAnalyzerStore.loopDetectionParams.label}
            notFoundContent={t(
              'data-analyze.algorithm-forms.jaccard.placeholder.no-edge-types'
            )}
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            width={400}
            onChange={(value: string) => {
              algorithmAnalyzerStore.mutateJaccardParams('label', value);
            }}
          >
            <Select.Option value="__all__" key="__all__">
              {t('data-analyze.algorithm-forms.jaccard.pre-value')}
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
              {t('data-analyze.algorithm-forms.jaccard.options.other')}
            </span>
          </div>
          <Input
            width={400}
            size="medium"
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            placeholder={t(
              'data-analyze.algorithm-forms.jaccard.placeholder.input-source-id'
            )}
            errorLocation="layer"
            errorMessage={
              algorithmAnalyzerStore.validateJaccardParamsErrorMessage.other
            }
            value={algorithmAnalyzerStore.loopDetectionParams.source}
            onChange={(e: any) => {
              algorithmAnalyzerStore.mutateJaccardParams(
                'other',
                e.value as string
              );

              algorithmAnalyzerStore.validateJaccardParams('other');
            }}
            originInputProps={{
              onBlur() {
                algorithmAnalyzerStore.validateJaccardParams('other');
              }
            }}
          />
        </div>
        <div className="query-tab-content-form-item">
          <div className="query-tab-content-form-item-title">
            <span>
              {t('data-analyze.algorithm-forms.jaccard.options.max_degree')}
            </span>
          </div>
          <Input
            width={400}
            size="medium"
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            placeholder={t(
              'data-analyze.algorithm-forms.jaccard.placeholder.input-integer'
            )}
            errorLocation="layer"
            errorMessage={
              algorithmAnalyzerStore.validateJaccardParamsErrorMessage
                .max_degree
            }
            value={algorithmAnalyzerStore.loopDetectionParams.max_degree}
            onChange={(e: any) => {
              algorithmAnalyzerStore.mutateJaccardParams(
                'max_degree',
                e.value as string
              );

              algorithmAnalyzerStore.validateJaccardParams('max_degree');
            }}
            originInputProps={{
              onBlur() {
                algorithmAnalyzerStore.validateJaccardParams('max_degree');
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
              {t('data-analyze.algorithm-forms.jaccard.options.direction')}
            </span>
          </div>
          <Radio.Group
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            value={algorithmAnalyzerStore.loopDetectionParams.direction}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              algorithmAnalyzerStore.mutateJaccardParams(
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
              url: 'jaccardsimilarity',
              type: Algorithm.jaccardSimilarity
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
            algorithmAnalyzerStore.resetJaccardParams();
          }}
        >
          {t('data-analyze.manipulations.reset')}
        </Button>
      </div>
    </div>
  );
});

export default Jaccard;
