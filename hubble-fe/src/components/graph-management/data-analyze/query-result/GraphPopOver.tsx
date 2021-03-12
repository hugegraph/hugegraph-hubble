import React, { useContext, useEffect, useRef, useCallback } from 'react';
import { observer } from 'mobx-react';
import { Message } from '@baidu/one-ui';
import { isUndefined, size, isEmpty } from 'lodash-es';

import { DataAnalyzeStoreContext } from '../../../../stores';
import { addGraphNodes, addGraphEdges } from '../../../../stores/utils';

interface GraphPopOverProps {
  x: number;
  y: number;
  switchIsPopover: (state: boolean) => void;
  isAfterDragging: boolean;
  switchAfterDragging: (state: boolean) => void;
}

const GraphPopOver: React.FC<GraphPopOverProps> = observer(
  ({ x, y, isAfterDragging, switchAfterDragging, switchIsPopover }) => {
    const dataAnalyzeStore = useContext(DataAnalyzeStoreContext);
    const popoverWrapperRef = useRef<HTMLDivElement>(null);

    const handleOutSideClick = useCallback(
      (e: MouseEvent) => {
        // if clicked element is not on dropdown, collpase it
        if (
          popoverWrapperRef.current &&
          !popoverWrapperRef.current.contains(e.target as Element)
        ) {
          if (isAfterDragging) {
            switchAfterDragging(false);
            return;
          }

          switchIsPopover(false);
        }
      },
      [switchIsPopover, isAfterDragging]
    );

    useEffect(() => {
      document.addEventListener('click', handleOutSideClick, false);

      return () => {
        document.removeEventListener('click', handleOutSideClick, false);
      };
    }, [handleOutSideClick]);

    return (
      <div
        className="graph-pop-over"
        onContextMenu={(e) => e.preventDefault()}
        style={{ top: y, left: x }}
        ref={popoverWrapperRef}
      >
        {dataAnalyzeStore.rightClickedGraphData.id === '' ? (
          <div
            className="graph-pop-over-item"
            onClick={() => {
              switchIsPopover(false);
              dataAnalyzeStore.setDynamicAddGraphDataStatus('vertex');
            }}
          >
            添加顶点
          </div>
        ) : (
          <>
            <div
              className="graph-pop-over-item"
              onClick={async () => {
                const node = dataAnalyzeStore.graphData.data.graph_view.vertices.find(
                  ({ id }) => id === dataAnalyzeStore.rightClickedGraphData.id
                );

                if (isUndefined(node)) {
                  return;
                }

                if (node.label === '~undefined') {
                  Message.info({
                    content: '该顶点是非法顶点，可能是由悬空边导致',
                    size: 'medium',
                    showCloseIcon: false,
                    duration: 1
                  });
                }

                if (
                  isUndefined(
                    dataAnalyzeStore.vertexTypes.find(
                      ({ name }) => name === node.label
                    )
                  )
                ) {
                  return;
                }

                await dataAnalyzeStore.expandGraphNode();

                if (
                  dataAnalyzeStore.requestStatus.expandGraphNode === 'success'
                ) {
                  // prompt if there's no extra node
                  if (
                    size(
                      dataAnalyzeStore.expandedGraphData.data.graph_view
                        .vertices
                    ) === 0
                  ) {
                    if (
                      isEmpty(
                        dataAnalyzeStore.visNetwork?.getConnectedNodes(node.id)
                      )
                    ) {
                      Message.info({
                        content: '不存在邻接点',
                        size: 'medium',
                        showCloseIcon: false,
                        duration: 1
                      });
                    } else {
                      Message.info({
                        content: '不存在更多邻接点',
                        size: 'medium',
                        showCloseIcon: false,
                        duration: 1
                      });
                    }

                    return;
                  }

                  addGraphNodes(
                    dataAnalyzeStore.expandedGraphData.data.graph_view.vertices,
                    dataAnalyzeStore.visDataSet?.nodes,
                    dataAnalyzeStore.vertexSizeMappings,
                    dataAnalyzeStore.colorMappings,
                    dataAnalyzeStore.vertexWritingMappings
                  );

                  addGraphEdges(
                    dataAnalyzeStore.expandedGraphData.data.graph_view.edges,
                    dataAnalyzeStore.visDataSet?.edges,
                    dataAnalyzeStore.edgeColorMappings,
                    dataAnalyzeStore.edgeThicknessMappings,
                    dataAnalyzeStore.edgeWithArrowMappings,
                    dataAnalyzeStore.edgeWritingMappings
                  );

                  dataAnalyzeStore.resetRightClickedGraphData();
                  switchIsPopover(false);
                } else {
                  Message.error({
                    content: dataAnalyzeStore.errorInfo.expandGraphNode.message,
                    size: 'medium',
                    showCloseIcon: false
                  });
                }
              }}
            >
              展开
            </div>
            <div
              className="graph-pop-over-item"
              onClick={() => {
                dataAnalyzeStore.switchShowFilterBoard(true);
                switchIsPopover(false);
              }}
            >
              查询
            </div>
            <div
              className="graph-pop-over-item"
              onClick={() => {
                dataAnalyzeStore.visDataSet?.nodes.remove([
                  dataAnalyzeStore.rightClickedGraphData.id
                ]);
                dataAnalyzeStore.hideGraphNode(
                  dataAnalyzeStore.rightClickedGraphData.id
                );
                dataAnalyzeStore.resetRightClickedGraphData();
                switchIsPopover(false);
              }}
            >
              隐藏
            </div>
            <div
              className="graph-pop-over-item"
              onClick={() => {
                dataAnalyzeStore.setDynamicAddGraphDataStatus('outEdge');
                dataAnalyzeStore.fetchRelatedEdges();
                switchIsPopover(false);
              }}
            >
              添加出边
            </div>
            <div
              className="graph-pop-over-item"
              onClick={() => {
                dataAnalyzeStore.setDynamicAddGraphDataStatus('inEdge');
                dataAnalyzeStore.fetchRelatedEdges();
                switchIsPopover(false);
              }}
            >
              添加入边
            </div>
          </>
        )}
      </div>
    );
  }
);

export default GraphPopOver;
