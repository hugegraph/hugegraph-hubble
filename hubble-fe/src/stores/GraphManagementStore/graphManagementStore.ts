import { createContext } from 'react';
import { observable, action, flow } from 'mobx';
import axios, { AxiosResponse } from 'axios';

export interface GraphData {
  id: number;
  name: string;
  graph: string;
  host: string;
  port: number;
  create_time: string;
  username: string;
}

export interface GraphDataConfig {
  [index: string]: string | undefined;
  name: string;
  graph: string;
  host: string;
  port: string;
  username: string;
  password: string;
}

export interface GraphDataPageConfig {
  pageNumber: number;
  pageSize: number;
  pageTotal: number;
}

export interface GraphDataResponse {
  status: number;
  data: { records: GraphData[]; total: number };
  message: string;
}

const baseUrl = 'http://localhost:8181/api/v1.1';

export class GraphManagementStore {
  [key: string]: any;

  // display create new graph layout
  @observable showCreateNewGraph = false;

  // display delete modal after dropdown click in GraphList
  @observable showDeleteModal = false;

  // disable all other buttons except from the current new/edit layout
  @observable selectedEditIndex: number | null = null;

  // values from the Search component
  @observable searchWords = '';

  // message from failed request
  @observable errorMessage = '';

  // searched results rather than initial fetched result
  @observable isSearched = false;

  // is clicekd submit or save to validate
  @observable isValidated = false;

  @observable.shallow requestStatus = {
    fetchGraphData: 'standby',
    AddGraphData: 'standby',
    upgradeGraphData: 'standby',
    deleteGraphData: 'standby'
  };

  @observable validateErrorMessage: { [index: string]: string } = {
    name: '',
    graph: '',
    host: '',
    port: '',
    usernameAndPassword: ''
  };

  @observable.shallow newGraphData: GraphDataConfig = {
    name: '',
    graph: '',
    host: '',
    port: '',
    username: '',
    password: ''
  };

  @observable.shallow editGraphData: GraphDataConfig = {
    name: '',
    graph: '',
    host: '',
    port: '',
    username: '',
    password: ''
  };

  @observable.ref graphData: GraphData[] = [];

  @observable.shallow graphDataPageConfig: GraphDataPageConfig = {
    pageNumber: 1,
    pageSize: 10,
    pageTotal: 0
  };

  @action
  switchCreateNewGraph(flag: boolean) {
    this.showCreateNewGraph = flag;
  }

  @action
  switchDeleteModal(flag: boolean) {
    this.showDeleteModal = flag;
  }

  @action
  changeSelectedEditIndex(index: number | null) {
    this.selectedEditIndex = index;
  }

  @action
  mutateSearchWords(text: string) {
    this.searchWords = text;
  }

  @action
  mutateGraphDataConfig(key: string, type: 'new' | 'edit') {
    return (eventTarget: EventTarget) => {
      this.isValidated = false;

      if (type === 'new') {
        this.newGraphData[key] = (eventTarget as HTMLInputElement).value;
      }

      if (type === 'edit') {
        this.editGraphData[key] = (eventTarget as HTMLInputElement).value;
      }
    };
  }

  @action
  fillInGraphDataConfig(index: number) {
    this.editGraphData.id = String(this.graphData[index].id);
    this.editGraphData.name = this.graphData[index].name;
    this.editGraphData.graph = this.graphData[index].graph;
    this.editGraphData.host = this.graphData[index].host;
    this.editGraphData.port = String(this.graphData[index].port);
    this.editGraphData.username = this.graphData[index].username;
  }

  @action
  resetGraphDataConfig(type: 'new' | 'edit') {
    if (type === 'new') {
      Object.keys(this.newGraphData).forEach(key => {
        this.newGraphData[key] = '';
      });
    }

    if (type === 'edit') {
      Object.keys(this.newGraphData).forEach(key => {
        this.editGraphData[key] = '';
      });
    }
  }

  @action
  mutatePageNumber(pageNumber: number) {
    this.graphDataPageConfig.pageNumber = pageNumber;
  }

