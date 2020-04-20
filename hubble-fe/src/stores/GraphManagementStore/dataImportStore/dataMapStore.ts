import { observable, action, flow, computed } from 'mobx';
import axios, { AxiosResponse } from 'axios';
import { isUndefined, cloneDeep, remove } from 'lodash-es';

import { DataImportRootStore } from './dataImportRootStore';
import { baseUrl, responseData } from '../../types/common';
import {
  FileMapInfo,
  FileConfig,
  FileMapResult,
  VertexMap,
  EdgeMap
} from '../../types/GraphManagementStore/dataImportStore';
import { checkIfLocalNetworkOffline } from '../../utils';
import fileInfoData from './mock-data';

export class DataMapStore {
  dataImportRootStore: DataImportRootStore;

  constructor(dataImportRootStore: DataImportRootStore) {
    this.dataImportRootStore = dataImportRootStore;
  }

  @observable isExpandFileConfig = true;
  @observable isExpandTypeConfig = false;
  // If one of the vertex type card is being edited
  @observable isEditTypeConfig = false;
  @observable fileMapInfos: FileMapInfo[] = [];
  // @observable fileMapInfos: FileMapInfo[] = fileInfoData;
  @observable selectedFileId: number = NaN;
  @observable selectedFileInfo: FileMapInfo | null = this.fileMapInfos[0];

  @observable newVertexType: VertexMap = {
    label: '',
    id_fields: ['', ''],
    field_mapping: [],
    value_mapping: [],
    null_values: {
      checked: ['NULL', 'null'],
      customized: []
    }
  };

  @observable editedVertexMap: VertexMap | null = null;

  @observable newEdgeType: EdgeMap = {
    label: '',
    source_fields: ['', ''],
    target_fields: ['', ''],
    field_mapping: [],
    value_mapping: [],
    null_values: {
      checked: ['NULL', 'null'],
      customized: []
    }
  };

  @observable editedEdgeMap: EdgeMap | null = null;

  @observable requestStatus = {
    updateFileConfig: 'standby',
    fetchDataMaps: 'standby',
    updateVertexMap: 'standby',
    updateEdgeMap: 'standby'
  };

  @observable errorInfo = {
    updateFileConfig: {
      code: NaN,
      message: ''
    },
    fetchDataMaps: {
      code: NaN,
      message: ''
    },
    updateVertexMap: {
      code: NaN,
      message: ''
    },
    updateEdgeMap: {
      code: NaN,
      message: ''
    }
  };

  @computed get filteredColumnNamesInEditSelection() {
    return this.selectedFileInfo!.file_setting.column_names.filter(
      (column_name) =>
        !this.newVertexType.field_mapping
          .map(({ column_name }) => column_name)
          .includes(column_name) &&
        !this.newVertexType.id_fields.includes(column_name)
    );
  }

  @computed get filteredColumnNamesInNewSelection() {
    return this.selectedFileInfo!.file_setting.column_names.filter(
      (column_name) =>
        !this.editedVertexMap?.field_mapping
          .map(({ column_name }) => column_name)
          .includes(column_name) &&
        !this.editedVertexMap?.id_fields.includes(column_name)
    );
  }

  @action
  switchExpand(card: 'file' | 'type', flag: boolean) {
    if (card === 'file') {
      this.isExpandFileConfig = flag;
    } else {
      this.isExpandTypeConfig = flag;
    }
  }

  @action
  switchEditTypeConfig(flag: boolean) {
    this.isExpandTypeConfig = flag;
  }

  @action
  setSelectedFileId(id: number) {
    this.selectedFileId = id;
  }

  @action
  setSelectedFileInfo() {
    const fileInfo = this.fileMapInfos.find(
      ({ id }) => id === this.selectedFileId
    );

    if (!isUndefined(fileInfo)) {
      this.selectedFileInfo = fileInfo;
    }
  }

  @action
  setFileConfig<T extends keyof FileConfig>(key: T, value: FileConfig[T]) {
    if (this.selectedFileInfo !== null) {
      this.selectedFileInfo.file_setting[key] = value;
    }
  }

  @action
  syncEditMap(type: 'vertex' | 'edge', mapIndex: number) {
    if (type === 'vertex') {
      this.editedVertexMap = cloneDeep(
        this.selectedFileInfo!.vertex_mappings[mapIndex]
      );
    } else {
      this.editedEdgeMap = cloneDeep(
        this.selectedFileInfo!.edge_mappings[mapIndex]
      );
    }
  }

