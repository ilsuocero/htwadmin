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
    console.log('🎯 ContextMenu: Component mounted at position:', position);
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.custom-context-menu')) {
        console.log('🎯 ContextMenu: Click outside detected, closing menu');
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('🎯 ContextMenu: Escape key pressed, closing menu');
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      console.log('🎯 ContextMenu: Component unmounting, removing event listeners');
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, position]);

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
