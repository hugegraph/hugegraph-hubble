import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import { range } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { Switch, Input, Button, Table, Tooltip } from '@baidu/one-ui';

import { DataImportRootStoreContext } from '../../../../../stores';

import ArrowIcon from '../../../../../assets/imgs/ic_arrow_16.svg';
import HintIcon from '../../../../../assets/imgs/ic_question_mark.svg';
import { ImportTasks } from '../../../../../stores/types/GraphManagementStore/dataImportStore';

const importStatusColorMapping: Record<string, string> = {
  RUNNING: '#2b65ff',
  SUCCEED: '#39bf45',
  FAILED: '#e64552',
  PAUSED: '#a9cbfb',
  STOPPED: '#ccc'
};

const ServerDataImport: React.FC = observer(() => {
  // const [isExpand, switchExpand] = useState(true);
  const dataImportRootStore = useContext(DataImportRootStoreContext);
  const { serverDataImportStore, dataMapStore } = dataImportRootStore;
  const { t } = useTranslation();

  const columnConfigs = [
    {
      title: t('server-data-import.import-details.column-titles.file-name'),
      dataIndex: 'conn_id',
      render(text: string) {
        return <div className="no-line-break">{text}</div>;
      }
    },
    {
      title: t('server-data-import.import-details.column-titles.type'),
      dataIndex: 'type',
      width: '20%',
      render(_: any, rowData: ImportTasks) {
        const title = (
          <div className="import-tasks-server-data-import-table-tooltip-title">
            <div>
              {t('server-data-import.import-details.content.vertex')}：
              {rowData.vertices.join(' ')}
            </div>
            <div>
              {t('server-data-import.import-details.content.edge')}：
              {rowData.edges.join(' ')}
            </div>
          </div>
        );

        return (
          <Tooltip placement="bottomLeft" title={title} type="dark">
            <div className="no-line-break">
              {t('server-data-import.import-details.content.vertex')}：
              {rowData.vertices.join(' ')}{' '}
              {t('server-data-import.import-details.content.edge')}：
              {rowData.edges.join(' ')}
            </div>
          </Tooltip>
        );
      }
    },
    {
      title: t('server-data-import.import-details.column-titles.import-speed'),
      dataIndex: 'load_rate',
      align: 'center',
      render(text: string) {
        return <div className="no-line-break">{text}</div>;
      }
    },
    {
      title: t(
        'server-data-import.import-details.column-titles.import-progress'
      ),
      dataIndex: 'load_progress',
      width: '40%',
      render(progress: number, rowData: Record<string, any>) {
        return (
          <div
            className="no-line-break"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <div className="import-tasks-server-data-import-table-progress">
              <div
                className="import-tasks-server-data-import-table-progress"
                style={{
                  width: `${progress}%`,
                  background: importStatusColorMapping[rowData.status]
                }}
              ></div>
            </div>
            <div>{`${progress}%`}</div>
          </div>
        );
      }
    },
    {
      title: t('server-data-import.import-details.column-titles.status'),
      dataIndex: 'status',
      width: '5%',
      render(text: string) {
        return (
          <div className="no-line-break">
            {t(`server-data-import.import-details.status.${text}`)}
          </div>
        );
      }
    },
    {
      title: t('server-data-import.import-details.column-titles.time-consumed'),
      dataIndex: 'duration',
      align: 'right',
      render(text: string) {
        return <div className="no-line-break">{text}</div>;
      }
    },
    {
      title: t('server-data-import.import-details.column-titles.manipulations'),
      width: '10%',
      render(_: never, rowData: Record<string, any>, taskIndex: number) {
        return (
          <div className="no-line-break">
            <ImportManipulations
              importStatus={rowData.status}
              taskIndex={taskIndex}
            />
          </div>
        );
      }
    }
  ];

  // const handleExpand = () => {
  //   switchExpand(!isExpand);
  // };

  const expandClassName = classnames({
    'import-tasks-step-content-header-expand':
      serverDataImportStore.isExpandImportConfig,
    'import-tasks-step-content-header-collpase': !serverDataImportStore.isExpandImportConfig
  });

  return (
    <div className="import-tasks-server-data-import-configs-wrapper">
      <div className="import-tasks-step-content-header">
        <span>{t('server-data-import.import-settings.title')}</span>
        <img
          src={ArrowIcon}
          alt="collpaseOrExpand"
          className={expandClassName}
          onClick={() => {
            serverDataImportStore.switchExpandImportConfig(
              !serverDataImportStore.isExpandImportConfig
            );
          }}
        />
      </div>

      {serverDataImportStore.isExpandImportConfig && (
        <div className="import-tasks-server-data-import-configs">
          <div className="import-tasks-server-data-import-config">
            <div className="import-tasks-server-data-import-config-option">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: 32,
                  justifyContent: 'flex-end'
                }}
              >
                <span style={{ marginRight: 5 }}>
                  {t('server-data-import.import-settings.checkIfExist')}:
                </span>
                <Tooltip
                  placement="right"
                  title={t('server-data-import.hint.check-vertex')}
                  type="dark"
                >
                  <img src={HintIcon} alt="hint" />
                </Tooltip>
              </div>
              <div style={{ width: 100 }}>
                <Switch
                  checked={serverDataImportStore.importConfigs?.check_vertex}
                  size="large"
                  onChange={(checked: boolean) => {
                    serverDataImportStore.mutateImportConfigs(
                      'check_vertex',
                      checked
                    );
                  }}
                />
              </div>
            </div>
            <div className="import-tasks-server-data-import-config-option">
              <span>
                {t(
                  'server-data-import.import-settings.maximumAnalyzedErrorRow'
                )}
                :
              </span>
              <Input
                size="medium"
                width={100}
                countMode="en"
                placeholder=""
                value={serverDataImportStore.importConfigs?.max_parse_errors}
                onChange={(e: any) => {
                  serverDataImportStore.mutateImportConfigs(
                    'max_parse_errors',
                    e.value
                  );
                }}
                errorLocation="bottom"
              />
            </div>
            <div className="import-tasks-server-data-import-config-option">
              <span>
                {t(
                  'server-data-import.import-settings.maxiumInterpolateErrorRow'
                )}
                :
              </span>
              <Input
                size="medium"
                width={100}
                countMode="en"
                placeholder=""
                value={serverDataImportStore.importConfigs?.max_insert_errors}
                onChange={(e: any) => {
                  serverDataImportStore.mutateImportConfigs(
                    'max_insert_errors',
                    e.value
                  );
                }}
                errorLocation="bottom"
              />
            </div>
          </div>
          <div className="import-tasks-server-data-import-config">
            <div className="import-tasks-server-data-import-config-option">
              <span>
                {t(
                  'server-data-import.import-settings.requestTimesWhenInterpolationFailed'
                )}
                :
              </span>
              <Input
                size="medium"
                width={100}
                countMode="en"
                placeholder=""
                value={serverDataImportStore.importConfigs?.retry_times}
                onChange={(e: any) => {
                  serverDataImportStore.mutateImportConfigs(
                    'retry_times',
                    e.value
                  );
                }}
                errorLocation="bottom"
              />
            </div>
            <div className="import-tasks-server-data-import-config-option">
              <span>
                {t(
                  'server-data-import.import-settings.requestTicksWhenInterpolationFailed'
                )}
                :
              </span>
              <Input
                size="medium"
                width={100}
                countMode="en"
                placeholder=""
                value={serverDataImportStore.importConfigs?.retry_interval}
                onChange={(e: any) => {
                  serverDataImportStore.mutateImportConfigs(
                    'retry_interval',
                    e.value
                  );
                }}
                errorLocation="bottom"
              />
            </div>
            <div className="import-tasks-server-data-import-config-option">
              <span>
                {t('server-data-import.import-settings.InterpolationTimeout')}:
              </span>
              <Input
                size="medium"
                width={100}
                countMode="en"
                placeholder=""
                value={serverDataImportStore.importConfigs?.insert_timeout}
                onChange={(e: any) => {
                  serverDataImportStore.mutateImportConfigs(
                    'insert_timeout',
                    e.value
                  );
                }}
                errorLocation="bottom"
              />
            </div>
          </div>
        </div>
      )}

      {serverDataImportStore.isImporting && (
        <>
          <div
            className="import-tasks-step-content-header"
            style={{ marginTop: 16 }}
          >
            <span>{t('server-data-import.import-details.title')}</span>
          </div>
          <div className="import-tasks-server-data-import-table-wrapper">
            <Table
              columns={columnConfigs}
              dataSource={serverDataImportStore.importTasks}
              pagination={false}
            />
          </div>
        </>
      )}

      <div className="import-tasks-server-data-import-manipulations">
        <Button
          size="medium"
          style={{
            width: 74,
            marginRight: 16
          }}
          onClick={() => {
            dataImportRootStore.setCurrentStep(2);
          }}
        >
          {t('server-data-import.manipulations.previous')}
        </Button>
        {!serverDataImportStore.isImporting && (
          <Button
            type="primary"
            size="medium"
            style={{
              width: 88
            }}
            onClick={async () => {
              if (serverDataImportStore.isImportFinished) {
                dataImportRootStore.setCurrentStep(4);
              } else {
                serverDataImportStore.switchExpandImportConfig(false);
                serverDataImportStore.switchImporting(true);

                await serverDataImportStore.startImport(
                  dataMapStore.selectedFileId
                );

                serverDataImportStore.fetchImportTasks();

                if (
                  serverDataImportStore.requestStatus.startImport === 'success'
                ) {
                  serverDataImportStore.switchExpandImportConfig(true);
                }
              }
            }}
          >
            {serverDataImportStore.isImportFinished
              ? t('server-data-import.manipulations.finished')
              : t('server-data-import.manipulations.start')}
          </Button>
        )}
      </div>
    </div>
  );
});

