import React, { useContext, useCallback } from 'react';
import { observer } from 'mobx-react';

import GraphQueryResult from './GraphQueryResult';
import TableQueryResult from './TableQueryResult';
import JSONQueryResult from './JSONQueryResult';
import { DataAnalyzeStoreContext } from '../../../../stores';
import ZoomIn from '../../../../assets/imgs/ic_fangda_16.svg';
import ZoomOut from '../../../../assets/imgs/ic_suoxiao_16.svg';
import Download from '../../../../assets/imgs/ic_xiazai_16.svg';
import FullScreen from '../../../../assets/imgs/ic_quanping_16.svg';
import ResetScreen from '../../../../assets/imgs/ic_tuichuquanping_16.svg';
import EmptyIcon from '../../../../assets/imgs/ic_sousuo_empty.svg';
import LoadingBackIcon from '../../../../assets/imgs/ic_loading_back.svg';
import LoadingFrontIcon from '../../../../assets/imgs/ic_loading_front.svg';
import FailedIcon from '../../../../assets/imgs/ic_fail.svg';

export interface QueryResultProps {
  sidebarIndex: number;
  isFullScreen: boolean;
  handleSetSidebarIndex: (index: number) => void;
}

const dataAnalyzeContentSidebarOptions = ['图', '表格', 'Json'];

const QueryResult: React.FC<QueryResultProps> = observer(
  ({ sidebarIndex, handleSetSidebarIndex, isFullScreen }) => {
    const dataAnalyzeStore = useContext(DataAnalyzeStoreContext);

    const switchFullScreen = useCallback(
      (flag: boolean) => () => {
        if (dataAnalyzeStore.requestStatus.fetchGraphs !== 'success') {
          return;
        }

        dataAnalyzeStore.setFullScreenReuslt(flag);

        if (dataAnalyzeStore.d3ForceSimulation !== null) {
          dataAnalyzeStore.d3ForceSimulation.alphaTarget(0.3).restart();
        }
      },
      [dataAnalyzeStore]
    );

    const renderReuslt = (index: number) => {
      switch (index) {
        case 0:
          if (
            // type
            dataAnalyzeStore.graphData.data.graph_view.vertices === null ||
            dataAnalyzeStore.graphData.data.graph_view.edges === null
          ) {
            return (
              <div className="query-result-content-empty">
                <img src={EmptyIcon} alt="无图结果，请查看表格或json" />
                <span>无图结果，请查看表格或json</span>
              </div>
            );
          }

          return <GraphQueryResult isFullScreen={isFullScreen} />;
        case 1:
          return <TableQueryResult />;
        case 2:
          return <JSONQueryResult />;
      }
    };

    return (
      <div className="query-result">
        <div className="query-result-sidebar">
          {dataAnalyzeContentSidebarOptions.map((text, index) => (
            <div className="query-result-sidebar-options" key={text}>
              <div
                onClick={() => {
                  handleSetSidebarIndex(index);
                }}
                className={
                  sidebarIndex === index
                    ? 'query-result-sidebar-options-active'
                    : ''
                }
              >
                <i className={sidebarIndex === index ? 'selected' : ''}></i>
                <span>{text}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="query-result-content">
          {sidebarIndex === 0 && (
            <div className="query-result-content-manipulations">
              <>
                <img src={ZoomIn} alt="放大" />
                <img src={ZoomOut} alt="缩小" />
                <img src={Download} alt="下载" />
                {dataAnalyzeStore.isFullScreenReuslt ? (
                  <img
                    src={ResetScreen}
                    alt="退出"
                    onClick={switchFullScreen(false)}
                  />
                ) : (
                  <img
                    src={FullScreen}
                    alt="全屏"
                    onClick={switchFullScreen(true)}
                  />
                )}
              </>
            </div>
          )}
          {dataAnalyzeStore.requestStatus.fetchGraphs === 'success' &&
            renderReuslt(sidebarIndex)}

          {dataAnalyzeStore.requestStatus.fetchGraphs !== 'success' && (
            <div className="query-result-content-empty">
              {dataAnalyzeStore.requestStatus.fetchGraphs === 'standby' && (
                <>
                  <img src={EmptyIcon} alt="暂无数据结果" />
                  <span>暂无数据结果</span>
                </>
              )}
              {dataAnalyzeStore.requestStatus.fetchGraphs === 'pending' && (
                <>
                  <div className="query-reuslt-loading-bg">
                    <img
                      className="query-result-loading-back"
                      src={LoadingBackIcon}
                    />
                    <img
                      className="query-result-loading-front"
                      src={LoadingFrontIcon}
                    />
                  </div>
                  <span>数据加载中...</span>
                </>
              )}
              {dataAnalyzeStore.requestStatus.fetchGraphs === 'failed' && (
                <>
                  <img src={FailedIcon} alt="错误" />

                  {dataAnalyzeStore.errorInfo.fetchGraphs.code !== 460 && (
                    <span>
                      {dataAnalyzeStore.errorInfo.fetchGraphs.message}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default QueryResult;
