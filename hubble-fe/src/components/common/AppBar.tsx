import React, { useCallback } from 'react';
import { observer } from 'mobx-react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next'
import { Select } from 'antd';
import './AppBar.less';
const { Option } = Select;

const AppBar: React.FC = observer(() => {
  const [_, setLocation] = useLocation();
  const { i18n } = useTranslation()
  const setRoute = useCallback(
    (route: string) => () => {
      setLocation(route);
    },
    [setLocation]
  );
  /*
  * switch language
  */
  const i18Change = (e: string) => {
    i18n.changeLanguage(e)
  }
  return (
    <nav className="navigator">
      <div className="navigator-logo" onClick={setRoute('/')}></div>
      <div className="navigator-items">
        <div
          className="navigator-item active"
          onClick={setRoute('/graph-management')}
        >
          <span>图管理</span>
        </div>
      </div>
      <div className="navigator-additions">
        <span></span>
      </div>
      {/* i18n */}
      <div className="i18n-box">
        <Select
          defaultValue="zh-CN"
          style={{ width: 120 }}
          size="small"
          onChange={i18Change}
        >
          <Option value="zh-CN">中文</Option>
          <Option value="en-US">English</Option>
        </Select>
      </div>
    </nav>
  );
});

export default AppBar;