interface ImportManipulationsProps {
  importStatus: string;
  taskIndex: number;
}

const ImportManipulations: React.FC<ImportManipulationsProps> = observer(
  ({ importStatus, taskIndex }) => {
    const dataImportRootStore = useContext(DataImportRootStoreContext);
    const { serverDataImportStore } = dataImportRootStore;
    const { t } = useTranslation();
    const manipulations: string[] = [];

    const handleClickManipulation = (manipulation: string) => {
      switch (manipulation) {
        case t('server-data-import.import-details.manipulations.pause'):
          serverDataImportStore.pauseImport(
            serverDataImportStore.importTasks[taskIndex].id
          );
          break;
        case t('server-data-import.import-details.manipulations.abort'):
          serverDataImportStore.abortImport(
            serverDataImportStore.importTasks[taskIndex].id
          );
          break;
        case t('server-data-import.import-details.manipulations.resume'):
          serverDataImportStore.resumeImport(
            serverDataImportStore.importTasks[taskIndex].id
          );
          break;
        // case t('server-data-import.import-details.manipulations.failed-cause'):
        //   break;
        case t('server-data-import.import-details.manipulations.retry'):
          serverDataImportStore.retryImport(
            serverDataImportStore.importTasks[taskIndex].id
          );
          break;
      }
    };

    switch (importStatus) {
      case 'RUNNING':
        manipulations.push(
          t('server-data-import.import-details.manipulations.pause'),
          t('server-data-import.import-details.manipulations.abort')
        );
        break;
      case 'FAILED':
        manipulations.push(
          t('server-data-import.import-details.manipulations.resume')
          // t('server-data-import.import-details.manipulations.failed-cause')
        );
        break;
      case 'PAUSED':
        manipulations.push(
          t('server-data-import.import-details.manipulations.resume'),
          t('server-data-import.import-details.manipulations.abort')
        );
        break;
      case 'STOPPED':
        manipulations.push(
          t('server-data-import.import-details.manipulations.retry')
        );
        break;
      case 'SUCCEED':
        break;
      default:
        throw new Error('Wrong status received from server');
    }

    return (
      <div className="import-tasks-server-data-import-table-manipulations">
        {manipulations.map((manipulation) => (
          <span
            className="import-tasks-manipulation"
            key={manipulation}
            style={{ marginRight: 8 }}
            onClick={() => {
              if (manipulation !== 'failed-cause') {
                serverDataImportStore.switchImportFinished(false);
              }

              handleClickManipulation(manipulation);
            }}
          >
            {manipulation}
          </span>
        ))}
      </div>
    );
  }
);

export default ServerDataImport;
