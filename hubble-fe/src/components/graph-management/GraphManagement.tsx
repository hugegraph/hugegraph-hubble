import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import { GraphManagementStoreContext } from '../../stores';
import GraphManagementHeader from './GraphManagementHeader';
import NewGraphConfig from './NewGraphConfig';
import GraphManagementList from './GraphManagementList';
import GraphManagementEmptyList from './GraphManagementEmptyList';

import './GraphManagement.less';

const GraphManagement: React.FC = observer(() => {
  const graphManagementStore = useContext(GraphManagementStoreContext);

  useEffect(() => {
    graphManagementStore.fetchGraphDataList();
  }, [graphManagementStore]);

  return (
    <section className="graph-management">
      <GraphManagementHeader />
      <NewGraphConfig />
      <GraphManagementEmptyList />
      <GraphManagementList />
    </section>
  );
});

export default GraphManagement;
