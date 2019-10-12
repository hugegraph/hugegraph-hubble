import React, {
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
import { reaction } from 'mobx';
import { observer } from 'mobx-react';
import * as d3 from 'd3';
import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import { Table, Select, Input, NumberBox, Calendar } from '@baidu/one-ui';

import { QueryResultProps } from './DataAnalyzeContent';
import { DataAnalyzeStoreContext } from '../../../stores';
import ZoomIn from '../../../assets/imgs/ic_fangda_16.svg';
import ZoomOut from '../../../assets/imgs/ic_suoxiao_16.svg';
import Download from '../../../assets/imgs/ic_xiazai_16.svg';
import FullScreen from '../../../assets/imgs/ic_quanping_16.svg';
import ResetScreen from '../../../assets/imgs/ic_tuichuquanping_16.svg';
import EmptyIcon from '../../../assets/imgs/ic_sousuo_empty.svg';
import LoadingIcon from '../../../assets/imgs/ic_loading@2x.svg';
import FailedIcon from '../../../assets/imgs/ic_fail.svg';
import {
  GraphNode,
  GraphLink
} from '../../../stores/GraphManagementStore/dataAnalyzeStore';

const dataAnalyzeContentSidebarOptions = ['图', '表格', 'Json'];

const getRuleOptions = (ruleType: string = '') => {
  switch (ruleType.toLowerCase()) {
    case 'float':
    case 'double':
    case 'byte':
    case 'int':
    case 'long':
    case 'date':
      return ['大于', '大于等于', '小于', '小于等于', '等于'];
    case 'object':
    case 'text':
    case 'blob':
    case 'uuid':
      return ['等于'];
    case 'boolean':
      return ['True', 'False'];
    default:
      return [];
  }
};

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
          <div className="query-result-content-manipulations">
            {sidebarIndex === 0 ? (
              <>
                <img src={ZoomIn} alt="放大" />
                <img src={ZoomOut} alt="缩小" />
                <img src={Download} alt="下载" />
                {dataAnalyzeStore.requestStatus.fetchGraphs === 'success' ? (
                  <span>下载</span>
                ) : (
                  <span style={{ color: '#9db4ff' }}>下载</span>
                )}
              </>
            ) : (
              <>
                <img alt="" />
                <img alt="" />
                <img alt="" />
                <span></span>
              </>
            )}
            {dataAnalyzeStore.isFullScreenReuslt ? (
              <>
                <img
                  src={ResetScreen}
                  alt="退出"
                  onClick={switchFullScreen(false)}
                />
                <span onClick={switchFullScreen(false)}>退出</span>
              </>
            ) : (
              <>
                <img
                  src={FullScreen}
                  alt="全屏"
                  onClick={switchFullScreen(true)}
                />
                {dataAnalyzeStore.requestStatus.fetchGraphs === 'success' ? (
                  <span onClick={switchFullScreen(true)}>全屏</span>
                ) : (
                  <span style={{ color: '#9db4ff' }}>全屏</span>
                )}
              </>
            )}
          </div>
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
                  <img src={LoadingIcon} alt="数据加载中" />
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

export interface GraphQueryResult {
  isFullScreen: boolean;
}

const GraphQueryResult: React.FC<GraphQueryResult> = observer(
  ({ isFullScreen }) => {
    const dataAnalyzeStore = useContext(DataAnalyzeStoreContext);
    const graphViewElement = useRef<SVGSVGElement>(null);

    const nodeRaidus = {
      normal: 20,
      hover: 30
    };

    const arrowOffset = nodeRaidus.normal + 10;

    const setupGraphView = () => {
      const svgWrapper = document.querySelector(
        isFullScreen ? '.full-screen-graph-svg-wrapper' : '.graph-svg-wrapper'
      ) as HTMLDivElement;

      const width = Number(
        (getComputedStyle(svgWrapper).width as string).split('px')[0]
      );
      const height = Number(
        (getComputedStyle(svgWrapper).height as string).split('px')[0]
      );

      const chart = d3
        .select(svgWrapper)
        .select('svg')
        .attr('width', width)
        .attr('height', height);

      chart
        .selectAll('g')
        .remove()
        .selectAll('defs')
        .remove();

      chart
        .append('defs')
        .append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', arrowOffset)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('xoverflow', 'visible')
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10,0 L 0,5')
        .attr('fill', '#999')
        .style('stroke', 'none');

      chart
        .append('defs')
        .append('marker')
        .attr('id', 'arrowhead-hover')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', arrowOffset)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('xoverflow', 'visible')
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10,0 L 0,5')
        .attr('fill', '#000')
        .style('stroke', 'none');

      // close pop over when click on other areas
      chart.on('click', function() {
        d3.select('.graph-pop-over').style('display', 'none');
      });

      const forceSimulation = d3
        .forceSimulation(dataAnalyzeStore.graphNodes)
        .force(
          'link',
          d3
            // have to specified generics here to avoid compiler error
            .forceLink<GraphNode, GraphLink>(
              dataAnalyzeStore.graphLinks as GraphLink[]
            )
            .id(d => d.id)
            .distance(() => Math.floor(Math.random() * (120 - 50)) + 90)
        )
        .force('charge', d3.forceManyBody().strength(-25))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide(30).strength(0.5))
        .on('tick', ticked);

      if (!isFullScreen) {
        dataAnalyzeStore.setD3Simluation(forceSimulation);
      }

      let linkTimer: number | undefined;

      const links = chart
        .append('g')
        .selectAll('.links')
        .data(dataAnalyzeStore.graphLinks as GraphLink[])
        .enter()
        .append('line')
        .attr('class', 'links')
        .attr('marker-end', 'url(#arrowhead)')
        .attr('stroke', '#999')
        .attr('stroke-width', 1.5)
        .style('z-index', 9)
        .on('mouseover', function(l) {
          d3.select(this)
            .attr('stroke', '#333')
            .attr('marker-end', 'url(#arrowhead-hover)');
        })
        .on('mouseout', function(l) {
          d3.select(this)
            .attr('stroke', '#999')
            .attr('marker-end', 'url(#arrowhead)');
        })
        .on('click', function(l) {
          linkTimer = window.setTimeout(() => {
            dataAnalyzeStore.changeSelectedGraphLinkData(l);

            if (
              dataAnalyzeStore.graphInfoDataSet !== 'link' ||
              !dataAnalyzeStore.isShowGraphInfo
            ) {
              dataAnalyzeStore.switchShowScreeDataSet('link');
              dataAnalyzeStore.switchShowScreenInfo(true);
            }
          }, 200);
        });

      // links.exit().remove();

      let nodeTimer: number | undefined = undefined;

      const nodes = chart
        .append('g')
        .selectAll('.node')
        .data(dataAnalyzeStore.graphNodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .on('mouseover', function(d) {
          d3.select(this)
            .selectAll('circle')
            .attr('cursor', 'move')
            .transition()
            .duration(300)
            .attr('r', nodeRaidus.hover);

          links.attr('stroke', function(l: any) {
            if (d.id === l.source.id || d.id === l.target.id) {
              d3.select(this).attr('marker-end', 'url(#arrowhead-hover)');
              return '#333';
            } else {
              return '#999';
            }
          });
        })
        .on('mouseout', function() {
          d3.select(this)
            .selectAll('circle')
            .transition()
            .duration(350)
            .attr('r', nodeRaidus.normal);

          links.attr('stroke', '#999').attr('marker-end', 'url(#arrowhead)');
        })
        .on('contextmenu', function(d) {
          dataAnalyzeStore.changeRightClickedGraphData(d);

          d3.select('.graph-pop-over')
            .style('display', 'block')
            .style('left', String(d.x) + 'px')
            .style('top', String(d.y) + 'px');
        })
        .on('click', function(d) {
          clearTimeout(nodeTimer);
          nodeTimer = window.setTimeout(() => {
            dataAnalyzeStore.changeSelectedGraphData(d);

            if (
              dataAnalyzeStore.graphInfoDataSet !== 'node' ||
              !dataAnalyzeStore.isShowGraphInfo
            ) {
              dataAnalyzeStore.switchShowScreeDataSet('node');
              dataAnalyzeStore.switchShowScreenInfo(true);
            }
          }, 200);
        })
        .on('dblclick', function(d) {
          clearTimeout(nodeTimer);
          // chart.selectAll('g').remove();
          dataAnalyzeStore.expandGraphNode(d.id, d.label);
        })
        .call(
          d3
            // have to specified generics here to avoid compiler error
            .drag<SVGGElement, GraphNode>()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended)
        );

      nodes
        .append('circle')
        .attr('r', nodeRaidus.normal)
        .attr('fill', d => dataAnalyzeStore.colorSchemas[d.label]);

      // Add text below each node
      nodes
        .append('text')
        .html((d: any) =>
          d.id.length <= 15 ? d.id : d.id.slice(0, 15) + '...'
        )
        .style('fill', '#666')
        .style('font-size', '12px')
        .attr('text-anchor', 'middle')
        .attr('y', 35);

      // Add title on each node
      nodes.append('title').text((d: any) => d.id);

      d3.select('.graph-pop-over').on('click', function() {
        d3.select(this).style('display', 'none');
      });

      function ticked() {
        links
          .attr('x1', function(d: any) {
            return d.source.x;
          })
          .attr('y1', function(d: any) {
            return d.source.y;
          })
          .attr('x2', function(d: any) {
            return d.target.x;
          })
          .attr('y2', function(d: any) {
            return d.target.y;
          });

        nodes
          .attr('cx', function(d: any) {
            return (d.x = Math.max(20, Math.min(width - 20, d.x)));
          })
          .attr('cy', function(d: any) {
            return (d.y = Math.max(20, Math.min(height - 33, d.y)));
          })
          .attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);
      }

      function dragstarted(d: any) {
        if (!d3.event.active) {
          forceSimulation.alphaTarget(0.3).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(d: any) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      }

      function dragended(d: any) {
        if (!d3.event.active) {
          forceSimulation.alphaTarget(0);
        }
        d.fx = null;
        d.fy = null;
      }
    };

    useEffect(() => {
      const root = document.getElementById('root');
      const cb = (e: MouseEvent) => e.preventDefault();

      if (graphViewElement.current) {
        graphViewElement.current.addEventListener('contextmenu', cb);
      }

      setupGraphView();

      root!.onclick = e => {
        if (
          (e.target as Element).nodeName !== 'circle' &&
          (e.target as Element).nodeName !== 'line'
        ) {
          dataAnalyzeStore.switchShowScreenInfo(false);
        }
      };

      return () => {
        if (graphViewElement.current) {
          graphViewElement.current.removeEventListener('contextmenu', cb);
        }

        root!.onclick = null;
      };
    }, [
      dataAnalyzeStore,
      setupGraphView,
      dataAnalyzeStore.graphData.data.graph_view.vertices.length
    ]);
    // 无法展示图，请查看表格/Json
    return (
      <div
        className={
          isFullScreen ? 'full-screen-graph-svg-wrapper' : 'graph-svg-wrapper'
        }
      >
        <svg ref={graphViewElement}></svg>
        {dataAnalyzeStore.isShowFilterBoard && <QueryFilterOptions />}
        <GraphPopover />
      </div>
    );
  }
);

