import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { useLocation } from 'wouter';
import { DndProvider, useDrop, DropTargetMonitor } from 'react-dnd';
import { useTranslation } from 'react-i18next';
import Backend, { NativeTypes } from 'react-dnd-html5-backend';
import { Button, Progress } from '@baidu/one-ui';

import { DataImportRootStoreContext } from '../../../../stores';

import './UploadEntry.less';

const UploadEntry: React.FC = observer(() => {
  const dataImportRootStore = useContext(DataImportRootStoreContext);
  const { dataMapStore } = dataImportRootStore;
  const [_, setLocation] = useLocation();
  const { t } = useTranslation();

  return (
    <>
      <DndProvider backend={Backend}>
        <FileDropZone />
      </DndProvider>
      <div className="import-tasks-manipulation-wrapper">
        <Button
          size="medium"
          style={{ width: 88, marginRight: 16 }}
          onClick={() => {
            setLocation('/');
          }}
        >
          {t('upload-files.cancel')}
        </Button>
        <Button
          type="primary"
          size="medium"
          style={{ width: 74 }}
          disabled={dataMapStore.fileMapInfos.length === 0}
          onClick={async () => {
            // await dataMapStore.fetchDataMaps();
            dataImportRootStore.setCurrentStep(2);
          }}
        >
          {t('upload-files.next')}
        </Button>
      </div>
    </>
  );
});

const FileDropZone: React.FC = observer(() => {
  const dataImportRootStore = useContext(DataImportRootStoreContext);
  const { dataMapStore, serverDataImportStore } = dataImportRootStore;
  const [{ canDrop, isOver }, drop] = useDrop({
    accept: [NativeTypes.FILE],
    drop(item, monitor) {
      handleFileDrop(monitor);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });
  const { t } = useTranslation();

  const handleFileDrop = (monitor: DropTargetMonitor) => {
    if (monitor) {
      const files = monitor.getItem().files;
      dataImportRootStore.updateFileList(files);

      dataImportRootStore.fileList.forEach(async (file: File) => {
        await dataImportRootStore.uploadFiles(file);
        await dataMapStore.fetchDataMaps();
        dataMapStore.setSelectedFileId(Number(dataMapStore.fileMapInfos[0].id));
        dataMapStore.setSelectedFileInfo();
        serverDataImportStore.syncImportConfigs(
          dataMapStore.selectedFileInfo!.load_parameter
        );
      });
      // dataImportStore.uploadFiles();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      dataImportRootStore.updateFileList(Array.from(e.target.files));
      dataImportRootStore.fileList.forEach(async (file) => {
        await dataImportRootStore.uploadFiles(file);
        await dataMapStore.fetchDataMaps();
        dataMapStore.setSelectedFileId(Number(dataMapStore.fileMapInfos[0].id));
        dataMapStore.setSelectedFileInfo();
        serverDataImportStore.syncImportConfigs(
          dataMapStore.selectedFileInfo!.load_parameter
        );
      });
      // dataImportStore.uploadFiles();
    }
  };

  const isActive = canDrop && isOver;

  return (
    <div className="import-tasks-upload-wrapper" ref={drop}>
      <label htmlFor="import-tasks-file-upload">
        <div className="import-tasks-upload-drag-area">
          <span>{t('upload-files.description')}</span>
          <input
            type="file"
            id="import-tasks-file-upload"
            multiple={true}
            onChange={handleFileChange}
            style={{
              display: 'none'
            }}
          />
        </div>
      </label>
      <FileList />
    </div>
  );
});

const FileList: React.FC = observer(() => {
  const dataImportStore = useContext(DataImportRootStoreContext);

  const handleRetry = () => {};

  const handleCancel = () => {};

  return (
    <div className="import-tasks-upload-file-list">
      {dataImportStore.fileList.map(({ name }) => (
        <div className="import-tasks-upload-file-info">
          <div>{name}</div>
          {/* <div>
            <Progress
              width={400}
              percent={50}
              status={'exception'}
              onCancel={handleCancel}
              onRetry={handleRetry}
            />
          </div> */}
        </div>
      ))}
    </div>
  );
});

export default UploadEntry;
