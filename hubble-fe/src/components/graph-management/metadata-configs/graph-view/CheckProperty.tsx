import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';
import { observer } from 'mobx-react';
import { Drawer, Table, Message } from '@baidu/one-ui';
import TooltipTrigger from 'react-popper-tooltip';

import MetadataConfigsRootStore from '../../../../stores/GraphManagementStore/metadataConfigsStore/metadataConfigsStore';

const CheckProperty: React.FC = observer(() => {
  const { metadataPropertyStore, graphViewStore } = useContext(
    MetadataConfigsRootStore
  );
  const [popIndex, setPopIndex] = useState<number | null>(null);
  const deleteWrapperRef = useRef<HTMLDivElement>(null);

  const handleOutSideClick = useCallback(
    (e: MouseEvent) => {
      const drawerWrapper = document.querySelector(
        '.new-fc-one-drawer-content-wrapper'
      );
      const buttonWrapper = document.querySelector(
        '#metadata-graph-button-check-property'
      );

      if (
        graphViewStore.currentDrawer === 'check-property' &&
        // avoid drawer name reset when click button before drawer pop out
        buttonWrapper &&
        !buttonWrapper.contains(e.target as Element) &&
        drawerWrapper &&
        !drawerWrapper.contains(e.target as Element)
      ) {
        graphViewStore.setCurrentDrawer('');
      }

      if (
        popIndex !== null &&
        deleteWrapperRef &&
        deleteWrapperRef.current &&
        !deleteWrapperRef.current.contains(e.target as Element)
      ) {
        setPopIndex(null);
      }
    },
    [graphViewStore, popIndex]
  );

  const handleCloseDrawer = () => {
    graphViewStore.setCurrentDrawer('');
  };

  useEffect(() => {
    document.addEventListener('click', handleOutSideClick, false);

    return () => {
      document.removeEventListener('click', handleOutSideClick, false);
    };
  }, [handleOutSideClick]);

  const columnConfigs = [
    {
      title: '属性名称',
      dataIndex: 'name'
    },
    {
      title: '数据类型',
      dataIndex: 'data_type'
    },
    {
      title: '基数',
      dataIndex: 'cardinality'
    },
    {
      title: '操作',
      render(_: any, records: any, index: number) {
        return (
          <TooltipTrigger
            tooltipShown={index === popIndex}
            placement="bottom"
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
                  className: 'metadata-graph-tooltips',
                  style: { zIndex: 1041 }
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
                  {metadataPropertyStore.metadataPropertyUsingStatus &&
                  metadataPropertyStore.metadataPropertyUsingStatus[
                    records.name
                  ] ? (
                    <p style={{ width: 200 }}>
                      当前属性数据正在使用中，不可删除。
                    </p>
                  ) : (
                    <>
                      <p>确认删除此属性？</p>
                      <p>删除后无法恢复，请谨慎操作。</p>
                      <div
                        style={{
                          display: 'flex',
                          marginTop: 12,
                          color: '#2b65ff',
                          cursor: 'pointer'
                        }}
                      >
                        <div
                          style={{ marginRight: 16, cursor: 'pointer' }}
                          onClick={async () => {
                            setPopIndex(null);
                            await metadataPropertyStore.deleteMetadataProperty([
                              index
                            ]);
                            if (
                              metadataPropertyStore.requestStatus
                                .deleteMetadataProperty === 'success'
                            ) {
                              Message.success({
                                content: '已删除未使用项',
                                size: 'medium',
                                showCloseIcon: false
                              });
                              metadataPropertyStore.fetchMetadataPropertyList();
                            }
                            if (
                              metadataPropertyStore.requestStatus
                                .deleteMetadataProperty === 'failed'
                            ) {
                              Message.error({
                                content: metadataPropertyStore.errorMessage,
                                size: 'medium',
                                showCloseIcon: false
                              });
                            }
                          }}
                        >
                          确认
                        </div>
                        <div
                          onClick={() => {
                            setPopIndex(null);
                          }}
                        >
                          取消
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          >
            {({ getTriggerProps, triggerRef }) => (
              <span
                {...getTriggerProps({
                  ref: triggerRef,
                  className: 'metadata-graph-property-manipulation',
                  async onClick() {
                    await metadataPropertyStore.checkIfUsing([index]);
                    if (
                      metadataPropertyStore.requestStatus.checkIfUsing ===
                      'success'
                    ) {
                      setPopIndex(index);
                    }
                  }
                })}
              >
                删除
              </span>
            )}
          </TooltipTrigger>
        );
      }
    }
  ];

  return (
    <Drawer
      title="查看属性"
      width={634}
      destroyOnClose
      mask={false}
      visible={graphViewStore.currentDrawer === 'check-property'}
      onClose={handleCloseDrawer}
      footer={[]}
    >
      <div className="metadata-configs-drawer">
        <Table
          columns={columnConfigs}
          dataSource={metadataPropertyStore.metadataProperties}
          pagination={false}
        />
      </div>
    </Drawer>
  );
});

export default CheckProperty;
