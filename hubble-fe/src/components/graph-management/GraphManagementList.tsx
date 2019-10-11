import React, { useContext, useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import {
  Embedded,
  Input,
  Button,
  Dropdown,
  Pagination,
  Modal,
  Message
} from '@baidu/one-ui';
import Highlighter from 'react-highlight-words';
import { GraphManagementStoreContext } from '../../stores';

const dropdownList = [
  {
    label: '编辑',
    value: 'edit'
  },
  {
    label: '删除',
    value: 'delete'
  }
];

const commonInputProps = {
  size: 'medium',
  width: 420
};

const isRequiredInputProps = {
  ...commonInputProps,
  isRequired: true,
  requiredErrorMessage: '必填项'
};

const GraphManagementList: React.FC = observer(() => {
  const graphManagementStore = useContext(GraphManagementStoreContext);
  const [width, setWidth] = useState(0);

  const handlePageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      graphManagementStore.mutatePageNumber(Number(e.target.value));
    },
    [graphManagementStore]
  );

  useEffect(() => {
    const pg = document.querySelector(
      '.new-fc-one-pagination-pager'
    ) as Element;

    if (!!pg) {
      const styles = getComputedStyle(pg);
      const width = styles.width as string;

      setWidth(+width.split('px')[0]);
    }
  }, [
    graphManagementStore.graphDataPageConfig.pageTotal,
    graphManagementStore.graphDataPageConfig.pageNumber
  ]);

  return (
    <>
      {graphManagementStore.graphData.map((data, index) => (
        <GraphManagementListItem {...data} index={index} key={data.id} />
      ))}
      <div style={{ position: 'relative' }}>
        {graphManagementStore.graphDataPageConfig.pageTotal > 1 &&
          (graphManagementStore.showCreateNewGraph ||
            graphManagementStore.selectedEditIndex !== null) && (
            <div
              style={{
                position: 'absolute',
                background: 'rgba(255, 255, 255, 0.5)',
                width,
                height: 33,
                left: `calc(540px - ${width / 2}px)`
              }}
            ></div>
          )}
        <Pagination
          size="medium"
          pageSize={10}
          hideOnSinglePage
          showSizeChange={false}
          showPageJumper={false}
          total={graphManagementStore.graphDataPageConfig.pageTotal}
          pageNo={graphManagementStore.graphDataPageConfig.pageNumber}
          onPageNoChange={handlePageChange}
        />
      </div>
    </>
  );
});

