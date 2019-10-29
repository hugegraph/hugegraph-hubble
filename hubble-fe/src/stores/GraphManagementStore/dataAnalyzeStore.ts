import { createContext } from 'react';
import { observable, action, flow, computed, runInAction } from 'mobx';
import axios, { AxiosResponse } from 'axios';
import { GraphData, GraphDataResponse } from './graphManagementStore';

const baseUrl = 'http://localhost:8181/api/v1.1';

const ruleMap: Record<string, string> = {
  大于: 'gt',
  大于等于: 'gte',
  等于: 'eq',
  小于: 'lt',
  小于等于: 'lte',
  True: 'eq',
  False: 'eq'
};

export type ArbObjectArray = Record<string, any>[];
export type ColorSchemas = Record<string, string>;

export interface FetchColorSchemas {
  status: number;
  data: ColorSchemas;
  message: string;
}

export interface FetchGraphReponse {
  status: number;
  data: {
    table_view: {
      header: string[];
      rows: ArbObjectArray;
    };
    json_view: {
      data: ArbObjectArray;
    };
    graph_view: {
      vertices: GraphNode[];
      edges: ArbObjectArray;
    };
    type: string;
  };
  message: string;
}

export interface ValueTypes {
  name: string;
  data_type: string;
  cardinality: string;
  create_time: string;
}

export interface AddQueryCollectionParams {
  name: string;
  content: string;
}

export interface ExecutionLogs {
  id: number;
  type: string;
  content: string;
  status: 'SUCCESS' | 'RUNNING' | 'FAILED';
  duration: string;
  create_time: string;
}

export interface ExecutionLogsResponse {
  status: number;
  data: { records: ExecutionLogs[]; total: number };
  message: string;
}

export interface FavoriteQuery {
  id: number;
  name: string;
  content: string;
  create_time: string;
}

export interface FavoriteQueryResponse {
  status: number;
  data: { records: FavoriteQuery[]; total: number };
  message: string;
}

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  properties: Record<string, any>;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  label: string;
  properties: Record<string, any>;
}

export class DataAnalyzeStore {
  [key: string]: any;

  @observable currentId: number | null = null;
  @observable searchText = '';
  @observable isSidebarExpanded = false;
  @observable isFullScreenReuslt = false;
  @observable isShowFilterBoard = false;
  // right-side drawer
  @observable isShowGraphInfo = false;
  @observable graphInfoDataSet = '';
  @observable codeEditorText = '';
  @observable d3ForceSimulation: d3.Simulation<GraphNode, any> | null = null;
  // @observable favoriteQueriesNameSortOrder = '';
  @observable favoriteQueriesSortOrder: Record<
    'time' | 'name',
    'desc' | 'asc' | ''
  > = {
    time: '',
    name: ''
  };

  // Mutate this variable to let mobx#reaction fires it's callback and set value for CodeEditor
  @observable pulse = false;

  // datas
  @observable.ref idList: { id: number; name: string }[] = [];
  @observable.ref valueTypes: Record<string, string> = {};
  @observable.ref colorSchemas: ColorSchemas = {};
  @observable.ref
  originalGraphData: FetchGraphReponse = {} as FetchGraphReponse;
  @observable.ref graphData: FetchGraphReponse = {} as FetchGraphReponse;
  @observable.ref executionLogData: ExecutionLogs[] = [];
  @observable.ref favoriteQueryData: FavoriteQuery[] = [];

  // data struct sync to GraphManagementStore
  @observable.shallow isSearched = {
    status: false,
    value: ''
  };

  @observable filteredGraphQueryOptions = {
    line: {
      type: '',
      direction: 'BOTH'
    } as Record<'type' | 'direction', string>,
    properties: [] as ArbObjectArray
  };

  @observable selectedGraphData: GraphNode = {
    id: '',
    label: '',
    properties: {}
  };

  @observable selectedGraphLinkData: GraphLink = {
    source: '',
    target: '',
    label: '',
    properties: {}
  };

  @observable rightClickedGraphData: GraphNode = {
    id: '',
    label: '',
    properties: {}
  };

