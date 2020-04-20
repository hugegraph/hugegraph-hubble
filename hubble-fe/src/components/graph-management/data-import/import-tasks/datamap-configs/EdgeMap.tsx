import React, { useContext, useState } from 'react';
import { toJS } from 'mobx';
import { observer } from 'mobx-react';
import { isUndefined, isEmpty, size, cloneDeep } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { Input, Select, Checkbox } from '@baidu/one-ui';

import { DataImportRootStoreContext } from '../../../../../stores';
import { VertexType } from '../../../../../stores/types/GraphManagementStore/metadataConfigsStore';
import TypeConfigManipulations from './TypeConfigManipulations';

import ArrowIcon from '../../../../../assets/imgs/ic_arrow_16.svg';
import BlueArrowIcon from '../../../../../assets/imgs/ic_arrow_blue.svg';
import CloseIcon from '../../../../../assets/imgs/ic_close_16.svg';
import MapIcon from '../../../../../assets/imgs/ic_yingshe_16.svg';

export interface EdgeMapProps {
  checkOrEdit: 'check' | 'edit' | boolean;
  onCancelCreateEdge: () => void;
  edgeMapIndex?: number;
  label?: string;
}

const EdgeMap: React.FC<EdgeMapProps> = observer(
  ({ checkOrEdit, onCancelCreateEdge, label, edgeMapIndex }) => {
    const dataImportRootStore = useContext(DataImportRootStoreContext);
    const { dataMapStore } = dataImportRootStore;
    const [isAddMapping, switchAddMapping] = useState(false);
    // const [extraNullValues, setExtraNullValues] = useState<string[]>([]);
    const { t } = useTranslation();

    const isCheck = checkOrEdit === 'check';
    const isEdit = checkOrEdit === 'edit';

    const selectedEdge = dataImportRootStore.edgeTypes.find(
      ({ name }) =>
        name ===
        (checkOrEdit !== false
          ? dataMapStore.editedEdgeMap!.label
          : dataMapStore.newEdgeType.label)
    );

    let selectedSourceVertex: VertexType | undefined;
    let selectedTargetVertex: VertexType | undefined;

    if (!isUndefined(selectedEdge)) {
      selectedSourceVertex = dataImportRootStore.vertexTypes.find(
        ({ name }) => name === selectedEdge.source_label
      );
      selectedTargetVertex = dataImportRootStore.vertexTypes.find(
        ({ name }) => name === selectedEdge.target_label
      );
    }

    const handleExpand = () => {
      dataMapStore.switchExpand('type', !dataMapStore.isExpandTypeConfig);
    };

    const wrapperName = classnames({
      'import-tasks-data-map-config-card': !Boolean(checkOrEdit),
      'import-tasks-data-map-config-view': Boolean(checkOrEdit)
    });

    const expandAdvanceClassName = classnames({
      'import-tasks-step-content-header-expand':
        dataMapStore.isExpandTypeConfig,
      'import-tasks-step-content-header-collpase': !dataMapStore.isExpandTypeConfig
    });

    const expandAddMapClassName = classnames({
      'import-tasks-step-content-header-expand': isAddMapping,
      'import-tasks-step-content-header-collpase': !isAddMapping
    });

    const addNullValueClassName = classnames({
      'import-tasks-manipulation': true,
      'import-tasks-manipulation-disabled': isEdit
        ? dataMapStore.editedEdgeMap!.null_values.customized.includes('')
        : dataMapStore.newEdgeType.null_values.customized.includes('')
    });

    return (
      <div className={wrapperName}>
        {Boolean(checkOrEdit) ? (
          <div
            className="import-tasks-step-content-header"
            style={{
              justifyContent: 'space-between',
              fontSize: 14,
              paddingLeft: 14
            }}
          >
            <span>{t('data-configs.type.basic-settings')}</span>
          </div>
        ) : (
          <div
            className="import-tasks-step-content-header"
            style={{ justifyContent: 'space-between' }}
          >
            <span>{t('data-configs.type.edge.title')}</span>
            <img
              src={CloseIcon}
              alt="collpaseOrExpand"
              onClick={onCancelCreateEdge}
            />
          </div>
        )}
        <div className="import-tasks-data-options">
          <span className="import-tasks-data-options-title in-card">
            {t('data-configs.type.edge.type')}:
          </span>
          {isCheck ? (
            <span>{dataMapStore.editedEdgeMap!.label}</span>
          ) : (
            <Select
              width={420}
              size="medium"
              value={
                isEdit
                  ? dataMapStore.editedEdgeMap!.label
                  : dataMapStore.newEdgeType.label
              }
              onChange={(value: string) => {
                if (isEdit) {
                  dataMapStore.editEdgeMapConfig('label', value, edgeMapIndex!);

                  // reset field mapping values since it binds with label
                  dataMapStore.editedEdgeMap?.field_mapping.forEach(
                    ({ column_name }, fieldIndex) => {
                      dataMapStore.setEdgeFieldMapping('edit', '', fieldIndex);
                    }
                  );
                } else {
                  dataMapStore.setNewEdgeConfig('label', value);

                  dataMapStore.newEdgeType.field_mapping.forEach(
                    ({ column_name }, fieldIndex) => {
                      dataMapStore.setEdgeFieldMapping('new', '', fieldIndex);
                    }
                  );
                }
              }}
            >
              {dataImportRootStore.edgeTypes.map(({ name }) => (
                <Select.Option value={name} key={name}>
                  {name}
                </Select.Option>
              ))}
            </Select>
          )}
        </div>

        {!isUndefined(selectedSourceVertex) && (
          <div className="import-tasks-data-options">
            <span className="import-tasks-data-options-title in-card">
              {t('data-configs.type.edge.source-ID-strategy')}:
            </span>
            <span>
              {t(
                `data-configs.type.ID-strategy.${selectedSourceVertex.id_strategy}`
              )}
              {selectedSourceVertex.id_strategy === 'PRIMARY_KEY' &&
                `-${selectedSourceVertex.properties
                  .map(({ name }) => name)
                  .join('，')}`}
            </span>
          </div>
        )}
        {selectedSourceVertex?.id_strategy !== 'PRIMARY_KEY' ? (
          <div className="import-tasks-data-options">
            <span className="import-tasks-data-options-title in-card">
              {t('data-configs.type.edge.ID-column')}:
            </span>
            {isCheck ? (
              <span>{dataMapStore.editedEdgeMap!.source_fields[0]}</span>
            ) : (
              <Select
                width={420}
                size="medium"
                value={
                  isEdit
                    ? dataMapStore.editedEdgeMap!.source_fields[0]
                    : dataMapStore.newEdgeType.source_fields[0]
                }
                onChange={(value: string) => {
                  if (isEdit) {
                    dataMapStore.editEdgeMapConfig(
                      'source_fields',
                      [value],
                      edgeMapIndex!
                    );

                    // remove selected field mappings after reselect column name
                    if (
                      !isUndefined(
                        dataMapStore.editedEdgeMap?.field_mapping.find(
                          ({ column_name }) => column_name === value
                        )
                      )
                    ) {
                      dataMapStore.removeEdgeFieldMapping('edit', value);
                    }
                  } else {
                    dataMapStore.setNewEdgeConfig('source_fields', [value]);

                    if (
                      !isUndefined(
                        dataMapStore.newEdgeType.field_mapping.find(
                          ({ column_name }) => column_name === value
                        )
                      )
                    ) {
                      dataMapStore.removeEdgeFieldMapping('new', value);
                    }
                  }
                }}
              >
                {dataMapStore.selectedFileInfo!.file_setting.column_names.map(
                  (name) => (
                    <Select.Option value={name} key={name}>
                      {name}
                    </Select.Option>
                  )
                )}
              </Select>
            )}
          </div>
        ) : (
          <>
            <div className="import-tasks-data-options">
              <span className="import-tasks-data-options-title in-card">
                {t('data-configs.type.edge.ID-column-1')}:
              </span>
              {isCheck ? (
                <span>{dataMapStore.editedEdgeMap!.source_fields[0]}</span>
              ) : (
                <Select
                  width={420}
                  size="medium"
                  value={
                    isEdit
                      ? dataMapStore.editedEdgeMap!.source_fields[0]
                      : dataMapStore.newEdgeType.source_fields[0]
                  }
                  onChange={(value: string) => {
                    const otherColumnValue = isEdit
                      ? dataMapStore.editedEdgeMap!.source_fields[1]
                      : dataMapStore.newEdgeType.source_fields[1];

                    isEdit
                      ? dataMapStore.editEdgeMapConfig(
                          'source_fields',
                          [value, otherColumnValue],
                          edgeMapIndex!
                        )
                      : dataMapStore.setNewEdgeConfig('source_fields', [
                          value,
                          otherColumnValue
                        ]);
                  }}
                >
                  {dataMapStore
                    .selectedFileInfo!.file_setting.column_names.filter(
                      (name) =>
                        isEdit
                          ? !dataMapStore.editedEdgeMap!.source_fields.includes(
                              name
                            )
                          : !dataMapStore.newEdgeType!.source_fields.includes(
                              name
                            )
                    )
                    .map((name) => (
                      <Select.Option value={name} key={name}>
                        {name}
                      </Select.Option>
                    ))}
                </Select>
              )}
            </div>
            <div className="import-tasks-data-options">
              <span className="import-tasks-data-options-title in-card">
                {t('data-configs.type.edge.ID-column-2')}:
              </span>
              {isCheck ? (
                <span>{dataMapStore.editedEdgeMap!.source_fields[1]}</span>
              ) : (
                <Select
                  width={420}
                  size="medium"
                  value={
                    isEdit
                      ? dataMapStore.editedEdgeMap!.source_fields[1]
                      : dataMapStore.newEdgeType.source_fields[1]
                  }
                  onChange={(value: string) => {
                    const otherColumnValue = isEdit
                      ? dataMapStore.editedEdgeMap!.source_fields[0]
                      : dataMapStore.newEdgeType.source_fields[0];

                    isEdit
                      ? dataMapStore.editEdgeMapConfig(
                          'source_fields',
                          [otherColumnValue, value],
                          edgeMapIndex!
                        )
                      : dataMapStore.setNewEdgeConfig('source_fields', [
                          otherColumnValue,
                          value
                        ]);
                  }}
                >
                  {dataMapStore
                    .selectedFileInfo!.file_setting.column_names.filter(
                      (name) =>
                        isEdit
                          ? !dataMapStore.editedEdgeMap!.source_fields.includes(
                              name
                            )
                          : !dataMapStore.newEdgeType!.source_fields.includes(
                              name
                            )
                    )
                    .map((name) => (
                      <Select.Option value={name} key={name}>
                        {name}
                      </Select.Option>
                    ))}
                </Select>
              )}
            </div>
          </>
        )}

        {!isUndefined(selectedTargetVertex) && (
          <div className="import-tasks-data-options">
            <span className="import-tasks-data-options-title in-card">
              {t('data-configs.type.edge.target-ID-strategy')}:
            </span>
            <span>
              {t(
                `data-configs.type.ID-strategy.${selectedTargetVertex.id_strategy}`
              )}
              {selectedTargetVertex.id_strategy === 'PRIMARY_KEY' &&
                `-${selectedTargetVertex.primary_keys.join('，')}`}
            </span>
          </div>
        )}
        {selectedTargetVertex?.id_strategy !== 'PRIMARY_KEY' ? (
          <div className="import-tasks-data-options">
            <span className="import-tasks-data-options-title in-card">
              {t('data-configs.type.edge.ID-column')}:
            </span>
            {isCheck ? (
              <span>{dataMapStore.editedEdgeMap!.target_fields[0]}</span>
            ) : (
              <Select
                width={420}
                size="medium"
                value={
                  isEdit
                    ? dataMapStore.editedEdgeMap!.target_fields[0]
                    : dataMapStore.newEdgeType.target_fields[0]
                }
                onChange={(value: string) => {
                  if (isEdit) {
                    dataMapStore.editEdgeMapConfig(
                      'target_fields',
                      [value],
                      edgeMapIndex!
                    );

                    // remove selected field mappings after reselect column name
                    if (
                      !isUndefined(
                        dataMapStore.editedEdgeMap?.field_mapping.find(
                          ({ column_name }) => column_name === value
                        )
                      )
                    ) {
                      dataMapStore.removeEdgeFieldMapping('edit', value);
                    }
                  } else {
                    dataMapStore.setNewEdgeConfig('target_fields', [value]);

                    if (
                      !isUndefined(
                        dataMapStore.newEdgeType.field_mapping.find(
                          ({ column_name }) => column_name === value
                        )
                      )
                    ) {
                      dataMapStore.removeEdgeFieldMapping('new', value);
                    }
                  }
                }}
              >
                {dataMapStore.selectedFileInfo!.file_setting.column_names.map(
                  (name) => (
                    <Select.Option value={name} key={name}>
                      {name}
                    </Select.Option>
                  )
                )}
              </Select>
            )}
          </div>
        ) : (
          <>
            <div className="import-tasks-data-options">
              <span className="import-tasks-data-options-title in-card">
                {t('data-configs.type.edge.ID-column-1')}:
              </span>
              {isCheck ? (
                <span>{dataMapStore.editedEdgeMap!.target_fields[0]}</span>
              ) : (
                <Select
                  width={420}
                  size="medium"
                  value={
                    isEdit
                      ? dataMapStore.editedEdgeMap!.target_fields[0]
                      : dataMapStore.newEdgeType.target_fields[0]
                  }
                  onChange={(value: string) => {
                    const otherColumnValue = isEdit
                      ? dataMapStore.editedEdgeMap!.target_fields[1]
                      : dataMapStore.newEdgeType.target_fields[1];

                    isEdit
                      ? dataMapStore.editEdgeMapConfig(
                          'target_fields',
                          [value, otherColumnValue],
                          edgeMapIndex!
                        )
                      : dataMapStore.setNewEdgeConfig('target_fields', [
                          value,
                          otherColumnValue
                        ]);
                  }}
                >
                  {dataMapStore
                    .selectedFileInfo!.file_setting.column_names.filter(
                      (name) =>
                        isEdit
                          ? !dataMapStore.editedEdgeMap!.target_fields.includes(
                              name
                            )
                          : !dataMapStore.newEdgeType!.target_fields.includes(
                              name
                            )
                    )
                    .map((name) => (
                      <Select.Option value={name} key={name}>
                        {name}
                      </Select.Option>
                    ))}
                </Select>
              )}
            </div>
            <div className="import-tasks-data-options">
              <span className="import-tasks-data-options-title in-card">
                {t('data-configs.type.edge.ID-column-2')}:
              </span>
              {isCheck ? (
                <span>{dataMapStore.editedEdgeMap!.target_fields[1]}</span>
              ) : (
                <Select
                  width={420}
                  size="medium"
                  value={
                    isEdit
                      ? dataMapStore.editedEdgeMap!.target_fields[1]
                      : dataMapStore.newEdgeType.target_fields[1]
                  }
                  onChange={(value: string) => {
                    const otherColumnValue = isEdit
                      ? dataMapStore.editedEdgeMap!.target_fields[0]
                      : dataMapStore.newEdgeType.target_fields[0];

                    isEdit
                      ? dataMapStore.editEdgeMapConfig(
                          'target_fields',
                          [otherColumnValue, value],
                          edgeMapIndex!
                        )
                      : dataMapStore.setNewEdgeConfig('target_fields', [
                          otherColumnValue,
                          value
                        ]);
                  }}
                >
                  {dataMapStore
                    .selectedFileInfo!.file_setting.column_names.filter(
                      (name) =>
                        isEdit
                          ? !dataMapStore.editedEdgeMap!.target_fields.includes(
                              name
                            )
                          : !dataMapStore.newEdgeType!.target_fields.includes(
                              name
                            )
                    )
                    .map((name) => (
                      <Select.Option value={name} key={name}>
                        {name}
                      </Select.Option>
                    ))}
                </Select>
              )}
            </div>
          </>
        )}

        <div className="import-tasks-data-options">
          <span
            className="import-tasks-data-options-title in-card"
            style={{ height: 32 }}
          >
            {t('data-configs.type.edge.map-settings')}:
          </span>
          <div className="import-tasks-data-options-expand-table">
            {((Boolean(checkOrEdit) === false &&
              !isEmpty(dataMapStore.newEdgeType.field_mapping)) ||
              (Boolean(checkOrEdit) !== false &&
                !isEmpty(dataMapStore.editedEdgeMap!.field_mapping))) && (
              <div className="import-tasks-data-options-expand-table-row">
                <div className="import-tasks-data-options-expand-table-column">
                  {t('data-configs.type.edge.add-map.name')}
                </div>
                <div className="import-tasks-data-options-expand-table-column">
                  {t('data-configs.type.edge.add-map.sample')}
                </div>
                <div className="import-tasks-data-options-expand-table-column">
                  {t('data-configs.type.edge.add-map.property')}
                </div>
                <div
                  className="import-tasks-data-options-expand-table-column
                import-tasks-manipulation"
                  style={{ cursor: 'default' }}
                >
                  {!isCheck && (
                    <span
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        isEdit
                          ? dataMapStore.toggleEdgeSelectAllFieldMapping(
                              'edit',
                              false
                            )
                          : dataMapStore.toggleEdgeSelectAllFieldMapping(
                              'new',
                              false
                            );
                      }}
                    >
                      {t('data-configs.type.edge.add-map.clear')}
                    </span>
                  )}
                </div>
              </div>
            )}
            {Boolean(checkOrEdit) === false
              ? dataMapStore.newEdgeType.field_mapping.map(
                  ({ column_name, mapped_name }, fieldIndex) => {
                    return (
                      <div className="import-tasks-data-options-expand-table-row">
                        <div className="import-tasks-data-options-expand-table-column">
                          {column_name}
                        </div>
                        <div className="import-tasks-data-options-expand-table-column">
                          {
                            dataMapStore.selectedFileInfo?.file_setting
                              .column_values[
                              dataMapStore.selectedFileInfo?.file_setting.column_names.findIndex(
                                (name) => column_name
                              )
                            ]
                          }
                        </div>
                        <div className="import-tasks-data-options-expand-table-column">
                          <Select
                            width={170}
                            size="medium"
                            value={mapped_name}
                            onChange={(value: string) => {
                              dataMapStore.setEdgeFieldMapping(
                                'new',
                                value,
                                fieldIndex
                              );
                            }}
                          >
                            {selectedSourceVertex?.properties.map(
                              ({ name }) => (
                                <Select.Option value={name} key={name}>
                                  {name}
                                </Select.Option>
                              )
                            )}
                            {selectedTargetVertex?.properties.map(
                              ({ name }) => (
                                <Select.Option value={name} key={name}>
                                  {name}
                                </Select.Option>
                              )
                            )}
                          </Select>
                        </div>
                        <div
                          className="import-tasks-data-options-expand-table-column import-tasks-manipulation"
                          style={{ cursor: 'default' }}
                        >
                          {!isCheck && (
                            <img
                              style={{ cursor: 'pointer' }}
                              src={CloseIcon}
                              alt="close"
                              onClick={() => {
                                dataMapStore.removeEdgeFieldMapping(
                                  'new',
                                  column_name
                                );
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  }
                )
              : dataMapStore.editedEdgeMap?.field_mapping.map(
                  ({ column_name, mapped_name }, fieldIndex) => {
                    return (
                      <div className="import-tasks-data-options-expand-table-row">
                        <div className="import-tasks-data-options-expand-table-column">
                          {column_name}
                        </div>
                        <div className="import-tasks-data-options-expand-table-column">
                          {
                            dataMapStore.selectedFileInfo?.file_setting
                              .column_values[
                              dataMapStore.selectedFileInfo?.file_setting.column_names.findIndex(
                                (name) => column_name
                              )
                            ]
                          }
                        </div>
                        <div className="import-tasks-data-options-expand-table-column">
                          {isEdit ? (
                            <Select
                              width={170}
                              size="medium"
                              value={mapped_name}
                              onChange={(value: string) => {
                                dataMapStore.setEdgeFieldMapping(
                                  'edit',
                                  value,
                                  fieldIndex
                                );
                              }}
                            >
                              {selectedSourceVertex?.properties.map(
                                ({ name }) => (
                                  <Select.Option value={name} key={name}>
                                    {name}
                                  </Select.Option>
                                )
                              )}
                              {selectedTargetVertex?.properties.map(
                                ({ name }) => (
                                  <Select.Option value={name} key={name}>
                                    {name}
                                  </Select.Option>
                                )
                              )}
                            </Select>
                          ) : (
                            <span>{mapped_name}</span>
                          )}
                        </div>
                        <div
                          className="import-tasks-data-options-expand-table-column import-tasks-manipulation"
                          style={{ cursor: 'default' }}
                        >
                          {!isCheck && (
                            <img
                              style={{ cursor: 'pointer' }}
                              src={CloseIcon}
                              alt="close"
                              onClick={() => {
                                dataMapStore.removeEdgeFieldMapping(
                                  'edit',
                                  column_name
                                );
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  }
                )}

            {!isCheck && (
              <>
                <div
                  className="import-tasks-data-options-expand-value"
                  style={{ marginBottom: 8, height: 32 }}
                >
                  <div
                    className="import-tasks-manipulation"
                    style={{ lineHeight: '32px' }}
                    onClick={() => {
                      switchAddMapping(!isAddMapping);
                    }}
                  >
                    {t('data-configs.type.edge.add-map.title')}
                  </div>
                  <img
                    src={BlueArrowIcon}
                    alt="expand"
                    className={expandAddMapClassName}
                    style={{ marginLeft: 4, cursor: 'pointer' }}
                    onClick={() => {
                      switchAddMapping(!isAddMapping);
                    }}
                  />
                </div>
                {isAddMapping && (
                  <div className="import-tasks-data-options-expand-dropdown">
                    <div>
                      <span>
                        <Checkbox
                          checked={
                            isEdit
                              ? !isEmpty(
                                  dataMapStore.editedEdgeMap?.field_mapping
                                )
                              : !isEmpty(dataMapStore.newEdgeType.field_mapping)
                          }
                          indeterminate={
                            isEdit
                              ? !isEmpty(
                                  dataMapStore.editedEdgeMap?.field_mapping
                                ) &&
                                size(
                                  dataMapStore.editedEdgeMap?.field_mapping
                                ) !==
                                  size(
                                    dataMapStore.filteredColumnNamesInEditSelection
                                  )
                              : !isEmpty(
                                  dataMapStore.newEdgeType.field_mapping
                                ) &&
                                size(dataMapStore.newEdgeType.field_mapping) !==
                                  size(
                                    dataMapStore.filteredColumnNamesInNewSelection
                                  )
                          }
                          onChange={(e: any) => {
                            if (isEdit) {
                              const isIndeterminate =
                                !isEmpty(
                                  dataMapStore.editedEdgeMap?.field_mapping
                                ) &&
                                size(
                                  dataMapStore.editedEdgeMap?.field_mapping
                                ) !==
                                  size(
                                    dataMapStore.filteredColumnNamesInEditSelection
                                  );

                              dataMapStore.toggleEdgeSelectAllFieldMapping(
                                'edit',
                                // if isIndeterminate is true, e.target.checked is false
                                isIndeterminate || e.target.checked
                              );
                            } else {
                              const isIndeterminate =
                                !isEmpty(
                                  dataMapStore.newEdgeType.field_mapping
                                ) &&
                                size(dataMapStore.newEdgeType.field_mapping) !==
                                  size(
                                    dataMapStore.filteredColumnNamesInNewSelection
                                  );

                              dataMapStore.toggleEdgeSelectAllFieldMapping(
                                'new',
                                isIndeterminate || e.target.checked
                              );
                            }
                          }}
                        >
                          {t('data-configs.type.edge.select-all')}
                        </Checkbox>
                      </span>
                    </div>
                    {isEdit
                      ? ''
                      : dataMapStore.selectedFileInfo?.file_setting.column_names
                          .filter(
                            (name) =>
                              !dataMapStore.newEdgeType.source_fields.includes(
                                name
                              )
                          )
                          .map((name) => {
                            return (
                              <div>
                                <span>
                                  <Checkbox
                                    checked={
                                      !isUndefined(
                                        dataMapStore.newEdgeType.field_mapping.find(
                                          ({ column_name }) =>
                                            column_name === name
                                        )
                                      )
                                    }
                                    onChange={(e: any) => {
                                      if (e.target.checked) {
                                        isEdit
                                          ? dataMapStore.setEdgeFieldMappingKey(
                                              'edit',
                                              name
                                            )
                                          : dataMapStore.setEdgeFieldMappingKey(
                                              'new',
                                              name
                                            );
                                      } else {
                                        isEdit
                                          ? dataMapStore.removeEdgeFieldMapping(
                                              'edit',
                                              name
                                            )
                                          : dataMapStore.removeEdgeFieldMapping(
                                              'new',
                                              name
                                            );
                                      }
                                    }}
                                  >
                                    {name}
                                    {`（${
                                      dataMapStore.selectedFileInfo
                                        ?.file_setting.column_values[
                                        dataMapStore.selectedFileInfo?.file_setting.column_names.findIndex(
                                          (columnName) => name
                                        )
                                      ]
                                    }）`}
                                  </Checkbox>
                                </span>
                              </div>
                            );
                          })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div
          className="import-tasks-step-content-header"
          style={{ fontSize: 14, paddingLeft: 14 }}
        >
          <span>{t('data-configs.type.edge.advance.title')}</span>
          {!isCheck && (
            <img
              src={ArrowIcon}
              alt="collpaseOrExpand"
              className={expandAdvanceClassName}
              onClick={handleExpand}
            />
          )}
        </div>
        <div className="import-tasks-data-options">
          <span
            className="import-tasks-data-options-title in-card"
            style={{ height: 32 }}
          >
            {t('data-configs.type.edge.advance.nullable-list.title')}:
          </span>
          {isCheck ? (
            <span>Nullable</span>
          ) : (
            <>
              <div
                style={{ display: 'flex', alignItems: 'center', height: 32 }}
              >
                <Checkbox.Group
                  onChange={(checkedList: string[]) => {
                    isEdit
                      ? dataMapStore.editCheckedNullValues(
                          'edit',
                          'edge',
                          checkedList
                        )
                      : dataMapStore.editCheckedNullValues(
                          'new',
                          'edge',
                          checkedList
                        );
                  }}
                  value={
                    isEdit
                      ? dataMapStore.editedEdgeMap!.null_values.checked
                      : dataMapStore.newEdgeType.null_values.checked
                  }
                >
                  <Checkbox value="NULL">Nullable</Checkbox>
                  <Checkbox value={''}>
                    {t('data-configs.type.edge.advance.nullable-list.empty')}
                  </Checkbox>
                </Checkbox.Group>
                <div style={{ marginLeft: 20 }}>
                  <Checkbox
                    value={t(
                      'data-configs.type.edge.advance.nullable-list.custom'
                    )}
                    onChange={(flag: boolean) => {
                      dataMapStore.toggleCustomNullValue(
                        isEdit ? 'edit' : 'new',
                        'edge',
                        flag
                      );
                    }}
                  >
                    {t('data-configs.type.edge.advance.nullable-list.custom')}
                  </Checkbox>
                </div>
              </div>
              <div
                className="import-tasks-data-options-expand-values"
                style={{ marginLeft: 12 }}
              >
                {isEdit ? (
                  <>
                    {dataMapStore.editedEdgeMap?.null_values.customized.map(
                      (nullValue, nullValueIndex) => (
                        <div className="import-tasks-data-options-expand-input">
                          <Input
                            size="medium"
                            width={122}
                            countMode="en"
                            placeholder={t(
                              'data-configs.type.edge.advance.placeholder.input'
                            )}
                            value={nullValue}
                            onChange={(e: any) => {
                              dataMapStore.editCustomNullValues(
                                'edit',
                                'edge',
                                e.value,
                                nullValueIndex
                              );
                            }}
                            errorLocation="bottom"
                          />
                        </div>
                      )
                    )}
                    {!isEmpty(
                      dataMapStore.editedEdgeMap?.null_values.customized
                    ) && (
                      <div style={{ marginTop: 8 }}>
                        <span
                          className={addNullValueClassName}
                          onClick={() => {
                            const extraNullValues =
                              dataMapStore.editedEdgeMap?.null_values
                                .customized;

                            if (!extraNullValues?.includes('')) {
                              dataMapStore.addCustomNullValues('edit', 'edge');
                            }
                          }}
                        >
                          {t('data-configs.manipulations.add')}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {dataMapStore.newEdgeType.null_values.customized.map(
                      (nullValue, nullValueIndex) => (
                        <div className="import-tasks-data-options-expand-input">
                          <Input
                            size="medium"
                            width={122}
                            countMode="en"
                            placeholder={t(
                              'data-configs.type.edge.advance.placeholder.input'
                            )}
                            value={nullValue}
                            onChange={(e: any) => {
                              dataMapStore.editCustomNullValues(
                                'new',
                                'edge',
                                e.value,
                                nullValueIndex
                              );
                            }}
                            errorLocation="bottom"
                          />
                        </div>
                      )
                    )}
                    {!isEmpty(
                      dataMapStore.newEdgeType.null_values.customized
                    ) && (
                      <div style={{ marginTop: 8 }}>
                        <span
                          className={addNullValueClassName}
                          onClick={() => {
                            const extraNullValues =
                              dataMapStore.newEdgeType?.null_values.customized;

                            if (!extraNullValues.includes('')) {
                              dataMapStore.addCustomNullValues('new', 'edge');
                            }
                          }}
                        >
                          {t('data-configs.manipulations.add')}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
        <div className="import-tasks-data-options" style={{ marginBottom: 16 }}>
          <span
            className="import-tasks-data-options-title in-card"
            style={{ height: 32 }}
          >
            {t('data-configs.type.edge.advance.map-property-value.title')}:
          </span>
          {!isCheck &&
            (isEdit
              ? isEmpty(dataMapStore.editedEdgeMap?.value_mapping)
              : isEmpty(dataMapStore.newEdgeType.value_mapping)) && (
              <div
                className="import-tasks-manipulation"
                style={{ lineHeight: '32px' }}
                onClick={() => {
                  isEdit
                    ? dataMapStore.addEdgeValueMapping('edit')
                    : dataMapStore.addEdgeValueMapping('new');
                }}
              >
                {t(
                  'data-configs.type.edge.advance.map-property-value.add-value'
                )}
              </div>
            )}

          {isCheck && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {dataMapStore.editedEdgeMap?.value_mapping.map(
                ({ column_name, values }, index) => (
                  <div className="import-tasks-data-options-expand-values">
                    <div className="import-tasks-data-options-expand-info">
                      <span>
                        {t(
                          'data-configs.type.edge.advance.map-property-value.fields.property'
                        )}
                        {index + 1}:
                      </span>
                      <span>{column_name}</span>
                    </div>
                    {values.map(({ column_value, mapped_value }) => (
                      <div className="import-tasks-data-options-expand-info">
                        <span>
                          {t(
                            'data-configs.type.edge.advance.map-property-value.fields.value-map'
                          )}
                        </span>
                        <span>{column_value}</span>
                        <img src={MapIcon} alt="map" />
                        <span>{mapped_value}</span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* property value mapping form */}
        {!isCheck &&
          (!Boolean(checkOrEdit)
            ? dataMapStore.newEdgeType.value_mapping.map(
                ({ column_name, values }, valueMapIndex) => (
                  <div className="import-tasks-data-options-value-maps">
                    <div className="import-tasks-data-options">
                      <span
                        className="import-tasks-data-options-title in-card"
                        style={{ marginRight: 24 }}
                      >
                        {t(
                          'data-configs.type.edge.advance.map-property-value.fields.property'
                        )}
                        {valueMapIndex + 1}:
                      </span>
                      <Select
                        width={420}
                        size="medium"
                        value={column_name}
                        onChange={(value: string) => {
                          dataMapStore.editEdgeValueMappingColumnName(
                            'new',
                            value,
                            valueMapIndex
                          );
                        }}
                      >
                        {dataMapStore.selectedFileInfo?.file_setting.column_names.map(
                          (columnName) => (
                            <Select.Option value={columnName} key={columnName}>
                              {columnName}
                            </Select.Option>
                          )
                        )}
                      </Select>
                      <span
                        className="import-tasks-manipulation"
                        style={{ marginLeft: 16, lineHeight: '32px' }}
                        onClick={() => {
                          dataMapStore.removeEdgeValueMapping(
                            'new',
                            valueMapIndex
                          );
                        }}
                      >
                        {t('data-configs.manipulations.delete')}
                      </span>
                    </div>
                    <div
                      className="import-tasks-data-options"
                      style={{ marginBottom: 0 }}
                    >
                      <span
                        className="import-tasks-data-options-title in-card"
                        style={{ height: 32, marginRight: 24 }}
                      >
                        {t(
                          'data-configs.type.edge.advance.map-property-value.fields.value-map'
                        )}
                        :
                      </span>
                      <div className="import-tasks-data-options-expand-values">
                        {values.map(
                          ({ column_value, mapped_value }, valueIndex) => (
                            <div className="import-tasks-data-options-expand-value">
                              <Input
                                size="medium"
                                width={200}
                                countMode="en"
                                placeholder=""
                                value={column_value}
                                onChange={(e: any) => {
                                  dataMapStore.editEdgeValueMappingColumnValueName(
                                    'new',
                                    'column_value',
                                    e.value,
                                    valueMapIndex,
                                    valueIndex
                                  );
                                }}
                                errorLocation="bottom"
                              />
                              <img src={MapIcon} alt="map" />
                              <Input
                                size="medium"
                                width={200}
                                countMode="en"
                                placeholder=""
                                value={mapped_value}
                                onChange={(e: any) => {
                                  dataMapStore.editEdgeValueMappingColumnValueName(
                                    'new',
                                    'mapped_value',
                                    e.value,
                                    valueMapIndex,
                                    valueIndex
                                  );
                                }}
                                errorLocation="bottom"
                              />
                              {values.length > 1 && (
                                <span
                                  className="import-tasks-manipulation"
                                  style={{ marginLeft: 16, lineHeight: '32px' }}
                                  onClick={() => {
                                    dataMapStore.removeEdgeValueMappingValue(
                                      'new',
                                      valueMapIndex,
                                      valueIndex
                                    );
                                  }}
                                >
                                  {t('data-configs.manipulations.delete')}
                                </span>
                              )}
                            </div>
                          )
                        )}
                        <div className="import-tasks-data-options-expand-manipulation">
                          <div className="import-tasks-manipulation">
                            <span
                              onClick={() => {
                                dataMapStore.addEdgeValueMappingValue(
                                  'new',
                                  valueMapIndex
                                );
                              }}
                            >
                              {t(
                                'data-configs.type.edge.advance.map-property-value.fields.add-value-map'
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )
            : dataMapStore.editedEdgeMap?.value_mapping.map(
                ({ column_name, values }, valueMapIndex) => (
                  <div className="import-tasks-data-options-value-maps">
                    <div className="import-tasks-data-options">
                      <span
                        className="import-tasks-data-options-title in-card"
                        style={{ marginRight: 24 }}
                      >
                        {t(
                          'data-configs.type.edge.advance.map-property-value.fields.property'
                        )}
                        {valueMapIndex + 1}:
                      </span>
                      <Select
                        width={420}
                        size="medium"
                        value={column_name}
                        onChange={(value: string) => {
                          dataMapStore.editEdgeValueMappingColumnName(
                            'edit',
                            value,
                            valueMapIndex
                          );
                        }}
                      >
                        {dataMapStore.selectedFileInfo?.file_setting.column_names.map(
                          (columnName) => (
                            <Select.Option value={columnName} key={columnName}>
                              {columnName}
                            </Select.Option>
                          )
                        )}
                      </Select>
                      <span
                        className="import-tasks-manipulation"
                        style={{ marginLeft: 16, lineHeight: '32px' }}
                        onClick={() => {
                          dataMapStore.removeEdgeValueMapping(
                            'edit',
                            valueMapIndex
                          );
                        }}
                      >
                        {t('data-configs.manipulations.delete')}
                      </span>
                    </div>
                    <div
                      className="import-tasks-data-options"
                      style={{ marginBottom: 0 }}
                    >
                      <span
                        className="import-tasks-data-options-title in-card"
                        style={{ height: 32, marginRight: 24 }}
                      >
                        {t(
                          'data-configs.type.edge.advance.map-property-value.fields.value-map'
                        )}
                        :
                      </span>
                      <div className="import-tasks-data-options-expand-values">
                        {values.map(
                          ({ column_value, mapped_value }, valueIndex) => (
                            <div className="import-tasks-data-options-expand-value">
                              <Input
                                size="medium"
                                width={200}
                                countMode="en"
                                placeholder=""
                                value={column_value}
                                onChange={(e: any) => {
                                  dataMapStore.editEdgeValueMappingColumnValueName(
                                    'edit',
                                    'column_value',
                                    e.value,
                                    valueMapIndex,
                                    valueIndex
                                  );
                                }}
                                errorLocation="bottom"
                              />
                              <img src={MapIcon} alt="map" />
                              <Input
                                size="medium"
                                width={200}
                                countMode="en"
                                placeholder=""
                                value={mapped_value}
                                onChange={(e: any) => {
                                  dataMapStore.editEdgeValueMappingColumnValueName(
                                    'edit',
                                    'mapped_value',
                                    e.value,
                                    valueMapIndex,
                                    valueIndex
                                  );
                                }}
                                errorLocation="bottom"
                              />
                              {values.length > 1 && (
                                <span
                                  className="import-tasks-manipulation"
                                  style={{ marginLeft: 16, lineHeight: '32px' }}
                                  onClick={() => {
                                    dataMapStore.removeEdgeValueMappingValue(
                                      'edit',
                                      valueMapIndex,
                                      valueIndex
                                    );
                                  }}
                                >
                                  {t('data-configs.manipulations.delete')}
                                </span>
                              )}
                            </div>
                          )
                        )}
                        <div className="import-tasks-data-options-expand-manipulation">
                          <div className="import-tasks-manipulation">
                            <span
                              onClick={() => {
                                dataMapStore.addEdgeValueMappingValue(
                                  'edit',
                                  valueMapIndex
                                );
                              }}
                            >
                              {t(
                                'data-configs.type.edge.advance.map-property-value.fields.add-value-map'
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ))}

        {!isCheck &&
          (isEdit
            ? !isEmpty(dataMapStore.editedEdgeMap?.value_mapping)
            : !isEmpty(dataMapStore.newEdgeType.value_mapping)) && (
            <div
              className="import-tasks-manipulation"
              style={{ marginTop: 16 }}
              onClick={() => {
                isEdit
                  ? dataMapStore.addEdgeValueMapping('edit')
                  : dataMapStore.addEdgeValueMapping('new');
              }}
            >
              {t('data-configs.type.edge.advance.map-property-value.add-value')}
            </div>
          )}

        {!isCheck && (
          <TypeConfigManipulations
            type="edge"
            status={isEdit ? 'edit' : 'add'}
            onCreate={() => {
              dataMapStore.switchEditTypeConfig(false);

              isEdit
                ? dataMapStore.updateEdgeMap(
                    'upgrade',
                    dataMapStore.selectedFileId
                  )
                : dataMapStore.updateEdgeMap(
                    'add',
                    dataMapStore.selectedFileId
                  );

              onCancelCreateEdge();
              dataMapStore.resetNewMap('edge');
            }}
            onCancel={() => {
              dataMapStore.switchEditTypeConfig(false);

              if (!isEdit) {
                dataMapStore.resetNewMap('edge');
              } else {
                dataMapStore.resetEditMapping('edge');
              }

              onCancelCreateEdge();
              dataMapStore.resetNewMap('edge');
            }}
          />
        )}
      </div>
    );
  }
);

export default EdgeMap;