  @action
  setNewVertexConfig<T extends keyof VertexMap>(key: T, value: VertexMap[T]) {
    this.newVertexType[key] = value;
  }

  @action
  editVertexMapConfig<T extends keyof VertexMap>(
    key: T,
    value: VertexMap[T],
    vertexMapIndex: number
  ) {
    this.editedVertexMap![key] = value;
  }

  @action
  setNewEdgeConfig<T extends keyof EdgeMap>(key: T, value: EdgeMap[T]) {
    this.newEdgeType[key] = value;
  }

  @action
  editEdgeMapConfig<T extends keyof EdgeMap>(
    key: T,
    value: EdgeMap[T],
    edgeMapIndex: number
  ) {
    this.editedEdgeMap![key] = value;
  }

  @action
  setVertexFieldMappingKey(type: 'new' | 'edit', key: string) {
    if (type === 'new') {
      this.newVertexType.field_mapping.unshift({
        column_name: key,
        mapped_name: ''
      });
    } else {
      this.editedVertexMap!.field_mapping.unshift({
        column_name: key,
        mapped_name: ''
      });
    }
  }

  @action
  setEdgeFieldMappingKey(type: 'new' | 'edit', key: string) {
    if (type === 'new') {
      this.newEdgeType.field_mapping.unshift({
        column_name: key,
        mapped_name: ''
      });
    } else {
      this.editedEdgeMap!.field_mapping.unshift({
        column_name: key,
        mapped_name: ''
      });
    }
  }

  @action
  setVertexFieldMapping(
    type: 'new' | 'edit',
    value: string,
    vertexMapFieldIndex: number
  ) {
    if (type === 'new') {
      this.newVertexType.field_mapping[vertexMapFieldIndex].mapped_name = value;
    } else {
      this.editedVertexMap!.field_mapping[
        vertexMapFieldIndex
      ].mapped_name = value;
    }
  }

  @action
  setEdgeFieldMapping(
    type: 'new' | 'edit',
    value: string,
    edgeMapFieldIndex: number
  ) {
    if (type === 'new') {
      this.newEdgeType.field_mapping[edgeMapFieldIndex].mapped_name = value;
    } else {
      this.editedEdgeMap!.field_mapping[edgeMapFieldIndex].mapped_name = value;
    }
  }

  @action
  removeVertexFieldMapping(type: 'new' | 'edit', columnName: string) {
    if (type === 'new') {
      remove(
        this.newVertexType.field_mapping,
        ({ column_name }) => column_name === columnName
      );
    } else {
      remove(
        this.editedVertexMap!.field_mapping,
        ({ column_name }) => column_name === columnName
      );
    }
  }

  @action
  removeEdgeFieldMapping(type: 'new' | 'edit', columnName: string) {
    if (type === 'new') {
      remove(
        this.newEdgeType.field_mapping,
        ({ column_name }) => column_name === columnName
      );
    } else {
      remove(
        this.editedEdgeMap!.field_mapping,
        ({ column_name }) => column_name === columnName
      );
    }
  }

  @action
  toggleVertexSelectAllFieldMapping(type: 'new' | 'edit', selectAll: boolean) {
    if (selectAll) {
      if (type === 'new') {
        const existedFieldColumnNames = this.newVertexType.field_mapping.map(
          ({ column_name }) => column_name
        );

        this.selectedFileInfo!.file_setting.column_names.filter(
          (column_name) =>
            !existedFieldColumnNames.includes(column_name) &&
            !this.newVertexType.id_fields.includes(column_name)
        ).map((columnName) => {
          this.setVertexFieldMappingKey(type, columnName);
        });
      } else {
        const existedFieldColumnNames = this.editedVertexMap!.field_mapping.map(
          ({ column_name }) => column_name
        );

        this.selectedFileInfo!.file_setting.column_names.filter(
          (column_name) =>
            !existedFieldColumnNames.includes(column_name) &&
            !this.editedVertexMap!.id_fields.includes(column_name)
        ).map((columnName) => {
          this.setVertexFieldMappingKey(type, columnName);
        });
      }
    } else {
      if (type === 'new') {
        this.newVertexType.field_mapping = [];
      } else {
        this.editedVertexMap!.field_mapping = [];
      }
    }
  }

