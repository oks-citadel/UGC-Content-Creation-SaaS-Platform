import React from 'react';

interface ToolbarProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onSplit?: () => void;
  onExport?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onDelete,
  onSplit,
  onExport,
  canUndo = false,
  canRedo = false,
}) => {
  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          Undo
        </button>
        <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          Redo
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button onClick={onCut} title="Cut (Ctrl+X)">
          Cut
        </button>
        <button onClick={onCopy} title="Copy (Ctrl+C)">
          Copy
        </button>
        <button onClick={onPaste} title="Paste (Ctrl+V)">
          Paste
        </button>
        <button onClick={onDelete} title="Delete (Del)">
          Delete
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button onClick={onSplit} title="Split Clip (S)">
          Split
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button onClick={onExport} className="toolbar-button-primary" title="Export Video">
          Export
        </button>
      </div>
    </div>
  );
};
