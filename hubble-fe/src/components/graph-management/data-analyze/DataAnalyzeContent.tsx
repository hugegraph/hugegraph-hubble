import React, { useState, useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import QueryAndAlgorithmLibrary from './QueryAndAlgorithmLibrary';
import { QueryResult } from './query-result';
import FullScreenQueryResult from './FullScreenQueryResult';
import ExecLogAndQueryCollections from './ExecLogAndQueryCollections';

export interface DataAnalyzeContentProps {
  isExpand: boolean;
}

const DataAnalyzeContent: React.FC<DataAnalyzeContentProps> = observer(
  ({ isExpand }) => {
    const [queryResultSidebarIndex, setQueryResultSidebarIndex] = useState(0);
    const wrapperClassName = classnames({
      'data-analyze-content': true,
      'sidebar-expand': isExpand
    });

    return (
      <div className={wrapperClassName}>
        <QueryAndAlgorithmLibrary />
        <QueryResult
          sidebarIndex={queryResultSidebarIndex}
          handleSetSidebarIndex={setQueryResultSidebarIndex}
          isFullScreen={false}
        />
        <FullScreenQueryResult
          sidebarIndex={queryResultSidebarIndex}
          handleSetSidebarIndex={setQueryResultSidebarIndex}
          isFullScreen={true}
        />
        <ExecLogAndQueryCollections />
      </div>
    );
  }
);

export default DataAnalyzeContent;
