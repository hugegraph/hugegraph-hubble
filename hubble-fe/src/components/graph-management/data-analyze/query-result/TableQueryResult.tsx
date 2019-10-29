import React, { useContext, useCallback } from 'react';
import { observer } from 'mobx-react';
import { Table } from '@baidu/one-ui';

import { DataAnalyzeStoreContext } from '../../../../stores';

const TableQueryResult: React.FC = observer(() => {
  const dataAnalyzeStore = useContext(DataAnalyzeStoreContext);

  const columnConfigs = dataAnalyzeStore.originalGraphData.data.table_view.header.map(
    title => ({
      title,
      dataIndex: title,
      render(text: any) {
        if (title === 'path') {
          return <PathItem items={text} />;
        }

        return typeof text !== 'object' ? text : JSON.stringify(text);
      }
    })
  );

  const handlePageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dataAnalyzeStore.mutatePageNumber('tableResult', Number(e.target.value));
    },
    [dataAnalyzeStore]
  );

  return (
    <Table
      columns={columnConfigs}
      dataSource={dataAnalyzeStore.originalGraphData.data.table_view.rows}
      pagination={{
        size: 'medium',
        pageSize: 10,
        hideOnSinglePage: true,
        showSizeChange: false,
        showPageJumper: false,
        total: dataAnalyzeStore.pageConfigs.tableResult.pageTotal,
        pageNo: dataAnalyzeStore.pageConfigs.tableResult.pageNumber,
        onPageNoChange: handlePageChange
      }}
    />
  );
});

const PathItem: React.FC<{ items: string[] }> = observer(({ items }) => (
  <>
    {items.map((item: string) => (
      <span className="query-result-content-table-path-item">{item}</span>
    ))}
  </>
));

export default TableQueryResult;
