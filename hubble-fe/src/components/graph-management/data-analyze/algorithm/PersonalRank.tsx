import React, { useContext, createContext } from 'react';
import { observer } from 'mobx-react';
import { Button, Radio, Input, Select, Switch } from '@baidu/one-ui';
import { useTranslation } from 'react-i18next';
import { styles } from '../QueryAndAlgorithmLibrary';
import { Tooltip as CustomTooltip } from '../../../common';
import DataAnalyzeStore from '../../../../stores/GraphManagementStore/dataAnalyzeStore/dataAnalyzeStore';
import { Algorithm } from '../../../../stores/factory/dataAnalyzeStore/algorithmStore';

import QuestionMarkIcon from '../../../../assets/imgs/ic_question_mark.svg';

const PersonalRank = observer(() => {
  const dataAnalyzeStore = useContext(DataAnalyzeStore);
  const { t } = useTranslation();
  const algorithmAnalyzerStore = dataAnalyzeStore.algorithmAnalyzerStore;

  const isValidExec =
    Object.values(
      algorithmAnalyzerStore.validatePersonalRankErrorMessage
    ).every((value) => value === '') &&
    algorithmAnalyzerStore.personalRankParams.source !== '' &&
    algorithmAnalyzerStore.personalRankParams.alpha !== '' &&
    algorithmAnalyzerStore.personalRankParams.label !== '' &&
    algorithmAnalyzerStore.personalRankParams.max_depth !== '';

  return (
    <div className="query-tab-content-form">
      <div className="query-tab-content-form-row">
        <div className="query-tab-content-form-item">
          <div
            className="query-tab-content-form-item-title"
            style={{ minWidth: 112 }}
          >
            <i>*</i>
            <span>
              {t('data-analyze.algorithm-forms.personal-rank.options.source')}
            </span>
          </div>
          <Input
            width={400}
            size="medium"
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            placeholder={t(
              'data-analyze.algorithm-forms.personal-rank.placeholder.input-source-id'
            )}
            errorLocation="layer"
            errorMessage={
              algorithmAnalyzerStore.validatePersonalRankErrorMessage.source
            }
            value={algorithmAnalyzerStore.personalRankParams.source}
            onChange={(e: any) => {
              algorithmAnalyzerStore.mutatePersonalRankParams(
                'source',
                e.value as string
              );

              algorithmAnalyzerStore.validatePersonalRankParams('source');
            }}
            originInputProps={{
              onBlur() {
                algorithmAnalyzerStore.validatePersonalRankParams('source');
              }
            }}
          />
        </div>
        <div className="query-tab-content-form-item">
          <div className="query-tab-content-form-item-title">
            <i>*</i>
            <span>
              {t('data-analyze.algorithm-forms.personal-rank.options.label')}
            </span>
          </div>
          <Select
            size="medium"
            trigger="click"
            value={algorithmAnalyzerStore.personalRankParams.label}
            selectorName={t(
              'data-analyze.algorithm-forms.personal-rank.placeholder.select-edge'
            )}
            notFoundContent={t(
              'data-analyze.algorithm-forms.personal-rank.placeholder.no-edge-types'
            )}
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            width={400}
            onChange={(value: string) => {
              algorithmAnalyzerStore.mutatePersonalRankParams('label', value);
            }}
          >
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
          <div
            className="query-tab-content-form-item-title"
            style={{ minWidth: 112 }}
          >
            <i>*</i>
            <span>
              {t('data-analyze.algorithm-forms.personal-rank.options.alpha')}
            </span>
          </div>
          <Input
            width={400}
            size="medium"
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            placeholder={t(
              'data-analyze.algorithm-forms.personal-rank.placeholder.alpha'
            )}
            errorLocation="layer"
            errorMessage={
              algorithmAnalyzerStore.validatePersonalRankErrorMessage.alpha
            }
            value={algorithmAnalyzerStore.personalRankParams.alpha}
            onChange={(e: any) => {
              algorithmAnalyzerStore.mutatePersonalRankParams(
                'alpha',
                e.value as string
              );

              algorithmAnalyzerStore.validatePersonalRankParams('alpha');
            }}
            originInputProps={{
              onBlur() {
                algorithmAnalyzerStore.validatePersonalRankParams('alpha');
              }
            }}
          />
        </div>
        <div className="query-tab-content-form-item">
          <div className="query-tab-content-form-item-title">
            <span>
              {t('data-analyze.algorithm-forms.personal-rank.options.degree')}
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
                'data-analyze.algorithm-forms.personal-rank.hint.degree'
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
              'data-analyze.algorithm-forms.personal-rank.placeholder.input-positive-integer-or-negative-one-degree'
            )}
            errorLocation="layer"
            errorMessage={
              algorithmAnalyzerStore.validatePersonalRankErrorMessage.degree
            }
            value={algorithmAnalyzerStore.personalRankParams.degree}
            onChange={(e: any) => {
              algorithmAnalyzerStore.mutatePersonalRankParams(
                'degree',
                e.value as string
              );

              algorithmAnalyzerStore.validatePersonalRankParams('degree');
            }}
            originInputProps={{
              onBlur() {
                algorithmAnalyzerStore.validatePersonalRankParams('degree');
              }
            }}
          />
        </div>
      </div>
      <div className="query-tab-content-form-row">
        <div className="query-tab-content-form-item">
          <div
            className="query-tab-content-form-item-title"
            style={{ minWidth: 112 }}
          >
            <i>*</i>
            <span>
              {t(
                'data-analyze.algorithm-forms.personal-rank.options.max_depth'
              )}
            </span>
          </div>
          <Input
            width={400}
            size="medium"
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            placeholder={t(
              'data-analyze.algorithm-forms.personal-rank.placeholder.max_depth'
            )}
            errorLocation="layer"
            errorMessage={
              algorithmAnalyzerStore.validatePersonalRankErrorMessage.max_depth
            }
            value={algorithmAnalyzerStore.personalRankParams.max_depth}
            onChange={(e: any) => {
              algorithmAnalyzerStore.mutatePersonalRankParams(
                'max_depth',
                e.value as string
              );

              algorithmAnalyzerStore.validatePersonalRankParams('max_depth');
            }}
            originInputProps={{
              onBlur() {
                algorithmAnalyzerStore.validatePersonalRankParams('max_depth');
              }
            }}
          />
        </div>
        <div className="query-tab-content-form-item">
          <div className="query-tab-content-form-item-title">
            <span>
              {t('data-analyze.algorithm-forms.personal-rank.options.limit')}
            </span>
          </div>
          <Input
            width={400}
            size="medium"
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            placeholder={t(
              'data-analyze.algorithm-forms.personal-rank.placeholder.input-positive-integer-or-negative-one-limit'
            )}
            errorLocation="layer"
            errorMessage={
              algorithmAnalyzerStore.validatePersonalRankErrorMessage.limit
            }
            value={algorithmAnalyzerStore.personalRankParams.limit}
            onChange={(e: any) => {
              algorithmAnalyzerStore.mutatePersonalRankParams(
                'limit',
                e.value as string
              );

              algorithmAnalyzerStore.validatePersonalRankParams('limit');
            }}
            originInputProps={{
              onBlur() {
                algorithmAnalyzerStore.validatePersonalRankParams('limit');
              }
            }}
          />
        </div>
      </div>
      <div className="query-tab-content-form-row">
        <div className="query-tab-content-form-item">
          <div
            className="query-tab-content-form-item-title"
            style={{ minWidth: 112 }}
          >
            <i>*</i>
            <span>
              {t(
                'data-analyze.algorithm-forms.personal-rank.options.with_label.title'
              )}
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
                'data-analyze.algorithm-forms.personal-rank.hint.with-label'
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
          <Radio.Group
            disabled={dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'}
            value={algorithmAnalyzerStore.personalRankParams.with_label}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              algorithmAnalyzerStore.mutatePersonalRankParams(
                'with_label',
                e.target.value
              );
            }}
          >
            <Radio value="SAME_LABEL">
              {t(
                'data-analyze.algorithm-forms.personal-rank.options.with_label.same_label'
              )}
            </Radio>
            <Radio value="OTHER_LABEL">
              {t(
                'data-analyze.algorithm-forms.personal-rank.options.with_label.other_label'
              )}
            </Radio>
            <Radio value="BOTH_LABEL">
              {t(
                'data-analyze.algorithm-forms.personal-rank.options.with_label.both_label'
              )}
            </Radio>
          </Radio.Group>
        </div>
        <div className="query-tab-content-form-item">
          <div className="query-tab-content-form-item-title">
            <span>
              {t('data-analyze.algorithm-forms.personal-rank.options.sorted')}
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
                'data-analyze.algorithm-forms.personal-rank.hint.sorted'
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
          <div style={{ width: 400 }}>
            <Switch
              size="medium"
              disabled={
                dataAnalyzeStore.requestStatus.fetchGraphs === 'pending'
              }
              checked={algorithmAnalyzerStore.personalRankParams.sorted}
              onChange={(checked: boolean) => {
                algorithmAnalyzerStore.mutatePersonalRankParams(
                  'sorted',
                  checked
                );
              }}
            />
          </div>
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
              url: 'personalrank',
              type: Algorithm.personalRankRecommendation
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
            algorithmAnalyzerStore.resetPersonalRankParams();
          }}
        >
          {t('data-analyze.manipulations.reset')}
        </Button>
      </div>
    </div>
  );
});

export default PersonalRank;
