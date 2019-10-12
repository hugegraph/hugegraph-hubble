import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { Modal } from '@baidu/one-ui';

import QueryResult from './QueryResult';
import { QueryResultProps } from './DataAnalyzeContent';
import { DataAnalyzeStoreContext } from '../../../stores';

const FullScreenQueryReuslt: React.FC<QueryResultProps> = observer(
  ({ sidebarIndex, handleSetSidebarIndex, isFullScreen }) => {
    const dataAnalyzeStore = useContext(DataAnalyzeStoreContext);

    return (
      <Modal
        visible={dataAnalyzeStore.isFullScreenReuslt}
        destoryOnClose
        fullScreen
        needCloseIcon={false}
        footer={[]}
      >
        <div className="data-analyze">
          <QueryResult
            sidebarIndex={sidebarIndex}
            handleSetSidebarIndex={handleSetSidebarIndex}
            isFullScreen={true}
          />
        </div>
      </Modal>
    );
  }
);

export default FullScreenQueryReuslt;