  @observable pageConfigs: {
    [key: string]: { pageNumber: number; pageTotal: number; pageSize?: number };
  } = {
    tableResult: {
      pageNumber: 1,
      pageTotal: 0
    },
    executionLog: {
      pageNumber: 1,
      pageSize: 10,
      pageTotal: 0
    },
    favoriteQueries: {
      pageNumber: 1,
      pageSize: 10,
      pageTotal: 0
    }
  };

  @observable.shallow requestStatus = {
    fetchIdList: 'standby',
    fetchValueTypes: 'standby',
    fetchColorSchemas: 'standby',
    fetchGraphs: 'standby',
    expandGraphNode: 'standby',
    filteredGraphData: 'standby',
    addQueryCollection: 'standby',
    editQueryCollection: 'standby',
    deleteQueryCollection: 'standby',
    fetchExecutionLogs: 'standby',
    fetchFavoriteQueries: 'standby'
  };

  @observable errorInfo = {
    fetchIdList: {
      code: NaN,
      message: ''
    },
    fetchValueTypes: {
      code: NaN,
      message: ''
    },
    fetchColorSchemas: {
      code: NaN,
      message: ''
    },
    fetchGraphs: {
      code: NaN,
      message: ''
    },
    expandGraphNode: {
      code: NaN,
      message: ''
    },
    filteredGraphData: {
      code: NaN,
      message: ''
    },
    addQueryCollection: {
      code: NaN,
      message: ''
    },
    editQueryCollection: {
      code: NaN,
      message: ''
    },
    fetchExecutionLogs: {
      code: NaN,
      message: ''
    },
    fetchFavoriteQueries: {
      code: NaN,
      message: ''
    },
    deleteQueryCollection: {
      code: NaN,
      message: ''
    }
  };

  @computed get graphNodes(): GraphNode[] {
    return this.graphData.data.graph_view.vertices;
  }

  @computed get graphLinks(): GraphLink[] | Record<string, any> {
    return this.graphData.data.graph_view.edges;
  }

  @computed get GraphDataTypes() {
    return Array.from(
      new Set(this.graphData.data.graph_view.edges.map(({ label }) => label))
    );
  }

  @action
  setCurrentId(id: number) {
    this.currentId = id;
  }

  @action
  setFullScreenReuslt(flag: boolean) {
    this.isFullScreenReuslt = flag;
  }

  @action
  mutateSearchText(text: string) {
    this.searchText = text;
  }

  @action
  setD3Simluation(simulation: d3.Simulation<GraphNode, any>) {
    this.d3ForceSimulation = simulation;
  }

  @action
  switchShowScreenInfo(flag: boolean) {
    this.isShowGraphInfo = flag;
  }

  @action
  switchShowFilterBoard(flag: boolean) {
    this.isShowFilterBoard = flag;
  }

  @action
  switchShowScreeDataSet(dataSet: string) {
    this.graphInfoDataSet = dataSet;
  }

  @action
  triggerLoadingStatementsIntoEditor() {
    this.pulse = !this.pulse;
  }

  @action
  mutateCodeEditorText(text: string) {
    this.codeEditorText = text;
  }

  @action
  changeSelectedGraphData(selectedData: GraphNode) {
    this.selectedGraphData = selectedData;
  }

  @action
  changeSelectedGraphLinkData(selectedLinkData: GraphLink) {
    this.selectedGraphLinkData = selectedLinkData;
  }

  @action
  changeRightClickedGraphData(rightClickedData: GraphNode) {
    this.rightClickedGraphData = rightClickedData;
  }

  @action
  mutatePageNumber(category: string, pageNumber: number) {
    this.pageConfigs[category].pageNumber = pageNumber;
  }

  @action
  mutatePageSize(category: string, pageSize: number) {
    this.pageConfigs[category].pageSize = pageSize;
  }

  @action
  editEdgeFilterOption(key: 'type' | 'direction', value: string) {
    this.filteredGraphQueryOptions.line[key] = value;
  }

  @action
  addPropertyFilterOption() {
    this.filteredGraphQueryOptions.properties.push({
      property: '',
      rule: '',
      value: ''
    });
  }

  @action
  editPropertyFilterOption(
    key: 'property' | 'rule' | 'value',
    value: string,
    index: number
  ) {
    this.filteredGraphQueryOptions.properties[index][key] = value;
  }

