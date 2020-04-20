import React, { useContext, useState } from 'react';
import { toJS } from 'mobx';
import { observer } from 'mobx-react';
import { isEmpty } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { Button } from '@baidu/one-ui';

import { DataImportRootStoreContext } from '../../../../../stores';

import TypeInfo from './TypeInfo';
import VertexMap from './VertexMap';
import EdgeMap from './EdgeMap';

import ArrowIcon from '../../../../../assets/imgs/ic_arrow_16.svg';
import CloseIcon from '../../../../../assets/imgs/ic_close_16.svg';
import MapIcon from '../../../../../assets/imgs/ic_yingshe_16.svg';

const TypeConfigs: React.FC = observer(() => {
  const dataImportRootStore = useContext(DataImportRootStoreContext);
  const { dataMapStore } = dataImportRootStore;
  const [isExpand, switchExpand] = useState(true);
  const [isCreateVertexMap, switchCreateVertexMap] = useState(false);
  const [isCreateEdgeMap, switchCreateEdgeMap] = useState(false);
  const { t } = useTranslation();

  const shouldRevealInitalButtons =
    !isCreateVertexMap &&
    !isCreateEdgeMap &&
    isEmpty(dataMapStore.selectedFileInfo?.vertex_mappings) &&
    isEmpty(dataMapStore.selectedFileInfo?.edge_mappings);

  const expandClassName = classnames({
    'import-tasks-step-content-header-expand': isExpand,
    'import-tasks-step-content-header-collpase': !isExpand
  });

  const handleExpand = () => {
    switchExpand(!isExpand);
  };

  const handleCreate = (type: 'vertex' | 'edge', flag: boolean) => () => {
    if (shouldRevealInitalButtons) {
      dataMapStore.switchExpand('file', false);
    }

    if (type === 'vertex') {
      switchCreateVertexMap(flag);
    } else {
      switchCreateEdgeMap(flag);
    }
  };

  return (
    <div className="import-tasks-data-map" style={{ marginBottom: 16 }}>
      <div className="import-tasks-step-content-header">
        <span style={{ lineHeight: '32px' }}>
          {t('data-configs.type.title')}
        </span>
        <img
          src={ArrowIcon}
          alt="collpaseOrExpand"
          className={expandClassName}
          onClick={handleExpand}
        />
        {!shouldRevealInitalButtons && (
          <TypeConfigMapCreations
            onCreateVertex={handleCreate('vertex', true)}
            onCreateEdge={handleCreate('edge', true)}
            disabled={isCreateVertexMap || isCreateEdgeMap}
          />
        )}
      </div>
      {shouldRevealInitalButtons && (
        <TypeConfigMapCreations
          onCreateVertex={handleCreate('vertex', true)}
          onCreateEdge={handleCreate('edge', true)}
        />
      )}
      {isExpand && (
        <>
          {isCreateVertexMap && (
            <VertexMap
              checkOrEdit={false}
              onCancelCreateVertex={handleCreate('vertex', false)}
            />
          )}
          {isCreateEdgeMap && (
            <EdgeMap
              checkOrEdit={false}
              onCancelCreateEdge={handleCreate('edge', false)}
            />
          )}
          {dataMapStore.selectedFileInfo?.vertex_mappings.map((_, index) => (
            <TypeInfo type="vertex" mapIndex={index} />
          ))}
          {dataMapStore.selectedFileInfo?.edge_mappings.map((_, index) => (
            <TypeInfo type="edge" mapIndex={index} />
          ))}
        </>
      )}
      <div className="import-tasks-data-map-manipulations">
        <Button
          size="medium"
          style={{ marginRight: 16 }}
          onClick={() => {
            dataImportRootStore.setCurrentStep(1);
          }}
        >
          {t('data-configs.manipulations.previous')}
        </Button>
        <Button
          type="primary"
          size="medium"
          disabled={
            isEmpty(dataMapStore.selectedFileInfo!.vertex_mappings) &&
            isEmpty(dataMapStore.selectedFileInfo!.edge_mappings)
          }
          onClick={() => {
            dataImportRootStore.setCurrentStep(3);
          }}
        >
          {t('data-configs.manipulations.next')}
        </Button>
      </div>
    </div>
  );
});

interface TypeConfigMapCreationsProps {
  onCreateVertex: () => void;
  onCreateEdge: () => void;
  disabled?: boolean;
}

const TypeConfigMapCreations: React.FC<TypeConfigMapCreationsProps> = observer(
  ({ onCreateVertex, onCreateEdge, disabled = false }) => {
    const { t } = useTranslation();

    return (
      <div className="import-tasks-data-type-manipulations">
        <Button
          size="medium"
          style={{ marginRight: 16 }}
          onClick={onCreateVertex}
          disabled={disabled}
        >
          {t('data-configs.type.manipulation.create-vertex')}
        </Button>
        <Button size="medium" onClick={onCreateEdge} disabled={disabled}>
          {t('data-configs.type.manipulation.create-edge')}
        </Button>
      </div>
    );
  }
);

export default TypeConfigs;
