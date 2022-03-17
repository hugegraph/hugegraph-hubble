import React from 'react';
import { observer } from 'mobx-react';

import LoadingBackIcon from '../../../../assets/imgs/ic_loading_back.svg';
import LoadingFrontIcon from '../../../../assets/imgs/ic_loading_front.svg';

import i18next from '../../../../i18n';
export interface LoadingDataViewProps {
  isLoading: boolean;
  emptyText?: string;
}

const LoadingDataView: React.FC<LoadingDataViewProps> = observer(
  ({ isLoading, emptyText }) =>
    isLoading ? (
      <div className="metadata-configs-content-loading-wrapper">
        <div className="metadata-configs-content-loading-bg">
          <img
            className="metadata-configs-content-loading-back"
            src={LoadingBackIcon}
            alt="load background"
          />
          <img
            className="metadata-configs-content-loading-front"
            src={LoadingFrontIcon}
            alt="load spinner"
          />
        </div>
        <span>{i18next.t('addition.message.data-loading')}...</span>
      </div>
    ) : emptyText ? (
      <span>{emptyText}</span>
    ) : null
);

export default LoadingDataView;