const GraphManagementListItem = observer(
  ({ id, name, graph, host, port, create_time, index }) => {
    const graphManagementStore = useContext(GraphManagementStoreContext);
    const [isEditing, setEditingState] = useState(false);

    const handleCancel = useCallback(() => {
      graphManagementStore.resetGraphDataConfig('edit');
      graphManagementStore.changeSelectedEditIndex(null);
      setEditingState(false);
    }, [graphManagementStore]);

    const handleSave = useCallback(async () => {
      graphManagementStore.switchValidateStatus(true);

      if (!graphManagementStore.validate('edit')) {
        return;
      }

      await graphManagementStore.upgradeGraphData(id);

      if (graphManagementStore.requestStatus.upgradeGraphData === 'success') {
        Message.success({
          content: '保存成功',
          size: 'medium',
          showCloseIcon: false
        });

        graphManagementStore.fetchGraphDataList();
        handleCancel();
      }

      if (graphManagementStore.requestStatus.upgradeGraphData === 'failed') {
        Message.error({
          content: graphManagementStore.errorMessage,
          size: 'medium',
          showCloseIcon: false
        });
      }
    }, [graphManagementStore, handleCancel, id]);

    const handleDropdownClick = useCallback(
      (index: number) => (e: { key: string; item: object }) => {
        const { name } = graphManagementStore.graphData[index];

        if (e.key === 'edit') {
          setEditingState(true);
          graphManagementStore.fillInGraphDataConfig(index);
          graphManagementStore.changeSelectedEditIndex(index);
        }

        if (e.key === 'delete') {
          Modal.confirm({
            title: '删除图',
            content: (
              <div className="graph-data-delete-confirm">
                {`确认删除 ${name} 吗？`}
                <br />
                删除后该图所有配置均不可恢复
              </div>
            ),
            buttonSize: 'medium',
            okText: '确认',
            onOk: async () => {
              await graphManagementStore.deleteGraphData(id);

              if (
                graphManagementStore.requestStatus.deleteGraphData === 'success'
              ) {
                graphManagementStore.fetchGraphDataList();
              }

              if (
                graphManagementStore.requestStatus.deleteGraphData === 'failed'
              ) {
                Message.error({
                  content: graphManagementStore.errorMessage,
                  size: 'medium',
                  showCloseIcon: false
                });
              }
            }
          });
        }
      },
      [graphManagementStore, id]
    );

    return isEditing ? (
      <Embedded
        title="编辑图"
        className="graph-management-list-data-config"
        onClose={() => {
          setEditingState(false);
          graphManagementStore.changeSelectedEditIndex(null);
        }}
        visible={isEditing}
      >
        <div className="graph-management-list-create-content">
          <div>
            <div>
              <span>图ID：</span>
              <Input
                {...isRequiredInputProps}
                maxLen={48}
                placeholder="必须以字母开头，允许出现英文、数字、下划线"
                errorMessage={
                  graphManagementStore.isValidated &&
                  graphManagementStore.validateErrorMessage.name !== ''
                    ? graphManagementStore.validateErrorMessage.name
                    : null
                }
                value={graphManagementStore.editGraphData.name}
                onChange={graphManagementStore.mutateGraphDataConfig(
                  'name',
                  'edit'
                )}
              />
            </div>
            <div>
              <span>图名称：</span>
              <Input
                {...isRequiredInputProps}
                maxLen={48}
                placeholder="必须以字母开头，允许出现英文、数字、下划线"
                errorMessage={
                  graphManagementStore.isValidated &&
                  graphManagementStore.validateErrorMessage.graph !== ''
                    ? graphManagementStore.validateErrorMessage.graph
                    : null
                }
                value={graphManagementStore.editGraphData.graph}
                onChange={graphManagementStore.mutateGraphDataConfig(
                  'graph',
                  'edit'
                )}
              />
            </div>
            <div>
              <span>主机名：</span>
              <Input
                {...isRequiredInputProps}
                placeholder="请输入主机名"
                errorMessage={
                  graphManagementStore.isValidated &&
                  graphManagementStore.validateErrorMessage.host !== ''
                    ? graphManagementStore.validateErrorMessage.host
                    : null
                }
                value={graphManagementStore.editGraphData.host}
                onChange={graphManagementStore.mutateGraphDataConfig(
                  'host',
                  'edit'
                )}
              />
            </div>
            <div>
              <span>端口号：</span>
              <Input
                {...isRequiredInputProps}
                placeholder="请输入端口号"
                errorMessage={
                  graphManagementStore.isValidated &&
                  graphManagementStore.validateErrorMessage.port !== ''
                    ? graphManagementStore.validateErrorMessage.port
                    : null
                }
                value={graphManagementStore.editGraphData.port}
                onChange={graphManagementStore.mutateGraphDataConfig(
                  'port',
                  'edit'
                )}
              />
            </div>
            <div>
              <span>用户名：</span>
              <Input
                {...commonInputProps}
                errorMessage={
                  graphManagementStore.isValidated &&
                  graphManagementStore.validateErrorMessage
                    .usernameAndPassword !== ''
                    ? graphManagementStore.validateErrorMessage
                        .usernameAndPassword
                    : null
                }
                value={graphManagementStore.editGraphData.username}
                onChange={graphManagementStore.mutateGraphDataConfig(
                  'username',
                  'edit'
                )}
              />
            </div>
            <div>
              <span>密码：</span>
              <Input
                {...commonInputProps}
                errorMessage={
                  graphManagementStore.isValidated &&
                  graphManagementStore.validateErrorMessage
                    .usernameAndPassword !== ''
                    ? graphManagementStore.validateErrorMessage
                        .usernameAndPassword
                    : null
                }
                value={graphManagementStore.editGraphData.password}
                onChange={graphManagementStore.mutateGraphDataConfig(
                  'password',
                  'edit'
                )}
              />
            </div>
            <div>
              <div style={{ width: 420 }}>
                <Button
                  type="primary"
                  size="medium"
                  style={{ width: 78 }}
                  onClick={handleSave}
                >
                  保存
                </Button>
                <Button
                  size="medium"
                  style={{
                    marginLeft: 12,
                    width: 78
                  }}
                  onClick={handleCancel}
                >
                  取消
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Embedded>
    ) : (
      <div className="graph-management-list" key={id}>
        <div className="graph-management-list-item">
          <div className="graph-management-list-title">图ID</div>
          <div className="graph-management-list-data">
            <span title={name}>
              <Highlighter
                highlightClassName="graph-management-list-highlight"
                searchWords={[graphManagementStore.isSearched.value]}
                autoEscape={true}
                textToHighlight={name}
              />
            </span>
          </div>
        </div>
        <div className="graph-management-list-item">
          <div className="graph-management-list-title">图名称</div>
          <div className="graph-management-list-data">
            <span title={graph}>
              <Highlighter
                highlightClassName="graph-management-list-highlight"
                searchWords={[graphManagementStore.isSearched.value]}
                autoEscape={true}
                textToHighlight={graph}
              />
            </span>
          </div>
        </div>
        <div className="graph-management-list-item">
          <div className="graph-management-list-title">主机名</div>
          <div className="graph-management-list-data" title={host}>
            {host}
          </div>
        </div>
        <div className="graph-management-list-item">
          <div className="graph-management-list-title">端口号</div>
          <div className="graph-management-list-data" title={port}>
            {port}
          </div>
        </div>
        <div className="graph-management-list-item">
          <div className="graph-management-list-title">创建时间</div>
          <div className="graph-management-list-data" title={create_time}>
            {create_time}
          </div>
        </div>
        <div className="graph-management-list-manipulation">
          <Button
            size="medium"
            style={{ width: 78, marginRight: 12 }}
            disabled={
              graphManagementStore.showCreateNewGraph === true ||
              (graphManagementStore.selectedEditIndex !== null &&
                graphManagementStore.selectedEditIndex !== index)
            }
          >
            访问
          </Button>
          <Dropdown.Button
            options={dropdownList}
            title="更多"
            size="medium"
            trigger={['click']}
            width={78}
            onHandleMenuClick={handleDropdownClick(index)}
            disabled={
              graphManagementStore.showCreateNewGraph === true ||
              (graphManagementStore.selectedEditIndex !== null &&
                graphManagementStore.selectedEditIndex !== index)
            }
          />
        </div>
      </div>
    );
  }
);

export default GraphManagementList;