  @action
  validate(type: 'new' | 'edit') {
    const reg = /^[A-Za-z]\w{0,47}$/;
    const dataName = type + 'GraphData';
    let readyToSubmit = true;

    this.resetValidateErrorMessage();

    if (!reg.test(this[dataName].name)) {
      this.validateErrorMessage.name = '不符合输入要求';
      readyToSubmit = false;
    }

    if (!reg.test(this[dataName].graph)) {
      this.validateErrorMessage.graph = '不符合输入要求';
      readyToSubmit = false;
    }

    if (this[dataName].host.length === 0) {
      this.validateErrorMessage.host = '必填项';
      readyToSubmit = false;
    }

    if (this[dataName].port.length === 0) {
      this.validateErrorMessage.port = '必填项';
      readyToSubmit = false;
    }

    if (
      (dataName === 'newGraphData' &&
        (this[dataName].username.length !== 0 &&
          this[dataName].password.length === 0)) ||
      (this[dataName].username.length === 0 &&
        this[dataName].password.length !== 0)
    ) {
      this.validateErrorMessage.usernameAndPassword =
        '必须同时填写用户名和密码';
      readyToSubmit = false;
    }

    return readyToSubmit;
  }

  @action
  switchValidateStatus(flag: boolean) {
    this.isValidated = flag;
  }

  @action
  resetValidateErrorMessage() {
    Object.keys(this.validateErrorMessage).forEach(key => {
      this.validateErrorMessage[key] = '';
    });
  }

  fetchGraphDataList = flow(function* fetchGraphDataList(
    this: GraphManagementStore,
    searchWords?: string
  ) {
    const url =
      `${baseUrl}/graph-connections?page_no=${this.graphDataPageConfig.pageNumber}&page_size=${this.graphDataPageConfig.pageSize}` +
      (typeof searchWords !== 'undefined' && searchWords !== ''
        ? `&content=${this.searchWords}`
        : '');

    this.requestStatus.fetchGraphData = 'pending';

    try {
      const result: AxiosResponse<GraphDataResponse> = yield axios.get<
        GraphData
      >(url);

      if (result.status !== 200) {
        throw new Error(result.data.message);
      }

      if (this.searchWords !== '') {
        this.isSearched = true;
      }

      this.graphData = result.data.data.records;
      this.graphDataPageConfig.pageTotal = result.data.data.total;
      this.requestStatus.fetchGraphData = 'success';
    } catch (error) {
      this.requestStatus.fetchGraphData = 'failed';
      this.errorMessage = error.message;
      console.error(error.message);
    }
  });

  AddGraphData = flow(function* AddGraphData(this: GraphManagementStore) {
    this.requestStatus.AddGraphData = 'pending';
    const filteredParams = filterParams(this.newGraphData);

    try {
      const result: AxiosResponse<GraphDataResponse> = yield axios.post<
        GraphDataResponse
      >(`${baseUrl}/graph-connections`, filteredParams);

      if (result.data.status !== 200) {
        throw new Error(result.data.message);
      }

      this.requestStatus.AddGraphData = 'success';
    } catch (error) {
      this.requestStatus.AddGraphData = 'failed';
      this.errorMessage = error.message;
      console.error(error.message);
    }
  });

  upgradeGraphData = flow(function* upgradeGraphData(
    this: GraphManagementStore,
    id: number
  ) {
    this.requestStatus.upgradeGraphData = 'pending';
    const filteredParams = filterParams(this.editGraphData);

    try {
      const result: AxiosResponse<GraphDataResponse> = yield axios.put<
        GraphDataResponse
      >(`${baseUrl}/graph-connections/${id}`, filteredParams);

      if (result.data.status !== 200) {
        throw new Error(result.data.message);
      }

      this.requestStatus.upgradeGraphData = 'success';
    } catch (error) {
      this.requestStatus.upgradeGraphData = 'failed';
      this.errorMessage = error.message;
      console.error(error.message);
    }
  });

  deleteGraphData = flow(function* deleteGraphData(
    this: GraphManagementStore,
    id
  ) {
    this.requestStatus.deleteGraphData = 'pending';

    try {
      const result: AxiosResponse<GraphDataResponse> = yield axios.delete<
        GraphDataResponse
      >(`${baseUrl}/graph-connections/${id}`);

      if (result.data.status !== 200) {
        throw new Error(result.data.message);
      }

      this.requestStatus.deleteGraphData = 'success';
    } catch (error) {
      this.requestStatus.deleteGraphData = 'failed';
      this.errorMessage = error.message;
      console.error(error.message);
    }
  });
}

function filterParams(originParams: GraphDataConfig): GraphDataConfig {
  const newParams = {} as GraphDataConfig;

  Object.keys(originParams).forEach(key => {
    const value = originParams[key];

    if (value !== null && value !== '' && typeof value !== 'undefined') {
      newParams[key] = originParams[key];
    }
  });

  return newParams;
}

export default createContext(new GraphManagementStore());