  @action
  deletePropertyFilterOption(index: number) {
    this.filteredGraphQueryOptions.properties.splice(index, 1);
  }

  @action
  addTempExecLog() {
    const date = new Date();
    const time = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

    const tempData: ExecutionLogs = {
      id: NaN,
      type: 'GREMLIN',
      content: this.codeEditorText,
      status: 'RUNNING',
      duration: '0',
      create_time: time
    };

    this.executionLogData = [tempData].concat(
      this.executionLogData.slice(0, 9)
    );

    return window.setInterval(() => {
      this.executionLogData[0].duration = String(
        Number(this.executionLogData[0].duration) + 10
      );

      runInAction(() => {
        this.executionLogData = this.executionLogData.slice();
      });
    }, 10);
  }

  @action
  swtichIsSearchedStatus(isSearched: boolean) {
    this.isSearched.status = isSearched;

    isSearched
      ? (this.isSearched.value = this.searchText)
      : (this.isSearched.value = '');
  }

  @action
  changeFavoriteQueriesSortOrder(
    key: 'time' | 'name',
    order: 'desc' | 'asc' | ''
  ) {
    this.favoriteQueriesSortOrder[key] = order;
  }

  @action
  clearFilteredGraphQueryOptions() {
    this.filteredGraphQueryOptions = {
      line: {
        type: '',
        direction: 'BOTH'
      } as Record<'type' | 'direction', string>,
      properties: [] as ArbObjectArray
    };
  }

  @action
  resetIdState() {
    this.currentId = null;
    this.searchText = '';
    this.isSidebarExpanded = false;
    this.isFullScreenReuslt = false;
    this.codeEditorText = '';
    this.graphData = {} as FetchGraphReponse;

    this.isSearched = {
      status: false,
      value: ''
    };

    this.selectedGraphData = {
      id: '',
      label: '',
      properties: {}
    };

    this.selectedGraphLinkData = {
      source: '',
      target: '',
      label: '',
      properties: {}
    };

    this.pageConfigs = {
      tableResult: {
        pageNumber: 1,
        pageTotal: 0
      },
      executionLog: {
        pageNumber: 1,
        pageSize: 10,
        pageTotal: 0
      },
      favoriteQueries: {
        pageNumber: 1,
        pageSize: 10,
        pageTotal: 0
      }
    };

    this.requestStatus = {
      fetchIdList: 'standby',
      fetchValueTypes: 'standby',
      fetchColorSchemas: 'standby',
      fetchGraphs: 'standby',
      expandGraphNode: 'standby',
      filteredGraphData: 'standby',
      addQueryCollection: 'standby',
      editQueryCollection: 'standby',
      deleteQueryCollection: 'standby',
      fetchExecutionLogs: 'standby',
      fetchFavoriteQueries: 'standby'
    };

    this.errorInfo = {
      fetchIdList: {
        code: NaN,
        message: ''
      },
      fetchValueTypes: {
        code: NaN,
        message: ''
      },
      fetchColorSchemas: {
        code: NaN,
        message: ''
      },
      fetchGraphs: {
        code: NaN,
        message: ''
      },
      expandGraphNode: {
        code: NaN,
        message: ''
      },
      filteredGraphData: {
        code: NaN,
        message: ''
      },
      addQueryCollection: {
        code: NaN,
        message: ''
      },
      editQueryCollection: {
        code: NaN,
        message: ''
      },
      fetchExecutionLogs: {
        code: NaN,
        message: ''
      },
      fetchFavoriteQueries: {
        code: NaN,
        message: ''
      },
      deleteQueryCollection: {
        code: NaN,
        message: ''
      }
    };

    this.clearFilteredGraphQueryOptions();
  }

  @action
  dispose() {
    this.resetIdState();
    this.idList = [];
  }

  fetchIdList = flow(function* fetchIdList(this: DataAnalyzeStore) {
    this.requestStatus.fetchIdList = 'pending';

    try {
      const result: AxiosResponse<GraphDataResponse> = yield axios.get<
        GraphData
      >(`${baseUrl}/graph-connections?page_size=-1`);

      if (result.status !== 200) {
        this.errorInfo.fetchIdList.code = result.data.status;
        throw new Error(result.data.message);
      }

      this.idList = result.data.data.records.map(({ id, name }) => ({
        id,
        name
      }));
      this.requestStatus.fetchIdList = 'success';
    } catch (error) {
      this.requestStatus.fetchIdList = 'failed';
      this.errorInfo.fetchIdList.message = error.message;
      console.error(error.message);
    }
  });

