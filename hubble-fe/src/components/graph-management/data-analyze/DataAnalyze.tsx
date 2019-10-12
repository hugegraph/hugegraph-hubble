import React, { useState, useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { useRoute, Params } from 'wouter';

import DataAnalyzeSidebar from './DataAnalyzeSidebar';
import DataAnalyzeContent from './DataAnalyzeContent';
import DataAnalyzeDrawer from './DataAnalyzeDrawer';
import { DataAnalyzeStoreContext } from '../../../stores';
import './DataAnalyze.less';

const DataAnalyze: React.FC = observer(() => {
  const dataAnalyzeStore = useContext(DataAnalyzeStoreContext);
  const [isExpanded, setExpand] = useState(false);
  const [match, params] = useRoute('/graph-management/:id/data-analyze');

  useEffect(() => {
    window.scrollTo(0, 0);
    dataAnalyzeStore.fetchIdList();

    return () => {
      dataAnalyzeStore.dispose();
    };
  }, [dataAnalyzeStore]);

  // Caution: Preitter will automatically add 'params' behind 'match' in array,
  // which is not equal each time
  /* eslint-disable */
  useEffect(() => {
    if (match && params !== null) {
      dataAnalyzeStore.setCurrentId(Number(params.id));
      dataAnalyzeStore.fetchValueTypes();
      dataAnalyzeStore.fetchColorSchemas();
    }
  }, [dataAnalyzeStore, match, (params as Params).id]);

  return (
    <section className="data-analyze">
      <DataAnalyzeSidebar isExpand={isExpanded} handleExpand={setExpand} />
      <DataAnalyzeContent isExpand={isExpanded} />
      <DataAnalyzeDrawer />
    </section>
  );
});

export default DataAnalyze;
