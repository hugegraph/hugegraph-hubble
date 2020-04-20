import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import { range, rangeRight } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { Radio, Switch, Input, Select, Button } from '@baidu/one-ui';

import { DataImportRootStoreContext } from '../../../../../stores';

import ArrowIcon from '../../../../../assets/imgs/ic_arrow_16.svg';

const separators = [',', ';', '\\t', ' '];
const charsets = ['UTF-8', 'GBK', 'ISO-8859-1', 'US-ASCII'];
const dateFormat = [
  'yyyy-MM-dd',
  'yyyy-MM-dd HH:mm:ss',
  'yyyy-MM-dd HH:mm:ss.SSS'
];

const timezones = rangeRight(1, 13)
  .map((num) => `GMT-${num}`)
  .concat(['GMT'])
  .concat(range(1, 13).map((num) => `GMT+${num}`));

const FileConfigs: React.FC = observer(() => {
  const [isExpand, switchExpand] = useState(true);
  const { dataMapStore } = useContext(DataImportRootStoreContext);
  const { t } = useTranslation();

  const expandClassName = classnames({
    'import-tasks-step-content-header-expand': isExpand,
    'import-tasks-step-content-header-collpase': !isExpand
  });

  const handleExpand = () => {
    switchExpand(!isExpand);
  };

  return (
    <div className="import-tasks-data-map">
      <div className="import-tasks-step-content-header">
        <span>{t('data-configs.file.title')}</span>
        <img
          src={ArrowIcon}
          alt="collpaseOrExpand"
          className={expandClassName}
          onClick={handleExpand}
        />
      </div>
      {isExpand && (
        <>
          <div className="import-tasks-data-options">
            <span className="import-tasks-data-options-title">
              {t('data-configs.file.include-header')}:
            </span>
            <Switch
              size="large"
              checked={dataMapStore.selectedFileInfo!.file_setting.has_header}
              onChange={(checked: boolean) => {
                dataMapStore.setFileConfig('has_header', checked);
              }}
            />
          </div>
          <div className="import-tasks-data-options">
            <span className="import-tasks-data-options-title">
              {t('data-configs.file.separator.title')}:
            </span>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Radio.Group
                value={
                  separators.includes(
                    dataMapStore.selectedFileInfo!.file_setting.delimiter
                  )
                    ? dataMapStore.selectedFileInfo!.file_setting.delimiter
                    : 'custom'
                }
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  if (e.target.value === 'custom') {
                    dataMapStore.setFileConfig('delimiter', '');
                  } else {
                    dataMapStore.setFileConfig('delimiter', e.target.value);
                  }
                }}
              >
                <Radio value=",">
                  {t('data-configs.file.separator.comma')}
                </Radio>
                <Radio value=";">
                  {t('data-configs.file.separator.semicolon')}
                </Radio>
                <Radio value="\t">{t('data-configs.file.separator.tab')}</Radio>
                <Radio value=" ">
                  {t('data-configs.file.separator.space')}
                </Radio>
                <Radio value="custom">
                  {t('data-configs.file.separator.custom')}
                </Radio>
              </Radio.Group>
            </div>
            {!separators.includes(
              dataMapStore.selectedFileInfo!.file_setting.delimiter
            ) && (
              <div style={{ marginLeft: 8 }}>
                <Input
                  size="medium"
                  width={110}
                  countMode="en"
                  placeholder={t(
                    'data-configs.file.placeholder.input-separator'
                  )}
                  value={dataMapStore.selectedFileInfo!.file_setting.delimiter}
                  onChange={(e: any) => {
                    dataMapStore.setFileConfig('delimiter', e.value);
                  }}
                  errorLocation="bottom"
                />
              </div>
            )}
          </div>
          <div className="import-tasks-data-options">
            <span className="import-tasks-data-options-title">
              {t('data-configs.file.code-type.title')}:
            </span>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Radio.Group
                value={
                  charsets.includes(
                    dataMapStore.selectedFileInfo!.file_setting.charset
                  )
                    ? dataMapStore.selectedFileInfo!.file_setting.charset
                    : 'custom'
                }
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  if (e.target.value === 'custom') {
                    dataMapStore.setFileConfig('charset', '');
                  } else {
                    dataMapStore.setFileConfig('charset', e.target.value);
                  }
                }}
              >
                <Radio value="UTF-8">
                  {t('data-configs.file.code-type.UTF-8')}
                </Radio>
                <Radio value="GBK">
                  {t('data-configs.file.code-type.GBK')}
                </Radio>
                <Radio value="ISO-8859-1">
                  {t('data-configs.file.code-type.ISO-8859-1')}
                </Radio>
                <Radio value="US-ASCII">
                  {t('data-configs.file.code-type.US-ASCII')}
                </Radio>
                <Radio value="custom">
                  {t('data-configs.file.code-type.custom')}
                </Radio>
              </Radio.Group>
            </div>
            {!charsets.includes(
              dataMapStore.selectedFileInfo!.file_setting.charset
            ) && (
              <div style={{ marginLeft: 8 }}>
                <Input
                  size="medium"
                  width={122}
                  countMode="en"
                  placeholder={t('data-configs.file.placeholder.input-charset')}
                  value={dataMapStore.selectedFileInfo!.file_setting.charset}
                  onChange={(e: any) => {
                    dataMapStore.setFileConfig('charset', e.value);
                  }}
                  errorLocation="bottom"
                />
              </div>
            )}
          </div>
          <div className="import-tasks-data-options">
            <span className="import-tasks-data-options-title">
              {t('data-configs.file.date-type.title')}:
            </span>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Radio.Group
                value={
                  dateFormat.includes(
                    dataMapStore.selectedFileInfo!.file_setting.date_format
                  )
                    ? dataMapStore.selectedFileInfo!.file_setting.date_format
                    : 'custom'
                }
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  if (e.target.value === 'custom') {
                    dataMapStore.setFileConfig('date_format', '');
                  } else {
                    dataMapStore.setFileConfig('date_format', e.target.value);
                  }
                }}
              >
                <Radio value="yyyy-MM-dd">YYYY-MM-DD</Radio>
                <Radio value="yyyy-MM-dd HH:mm:ss">YYYY-MM-DD HH:MM:SS</Radio>
                <Radio value="yyyy-MM-dd HH:mm:ss.SSS">
                  YYYY-MM-DD HH:MM:SS.SSS
                </Radio>
                <Radio value="custom">
                  {t('data-configs.file.code-type.custom')}
                </Radio>
              </Radio.Group>
              {!dateFormat.includes(
                dataMapStore.selectedFileInfo!.file_setting.date_format
              ) && (
                <div style={{ marginLeft: 8 }}>
                  <Input
                    size="medium"
                    width={122}
                    countMode="en"
                    placeholder={t(
                      'data-configs.file.placeholder.input-date-format'
                    )}
                    value={
                      dataMapStore.selectedFileInfo!.file_setting.date_format
                    }
                    onChange={(e: any) => {
                      dataMapStore.setFileConfig('date_format', e.value);
                    }}
                    errorLocation="bottom"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="import-tasks-data-options">
            <span className="import-tasks-data-options-title">
              {t('data-configs.file.ignore-line')}:
            </span>
            <Input
              size="medium"
              width={356}
              maxLen={48}
              countMode="en"
              placeholder=""
              value={dataMapStore.selectedFileInfo!.file_setting.skipped_line}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                dataMapStore.setFileConfig('skipped_line', e.target.value);
              }}
              errorLocation="bottom"
            />
          </div>
          <div className="import-tasks-data-options">
            <span className="import-tasks-data-options-title">
              {t('data-configs.file.timezone')}:
            </span>
            <Select
              width={140}
              size="medium"
              value={dataMapStore.selectedFileInfo!.file_setting.time_zone}
              onChange={(value: string) => {
                dataMapStore.setFileConfig('time_zone', value);
              }}
            >
              {timezones.map((timezone) => (
                <Select.Option value={timezone} key={timezone}>
                  {timezone}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="import-tasks-data-options">
            <span className="import-tasks-data-options-title"></span>
            <Button
              type="primary"
              size="medium"
              onClick={() => {
                dataMapStore.updateFileConfig(dataMapStore.selectedFileId);
              }}
            >
              {t('data-configs.file.save')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
});

export default FileConfigs;
