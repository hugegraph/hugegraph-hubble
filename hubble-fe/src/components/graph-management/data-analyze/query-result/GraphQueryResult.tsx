import React, { useState, useContext, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import * as d3 from 'd3';

import QueryFilterOptions from './QueryFilterOptions';
import { DataAnalyzeStoreContext } from '../../../../stores';
import {
  GraphNode,
  GraphLink
} from '../../../../stores/GraphManagementStore/dataAnalyzeStore';

export interface GraphQueryResult {
  isFullScreen: boolean;
}

const GraphQueryResult: React.FC<GraphQueryResult> = observer(
  ({ isFullScreen }) => {
    const dataAnalyzeStore = useContext(DataAnalyzeStoreContext);
    const graphViewElement = useRef<SVGSVGElement>(null);

    // const nodeRaidus = {
    //   normal: 20,
    //   hover: 30
    // };

    let radius: number;
    const nodeNumber =
      dataAnalyzeStore.graphData.data.graph_view.vertices.length;

    if (nodeNumber > 400) {
      radius = 2;
    } else if (nodeNumber < 40) {
      radius = 20;
    } else {
      radius = 20 - (nodeNumber - 40) / 20;
    }

    const arrowOffset = radius + 10;

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

      const defs = chart.append('defs');

      chart
        .selectAll('g')
        .remove()
        .selectAll('defs')
        .remove();

      defs
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
        .attr('fill', '#5c73e6')
        .style('stroke', 'none');

      defs
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
        .attr('fill', '#5c73e6')
        // .attr('fill-opacity', 1)
        .style('stroke', 'none');

      const circleShadowFilters = defs.append('filter');

      circleShadowFilters
        .attr('id', 'circle-shadow')
        .attr('filterUnits', 'userSpaceOnUse')
        .attr('width', '130%')
        .attr('height', '130%');

      circleShadowFilters
        .append('feDropShadow')
        .attr('stdDeviation', 10)
        .attr('flood-color', '#000')
        .attr('flood-opacity', 0.2);

      const lineShadowFilter = defs.append('filter');

      lineShadowFilter
        .attr('id', 'line-shadow')
        .attr('filterUnits', 'userSpaceOnUse');
      // .attr('width', '130%')
      // .attr('height', '130%');

      lineShadowFilter
        .append('feDropShadow')
        .attr('stdDeviation', 10)
        .attr('flood-color', '#000')
        .attr('flood-opacity', 0.8);

      // shadowFilters
      //   .append('feGaussianBlur')
      //   .attr('in', 'SourceGraphic')
      //   .attr('stdDeviation', 10)
      //   .attr('result', 'blur-out');

      // shadowFilters
      //   .append('feColorMatrix')
      //   .attr('in', 'blur-out')
      //   .attr('type', 'hueRotate')
      //   .attr('values', 180)
      //   .attr('result', 'yo');

      // shadowFilters
      //   .append('feOffset')
      //   // .attr('in', 'blur-out')
      //   .attr('in', 'yo')
      //   .attr('dx', 10)
      //   .attr('dy', 10)
      //   .attr('result', 'coloraka');

      // shadowFilters
      //   .append('feComponentTransfer')
      //   .append('feFuncA')
      //   .attr('in', 'coloraka')
      //   .attr('type', 'linear')
      //   .attr('slope', 0.4)
      //   .attr('result', 'shadow-blur');

      // shadowFilters
      //   .append('feBlend')
      //   .attr('in', 'SourceGraphic')
      //   .attr('in2', 'shadow-blur')
      //   .attr('mode', 'normal');

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
        .attr('stroke', '#5c73e6')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.8)
        .on('mouseover', function(l) {
          d3.select(this)
            .attr('opacity', 1)
            .attr('marker-end', 'url(#arrowhead-hover)');
        })
        .on('mouseout', function(l) {
          if (
            dataAnalyzeStore.graphInfoDataSet !== 'link' ||
            l.label !== dataAnalyzeStore.selectedGraphLinkData.label
          ) {
            d3.select(this)
              .attr('opacity', 0.8)
              .attr('filter', 'none')
              .attr('marker-end', 'url(#arrowhead)');
          }
        })
        .on('click', function(l) {
          d3.select(this)
            .attr('opacity', 1)
            .attr('filter', 'url(#line-shadow)');

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
            .attr('r', radius * 1.2);

          // links.attr('opacity', function(l: any) {
          //   if (d.id === l.source.id || d.id === l.target.id) {
          //     d3.select(this).attr('marker-end', 'url(#arrowhead-hover)');
          //     return 1;
          //   } else {
          //     return 0.8;
          //   }
          // });
        })
        .on('mouseout', function(d) {
          if (
            dataAnalyzeStore.graphInfoDataSet !== 'node' ||
            d.id !== dataAnalyzeStore.selectedGraphData.id
          ) {
            d3.select(this)
              .selectAll('circle')
              .transition()
              .duration(350)
              .attr('r', radius);
          }

          // links.attr('opacity', 0.8).attr('marker-end', 'url(#arrowhead)');
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

            d3.selectAll('line')
              .attr('opacity', function(l: any) {
                if (d.id === l.source.id || d.id === l.target.id) {
                  return 1;
                } else {
                  return 0.8;
                }
              })
              .attr('filter', function(l: any) {
                if (d.id === l.source.id || d.id === l.target.id) {
                  return 'url(#line-shadow)';
                } else {
                  return 'none';
                }
              });

            d3.selectAll('circle')
              .transition()
              .duration(350)
              .attr('filter', function(d: any) {
                if (d.id !== dataAnalyzeStore.selectedGraphData.id) {
                  return 'none';
                }

                return 'url(#circle-shadow)';
              })
              .attr('r', function(d: any) {
                if (d.id !== dataAnalyzeStore.selectedGraphData.id) {
                  return radius;
                }

                return radius * 1.2;
              });

            d3.select(this)
              .selectAll('circle')
              .attr('cursor', 'move')
              .attr('r', radius * 1.2)
              .attr('filter', 'url(#circle-shadow)');

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
        .attr('r', radius)
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

      const zoomHandler = d3.zoom().on('zoom', () => {
        d3.selectAll('g').attr('transform', d3.event.transform);
      });

      zoomHandler(d3.select('svg'));

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
            // return (d.x = Math.max(20, Math.min(width - 20, d.x)));
            return d.x;
          })
          .attr('cy', function(d: any) {
            // return (d.y = Math.max(20, Math.min(height - 33, d.y)));
            return d.y;
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
          d3.selectAll('circle')
            .attr('r', radius)
            .attr('filter', 'none');

          d3.selectAll('line')
            .attr('opacity', '0.8')
            .attr('filter', 'none');

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
      dataAnalyzeStore.graphData.data.graph_view.vertices.length,
      radius
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

export default GraphQueryResult;