  fetchValueTypes = flow(function* fetchValueTypes(this: DataAnalyzeStore) {
    this.requestStatus.fetchValueTypes = 'pending';

    try {
      const result = yield axios.get<ValueTypes>(
        `${baseUrl}/schema/propertykeys`,
        {
          params: {
            conn_id: this.currentId,
            page_size: -1
          }
        }
      );

      if (result.status !== 200) {
        this.errorInfo.fetchValueTypes.code = result.data.status;
        throw new Error(result.data.message);
      }

      result.data.data.records.map(
        ({ name, data_type }: Record<string, string>) => {
          this.valueTypes[name] = data_type;
        }
      );

      this.requestStatus.fetchValueTypes = 'success';
    } catch (error) {
      this.requestStatus.fetchValueTypes = 'failed';
      this.errorInfo.fetchValueTypes.message = error.message;
      console.error(error.message);
    }
  });

  fetchColorSchemas = flow(function* fetchColorSchemas(this: DataAnalyzeStore) {
    this.requestStatus.fetchColorSchemas = 'pending';

    try {
      const result: AxiosResponse<FetchColorSchemas> = yield axios.get<
        FetchGraphReponse
      >(`${baseUrl}/schema/vertexlabels/style`, {
        params: {
          connection_id: this.currentId
        }
      });

      if (result.status !== 200) {
        this.errorInfo.fetchColorSchemas.code = result.data.status;
        throw new Error(result.data.message);
      }

      this.colorSchemas = result.data.data;
      this.requestStatus.fetchColorSchemas = 'success';
    } catch (error) {
      this.requestStatus.fetchColorSchemas = 'failed';
      this.errorInfo.fetchColorSchemas.message = error.message;
      console.error(error.message);
    }
  });

  fetchGraphs = flow(function* fetchGraphs(this: DataAnalyzeStore) {
    this.requestStatus.fetchGraphs = 'pending';

    try {
      const result: AxiosResponse<FetchGraphReponse> = yield axios.post<
        FetchGraphReponse
      >(`${baseUrl}/gremlin-query`, {
        connection_id: this.currentId,
        content: this.codeEditorText
      });

      if (result.data.status !== 200) {
        this.errorInfo.fetchGraphs.code = result.data.status;
        throw new Error(result.data.message);
      }

      // replace null with empty array when query result type is EMPTY
      if (result.data.data.type === 'EMPTY') {
        result.data.data.json_view.data = [];
        result.data.data.table_view = {
          header: ['result'],
          rows: []
        };
      }

      this.originalGraphData = result.data;
      this.graphData = result.data;
      this.pageConfigs.tableResult.pageTotal = this.originalGraphData.data.table_view.rows.length;
      this.requestStatus.fetchGraphs = 'success';
    } catch (error) {
      this.requestStatus.fetchGraphs = 'failed';
      this.errorInfo.fetchGraphs.message = error.message;
      console.error(error.message);
    }
  });

  expandGraphNode = flow(function* expandGraphNode(
    this: DataAnalyzeStore,
    // double click on a node, or right click a node
    nodeId?: string,
    label?: string
  ) {
    this.requestStatus.expandGraphNode = 'pending';

    try {
      const result: AxiosResponse<FetchGraphReponse> = yield axios.put(
        `${baseUrl}/gremlin-query`,
        {
          connection_id: this.currentId,
          vertex_id: nodeId || this.rightClickedGraphData.id,
          vertex_label: label || this.rightClickedGraphData.label
        }
      );

      if (result.data.status !== 200) {
        this.errorInfo.expandGraphNode.code = result.data.status;
        throw new Error(result.data.message);
      }

      const newGraphData = result.data;
      const vertexCollection = new Set();
      const edgeCollection = new Set();

      const mergeData: FetchGraphReponse = {
        ...newGraphData,
        data: {
          ...newGraphData.data,
          graph_view: {
            vertices: this.graphData.data.graph_view.vertices
              .concat(newGraphData.data.graph_view.vertices)
              .filter(item => {
                const isDuplicate = vertexCollection.has(item.id);
                vertexCollection.add(item.id);
                return !isDuplicate;
              }),
            edges: this.graphData.data.graph_view.edges
              .concat(newGraphData.data.graph_view.edges)
              .filter(item => {
                const isDuplicate = edgeCollection.has(item.id);
                edgeCollection.add(item.id);
                return !isDuplicate;
              })
          }
        }
      };

      this.graphData = mergeData;
      this.requestStatus.expandGraphNode = 'success';
    } catch (error) {
      this.requestStatus.expandGraphNode = 'failed';
      this.errorInfo.expandGraphNode.message = error.message;
      console.error(error.message);
    }
  });

