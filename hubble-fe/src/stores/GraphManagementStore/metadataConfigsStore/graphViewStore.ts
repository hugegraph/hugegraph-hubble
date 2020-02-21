import { observable, action, flow, computed } from 'mobx';
import axios from 'axios';
import { isUndefined } from 'lodash-es';

import vis from 'vis-network';
import { MetadataConfigsRootStore } from './metadataConfigsStore';
import { checkIfLocalNetworkOffline } from '../../utils';
import { baseUrl } from '../../types/common';
import {
  GraphViewData,
  DrawerTypes
} from '../../types/GraphManagementStore/metadataConfigsStore';

export class GraphViewStore {
  metadataConfigsRootStore: MetadataConfigsRootStore;

  constructor(MetadataConfigsRootStore: MetadataConfigsRootStore) {
    this.metadataConfigsRootStore = MetadataConfigsRootStore;
  }

  colorMappings: Record<string, string> = {};
  edgeColorMappings: Record<string, string> = {};
  @observable currentDrawer: DrawerTypes = '';
  @observable currentSelected = '';

  @observable visNetwork: vis.Network | null = null;
  @observable visDataSet: Record<'nodes' | 'edges', any> | null = null;
  @observable.ref graphViewData: GraphViewData | null = null;
  @observable.ref originalGraphViewData: GraphViewData | null = null;

  @observable.shallow requestStatus = {
    fetchGraphViewData: 'standby'
  };

  @observable errorInfo = {
    fetchGraphViewData: {
      code: NaN,
      message: ''
    }
  };

  @computed get graphNodes() {
    if (this.originalGraphViewData === null) {
      return [];
    }

    return this.originalGraphViewData.vertices.map(
      ({ id, label, properties, ...rest }) => {
        return {
          ...rest,
          id,
          label: id.length <= 15 ? id : id.slice(0, 15) + '...',
          vLabel: label,
          properties,
          title: `
            <div class="metadata-graph-view-tooltip-fields">
              <div>类型名称：</div>
              <div>${label}</div>
            </div>
            ${Object.entries(properties)
              .map(([key, value]) => {
                return `<div class="metadata-graph-view-tooltip-fields">
                          <div>${key}: </div>
                          <div>${value}</div>
                        </div>`;
              })
              .join('')}
          `,
          color: {
            background: this.colorMappings[label] || '#5c73e6',
            border: this.colorMappings[label] || '#5c73e6',
            highlight: { background: '#fb6a02', border: '#fb6a02' },
            hover: { background: '#ec3112', border: '#ec3112' }
          },
          chosen: {
            node(
              values: any,
              id: string,
              selected: boolean,
              hovering: boolean
            ) {
              if (hovering || selected) {
                values.shadow = true;
                values.shadowColor = 'rgba(0, 0, 0, 0.6)';
                values.shadowX = 0;
                values.shadowY = 0;
                values.shadowSize = 25;
              }

              if (selected) {
                values.size = 30;
              }
            }
          }
        };
      }
    );
  }

  @computed get graphEdges() {
    if (this.originalGraphViewData === null) {
      return [];
    }

    return this.originalGraphViewData.edges.map((edge: any) => {
      return {
        ...edge,
        from: edge.source,
        to: edge.target,
        font: {
          color: '#666'
        },
        title: `
        <div class="tooltip-fields">
          <div>类型名称：</div>
          <div>${edge.label}</div>
        </div>
        ${Object.entries(edge.properties)
          .map(([key, value]) => {
            return `<div class="tooltip-fields">
                      <div>${key}: </div>
                      <div>${value}</div>
                    </div>`;
          })
          .join('')}
        `,
        color: {
          color: this.edgeColorMappings[edge.label] || '#5c73e6',
          highlight: this.edgeColorMappings[edge.label] || '#5c73e6',
          hover: this.edgeColorMappings[edge.label] || '#5c73e6'
        }
      };
    });
  }

  @action
  setCurrentDrawer(drawer: DrawerTypes) {
    this.currentDrawer = drawer;
  }

  @action
  setVisNetwork(visNetwork: vis.Network) {
    this.visNetwork = visNetwork;
  }

  @action
  setVisDataSet(visDataSet: Record<'nodes' | 'edges', any>) {
    this.visDataSet = visDataSet;
  }

  @action
  dispose() {
    this.currentDrawer = '';
    this.currentSelected = '';
    this.colorMappings = {};
    this.graphViewData = null;
    this.originalGraphViewData = null;
    this.requestStatus = {
      fetchGraphViewData: 'standby'
    };
    this.errorInfo = {
      fetchGraphViewData: {
        code: NaN,
        message: ''
      }
    };
  }

  fetchGraphViewData = flow(function* fetchGraphViewData(
    this: GraphViewStore,
    colorMappings?: Record<string, string>,
    edgeColorMappings?: Record<string, string>
  ) {
    this.requestStatus.fetchGraphViewData = 'pending';

    if (!isUndefined(colorMappings)) {
      this.colorMappings = colorMappings;
    }

    if (!isUndefined(edgeColorMappings)) {
      this.edgeColorMappings = edgeColorMappings;
    }

    try {
      const result = yield axios
        .get(
          `${baseUrl}/${this.metadataConfigsRootStore.currentId}/schema/graphview`
        )
        .catch(checkIfLocalNetworkOffline);

      if (result.data.status !== 200) {
        this.errorInfo.fetchGraphViewData.code = result.data.status;
        throw new Error(result.data.message);
      }

      const data = result.data.data;

      this.originalGraphViewData = data;
      this.graphViewData = data;

      this.requestStatus.fetchGraphViewData = 'success';
    } catch (error) {
      this.requestStatus.fetchGraphViewData = 'failed';
      this.errorInfo.fetchGraphViewData.message = error.message;
      console.error(error.message);
    }
  });
}
