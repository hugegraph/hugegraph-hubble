import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { useTranslation } from 'react-i18next';
import { Menu } from '@baidu/one-ui';

import { DataImportRootStoreContext } from '../../../../../stores';
import FileConfigs from './FileConfigs';
import TypeConfigs from './TypeConfigs';

import './DataMapConfigs.less';

const DataMapConfigs: React.FC = observer(() => {
  const { dataMapStore } = useContext(DataImportRootStoreContext);
  const { t } = useTranslation();

  useEffect(() => {
    // dataMapStore.setSelectedFileId(dataMapStore.fileMapInfos[0].id);
  }, []);

  return (
    <div className="import-tasks-step-wrapper">
      <Menu
        mode="inline"
        // defaultSelectedKeys={[dataImportRootStore.fileList[0].name]}
        needBorder={true}
        style={{ width: 200, height: 'calc(100vh - 194px)' }}
        selectedKeys={[String(dataMapStore.selectedFileId)]}
        onClick={(e: any) => {
          dataMapStore.setSelectedFileId(Number(e.key));
          dataMapStore.setSelectedFileInfo();
        }}
      >
        {dataMapStore.fileMapInfos.map(({ id, name }) => (
          <Menu.Item key={id}>
            <span>{name}</span>
          </Menu.Item>
        ))}
      </Menu>
      <div className="import-tasks-data-map-configs">
        <FileConfigs />
        <TypeConfigs />
      </div>
    </div>
  );
});

export default DataMapConfigs;