  @action
  hideGraphNode() {
    this.graphData.data.graph_view.vertices = this.graphData.data.graph_view.vertices.filter(
      data => data.id !== this.rightClickedGraphData.id
    );

    this.graphData.data.graph_view.edges = this.graphData.data.graph_view.edges.filter(
      data => {
        return (
          data.source.id !== this.rightClickedGraphData.id &&
          data.target.id !== this.rightClickedGraphData.id
        );
      }
    );

    // assign new object to observable
    this.graphData = { ...this.graphData };
  }

  filterGraphData = flow(function* filteredGraphData(this: DataAnalyzeStore) {
    this.requestStatus.filteredGraphData = 'pending';

    try {
      const result: AxiosResponse<FetchGraphReponse> = yield axios.put(
        `${baseUrl}/gremlin-query`,
        {
          connection_id: this.currentId,
          vertex_id: this.rightClickedGraphData.id,
          vertex_label: this.rightClickedGraphData.label,
          edge_label: this.filteredGraphQueryOptions.line.type,
          direction: this.filteredGraphQueryOptions.line.direction,
          conditions: this.filteredGraphQueryOptions.properties.map(
            ({ property, rule, value }) => ({
              key: property,
              operator: ruleMap[rule],
              value: rule === 'True' || rule === 'False' ? Boolean(rule) : value
            })
          )
        }
      );

      if (result.data.status !== 200) {
        this.errorInfo.filteredGraphData.code = result.data.status;
        throw new Error(result.data.message);
      }

      const newGraphData = result.data;
      const vertexCollection = new Set();
      const edgeCollection = new Set();

      const mergeData: FetchGraphReponse = {
        ...newGraphData,
        data: {
          ...newGraphData.data,
          graph_view: {
            vertices: this.graphData.data.graph_view.vertices
              .concat(newGraphData.data.graph_view.vertices)
              .filter(item => {
                const isDuplicate = vertexCollection.has(item.id);
                vertexCollection.add(item.id);
                return !isDuplicate;
              }),
            edges: this.graphData.data.graph_view.edges
              .concat(newGraphData.data.graph_view.edges)
              .filter(item => {
                const isDuplicate = edgeCollection.has(item.id);
                edgeCollection.add(item.id);
                return !isDuplicate;
              })
          }
        }
      };

      this.graphData = mergeData;
      this.requestStatus.filteredGraphData = 'success';
    } catch (error) {}
  });

  addQueryCollection = flow(function* addQueryCollection(
    this: DataAnalyzeStore,
    name: string,
    // if content is not the value in codeEditor (e.g. in table)
    content?: string
  ) {
    this.requestStatus.addQueryCollection = 'pending';

    try {
      const result = yield axios.post<AddQueryCollectionParams>(
        `${baseUrl}/gremlin-collections`,
        {
          name,
          content: content || this.codeEditorText
        }
      );

      if (result.data.status !== 200) {
        this.errorInfo.addQueryCollection.code = result.data.status;
        throw new Error(result.data.message);
      }

      this.requestStatus.addQueryCollection = 'success';
    } catch (error) {
      this.requestStatus.addQueryCollection = 'failed';
      this.errorInfo.addQueryCollection.message = error.message;
      console.error(error.message);
    }
  });

