import React, { useState } from 'react';
import type { TextOverlay as TextOverlayType, TextAnimation } from '../types';

interface TextOverlayProps {
  overlay?: TextOverlayType;
  onSave?: (overlay: Omit<TextOverlayType, 'id'>) => void;
  onCancel?: () => void;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  overlay,
  onSave,
  onCancel,
}) => {
  const [text, setText] = useState(overlay?.text || '');
  const [fontFamily, setFontFamily] = useState(overlay?.fontFamily || 'Arial');
  const [fontSize, setFontSize] = useState(overlay?.fontSize || 48);
  const [color, setColor] = useState(overlay?.color || '#ffffff');
  const [backgroundColor, setBackgroundColor] = useState(overlay?.backgroundColor || '');
  const [x, setX] = useState(overlay?.x || 100);
  const [y, setY] = useState(overlay?.y || 100);
  const [width, setWidth] = useState(overlay?.width || 400);
  const [height, setHeight] = useState(overlay?.height || 100);
  const [startTime, setStartTime] = useState(overlay?.startTime || 0);
  const [endTime, setEndTime] = useState(overlay?.endTime || 5);
  const [animationType, setAnimationType] = useState<TextAnimation['type'] | ''>
    (overlay?.animation?.type || '');
  const [animationDuration, setAnimationDuration] = useState(
    overlay?.animation?.duration || 0.5
  );

  const handleSave = () => {
    const animation: TextAnimation | undefined = animationType
      ? { type: animationType, duration: animationDuration }
      : undefined;

    onSave?.({
      text,
      fontFamily,
      fontSize,
      color,
      backgroundColor: backgroundColor || undefined,
      x,
      y,
      width,
      height,
      startTime,
      endTime,
      animation,
    });
  };

  return (
    <div className="text-overlay-editor">
      <h3>{overlay ? 'Edit Text Overlay' : 'Add Text Overlay'}</h3>

      <div className="form-group">
        <label>Text</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your text"
          rows={3}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Font Family</label>
          <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Impact">Impact</option>
            <option value="Comic Sans MS">Comic Sans MS</option>
          </select>
        </div>

        <div className="form-group">
          <label>Font Size</label>
          <input
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            min={12}
            max={200}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Text Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Background Color (Optional)</label>
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>X Position</label>
          <input
            type="number"
            value={x}
            onChange={(e) => setX(Number(e.target.value))}
            min={0}
          />
        </div>

        <div className="form-group">
          <label>Y Position</label>
          <input
            type="number"
            value={y}
            onChange={(e) => setY(Number(e.target.value))}
            min={0}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Width</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            min={50}
          />
        </div>

        <div className="form-group">
          <label>Height</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            min={20}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Start Time (seconds)</label>
          <input
            type="number"
            value={startTime}
            onChange={(e) => setStartTime(Number(e.target.value))}
            min={0}
            step={0.1}
          />
        </div>

        <div className="form-group">
          <label>End Time (seconds)</label>
          <input
            type="number"
            value={endTime}
            onChange={(e) => setEndTime(Number(e.target.value))}
            min={startTime}
            step={0.1}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Animation</label>
          <select
            value={animationType}
            onChange={(e) => setAnimationType(e.target.value as any)}
          >
            <option value="">None</option>
            <option value="fade-in">Fade In</option>
            <option value="fade-out">Fade Out</option>
            <option value="slide-in">Slide In</option>
            <option value="slide-out">Slide Out</option>
            <option value="zoom-in">Zoom In</option>
            <option value="zoom-out">Zoom Out</option>
          </select>
        </div>

        {animationType && (
          <div className="form-group">
            <label>Animation Duration (seconds)</label>
            <input
              type="number"
              value={animationDuration}
              onChange={(e) => setAnimationDuration(Number(e.target.value))}
              min={0.1}
              max={5}
              step={0.1}
            />
          </div>
        )}
      </div>

      <div className="form-actions">
        <button onClick={onCancel} className="button-secondary">
          Cancel
        </button>
        <button onClick={handleSave} className="button-primary">
          {overlay ? 'Update' : 'Add'} Text
        </button>
      </div>
    </div>
  );
};
