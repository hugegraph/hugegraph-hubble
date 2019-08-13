import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { AppStoreContext } from '../../stores';

import './AppBar.less';

const AppBar: React.FC = observer(() => {
  const appStore = useContext(AppStoreContext);

  return (
    <nav className="navigator">
      <div className="navigator-logo"></div>
      <div className="navigator-items">
        <div className="navigator-item active">
          <span>图管理</span>
        </div>
        <div className="navigator-item">
          <span>图概览</span>
        </div>
      </div>
      <div className="navigator-additions">
        <span>{appStore.user}</span>
      </div>
    </nav>
  );
});

export default AppBar;
