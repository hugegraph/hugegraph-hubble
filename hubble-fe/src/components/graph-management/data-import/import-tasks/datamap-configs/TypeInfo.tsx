import React, {
  useState,
  useRef,
  useContext,
  useCallback,
  useEffect
} from 'react';
import { observer } from 'mobx-react';
// import { useLocation } from 'wouter';
import { range } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import TooltipTrigger from 'react-popper-tooltip';
import classnames from 'classnames';
import { Button } from '@baidu/one-ui';

import { DataImportRootStoreContext } from '../../../../../stores';
import VertexMap from './VertexMap';
import EdgeMap from './EdgeMap';

import ArrowIcon from '../../../../../assets/imgs/ic_arrow_16.svg';

export interface TypeInfoProps {
  type: 'vertex' | 'edge';
  mapIndex: number;
}

const TypeInfo: React.FC<TypeInfoProps> = observer(({ type, mapIndex }) => {
  const dataImportRootStore = useContext(DataImportRootStoreContext);
  const { dataMapStore } = dataImportRootStore;
  const [isExpand, switchExpand] = useState(false);
  const [isDeletePop, switchDeletePop] = useState(false);
  const [checkOrEdit, setCheckOrEdit] = useState<'check' | 'edit' | boolean>(
    false
  );
  const deleteWrapperRef = useRef<HTMLImageElement>(null);
  const { t } = useTranslation();
  const vertexInfo = dataImportRootStore.vertexTypes.find(
    ({ name }) =>
      name === dataMapStore.selectedFileInfo?.vertex_mappings[mapIndex].label
  );

  const handleImgClickExpand = () => {
    switchExpand(!isExpand);

    if (Boolean(checkOrEdit)) {
      if (checkOrEdit === 'edit') {
        dataMapStore.switchEditTypeConfig(false);
      }

      setCheckOrEdit(false);
    } else {
      if (type === 'vertex') {
        dataMapStore.syncEditMap('vertex', mapIndex);
      } else {
        // dataMapStore.syncEditMap('edge', mapIndex)
      }

      setCheckOrEdit('check');
    }
  };

  const handleOutSideClick = useCallback(
    (e: MouseEvent) => {
      if (
        isDeletePop &&
        deleteWrapperRef.current &&
        !deleteWrapperRef.current.contains(e.target as Element)
      ) {
        switchDeletePop(false);
      }
    },
    [isDeletePop]
  );

  const expandClassName = classnames({
    expand: isExpand,
    collpase: !isExpand
  });

  useEffect(() => {
    document.addEventListener('click', handleOutSideClick, false);

    return () => {
      document.removeEventListener('click', handleOutSideClick, false);
    };
  }, [handleOutSideClick]);

  return (
    <div style={{ position: 'relative' }}>
      <div className="import-tasks-data-type-info-wrapper">
        <div
          className="import-tasks-data-type-info"
          style={{ flexDirection: 'row' }}
        >
          <div style={{ marginRight: 16 }}>
            <img
              src={ArrowIcon}
              alt="collpaseOrExpand"
              className={expandClassName}
              onClick={handleImgClickExpand}
            />
          </div>
          <div style={{ flexDirection: 'column' }}>
            <span className="import-tasks-data-type-info-title">
              {t('data-configs.type.info.type')}
            </span>
            <span className="import-tasks-data-type-info-content">
              {type === 'vertex'
                ? t('data-configs.type.vertex.type')
                : t('data-configs.type.edge.type')}
            </span>
          </div>
        </div>
        <div className="import-tasks-data-type-info">
          <span className="import-tasks-data-type-info-title">
            {t('data-configs.type.info.name')}
          </span>
          <span className="import-tasks-data-type-info-content">
            {dataMapStore.selectedFileInfo?.vertex_mappings[mapIndex].label}
          </span>
        </div>
        <div className="import-tasks-data-type-info">
          <span className="import-tasks-data-type-info-title">
            {t('data-configs.type.info.ID-strategy')}
          </span>
          <span className="import-tasks-data-type-info-content">
            {t(`data-configs.type.ID-strategy.${vertexInfo?.id_strategy}`)}-
            {vertexInfo?.properties.map(({ name }) => name).join('，')}
          </span>
        </div>
        <div className="import-tasks-data-type-info">
          <Button
            size="medium"
            style={{ width: 78, marginRight: 12 }}
            disabled={dataMapStore.isExpandTypeConfig}
            onClick={() => {
              switchExpand(true);
              setCheckOrEdit('edit');
              dataMapStore.switchEditTypeConfig(true);

              type === 'vertex'
                ? dataMapStore.syncEditMap('vertex', mapIndex)
                : dataMapStore.syncEditMap('edge', mapIndex);
            }}
          >
            {t('data-configs.manipulations.edit')}
          </Button>
          <TooltipTrigger
            tooltipShown={isDeletePop}
            placement="bottom-start"
            tooltip={({
              arrowRef,
              tooltipRef,
              getArrowProps,
              getTooltipProps,
              placement
            }) => (
              <div
                {...getTooltipProps({
                  ref: tooltipRef,
                  className: 'import-tasks-tooltips',
                  style: {
                    zIndex: 1042
                  }
                })}
              >
                <div
                  {...getArrowProps({
                    ref: arrowRef,
                    className: 'tooltip-arrow',
                    'data-placement': placement
                  })}
                />
                <div ref={deleteWrapperRef}>
                  <p>{t('data-configs.manipulations.hints.delete-confirm')}</p>
                  <p>{t('data-configs.manipulations.hints.delete-warning')}</p>
                  <div
                    style={{
                      display: 'flex',
                      marginTop: 12,
                      color: '#2b65ff',
                      cursor: 'pointer'
                    }}
                  >
                    <Button
                      type="primary"
                      size="medium"
                      style={{ width: 60, marginRight: 12 }}
                    >
                      {t('data-configs.type.info.delete')}
                    </Button>
                    <Button
                      size="medium"
                      style={{ width: 60 }}
                      onClick={() => {
                        switchDeletePop(false);
                      }}
                    >
                      {t('data-configs.manipulations.cancel')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          >
            {({ getTriggerProps, triggerRef }) => (
              <span
                {...getTriggerProps({
                  ref: triggerRef,
                  onClick() {
                    switchDeletePop(true);
                  }
                })}
                key="drawer-close"
              >
                <Button size="medium" style={{ width: 78 }}>
                  {t('data-configs.manipulations.delete')}
                </Button>
              </span>
            )}
          </TooltipTrigger>
        </div>
      </div>
      {isExpand && Boolean(checkOrEdit) && type === 'vertex' && (
        <VertexMap
          checkOrEdit={checkOrEdit}
          onCancelCreateVertex={() => {
            switchExpand(false);
          }}
          vertexMapIndex={mapIndex}
        />
      )}
      {isExpand && Boolean(checkOrEdit) && type === 'edge' && (
        <EdgeMap
          checkOrEdit={checkOrEdit}
          onCancelCreateEdge={() => {
            switchExpand(false);
          }}
          edgeMapIndex={mapIndex}
        />
      )}
    </div>
  );
});

export default TypeInfo;