  @action
  toggleEdgeSelectAllFieldMapping(type: 'new' | 'edit', selectAll: boolean) {
    if (selectAll) {
      if (type === 'new') {
        const existedFieldColumnNames = this.newEdgeType.field_mapping.map(
          ({ column_name }) => column_name
        );

        this.selectedFileInfo!.file_setting.column_names.filter(
          (column_name) =>
            !existedFieldColumnNames.includes(column_name) &&
            !this.newEdgeType.source_fields.includes(column_name) &&
            !this.newEdgeType.target_fields.includes(column_name)
        ).map((columnName) => {
          this.setVertexFieldMappingKey(type, columnName);
        });
      } else {
        const existedFieldColumnNames = this.editedEdgeMap!.field_mapping.map(
          ({ column_name }) => column_name
        );

        this.selectedFileInfo!.file_setting.column_names.filter(
          (column_name) =>
            !existedFieldColumnNames.includes(column_name) &&
            !this.editedEdgeMap!.source_fields.includes(column_name) &&
            !this.editedEdgeMap!.target_fields.includes(column_name)
        ).map((columnName) => {
          this.setVertexFieldMappingKey(type, columnName);
        });
      }
    } else {
      if (type === 'new') {
        this.newEdgeType.field_mapping = [];
      } else {
        this.editedEdgeMap!.field_mapping = [];
      }
    }
  }

  toggleCustomNullValue(
    type: 'new' | 'edit',
    collection: 'vertex' | 'edge',
    flag: boolean
  ) {
    if (type === 'new') {
      if (collection === 'vertex') {
        if (flag) {
          this.newVertexType.null_values.customized = [''];
        } else {
          this.newVertexType.null_values.customized = [];
        }
      } else {
        if (flag) {
          this.newEdgeType.null_values.customized = [''];
        } else {
          this.newEdgeType.null_values.customized = [];
        }
      }
    } else {
      if (collection === 'vertex') {
        if (flag) {
          this.editedVertexMap!.null_values.customized = [''];
        } else {
          this.editedVertexMap!.null_values.customized = [];
        }
      } else {
        if (flag) {
          this.editedEdgeMap!.null_values.customized = [''];
        } else {
          this.editedEdgeMap!.null_values.customized = [];
        }
      }
    }
  }

  editCheckedNullValues(
    type: 'new' | 'edit',
    collection: 'vertex' | 'edge',
    values: string[]
  ) {
    if (type === 'new') {
      if (collection === 'vertex') {
        this.newVertexType.null_values.checked = values;
      } else {
        this.newEdgeType.null_values.checked = values;
      }
    } else {
      if (collection === 'edge') {
        this.editedVertexMap!.null_values.checked = values;
      } else {
        this.editedEdgeMap!.null_values.checked = values;
      }
    }
  }

  addCustomNullValues(type: 'new' | 'edit', collection: 'vertex' | 'edge') {
    if (type === 'new') {
      if (collection === 'vertex') {
        this.newVertexType.null_values.customized.push('');
      } else {
        this.newEdgeType.null_values.customized.push('');
      }
    } else {
      if (collection === 'vertex') {
        this.editedVertexMap!.null_values.customized.push('');
      } else {
        this.editedVertexMap!.null_values.customized.push('');
      }
    }
  }

  editCustomNullValues(
    type: 'new' | 'edit',
    collection: 'vertex' | 'edge',
    value: string,
    nullValueIndex: number
  ) {
    if (type === 'new') {
      if (collection === 'vertex') {
        this.newVertexType.null_values.customized[nullValueIndex] = value;
      } else {
        this.newEdgeType.null_values.customized[nullValueIndex] = value;
      }
    } else {
      if (collection === 'edge') {
        this.editedVertexMap!.null_values.customized[nullValueIndex] = value;
      } else {
        this.editedEdgeMap!.null_values.customized[nullValueIndex] = value;
      }
    }
  }

  @action
  addVertexValueMapping(type: 'new' | 'edit') {
    const newValueMapping = {
      column_name: '',
      values: [
        {
          column_value: '',
          mapped_value: ''
        }
      ]
    };

    if (type === 'new') {
      this.newVertexType.value_mapping.push(newValueMapping);
    } else {
      this.editedVertexMap!.value_mapping.push(newValueMapping);
    }
  }

