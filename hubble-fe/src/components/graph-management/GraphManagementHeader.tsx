import React, { useContext, useCallback } from 'react';
import { observer } from 'mobx-react';
import { Input, Button } from '@baidu/one-ui';
import { GraphManagementStoreContext } from '../../stores';

const styles = {
  marginLeft: '20px',
  width: 88
};

const GraphManagementHeader: React.FC = observer(() => {
  const graphManagementStore = useContext(GraphManagementStoreContext);

  const handleLayoutSwitch = useCallback(
    (flag: boolean) => () => {
      graphManagementStore.switchCreateNewGraph(flag);
    },
    [graphManagementStore]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      graphManagementStore.mutateSearchWords(e.target.value);
    },
    [graphManagementStore]
  );

  const handleSearch = useCallback(() => {
    graphManagementStore.fetchGraphDataList(graphManagementStore.searchWords);
  }, [graphManagementStore]);

  const buttonStyles =
    graphManagementStore.showCreateNewGraph ||
    graphManagementStore.selectedEditIndex !== null
      ? styles
      : { ...styles, backgroundColor: '#2b65ff' };

  return (
    <div className="graph-management-header">
      <span>图管理</span>
      <Input.Search
        size="medium"
        width={200}
        placeholder="搜索图名称或ID"
        value={graphManagementStore.searchWords}
        onChange={handleSearchChange}
        onSearch={handleSearch}
        isShowDropDown={false}
        disabled={
          graphManagementStore.showCreateNewGraph ||
          graphManagementStore.selectedEditIndex !== null
        }
      />
      <Button
        type="primary"
        size="medium"
        style={styles}
        onClick={handleLayoutSwitch(true)}
        disabled={
          graphManagementStore.showCreateNewGraph ||
          graphManagementStore.selectedEditIndex !== null
        }
      >
        创建图
      </Button>
    </div>
  );
});

export default GraphManagementHeader;
