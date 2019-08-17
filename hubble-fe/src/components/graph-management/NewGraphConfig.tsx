import React, { useContext, useCallback } from 'react';
import { observer } from 'mobx-react';
import { Embedded, Input, Button, Message } from '@baidu/one-ui';
import { GraphManagementStoreContext } from '../../stores';

const commonInputProps = {
  size: 'medium',
  width: 419
};

const isRequiredInputProps = {
  ...commonInputProps,
  isRequired: true,
  requiredErrorMessage: '必填项'
};

const NewGraphConfig: React.FC = observer(() => {
  const graphManagementStore = useContext(GraphManagementStoreContext);

  const handleLayoutSwitch = useCallback(
    (flag: boolean) => () => {
      graphManagementStore.switchCreateNewGraph(flag);
    },
    [graphManagementStore]
  );

  const handleCreate = useCallback(async () => {
    graphManagementStore.switchValidateStatus(true);

    if (!graphManagementStore.validate('new')) {
      return;
    }

    await graphManagementStore.AddGraphData();

    if (graphManagementStore.requestStatus.AddGraphData === 'success') {
      Message.success({
        content: '创建成功',
        size: 'medium'
      });

      graphManagementStore.fetchGraphDataList();
    }

    if (graphManagementStore.requestStatus.AddGraphData === 'failed') {
      Message.error({
        content: graphManagementStore.errorMessage,
        size: 'medium'
      });
    }
  }, [graphManagementStore]);

  const handleCancel = useCallback(() => {
    graphManagementStore.switchCreateNewGraph(false);
    graphManagementStore.resetGraphDataConfig('new');
    graphManagementStore.switchValidateStatus(false);
    graphManagementStore.resetValidateErrorMessage();
  }, [graphManagementStore]);

  return (
    <Embedded
      title="创建图"
      className="graph-management-list-data-config"
      onClose={handleLayoutSwitch(false)}
      visible={graphManagementStore.showCreateNewGraph}
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
              value={graphManagementStore.newGraphData.name}
              onChange={graphManagementStore.mutateGraphDataConfig(
                'name',
                'new'
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
              value={graphManagementStore.newGraphData.graph}
              onChange={graphManagementStore.mutateGraphDataConfig(
                'graph',
                'new'
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
              value={graphManagementStore.newGraphData.host}
              onChange={graphManagementStore.mutateGraphDataConfig(
                'host',
                'new'
              )}
            />
          </div>
          <div>
            <span>端口号：</span>
            <Input
              {...isRequiredInputProps}
              placeholder="请输出端口号"
              errorMessage={
                graphManagementStore.isValidated &&
                graphManagementStore.validateErrorMessage.port !== ''
                  ? graphManagementStore.validateErrorMessage.port
                  : null
              }
              value={graphManagementStore.newGraphData.port}
              onChange={graphManagementStore.mutateGraphDataConfig(
                'port',
                'new'
              )}
            />
          </div>
          <div>
            <span>用户名：</span>
            <Input
              {...commonInputProps}
              placeholder="不输入则无需填写"
              errorMessage={
                graphManagementStore.isValidated &&
                graphManagementStore.validateErrorMessage
                  .usernameAndPassword !== ''
                  ? graphManagementStore.validateErrorMessage
                      .usernameAndPassword
                  : null
              }
              value={graphManagementStore.newGraphData.username}
              onChange={graphManagementStore.mutateGraphDataConfig(
                'username',
                'new'
              )}
            />
          </div>
          <div>
            <span>密码：</span>
            <Input
              {...commonInputProps}
              placeholder="不输入则无需填写"
              errorMessage={
                graphManagementStore.isValidated &&
                graphManagementStore.validateErrorMessage
                  .usernameAndPassword !== ''
                  ? graphManagementStore.validateErrorMessage
                      .usernameAndPassword
                  : null
              }
              value={graphManagementStore.newGraphData.password}
              onChange={graphManagementStore.mutateGraphDataConfig(
                'password',
                'new'
              )}
            />
          </div>
          <div>
            <div style={{ width: 419 }}>
              <Button
                type="primary"
                size="medium"
                style={{ width: 78 }}
                onClick={handleCreate}
              >
                创建
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
  );
});

export default NewGraphConfig;
