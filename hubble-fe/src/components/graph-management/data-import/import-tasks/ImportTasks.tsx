import React, { useState, useContext, useMemo, useEffect } from 'react';
import { observer } from 'mobx-react';
import { useRoute, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { remove } from 'lodash-es';
import { Breadcrumb, Steps } from '@baidu/one-ui';

import UploadEntry from './UploadEntry';
import { DataMapConfigs } from './datamap-configs';
import { ServerDataImport } from './server-data-import';
import {
  GraphManagementStoreContext,
  DataImportRootStoreContext
} from '../../../../stores';
import PassIcon from '../../../../assets/imgs/ic_pass.svg';

import './ImportTasks.less';

const ImportTasks: React.FC = observer(() => {
  const graphManagementStore = useContext(GraphManagementStoreContext);
  const dataImportRootStore = useContext(DataImportRootStoreContext);
  const { dataMapStore, serverDataImportStore } = dataImportRootStore;
  // const [currentStep, setCurrentStep] = useState(3);
  const [match, params] = useRoute(
    '/graph-management/:id/data-import/import-tasks'
  );
  const { t } = useTranslation();
  const [_, setLocation] = useLocation();

  const steps = useMemo(
    () => [
      t('step.first'),
      t('step.second'),
      t('step.third'),
      t('step.fourth')
    ],
    []
  );

  const wrapperClassName = classnames({
    'import-tasks': true,
    'import-tasks-with-expand-sidebar': graphManagementStore.isExpanded
  });

  useEffect(() => {
    dataImportRootStore.setCurrentId(Number(params!.id));
    dataImportRootStore.fetchVertexTypeList();
    dataImportRootStore.fetchEdgeTypeList();
    // dataMapStore.setSelectedFileId(dataMapStore.fileMapInfos[0].id);
    // dataMapStore.setSelectedFileInfo();
    // serverDataImportStore.syncImportConfigs(
    //   dataMapStore.fileMapInfos[0].load_parameter
    // );
  }, []);

  return (
    <section className={wrapperClassName}>
      <div className="import-tasks-breadcrumb-wrapper">
        <Breadcrumb size="small">
          <Breadcrumb.Item>{t('breadcrumb.first')}</Breadcrumb.Item>
          <Breadcrumb.Item>{t('breadcrumb.second')}</Breadcrumb.Item>
        </Breadcrumb>
      </div>
      <div className="import-tasks-content-wrapper">
        <div style={{ padding: '16px 64px' }}>
          <Steps current={dataImportRootStore.currentStep}>
            {steps.map((title: string, index: number) => (
              <Steps.Step
                title={title}
                status={
                  dataImportRootStore.currentStep === index + 1
                    ? 'process'
                    : dataImportRootStore.currentStep > index + 1
                    ? 'finish'
                    : 'wait'
                }
                key={title}
              />
            ))}
          </Steps>
        </div>
        {dataImportRootStore.currentStep === 1 && <UploadEntry />}
        {dataImportRootStore.currentStep === 2 && <DataMapConfigs />}
        {dataImportRootStore.currentStep === 3 && <ServerDataImport />}
        {dataImportRootStore.currentStep === 4 && (
          <div className="import-tasks-complete-hint">
            <div className="import-tasks-complete-hint-description">
              <img src={PassIcon} alt="complete" />
              <div>
                <div>{t('data-import-status.finished')}</div>
                <div>{t('data-import-status.success')}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

export default ImportTasks;