  @action
  addEdgeValueMapping(type: 'new' | 'edit') {
    const newValueMapping = {
      column_name: '',
      values: [
        {
          column_value: '',
          mapped_value: ''
        }
      ]
    };

    if (type === 'new') {
      this.newEdgeType.value_mapping.push(newValueMapping);
    } else {
      this.editedEdgeMap!.value_mapping.push(newValueMapping);
    }
  }

  @action
  addVertexValueMappingValue(type: 'new' | 'edit', vertexMapIndex: number) {
    const newValue = {
      column_value: '',
      mapped_value: ''
    };

    if (type === 'new') {
      this.newVertexType.value_mapping[vertexMapIndex].values.push(newValue);
    } else {
      this.editedVertexMap!.value_mapping[vertexMapIndex].values.push(newValue);
    }
  }

  @action
  addEdgeValueMappingValue(type: 'new' | 'edit', vertexMapIndex: number) {
    const newValue = {
      column_value: '',
      mapped_value: ''
    };

    if (type === 'new') {
      this.newEdgeType.value_mapping[vertexMapIndex].values.push(newValue);
    } else {
      this.editedEdgeMap!.value_mapping[vertexMapIndex].values.push(newValue);
    }
  }

  @action
  editVertexValueMappingColumnName(
    type: 'new' | 'edit',
    value: string,
    valueMapIndex: number
  ) {
    if (type === 'new') {
      this.newVertexType.value_mapping[valueMapIndex].column_name = value;
    } else {
      this.editedVertexMap!.value_mapping[valueMapIndex].column_name = value;
    }
  }

  @action
  editEdgeValueMappingColumnName(
    type: 'new' | 'edit',
    value: string,
    valueMapIndex: number
  ) {
    if (type === 'new') {
      this.newEdgeType.value_mapping[valueMapIndex].column_name = value;
    } else {
      this.editedEdgeMap!.value_mapping[valueMapIndex].column_name = value;
    }
  }

  @action
  editVertexValueMappingColumnValueName(
    type: 'new' | 'edit',
    field: 'column_value' | 'mapped_value',
    value: string,
    valueMapIndex: number,
    valueIndex: number
  ) {
    if (type === 'new') {
      this.newVertexType.value_mapping[valueMapIndex].values[valueIndex][
        field
      ] = value;
    } else {
      this.editedVertexMap!.value_mapping[valueMapIndex].values[valueIndex][
        field
      ] = value;
    }
  }

  @action
  editEdgeValueMappingColumnValueName(
    type: 'new' | 'edit',
    field: 'column_value' | 'mapped_value',
    value: string,
    valueMapIndex: number,
    valueIndex: number
  ) {
    if (type === 'new') {
      this.newEdgeType.value_mapping[valueMapIndex].values[valueIndex][
        field
      ] = value;
    } else {
      this.editedEdgeMap!.value_mapping[valueMapIndex].values[valueIndex][
        field
      ] = value;
    }
  }

  @action
  removeVertexValueMapping(type: 'new' | 'edit', valueMapIndex: number) {
    if (type === 'new') {
      remove(
        this.newVertexType.value_mapping,
        (_, index) => index === valueMapIndex
      );
    } else {
      remove(
        this.editedVertexMap!.value_mapping,
        (_, index) => index === valueMapIndex
      );
    }
  }

  @action
  removeEdgeValueMapping(type: 'new' | 'edit', valueMapIndex: number) {
    if (type === 'new') {
      remove(
        this.newEdgeType.value_mapping,
        (_, index) => index === valueMapIndex
      );
    } else {
      remove(
        this.editedEdgeMap!.value_mapping,
        (_, index) => index === valueMapIndex
      );
    }
  }

  @action
  removeVertexValueMappingValue(
    type: 'new' | 'edit',
    valueMapIndex: number,
    valueIndex: number
  ) {
    if (type === 'new') {
      remove(
        this.newVertexType.value_mapping[valueMapIndex].values,
        (_, index) => index === valueIndex
      );
    } else {
      remove(
        this.editedVertexMap!.value_mapping[valueMapIndex].values,
        (_, index) => index === valueIndex
      );
    }
  }

  @action
  removeEdgeValueMappingValue(
    type: 'new' | 'edit',
    valueMapIndex: number,
    valueIndex: number
  ) {
    if (type === 'new') {
      remove(
        this.newEdgeType.value_mapping[valueMapIndex].values,
        (_, index) => index === valueIndex
      );
    } else {
      remove(
        this.editedEdgeMap!.value_mapping[valueMapIndex].values,
        (_, index) => index === valueIndex
      );
    }
  }

