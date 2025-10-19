import React from 'react';
import { MapCoordinates } from '../types/geojson';

interface ContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  onNewCrossroad: () => void;
  onNewSegment: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  onClose,
  onNewCrossroad,
  onNewSegment,
}) => {
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.custom-context-menu')) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);
  // Position the context menu near the clicked coordinates
  const offsetX = 10; // Adjust the X offset as needed
  const offsetY = -10; // Adjust the Y offset as needed
  const pos = positioncoordinates).add(new maplibregl.Point(offsetX, offsetY));
  contextMenu.style.position = 'absolute';
  contextMenu.style.left = pos.x + 'px';
  contextMenu.style.top = pos.y + 'px';
  return (
    <div
      className="custom-context-menu"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        background: 'white',
        padding: '8px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        zIndex: 1000,
      }}
    >
      <div
        className="menu-entry"
        style={{ marginBottom: '4px', cursor: 'pointer' }}
        onClick={onNewCrossroad}
      >
        New Crossroad
      </div>
      <div
        className="menu-entry"
        style={{ cursor: 'pointer' }}
        onClick={onNewSegment}
      >
        New Segment
      </div>
    </div>
  );
};

export default ContextMenu;