  editQueryCollection = flow(function* editQueryCollection(
    this: DataAnalyzeStore,
    id: number,
    name: string,
    content: string
  ) {
    this.requestStatus.editQueryCollection = 'pending';

    try {
      const result = yield axios.put<AddQueryCollectionParams>(
        `${baseUrl}/gremlin-collections/${id}`,
        {
          name,
          content
        }
      );

      if (result.data.status !== 200) {
        this.errorInfo.editQueryCollection.code = result.data.status;
        throw new Error(result.data.message);
      }

      this.requestStatus.editQueryCollection = 'success';
    } catch (error) {
      this.requestStatus.editQueryCollection = 'failed';
      this.errorInfo.editQueryCollection.message = error.message;
      console.error(error.message);
    }
  });

  deleteQueryCollection = flow(function* deleteQueryCollection(
    this: DataAnalyzeStore,
    id: number
  ) {
    this.requestStatus.deleteQueryCollection = 'pending';

    try {
      const result = yield axios.delete(`${baseUrl}/gremlin-collections/${id}`);

      if (result.data.status !== 200) {
        this.errorInfo.deleteQueryCollection = result.data.status;
        throw new Error(result.data.message);
      }

      // if current pageNumber has no data after delete, set the pageNumber to the previous
      if (
        this.favoriteQueryData.length === 1 &&
        this.pageConfigs.favoriteQueries.pageNumber > 1
      ) {
        this.pageConfigs.favoriteQueries.pageNumber =
          this.pageConfigs.favoriteQueries.pageNumber - 1;
      }

      this.requestStatus.deleteQueryCollection = 'success';
    } catch (error) {
      this.requestStatus.deleteQueryCollection = 'failed';
      this.errorInfo.deleteQueryCollection.message = error.message;
      console.error(error.message);
    }
  });

  fetchExecutionLogs = flow(function* fetchExecutionLogs(
    this: DataAnalyzeStore
  ) {
    this.requestStatus.fetchExecutionLogs = 'pending';

    try {
      const result: AxiosResponse<ExecutionLogsResponse> = yield axios.get<
        ExecutionLogsResponse
      >(`${baseUrl}/execute-histories`, {
        params: {
          page_size: this.pageConfigs.executionLog.pageSize,
          page_no: this.pageConfigs.executionLog.pageNumber
        }
      });

      if (result.data.status !== 200) {
        throw new Error(result.data.message);
      }

      this.executionLogData = result.data.data.records;
      this.pageConfigs.executionLog.pageTotal = result.data.data.total;
      this.requestStatus.fetchExecutionLogs = 'success';
    } catch (error) {
      this.requestStatus.fetchExecutionLogs = 'failed';
      this.errorInfo.fetchExecutionLogs.message = error.message;
      console.error(error.message);
    }
  });

  fetchFavoriteQueries = flow(function* fetchFavoriteQueries(
    this: DataAnalyzeStore
  ) {
    const url =
      `${baseUrl}/gremlin-collections?` +
      `&page_no=${this.pageConfigs.favoriteQueries.pageNumber}` +
      `&page_size=${this.pageConfigs.favoriteQueries.pageSize}` +
      (this.favoriteQueriesSortOrder.time !== ''
        ? `&time_order=${this.favoriteQueriesSortOrder.time}`
        : '') +
      (this.favoriteQueriesSortOrder.name !== ''
        ? `&name_order=${this.favoriteQueriesSortOrder.name}`
        : '') +
      (this.isSearched.status && this.searchText !== ''
        ? `&content=${this.searchText}`
        : '');

    this.requestStatus.fetchFavoriteQueries = 'pending';

    try {
      const result: AxiosResponse<FavoriteQueryResponse> = yield axios.get<
        FavoriteQueryResponse
      >(url);

      if (result.data.status !== 200) {
        this.errorInfo.fetchFavoriteQueries.code = result.data.status;
        throw new Error(result.data.message);
      }

      this.favoriteQueryData = result.data.data.records;
      this.pageConfigs.favoriteQueries.pageTotal = result.data.data.total;
      this.requestStatus.fetchFavoriteQueries = 'success';
    } catch (error) {
      this.requestStatus.fetchFavoriteQueries = 'failed';
      this.errorInfo.fetchFavoriteQueries.message = error.message;
      console.error(error.message);
    }
  });
}

export default createContext(new DataAnalyzeStore());