  @action
  resetNewMap(newMap: 'vertex' | 'edge') {
    if (newMap === 'vertex') {
      this.newVertexType = {
        label: '',
        id_fields: ['', ''],
        field_mapping: [],
        value_mapping: [],
        null_values: {
          checked: ['NULL', 'null'],
          customized: []
        }
      };
    } else {
      this.newEdgeType = {
        label: '',
        source_fields: ['', ''],
        target_fields: ['', ''],
        field_mapping: [],
        value_mapping: [],
        null_values: {
          checked: ['NULL', 'null'],
          customized: []
        }
      };
    }
  }

  @action
  resetEditMapping(editMapping: 'vertex' | 'edge') {
    if (editMapping === 'vertex') {
      this.editedVertexMap = null;
    } else {
      this.editedEdgeMap = null;
    }
  }

  @action
  validateVertexMaping() {}

  @action
  resetNewVertexType() {
    this.newVertexType = {
      label: '',
      id_fields: ['', ''],
      field_mapping: [],
      value_mapping: [],
      null_values: {
        checked: ['NULL', 'null'],
        customized: []
      }
    };
  }

  @action
  resetNewEdgeType() {
    this.newEdgeType = {
      label: '',
      source_fields: ['', ''],
      target_fields: ['', ''],
      field_mapping: [],
      value_mapping: [],
      null_values: {
        checked: ['NULL', 'null'],
        customized: []
      }
    };
  }

  // @action
  // reset() {
  //   this.selectedFileInfo = null;
  //   this.requestStatus = {
  //     updateFileConfig: 'standby',
  //     fetchDataMaps: 'standby',
  //     updateVertexMap: 'standby',
  //     updateEdgeMap: 'standby'
  //   };
  //   this.errorInfo = {
  //     updateFileConfig: {
  //       code: NaN,
  //       message: ''
  //     },
  //     fetchDataMaps: {
  //       code: NaN,
  //       message: ''
  //     },
  //     updateVertexMap: {
  //       code: NaN,
  //       message: ''
  //     },
  //     updateEdgeMap: {
  //       code: NaN,
  //       message: ''
  //     }
  //   };
  // }

  fetchDataMaps = flow(function* fetchDataMaps(this: DataMapStore) {
    this.requestStatus.fetchDataMaps = 'pending';

    try {
      const result: AxiosResponse<responseData<FileMapResult>> = yield axios
        .get<responseData<FileMapResult>>(
          `${baseUrl}/${this.dataImportRootStore.currentId}/file-mappings`,
          {
            params: {
              page_size: -1
            }
          }
        )
        .catch(checkIfLocalNetworkOffline);

      if (result.data.status !== 200) {
        this.errorInfo.fetchDataMaps.code = result.data.status;
        throw new Error(result.data.message);
      }

      this.fileMapInfos = result.data.data.records;
      this.requestStatus.fetchDataMaps = 'success';
    } catch (error) {
      this.requestStatus.fetchDataMaps = 'failed';
      this.errorInfo.fetchDataMaps.message = error.message;
      console.error(error.message);
    }
  });

  updateFileConfig = flow(function* updateFileConfig(
    this: DataMapStore,
    fileId: number
  ) {
    this.requestStatus.updateFileConfig = 'pending';

    try {
      const result: AxiosResponse<responseData<FileMapInfo>> = yield axios
        .post<responseData<FileMapInfo>>(
          `${baseUrl}/${this.dataImportRootStore.currentId}/file-mappings/${fileId}/file-setting`,
          this.selectedFileInfo?.file_setting
        )
        .catch(checkIfLocalNetworkOffline);

      if (result.data.status !== 200) {
        this.errorInfo.updateFileConfig.code = result.data.status;
        throw new Error(result.data.message);
      }

      this.selectedFileInfo!.file_setting = result.data.data.file_setting;
      this.requestStatus.updateFileConfig = 'success';
    } catch (error) {
      this.requestStatus.updateFileConfig = 'failed';
      this.errorInfo.updateFileConfig.message = error.message;
      console.error(error.message);
    }
  });