const QueryFilterOptions: React.FC = observer(() => {
  const dataAnalyzeStore = useContext(DataAnalyzeStoreContext);
  const line = dataAnalyzeStore.filteredGraphQueryOptions.line;
  const properties = dataAnalyzeStore.filteredGraphQueryOptions.properties;
  const lastProperty = properties[properties.length - 1];

  // value of the corresponding revealed form should not be empty
  const allowAddProperties =
    (properties.length === 0 && line.type !== '') ||
    (lastProperty &&
      lastProperty.property !== '' &&
      lastProperty.rule !== '' &&
      lastProperty.value !== '') ||
    (lastProperty &&
      (lastProperty.rule === 'True' || lastProperty.rule === 'False'));
  const allowSendFilterRequest = allowAddProperties;

  const handleEdgeSelectChange = useCallback(
    (key: 'type' | 'direction') => (value: string) => {
      dataAnalyzeStore.editEdgeFilterOption(key, value);
    },
    [dataAnalyzeStore]
  );

  const handlePropertyChange = useCallback(
    (key: 'property' | 'rule' | 'value', value: string, index: number) => {
      dataAnalyzeStore.editPropertyFilterOption(key, value, index);
    },
    [dataAnalyzeStore]
  );

  const renderPropertyValue = (
    type: string = '',
    value: string,
    index: number
  ) => {
    const shouldDisabled =
      dataAnalyzeStore.filteredGraphQueryOptions.properties[index].property ===
      '';

    switch (type.toLowerCase()) {
      case 'float':
      case 'double':
        return (
          <Input
            size="large"
            width={180}
            placeholder="请输入数字"
            value={value}
            onChange={(e: any) => {
              handlePropertyChange('value', e.value, index);
            }}
            disabled={shouldDisabled}
          />
        );
      case 'byte':
      case 'int':
      case 'long':
        return (
          <NumberBox
            mode="strong"
            size="medium"
            type="int"
            step={1}
            value={value}
            onChange={(e: any) => {
              handlePropertyChange('value', e.target.value, index);
            }}
            disabled={shouldDisabled}
          />
        );
      case 'date':
        return (
          <Calendar
            size="medium"
            onSelectDay={(timeParams: { beginTime: string }) => {
              handlePropertyChange('value', timeParams.beginTime, index);
            }}
            disabled={shouldDisabled}
          />
        );
      case 'object':
      case 'text':
      case 'blob':
      case 'uuid':
        return (
          <Input
            size="large"
            width={180}
            placeholder="请输入字符串"
            value={value}
            onChange={(e: any) => {
              handlePropertyChange('value', e.value, index);
            }}
            disabled={shouldDisabled}
          />
        );
      case 'boolean':
        return <div style={{ lineHeight: '32px' }}>/</div>;
      default:
        return (
          <Input
            size="large"
            width={180}
            placeholder="请输入"
            disabled={true}
          />
        );
    }
  };

  return (
    <div className="query-result-filter-options">
      <div className="query-result-filter-options-edge-filter">
        <div>
          <span style={{ display: 'block', width: 56, marginRight: 8 }}>
            边类型：
          </span>
          <Select
            size="medium"
            trigger="click"
            showSearch={true}
            value={dataAnalyzeStore.filteredGraphQueryOptions.line.type}
            width={180}
            onChange={handleEdgeSelectChange('type')}
            dropdownClassName="data-analyze-sidebar-select"
          >
            {dataAnalyzeStore.GraphDataTypes.map(type => (
              <Select.Option value={type} key={type}>
                {type}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div>
          <span style={{ display: 'block', width: 56, marginRight: 8 }}>
            边方向：
          </span>
          <Select
            size="medium"
            trigger="click"
            value={dataAnalyzeStore.filteredGraphQueryOptions.line.direction}
            width={180}
            onChange={handleEdgeSelectChange('direction')}
            dropdownClassName="data-analyze-sidebar-select"
          >
            {['IN', 'OUT', 'BOTH'].map(value => (
              <Select.Option value={value} key={value}>
                {value}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div>
          <span
            style={{
              color: allowSendFilterRequest ? '#2b65ff' : '#ccc'
            }}
            onClick={() => {
              dataAnalyzeStore.filterGraphData();
              dataAnalyzeStore.switchShowFilterBoard(false);
            }}
          >
            筛选
          </span>
          <span
            onClick={() => {
              dataAnalyzeStore.switchShowFilterBoard(false);
              dataAnalyzeStore.clearFilteredGraphQueryOptions();
            }}
          >
            取消
          </span>
        </div>
      </div>
      {dataAnalyzeStore.filteredGraphQueryOptions.properties.length !== 0 && (
        <div className="query-result-filter-options-hr" />
      )}
      {dataAnalyzeStore.filteredGraphQueryOptions.properties.map(
        ({ property, rule, value }, index) => {
          return (
            <div
              className="query-result-filter-options-property-filter"
              key={property}
            >
              <div>
                <span>属性：</span>
                <Select
                  size="medium"
                  trigger="click"
                  value={property}
                  width={180}
                  onChange={(value: string) => {
                    handlePropertyChange('property', value, index);
                    handlePropertyChange('rule', '', index);
                    handlePropertyChange('value', '', index);
                  }}
                  dropdownClassName="data-analyze-sidebar-select"
                >
                  {Object.keys(
                    dataAnalyzeStore.graphData.data.graph_view.edges[0]
                      .properties
                  ).map(prop => (
                    <Select.Option value={prop} key={prop}>
                      {prop}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              <div>
                <span>规则：</span>
                <Select
                  size="medium"
                  trigger="click"
                  value={rule}
                  width={180}
                  placeholder="请输入"
                  onChange={(value: string) => {
                    handlePropertyChange('rule', value, index);
                  }}
                  dropdownClassName="data-analyze-sidebar-select"
                  disabled={
                    dataAnalyzeStore.filteredGraphQueryOptions.properties[index]
                      .property === ''
                  }
                >
                  {getRuleOptions(dataAnalyzeStore.valueTypes[property]).map(
                    value => (
                      <Select.Option value={value} key={value}>
                        {value}
                      </Select.Option>
                    )
                  )}
                </Select>
              </div>
              <div>
                <span>值：</span>
                {renderPropertyValue(
                  // the real type of value
                  dataAnalyzeStore.valueTypes[property],
                  value,
                  index
                )}
              </div>
              <div>
                <span
                  style={{ color: '#2b65ff', cursor: 'pointer' }}
                  onClick={() => {
                    dataAnalyzeStore.deletePropertyFilterOption(index);
                  }}
                >
                  删除
                </span>
              </div>
            </div>
          );
        }
      )}
      <div className="query-result-filter-options-manipulation">
        <span
          onClick={
            allowAddProperties
              ? () => {
                  dataAnalyzeStore.addPropertyFilterOption();
                }
              : undefined
          }
          style={{
            color: allowAddProperties ? '#2b65ff' : '#ccc'
          }}
        >
          添加属性筛选
        </span>
      </div>
    </div>
  );
});

const TableQueryResult: React.FC = observer(() => {
  const dataAnalyzeStore = useContext(DataAnalyzeStoreContext);

  const handlePageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dataAnalyzeStore.mutatePageNumber('tableResult', Number(e.target.value));
    },
    [dataAnalyzeStore]
  );

  return (
    <Table
      columns={dataAnalyzeStore.TableFormatGraphData.columnsConfigs}
      dataSource={dataAnalyzeStore.TableFormatGraphData.data}
      pagination={{
        size: 'medium',
        pageSize: 10,
        hideOnSinglePage: true,
        showSizeChange: false,
        showPageJumper: false,
        total: dataAnalyzeStore.pageConfigs.tableResult.pageTotal,
        pageNo: dataAnalyzeStore.pageConfigs.tableResult.pageNumber,
        onPageNoChange: handlePageChange
      }}
    />
  );
});

const JSONQueryResult: React.FC = observer(() => {
  const dataAnalyzeStore = useContext(DataAnalyzeStoreContext);
  const JSONReusltContainer = useRef<HTMLTextAreaElement>(null);
  const codeEditor = useRef<CodeMirror.Editor>();

  useEffect(() => {
    codeEditor.current = CodeMirror.fromTextArea(
      JSONReusltContainer.current as HTMLTextAreaElement,
      {
        mode: { name: 'javascript', json: true },
        lineNumbers: true,
        readOnly: true
      }
    );

    codeEditor.current.setValue(
      JSON.stringify(dataAnalyzeStore.originalGraphData.data.json_view, null, 4)
    );

    reaction(
      () => dataAnalyzeStore.originalGraphData,
      () => {
        if (codeEditor.current) {
          codeEditor.current.setValue(
            JSON.stringify(
              dataAnalyzeStore.originalGraphData.data.json_view,
              null,
              4
            )
          );
        }
      }
    );
  }, [dataAnalyzeStore]);

  return (
    <div className="hello">
      <textarea
        className="query-tab-code-editor"
        ref={JSONReusltContainer}
      ></textarea>
    </div>
  );
});

const GraphPopover = observer(() => {
  const dataAnalyzeStore = useContext(DataAnalyzeStoreContext);
  const [isShowPopover, switchShowPopover] = useState(false);

  return (
    <div
      className="graph-pop-over"
      onContextMenu={e => e.preventDefault()}
      style={{ display: isShowPopover ? 'block' : 'none' }}
    >
      <div
        className="graph-pop-over-item"
        onClick={() => {
          switchShowPopover(false);
          dataAnalyzeStore.expandGraphNode();
        }}
      >
        展开
      </div>
      <div
        className="graph-pop-over-item"
        onClick={() => {
          dataAnalyzeStore.clearFilteredGraphQueryOptions();
          dataAnalyzeStore.switchShowFilterBoard(true);
        }}
      >
        查询
      </div>
      <div
        className="graph-pop-over-item"
        onClick={() => {
          switchShowPopover(false);
          dataAnalyzeStore.hideGraphNode();
        }}
      >
        隐藏
      </div>
    </div>
  );
});

export default QueryResult;
