import React, { useContext, useState } from 'react';
import { toJS } from 'mobx';
import { observer } from 'mobx-react';
import { isUndefined, isEmpty, size, cloneDeep } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { Input, Select, Checkbox } from '@baidu/one-ui';

import { DataImportRootStoreContext } from '../../../../../stores';
import TypeConfigManipulations from './TypeConfigManipulations';

import ArrowIcon from '../../../../../assets/imgs/ic_arrow_16.svg';
import BlueArrowIcon from '../../../../../assets/imgs/ic_arrow_blue.svg';
import CloseIcon from '../../../../../assets/imgs/ic_close_16.svg';
import MapIcon from '../../../../../assets/imgs/ic_yingshe_16.svg';

export interface VertexMapProps {
  checkOrEdit: 'check' | 'edit' | boolean;
  onCancelCreateVertex: () => void;
  vertexMapIndex?: number;
  label?: string;
}

const VertexMap: React.FC<VertexMapProps> = observer(
  ({ checkOrEdit, onCancelCreateVertex, label, vertexMapIndex }) => {
    const dataImportRootStore = useContext(DataImportRootStoreContext);
    const { dataMapStore } = dataImportRootStore;
    const [isAddMapping, switchAddMapping] = useState(false);
    // const [extraNullValues, setExtraNullValues] = useState<string[]>([]);
    const { t } = useTranslation();

    const isCheck = checkOrEdit === 'check';
    const isEdit = checkOrEdit === 'edit';

    const selectedVertex = dataImportRootStore.vertexTypes.find(
      ({ name }) =>
        name ===
        (checkOrEdit !== false
          ? dataMapStore.editedVertexMap!.label
          : dataMapStore.newVertexType.label)
    );

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
        ? dataMapStore.editedVertexMap!.null_values.customized.includes('')
        : dataMapStore.newVertexType.null_values.customized.includes('')
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
            <span>{t('data-configs.type.vertex.title')}</span>
            <img
              src={CloseIcon}
              alt="collpaseOrExpand"
              onClick={onCancelCreateVertex}
            />
          </div>
        )}
        <div className="import-tasks-data-options">
          <span className="import-tasks-data-options-title in-card">
            {t('data-configs.type.vertex.type')}:
          </span>
          {isCheck ? (
            <span>{dataMapStore.editedVertexMap!.label}</span>
          ) : (
            <Select
              width={420}
              size="medium"
              value={
                isEdit
                  ? dataMapStore.editedVertexMap!.label
                  : dataMapStore.newVertexType.label
              }
              onChange={(value: string) => {
                if (isEdit) {
                  dataMapStore.editVertexMapConfig(
                    'label',
                    value,
                    vertexMapIndex!
                  );

                  // reset field mapping values since it binds with label
                  dataMapStore.editedVertexMap?.field_mapping.forEach(
                    ({ column_name }, fieldIndex) => {
                      dataMapStore.setVertexFieldMapping(
                        'edit',
                        '',
                        fieldIndex
                      );
                    }
                  );
                } else {
                  dataMapStore.setNewVertexConfig('label', value);

                  dataMapStore.newVertexType.field_mapping.forEach(
                    ({ column_name }, fieldIndex) => {
                      dataMapStore.setVertexFieldMapping('new', '', fieldIndex);
                    }
                  );
                }
              }}
            >
              {dataImportRootStore.vertexTypes.map(({ name }) => (
                <Select.Option value={name} key={name}>
                  {name}
                </Select.Option>
              ))}
            </Select>
          )}
        </div>
        {!isUndefined(selectedVertex) && (
          <div className="import-tasks-data-options">
            <span className="import-tasks-data-options-title in-card">
              {t('data-configs.type.vertex.ID-strategy')}:
            </span>
            <span>
              {t(`data-configs.type.ID-strategy.${selectedVertex.id_strategy}`)}
              {selectedVertex.id_strategy === 'PRIMARY_KEY' &&
                `-${selectedVertex.primary_keys.join('，')}`}
            </span>
          </div>
        )}
        {selectedVertex?.id_strategy !== 'PRIMARY_KEY' ? (
          <div className="import-tasks-data-options">
            <span className="import-tasks-data-options-title in-card">
              {t('data-configs.type.vertex.ID-column')}:
            </span>
            {isCheck ? (
              <span>{dataMapStore.editedVertexMap!.id_fields[0]}</span>
            ) : (
              <Select
                width={420}
                size="medium"
                value={
                  isEdit
                    ? dataMapStore.editedVertexMap!.id_fields[0]
                    : dataMapStore.newVertexType.id_fields[0]
                }
                onChange={(value: string) => {
                  if (isEdit) {
                    dataMapStore.editVertexMapConfig(
                      'id_fields',
                      [value],
                      vertexMapIndex!
                    );

                    // remove selected field mappings after reselect column name
                    if (
                      !isUndefined(
                        dataMapStore.editedVertexMap?.field_mapping.find(
                          ({ column_name }) => column_name === value
                        )
                      )
                    ) {
                      dataMapStore.removeVertexFieldMapping('edit', value);
                    }
                  } else {
                    dataMapStore.setNewVertexConfig('id_fields', [value]);

                    if (
                      !isUndefined(
                        dataMapStore.newVertexType.field_mapping.find(
                          ({ column_name }) => column_name === value
                        )
                      )
                    ) {
                      dataMapStore.removeVertexFieldMapping('new', value);
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
                {t('data-configs.type.vertex.ID-column-1')}:
              </span>
              {isCheck ? (
                <span>{dataMapStore.editedVertexMap!.id_fields[0]}</span>
              ) : (
                <Select
                  width={420}
                  size="medium"
                  value={
                    isEdit
                      ? dataMapStore.editedVertexMap!.id_fields[0]
                      : dataMapStore.newVertexType.id_fields[0]
                  }
                  onChange={(value: string) => {
                    const otherColumnValue = isEdit
                      ? dataMapStore.editedVertexMap!.id_fields[1]
                      : dataMapStore.newVertexType.id_fields[1];

                    isEdit
                      ? dataMapStore.editVertexMapConfig(
                          'id_fields',
                          [value, otherColumnValue],
                          vertexMapIndex!
                        )
                      : dataMapStore.setNewVertexConfig('id_fields', [
                          value,
                          otherColumnValue
                        ]);
                  }}
                >
                  {dataMapStore
                    .selectedFileInfo!.file_setting.column_names.filter(
                      (name) =>
                        isEdit
                          ? !dataMapStore.editedVertexMap!.id_fields.includes(
                              name
                            )
                          : !dataMapStore.newVertexType!.id_fields.includes(
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
                {t('data-configs.type.vertex.ID-column-2')}:
              </span>
              {isCheck ? (
                <span>{dataMapStore.editedVertexMap!.id_fields[1]}</span>
              ) : (
                <Select
                  width={420}
                  size="medium"
                  value={
                    isEdit
                      ? dataMapStore.editedVertexMap!.id_fields[1]
                      : dataMapStore.newVertexType.id_fields[1]
                  }
                  onChange={(value: string) => {
                    const otherColumnValue = isEdit
                      ? dataMapStore.editedVertexMap!.id_fields[0]
                      : dataMapStore.newVertexType!.id_fields[0];

                    isEdit
                      ? dataMapStore.editVertexMapConfig(
                          'id_fields',
                          [otherColumnValue, value],
                          vertexMapIndex!
                        )
                      : dataMapStore.setNewVertexConfig('id_fields', [
                          otherColumnValue,
                          value
                        ]);
                  }}
                >
                  {dataMapStore
                    .selectedFileInfo!.file_setting.column_names.filter(
                      (name) =>
                        isEdit
                          ? !dataMapStore.editedVertexMap!.id_fields.includes(
                              name
                            )
                          : !dataMapStore.newVertexType!.id_fields.includes(
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
            {t('data-configs.type.vertex.map-settings')}:
          </span>
          <div className="import-tasks-data-options-expand-table">
            {((Boolean(checkOrEdit) === false &&
              !isEmpty(dataMapStore.newVertexType.field_mapping)) ||
              (Boolean(checkOrEdit) !== false &&
                !isEmpty(dataMapStore.editedVertexMap!.field_mapping))) && (
              <div className="import-tasks-data-options-expand-table-row">
                <div className="import-tasks-data-options-expand-table-column">
                  {t('data-configs.type.vertex.add-map.name')}
                </div>
                <div className="import-tasks-data-options-expand-table-column">
                  {t('data-configs.type.vertex.add-map.sample')}
                </div>
                <div className="import-tasks-data-options-expand-table-column">
                  {t('data-configs.type.vertex.add-map.property')}
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
                          ? dataMapStore.toggleVertexSelectAllFieldMapping(
                              'edit',
                              false
                            )
                          : dataMapStore.toggleVertexSelectAllFieldMapping(
                              'new',
                              false
                            );
                      }}
                    >
                      {t('data-configs.type.vertex.add-map.clear')}
                    </span>
                  )}
                </div>
              </div>
            )}
            {Boolean(checkOrEdit) === false
              ? dataMapStore.newVertexType.field_mapping.map(
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
                              dataMapStore.setVertexFieldMapping(
                                'new',
                                value,
                                fieldIndex
                              );
                            }}
                          >
                            {selectedVertex?.properties.map(({ name }) => (
                              <Select.Option value={name} key={name}>
                                {name}
                              </Select.Option>
                            ))}
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
                                dataMapStore.removeVertexFieldMapping(
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
              : dataMapStore.editedVertexMap?.field_mapping.map(
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
                                dataMapStore.setVertexFieldMapping(
                                  'edit',
                                  value,
                                  fieldIndex
                                );
                              }}
                            >
                              {selectedVertex?.properties.map(({ name }) => (
                                <Select.Option value={name} key={name}>
                                  {name}
                                </Select.Option>
                              ))}
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
                                dataMapStore.removeVertexFieldMapping(
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
                    {t('data-configs.type.vertex.add-map.title')}
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
                                  dataMapStore.editedVertexMap?.field_mapping
                                )
                              : !isEmpty(
                                  dataMapStore.newVertexType.field_mapping
                                )
                          }
                          indeterminate={
                            isEdit
                              ? !isEmpty(
                                  dataMapStore.editedVertexMap?.field_mapping
                                ) &&
                                size(
                                  dataMapStore.editedVertexMap?.field_mapping
                                ) !==
                                  size(
                                    dataMapStore.filteredColumnNamesInEditSelection
                                  )
                              : !isEmpty(
                                  dataMapStore.newVertexType.field_mapping
                                ) &&
                                size(
                                  dataMapStore.newVertexType.field_mapping
                                ) !==
                                  size(
                                    dataMapStore.filteredColumnNamesInNewSelection
                                  )
                          }
                          onChange={(e: any) => {
                            if (isEdit) {
                              const isIndeterminate =
                                !isEmpty(
                                  dataMapStore.editedVertexMap?.field_mapping
                                ) &&
                                size(
                                  dataMapStore.editedVertexMap?.field_mapping
                                ) !==
                                  size(
                                    dataMapStore.filteredColumnNamesInEditSelection
                                  );

                              dataMapStore.toggleVertexSelectAllFieldMapping(
                                'edit',
                                // if isIndeterminate is true, e.target.checked is false
                                isIndeterminate || e.target.checked
                              );
                            } else {
                              const isIndeterminate =
                                !isEmpty(
                                  dataMapStore.newVertexType.field_mapping
                                ) &&
                                size(
                                  dataMapStore.newVertexType.field_mapping
                                ) !==
                                  size(
                                    dataMapStore.filteredColumnNamesInNewSelection
                                  );

                              dataMapStore.toggleVertexSelectAllFieldMapping(
                                'new',
                                isIndeterminate || e.target.checked
                              );
                            }
                          }}
                        >
                          {t('data-configs.type.vertex.select-all')}
                        </Checkbox>
                      </span>
                    </div>
                    {isEdit
                      ? ''
                      : dataMapStore.selectedFileInfo?.file_setting.column_names
                          .filter(
                            (name) =>
                              !dataMapStore.newVertexType.id_fields.includes(
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
                                        dataMapStore.newVertexType.field_mapping.find(
                                          ({ column_name }) =>
                                            column_name === name
                                        )
                                      )
                                    }
                                    onChange={(e: any) => {
                                      if (e.target.checked) {
                                        isEdit
                                          ? dataMapStore.setVertexFieldMappingKey(
                                              'edit',
                                              name
                                            )
                                          : dataMapStore.setVertexFieldMappingKey(
                                              'new',
                                              name
                                            );
                                      } else {
                                        isEdit
                                          ? dataMapStore.removeVertexFieldMapping(
                                              'edit',
                                              name
                                            )
                                          : dataMapStore.removeVertexFieldMapping(
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
          <span>{t('data-configs.type.vertex.advance.title')}</span>
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
            {t('data-configs.type.vertex.advance.nullable-list.title')}:
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
                          'vertex',
                          checkedList
                        )
                      : dataMapStore.editCheckedNullValues(
                          'new',
                          'vertex',
                          checkedList
                        );
                  }}
                  value={
                    isEdit
                      ? dataMapStore.editedVertexMap!.null_values.checked
                      : dataMapStore.newVertexType.null_values.checked
                  }
                >
                  <Checkbox value="NULL">Nullable</Checkbox>
                  <Checkbox value={''}>
                    {t('data-configs.type.vertex.advance.nullable-list.empty')}
                  </Checkbox>
                </Checkbox.Group>
                <div style={{ marginLeft: 20 }}>
                  <Checkbox
                    value={t(
                      'data-configs.type.vertex.advance.nullable-list.custom'
                    )}
                    onChange={(flag: boolean) => {
                      dataMapStore.toggleCustomNullValue(
                        isEdit ? 'edit' : 'new',
                        'vertex',
                        flag
                      );
                    }}
                  >
                    {t('data-configs.type.vertex.advance.nullable-list.custom')}
                  </Checkbox>
                </div>
              </div>
              <div
                className="import-tasks-data-options-expand-values"
                style={{ marginLeft: 12 }}
              >
                {isEdit ? (
                  <>
                    {dataMapStore.editedVertexMap?.null_values.customized.map(
                      (nullValue, nullValueIndex) => (
                        <div className="import-tasks-data-options-expand-input">
                          <Input
                            size="medium"
                            width={122}
                            countMode="en"
                            placeholder={t(
                              'data-configs.type.vertex.advance.placeholder.input'
                            )}
                            value={nullValue}
                            onChange={(e: any) => {
                              dataMapStore.editCustomNullValues(
                                'edit',
                                'vertex',
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
                      dataMapStore.editedVertexMap?.null_values.customized
                    ) && (
                      <div style={{ marginTop: 8 }}>
                        <span
                          className={addNullValueClassName}
                          onClick={() => {
                            const extraNullValues =
                              dataMapStore.editedVertexMap?.null_values
                                .customized;

                            if (!extraNullValues?.includes('')) {
                              dataMapStore.addCustomNullValues(
                                'edit',
                                'vertex'
                              );
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
                    {dataMapStore.newVertexType.null_values.customized.map(
                      (nullValue, nullValueIndex) => (
                        <div className="import-tasks-data-options-expand-input">
                          <Input
                            size="medium"
                            width={122}
                            countMode="en"
                            placeholder={t(
                              'data-configs.type.vertex.advance.placeholder.input'
                            )}
                            value={nullValue}
                            onChange={(e: any) => {
                              dataMapStore.editCustomNullValues(
                                'new',
                                'vertex',
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
                      dataMapStore.newVertexType.null_values.customized
                    ) && (
                      <div style={{ marginTop: 8 }}>
                        <span
                          className={addNullValueClassName}
                          onClick={() => {
                            const extraNullValues =
                              dataMapStore.newVertexType?.null_values
                                .customized;

                            if (!extraNullValues.includes('')) {
                              dataMapStore.addCustomNullValues('new', 'vertex');
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
            {t('data-configs.type.vertex.advance.map-property-value.title')}:
          </span>
          {!isCheck &&
            (isEdit
              ? isEmpty(dataMapStore.editedVertexMap?.value_mapping)
              : isEmpty(dataMapStore.newVertexType.value_mapping)) && (
              <div
                className="import-tasks-manipulation"
                style={{ lineHeight: '32px' }}
                onClick={() => {
                  isEdit
                    ? dataMapStore.addVertexValueMapping('edit')
                    : dataMapStore.addVertexValueMapping('new');
                }}
              >
                {t(
                  'data-configs.type.vertex.advance.map-property-value.add-value'
                )}
              </div>
            )}

          {isCheck && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {dataMapStore.editedVertexMap?.value_mapping.map(
                ({ column_name, values }, index) => (
                  <div className="import-tasks-data-options-expand-values">
                    <div className="import-tasks-data-options-expand-info">
                      <span>
                        {t(
                          'data-configs.type.vertex.advance.map-property-value.fields.property'
                        )}
                        {index + 1}:
                      </span>
                      <span>{column_name}</span>
                    </div>
                    {values.map(({ column_value, mapped_value }) => (
                      <div className="import-tasks-data-options-expand-info">
                        <span>
                          {t(
                            'data-configs.type.vertex.advance.map-property-value.fields.value-map'
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
            ? dataMapStore.newVertexType.value_mapping.map(
                ({ column_name, values }, valueMapIndex) => (
                  <div className="import-tasks-data-options-value-maps">
                    <div className="import-tasks-data-options">
                      <span
                        className="import-tasks-data-options-title in-card"
                        style={{ marginRight: 24 }}
                      >
                        {t(
                          'data-configs.type.vertex.advance.map-property-value.fields.property'
                        )}
                        {valueMapIndex + 1}:
                      </span>
                      <Select
                        width={420}
                        size="medium"
                        value={column_name}
                        onChange={(value: string) => {
                          dataMapStore.editVertexValueMappingColumnName(
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
                          dataMapStore.removeVertexValueMapping(
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
                          'data-configs.type.vertex.advance.map-property-value.fields.value-map'
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
                                  dataMapStore.editVertexValueMappingColumnValueName(
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
                                  dataMapStore.editVertexValueMappingColumnValueName(
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
                                    dataMapStore.removeVertexValueMappingValue(
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
                                dataMapStore.addVertexValueMappingValue(
                                  'new',
                                  valueMapIndex
                                );
                              }}
                            >
                              {t(
                                'data-configs.type.vertex.advance.map-property-value.fields.add-value-map'
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )
            : dataMapStore.editedVertexMap?.value_mapping.map(
                ({ column_name, values }, valueMapIndex) => (
                  <div className="import-tasks-data-options-value-maps">
                    <div className="import-tasks-data-options">
                      <span
                        className="import-tasks-data-options-title in-card"
                        style={{ marginRight: 24 }}
                      >
                        {t(
                          'data-configs.type.vertex.advance.map-property-value.fields.property'
                        )}
                        {valueMapIndex + 1}:
                      </span>
                      <Select
                        width={420}
                        size="medium"
                        value={column_name}
                        onChange={(value: string) => {
                          dataMapStore.editVertexValueMappingColumnName(
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
                          dataMapStore.removeVertexValueMapping(
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
                          'data-configs.type.vertex.advance.map-property-value.fields.value-map'
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
                                  dataMapStore.editVertexValueMappingColumnValueName(
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
                                  dataMapStore.editVertexValueMappingColumnValueName(
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
                                    dataMapStore.removeVertexValueMappingValue(
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
                                dataMapStore.addVertexValueMappingValue(
                                  'edit',
                                  valueMapIndex
                                );
                              }}
                            >
                              {t(
                                'data-configs.type.vertex.advance.map-property-value.fields.add-value-map'
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
            ? !isEmpty(dataMapStore.editedVertexMap?.value_mapping)
            : !isEmpty(dataMapStore.newVertexType.value_mapping)) && (
            <div
              className="import-tasks-manipulation"
              style={{ marginTop: 16 }}
              onClick={() => {
                isEdit
                  ? dataMapStore.addVertexValueMapping('edit')
                  : dataMapStore.addVertexValueMapping('new');
              }}
            >
              {t(
                'data-configs.type.vertex.advance.map-property-value.add-value'
              )}
            </div>
          )}

        {!isCheck && (
          <TypeConfigManipulations
            type="vertex"
            status={isEdit ? 'edit' : 'add'}
            onCreate={() => {
              dataMapStore.switchEditTypeConfig(false);

              isEdit
                ? dataMapStore.updateVertexMap(
                    'upgrade',
                    dataMapStore.selectedFileId
                  )
                : dataMapStore.updateVertexMap(
                    'add',
                    dataMapStore.selectedFileId
                  );

              onCancelCreateVertex();
              dataMapStore.resetNewMap('vertex');
            }}
            onCancel={() => {
              dataMapStore.switchEditTypeConfig(false);

              if (!isEdit) {
                dataMapStore.resetNewMap('vertex');
              } else {
                dataMapStore.resetEditMapping('vertex');
              }

              onCancelCreateVertex();
              dataMapStore.resetNewMap('vertex');
            }}
          />
        )}
      </div>
    );
  }
);

export default VertexMap;
