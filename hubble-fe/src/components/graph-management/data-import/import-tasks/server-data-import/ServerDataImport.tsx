import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
// import { useLocation } from 'wouter';
import { range } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { Menu, Radio, Switch, Input, Select, Checkbox } from '@baidu/one-ui';

import { DataImportRootStoreContext } from '../../../../../stores';
import ImportConfigs from './ImportConfigs';

import ArrowIcon from '../../../../../assets/imgs/ic_arrow_16.svg';
import CloseIcon from '../../../../../assets/imgs/ic_close_16.svg';
import MapIcon from '../../../../../assets/imgs/ic_yingshe_16.svg';

import './ServerDataImport.less';

const ServerDataImport: React.FC = observer(() => {
  const dataImportStore = useContext(DataImportRootStoreContext);

  return (
    <div className="import-tasks-step-wrapper" style={{ padding: '0 16px' }}>
      <ImportConfigs />
    </div>
  );
});

export default ServerDataImport;
