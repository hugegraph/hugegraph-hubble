import { createContext } from 'react';
import { observable, action, flow } from 'mobx';
import axios, { AxiosResponse } from 'axios';

import { DataMapStore } from './dataMapStore';
import { ServerDataImportStore } from './serverDataImportStore';
import { baseUrl, responseData } from '../../types/common';
import { FileUploadResult } from '../../types/GraphManagementStore/dataImportStore';
import {
  VertexType,
  VertexTypeListResponse,
  EdgeType,
  EdgeTypeListResponse
} from '../../types/GraphManagementStore/metadataConfigsStore';
import { checkIfLocalNetworkOffline } from '../../utils';

export class DataImportRootStore {
  dataMapStore: DataMapStore;
  serverDataImportStore: ServerDataImportStore;

  constructor() {
    this.dataMapStore = new DataMapStore(this);
    this.serverDataImportStore = new ServerDataImportStore(this);
  }

  @observable currentId: number | null = null;
  @observable currentStep = 1;

  @observable requestStatus = {
    uploadFiles: 'standby',
    deleteFiles: 'standby',
    fetchVertexTypeList: 'standby',
    fetchEdgeTypeList: 'standby'
  };

  @observable errorInfo = {
    uploadFiles: {
      code: NaN,
      message: ''
    },
    deleteFiles: {
      code: NaN,
      message: ''
    },
    fetchVertexTypeList: {
      code: NaN,
      message: ''
    },
    fetchEdgeTypeList: {
      code: NaN,
      message: ''
    }
  };

  @observable fileList: File[] = [];
  // @observable fileList: File[] = [
  //   new File([new Blob()], '12.csv'),
  //   new File([new Blob()], '34.csv'),
  //   new File([new Blob()], '56.csv'),
  //   new File([new Blob()], '78.csv'),
  //   new File([new Blob()], '90.csv')
  // ];

  @observable.ref fileInfos: FileUploadResult[] = [];
  @observable.ref vertexTypes: VertexType[] = [];
  @observable.ref edgeTypes: EdgeType[] = [];

  @action
  setCurrentId(id: number) {
    this.currentId = id;
  }

  @action
  setCurrentStep(step: number) {
    this.currentStep = step;
  }

  @action
  updateFileList(files: File[]) {
    // console.log('wtf is the files: ', files);
    this.fileList = [...files, ...this.fileList];
  }

  // uploadFiles = flow(function* uploadFiles(this: DataImportRootStore) {
  //   this.requestStatus.uploadFiles = 'pending';
  //   const formData = new FormData();
  //   this.fileList.forEach((file) => {
  //     formData.append('files', file);
  //   });

  //   try {
  //     const result = yield axios.post(`${baseUrl}/1/upload-file`, formData, {
  //       headers: {
  //         'Content-Type': 'multipart/form-data'
  //       }
  //     });

  //     if (result.data.status !== 200) {
  //       this.errorInfo.uploadFiles.code = result.data.status;
  //       throw new Error(result.data.message);
  //     }

  //     this.requestStatus.uploadFiles = 'success';
  //   } catch (error) {
  //     this.requestStatus.uploadFiles = 'failed';
  //     this.errorInfo.uploadFiles.message = error.message;
  //     console.error(error.message);
  //   }
  // });

  uploadFiles = flow(function* uploadFiles(
    this: DataImportRootStore,
    file: File
  ) {
    this.requestStatus.uploadFiles = 'pending';
    const formData = new FormData();
    formData.append('file', file);
    // this.fileList.forEach((file) => {
    //   formData.append('files', file);
    // });

    try {
      const result = yield axios.post<responseData<FileUploadResult>>(
        `${baseUrl}/${this.currentId}/upload-file?total=1&index=1`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (result.data.status !== 200) {
        this.errorInfo.uploadFiles.code = result.data.status;
        throw new Error(result.data.message);
      }

      this.fileInfos.push(result.data.data);
      this.requestStatus.uploadFiles = 'success';
    } catch (error) {
      this.requestStatus.uploadFiles = 'failed';
      this.errorInfo.uploadFiles.message = error.message;
      console.error(error.message);
    }
  });

  deleteFiles = flow(function* deleteFiles(
    this: DataImportRootStore,
    fileNames: string[]
  ) {
    this.requestStatus.deleteFiles = 'pending';

    try {
      const result = yield axios.delete(`${baseUrl}/1/upload-file`, {
        params: fileNames.map((fileName) => `names=${fileName}`).join('&')
      });

      if (result.data.status !== 200) {
        this.errorInfo.deleteFiles.code = result.data.status;
        throw new Error(result.data.message);
      }

      this.requestStatus.deleteFiles = 'success';
    } catch (error) {
      this.requestStatus.deleteFiles = 'failed';
      this.errorInfo.deleteFiles.message = error.message;
      console.error(error.message);
    }
  });

  fetchVertexTypeList = flow(function* fetchVertexTypeList(
    this: DataImportRootStore
  ) {
    this.requestStatus.fetchVertexTypeList = 'pending';

    try {
      const result: AxiosResponse<responseData<
        VertexTypeListResponse
      >> = yield axios
        .get<responseData<VertexTypeListResponse>>(
          `${baseUrl}/${this.currentId}/schema/vertexlabels`,
          {
            params: {
              page_size: -1
            }
          }
        )
        .catch(checkIfLocalNetworkOffline);

      if (result.data.status !== 200) {
        this.errorInfo.fetchVertexTypeList.code = result.data.status;
        throw new Error(result.data.message);
      }

      this.vertexTypes = result.data.data.records;
      this.requestStatus.fetchVertexTypeList = 'success';
    } catch (error) {
      this.requestStatus.fetchVertexTypeList = 'failed';
      this.errorInfo.fetchVertexTypeList.message = error.message;
    }
  });

  fetchEdgeTypeList = flow(function* fetchEdgeTypeList(
    this: DataImportRootStore
  ) {
    this.requestStatus.fetchEdgeTypeList = 'pending';

    try {
      const result: AxiosResponse<responseData<
        EdgeTypeListResponse
      >> = yield axios
        .get<responseData<EdgeTypeListResponse>>(
          `${baseUrl}/${this.currentId}/schema/edgelabels`,
          {
            params: {
              page_size: -1
            }
          }
        )
        .catch(checkIfLocalNetworkOffline);

      if (result.data.status !== 200) {
        this.errorInfo.fetchEdgeTypeList.code = result.data.status;
        throw new Error(result.data.message);
      }

      this.edgeTypes = result.data.data.records;
      this.requestStatus.fetchEdgeTypeList = 'success';
    } catch (error) {
      this.requestStatus.fetchEdgeTypeList = 'failed';
      this.errorInfo.fetchEdgeTypeList.message = error.message;
    }
  });
}

export default createContext(new DataImportRootStore());
