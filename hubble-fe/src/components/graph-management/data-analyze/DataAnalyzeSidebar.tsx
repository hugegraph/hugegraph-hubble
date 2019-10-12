import React, { useState, useCallback, useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import { useLocation, useRoute } from 'wouter';

import { Select, Tooltip, Menu, Dropdown, PopLayer } from '@baidu/one-ui';

import BackIcon from '../../../assets/imgs/ic_topback.svg';
import ArrowIcon from '../../../assets/imgs/ic_arrow_white.svg';
import DataAnalyzeIconNormal from '../../../assets/imgs/ic_shuju_normal.svg';
import DataAnalyzeIconPressed from '../../../assets/imgs/ic_shuju_pressed.svg';
import MetaDataManagementIconNormal from '../../../assets/imgs/ic_yuanshuju_normal.svg';
import MetaDataManagementIconPressed from '../../../assets/imgs/ic_yuanshuju_pressed.svg';
import ManagementIconNormal from '../../../assets/imgs/ic_guanli_normal.svg';
import ManagementIconPressed from '../../../assets/imgs/ic_guanli_pressed.svg';
import SidebarExpandIcon from '../../../assets/imgs/ic_cebianzhankai.svg';
import SidebarCollapseIcon from '../../../assets/imgs/ic_cebianshouqi.svg';
import { DataAnalyzeStoreContext } from '../../../stores';

const selectListMock = [
  {
    label: '图1',
    value: 'graphname1'
  },
  {
    label: '图2',
    value: 'graphname2'
  },
  {
    label: '图3',
    value: 'graphname3'
  },
  {
    label: '图4',
    value: 'graphname4'
  },
  {
    label: '图5',
    value: 'graphname5'
  }
];

export interface DataAnalyzeSidebarProps {
  isExpand: boolean;
  handleExpand: (flag: boolean) => void;
}

const DataAnalyzeSidebar: React.FC<DataAnalyzeSidebarProps> = observer(
  ({ isExpand, handleExpand }) => {
    const dataAnalyzeStore = useContext(DataAnalyzeStoreContext);
    const [_, setLocation] = useLocation();
    const [__, params] = useRoute('/graph-management/:id/data-analyze');
    const [sidebarIndex, setSidebarIndex] = useState(0);
    const [isShowNamePop, switchShowNamePop] = useState(false);
    const optionClassName = 'data-analyze-sidebar-options';
    const activeOptionClassName = optionClassName + ' selected';

    const sidebarWrapperClassName = classnames({
      'data-analyze-sidebar': true,
      expand: isExpand
    });

    const sidebarGoBackClassName = classnames({
      'data-analyze-sidebar-go-back': true,
      expand: isExpand
    });

    const sidebarGraphSelectionClassName = classnames({
      'data-analyze-sidebar-graph-selection': true,
      expand: isExpand
    });

    const sidebarGraphSelectionIconClassName = classnames({
      'data-analyze-sidebar-graph-selection-icon': true,
      expand: isExpand
    });

    const handleOptionClick = useCallback(
      (index: number) => () => {
        setSidebarIndex(index);
      },
      []
    );

    const handleSelectId = useCallback(
      (value: string) => {
        const id = dataAnalyzeStore.idList.find(({ name }) => name === value)!
          .id;

        dataAnalyzeStore.resetIdState();
        dataAnalyzeStore.fetchExecutionLogs();
        dataAnalyzeStore.fetchFavoriteQueries();
        setLocation(`/graph-management/${id}/data-analyze`);
      },
      [dataAnalyzeStore, setLocation]
    );

    const handleExpandClick = useCallback(() => {
      handleExpand(!isExpand);
    }, [handleExpand, isExpand]);

    return (
      <ul className={sidebarWrapperClassName}>
        <li
          className={sidebarGoBackClassName}
          onClick={() => {
            setLocation('/');
          }}
        >
          <Tooltip
            placement="right"
            title={isExpand ? '' : '返回图管理'}
            type="dark"
          >
            <img src={BackIcon} alt="返回" />
          </Tooltip>
          {isExpand && <span>返回图管理</span>}
        </li>
        <li className={sidebarGraphSelectionClassName}>
          {!isExpand ? (
            <PopLayer
              overlay={
                <GraphSelectMenu
                  routeId={Number(params && params.id)}
                  isShowNamePop={isShowNamePop}
                  switchShowPop={switchShowNamePop}
                />
              }
              visible={isShowNamePop}
            >
              <div
                className="data-analyze-sidebar-dropdown-selection"
                onClick={() => {
                  switchShowNamePop(!isShowNamePop);
                }}
              >
                <div className={sidebarGraphSelectionIconClassName}>G</div>
                <div className="data-analyze-sidebar-graph-selection-instruction">
                  <img
                    src={ArrowIcon}
                    alt="选择图"
                    style={{
                      transform: isShowNamePop
                        ? 'rotate(180deg)'
                        : 'rotate(0deg)'
                    }}
                  />
                </div>
              </div>
            </PopLayer>
          ) : (
            <>
              <div className={sidebarGraphSelectionIconClassName}>G</div>
              <div>
                <Select
                  options={dataAnalyzeStore.idList.map(({ name }) => name)}
                  size="medium"
                  trigger="click"
                  value={
                    dataAnalyzeStore.idList.find(
                      ({ id }) => String(id) === params!.id
                    )!.name
                  }
                  width={150}
                  onChange={handleSelectId}
                  dropdownClassName="data-analyze-sidebar-select"
                >
                  {dataAnalyzeStore.idList.map(({ id, name }) => (
                    <Select.Option
                      value={name}
                      disabled={id === Number(params && params.id)}
                    >
                      {name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </>
          )}
        </li>
        {sidebarIndex === 0 ? (
          <li className={activeOptionClassName} onClick={handleOptionClick(0)}>
            <Tooltip
              placement="right"
              title={isExpand ? '' : '数据分析'}
              type="dark"
            >
              <img src={DataAnalyzeIconPressed} alt="数据分析" />
            </Tooltip>
            {isExpand && <span>数据分析</span>}
          </li>
        ) : (
          <li className={optionClassName} onClick={handleOptionClick(0)}>
            <Tooltip
              placement="right"
              title={isExpand ? '' : '数据分析'}
              type="dark"
            >
              <img src={DataAnalyzeIconNormal} alt="数据分析" />
            </Tooltip>
            {isExpand && <span>数据分析</span>}
          </li>
        )}
        {/* {sidebarIndex === 1 ? (
          <li className={activeOptionClassName} onClick={handleOptionClick(1)}>
            <Tooltip
              placement="right"
              title={isExpand ? '' : '元数据配置'}
              type="dark"
            >
              <img src={MetaDataManagementIconPressed} alt="元数据配置" />
            </Tooltip>
            {isExpand && <span>元数据配置</span>}
          </li>
        ) : (
          <li className={optionClassName} onClick={handleOptionClick(1)}>
            <Tooltip
              placement="right"
              title={isExpand ? '' : '元数据配置'}
              type="dark"
            >
              <img src={MetaDataManagementIconNormal} alt="元数据配置" />
            </Tooltip>
            {isExpand && <span>元数据配置</span>}
          </li>
        )} */}
        {/* {sidebarIndex === 2 ? (
          <li className={activeOptionClassName} onClick={handleOptionClick(2)}>
            <Tooltip
              placement="right"
              title={isExpand ? '' : '数据管理'}
              type="dark"
            >
              <img src={ManagementIconPressed} alt="数据管理" />
            </Tooltip>
            {isExpand && <span>数据管理</span>}
          </li>
        ) : (
          <li className={optionClassName} onClick={handleOptionClick(2)}>
            <Tooltip
              placement="right"
              title={isExpand ? '' : '数据管理'}
              type="dark"
            >
              <img src={ManagementIconNormal} alt="数据管理" />
            </Tooltip>
            {isExpand && <span>数据管理</span>}
          </li>
        )} */}
        <li
          className="data-analyze-sidebar-expand-control"
          onClick={handleExpandClick}
        >
          {isExpand ? (
            <img src={SidebarCollapseIcon} alt="折叠" />
          ) : (
            <img src={SidebarExpandIcon} alt="展开" />
          )}
        </li>
      </ul>
    );
  }
);

export interface GraphSelectMenuProps {
  routeId: number;
  isShowNamePop: boolean;
  switchShowPop: (flag: boolean) => void;
}

const GraphSelectMenu: React.FC<GraphSelectMenuProps> = observer(
  ({ routeId, isShowNamePop, switchShowPop }) => {
    const dataAnalyzeStore = useContext(DataAnalyzeStoreContext);
    const [_, setLocation] = useLocation();

    const handleSelectDropdownId = useCallback(
      id => (e: any) => {
        const targetClassName = (e.target as Element).className;

        if (
          (e.target as Element).className !==
            'data-analyze-sidebar-dropdown-menu-item-wrapper disabled' &&
          (e.target as Element).className !==
            'data-analyze-sidebar-dropdown-menu-item disabled'
        ) {
          switchShowPop(false);
          dataAnalyzeStore.resetIdState();
          dataAnalyzeStore.fetchExecutionLogs();
          dataAnalyzeStore.fetchFavoriteQueries();
          setLocation(`/graph-management/${id}/data-analyze`);
        }
      },
      [dataAnalyzeStore, setLocation, switchShowPop]
    );

    useEffect(() => {
      const cb = (e: MouseEvent) => {
        if (
          (e.target as Element).className !==
            'data-analyze-sidebar-graph-selection-icon' &&
          (e.target as Element).className !==
            'data-analyze-sidebar-graph-selection-instruction' &&
          (e.target as Element).nodeName.toLowerCase() !== 'img' &&
          (e.target as Element).className !==
            'data-analyze-sidebar-dropdown-menu-item-wrapper disabled' &&
          (e.target as Element).className !==
            'data-analyze-sidebar-dropdown-menu-item disabled'
        ) {
          switchShowPop(false);
        }
      };

      window.addEventListener('click', cb, true);

      return () => {
        window.removeEventListener('click', cb);
      };
    }, [switchShowPop]);

    return (
      <div className="data-analyze">
        <div className="data-analyze-sidebar-dropdown-menu">
          {dataAnalyzeStore.idList.map(({ id, name }) => {
            const dropdownItemWrapperClassName = classnames({
              'data-analyze-sidebar-dropdown-menu-item-wrapper': true,
              disabled: routeId === id
            });

            const dropdownItemClassName = classnames({
              'data-analyze-sidebar-dropdown-menu-item': true,
              disabled: routeId === id
            });

            return (
              <div
                className={dropdownItemWrapperClassName}
                onClick={handleSelectDropdownId(id)}
                key={id}
              >
                <div className={dropdownItemClassName}>{name}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

export default DataAnalyzeSidebar;