  updateVertexMap = flow(function* updateVertexMap(
    this: DataMapStore,
    method: 'add' | 'upgrade' | 'delete',
    fileId: number
  ) {
    this.requestStatus.updateVertexMap = 'pending';

    try {
      let result: AxiosResponse<responseData<FileMapInfo>>;

      switch (method) {
        case 'add': {
          const newVertexType = cloneDeep(this.newVertexType);

          if (
            newVertexType.null_values.checked.includes('NULL') &&
            !newVertexType.null_values.checked.includes('null')
          ) {
            newVertexType.null_values.checked.push('null');
          }

          result = yield axios
            .post(
              `${baseUrl}/${this.dataImportRootStore.currentId}/file-mappings/${fileId}/vertex-mappings`,
              newVertexType
            )
            .catch(checkIfLocalNetworkOffline);
          break;
        }
        case 'upgrade': {
          const editedVertexMap = cloneDeep(this.editedVertexMap);

          if (
            editedVertexMap!.null_values.checked.includes('NULL') &&
            !editedVertexMap!.null_values.checked.includes('null')
          ) {
            editedVertexMap!.null_values.checked.push('null');
          }

          result = yield axios
            .put(
              `${baseUrl}/${this.dataImportRootStore.currentId}/file-mappings/${fileId}/vertex-mappings${this.editedVertexMap?.id}`,
              editedVertexMap
            )
            .catch(checkIfLocalNetworkOffline);
          break;
        }
        case 'delete':
          result = yield axios
            .delete(
              `${baseUrl}/${this.dataImportRootStore.currentId}/file-mappings/${fileId}/vertex-mappings${this.editedVertexMap?.id}`
            )
            .catch(checkIfLocalNetworkOffline);
          break;
      }

      if (result.data.status !== 200) {
        this.errorInfo.updateVertexMap.code = result.data.status;
        throw new Error(result.data.message);
      }

      this.selectedFileInfo!.vertex_mappings = result.data.data.vertex_mappings;
      this.requestStatus.updateVertexMap = 'success';
    } catch (error) {
      this.requestStatus.updateVertexMap = 'failed';
      this.errorInfo.updateVertexMap.message = error.message;
      console.error(error.message);
    }
  });

  updateEdgeMap = flow(function* updateEdgeMap(
    this: DataMapStore,
    method: 'add' | 'upgrade' | 'delete',
    fileId: number
  ) {
    this.requestStatus.updateEdgeMap = 'pending';

    try {
      let result: AxiosResponse<responseData<FileMapInfo>>;

      switch (method) {
        case 'add': {
          const newEdgeType = cloneDeep(this.newEdgeType);

          if (
            newEdgeType.null_values.checked.includes('NULL') &&
            !newEdgeType.null_values.checked.includes('null')
          ) {
            newEdgeType.null_values.checked.push('null');
          }

          result = yield axios
            .post(
              `${baseUrl}/${this.dataImportRootStore.currentId}/file-mappings/${fileId}/edge-mapping`,
              newEdgeType
            )
            .catch(checkIfLocalNetworkOffline);
          break;
        }
        case 'upgrade': {
          const editedEdgeMap = cloneDeep(this.editedEdgeMap);

          if (
            editedEdgeMap!.null_values.checked.includes('NULL') &&
            !editedEdgeMap!.null_values.checked.includes('null')
          ) {
            editedEdgeMap!.null_values.checked.push('null');
          }

          result = yield axios
            .put(
              `${baseUrl}/${this.dataImportRootStore.currentId}/file-mappings/${fileId}/edge-mapping${this.editedEdgeMap?.id}`,
              this.editedEdgeMap
            )
            .catch(checkIfLocalNetworkOffline);
          break;
        }
        case 'delete':
          result = yield axios
            .delete(
              `${baseUrl}/${this.dataImportRootStore.currentId}/file-mappings/${fileId}/edge-mapping${this.editedEdgeMap?.id}`
            )
            .catch(checkIfLocalNetworkOffline);
          break;
      }

      if (result.data.status !== 200) {
        this.errorInfo.updateEdgeMap.code = result.data.status;
        throw new Error(result.data.message);
      }

      this.selectedFileInfo!.edge_mappings = result.data.data.edge_mappings;
      this.requestStatus.updateEdgeMap = 'success';
    } catch (error) {
      this.requestStatus.updateEdgeMap = 'failed';
      this.errorInfo.updateEdgeMap.message = error.message;
      console.error(error.message);
    }
  });
}
