import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import CodeMirror from '@uiw/react-codemirror';
import { xodExtensions } from '../codemirrorXodMode.js';

function CppImplementationEditor({
  patchPath,
  isActive,
  source,
  isInDebuggerTab,
  onChange,
  onClose,
}) {
  return (
    <div
      className={cn('AttachmentEditor', {
        isActive,
        isInDebuggerTab,
      })}
    >
      <div className="Breadcrumbs Breadcrumbs--codeEditor">
        <ul>
          <li>
            <button className="back-button" onClick={onClose} />
          </li>
          <li>
            <button className="Breadcrumbs-chunk-button" onClick={onClose}>
              {patchPath}
            </button>
          </li>
          <li>
            <button className="Breadcrumbs-chunk-button is-tail is-active">
              C++ implementation
              {isInDebuggerTab && <span className="hint">read only</span>}
            </button>
          </li>
        </ul>
      </div>
      <div className="cpp-editor">
        <CodeMirror
          className="cpp-editor-codemirror"
          value={source}
          onChange={onChange}
          readOnly={isInDebuggerTab}
          basicSetup={{ tabSize: 4 }}
          extensions={xodExtensions}
        />
      </div>
    </div>
  );
}

CppImplementationEditor.propTypes = {
  patchPath: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  source: PropTypes.string.isRequired,
  isInDebuggerTab: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CppImplementationEditor;
