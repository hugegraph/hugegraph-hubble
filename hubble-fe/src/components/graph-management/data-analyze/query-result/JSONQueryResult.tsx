import React, { useContext, useEffect, useRef } from 'react';
import { reaction } from 'mobx';
import { observer } from 'mobx-react';
import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';

import { DataAnalyzeStoreContext } from '../../../../stores';

const JSONQueryResult: React.FC = observer(() => {
  const dataAnalyzeStore = useContext(DataAnalyzeStoreContext);
  const JSONReusltContainer = useRef<HTMLTextAreaElement>(null);
  const codeEditor = useRef<CodeMirror.Editor>();

  useEffect(() => {
    codeEditor.current = CodeMirror.fromTextArea(
      JSONReusltContainer.current as HTMLTextAreaElement,
      {
        mode: { name: 'javascript', json: true },
        lineNumbers: true,
        readOnly: true
      }
    );

    codeEditor.current.setValue(
      JSON.stringify(dataAnalyzeStore.originalGraphData.data.json_view, null, 4)
    );

    reaction(
      () => dataAnalyzeStore.originalGraphData,
      () => {
        if (codeEditor.current) {
          codeEditor.current.setValue(
            JSON.stringify(
              dataAnalyzeStore.originalGraphData.data.json_view,
              null,
              4
            )
          );
        }
      }
    );
  }, [dataAnalyzeStore]);

  return (
    <div className="hello">
      <textarea
        className="query-tab-code-editor"
        ref={JSONReusltContainer}
      ></textarea>
    </div>
  );
});

export default JSONQueryResult;
