import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// ChartCard.jsx
//
// Minimalist, clutter-free card shell with natural mouse corner drag-resizing.
// Hovering the bottom-right corner turns cursor into diagonal resize (se-resize)
// allowing the admin to drag and scale height and width smoothly in real time.
// ---------------------------------------------------------------------------

export const ChartCard = ({
  id,
  title,
  subtitle,
  action,
  children,
  className = '',
  colSpan = 1,
  height,
  density = 'normal',
  maxCols = 3,
  onResize,
}) => {
  const isDraggingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, startHeight: 280, startSpan: 1 });
  const [isResizing, setIsResizing] = useState(false);

  const handleCornerMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    setIsResizing(true);
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      startHeight: height || 280,
      startSpan: colSpan || 1,
    };

    const handleMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = moveEvent.clientX - startRef.current.x;
      const deltaY = moveEvent.clientY - startRef.current.y;

      // Adjust height smoothly (160px min to 650px max)
      const newHeight = Math.max(160, Math.min(650, startRef.current.startHeight + deltaY));

      // Adjust width span smoothly based on horizontal drag
      let newSpan = startRef.current.startSpan;
      if (deltaX > 110 && newSpan < maxCols) {
        newSpan = Math.min(maxCols, startRef.current.startSpan + 1);
      } else if (deltaX < -110 && newSpan > 1) {
        newSpan = Math.max(1, startRef.current.startSpan - 1);
      }

      if (onResize) {
        onResize(id, {
          height: Math.round(newHeight),
          colSpan: newSpan,
        });
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const paddingClass =
    density === 'compact'
      ? 'p-3 sm:p-3.5'
      : density === 'comfort'
      ? 'p-5 sm:p-6'
      : 'p-4 sm:p-5';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        height: height ? `${height}px` : '240px',
        minHeight: height ? `${height}px` : '240px',
      }}
      className={`relative bg-white dark:bg-neutral-900 border rounded-2xl sm:rounded-3xl shadow-xs transition-all flex flex-col justify-between overflow-hidden ${paddingClass} ${
        isResizing
          ? 'border-primary-500 ring-2 ring-primary-500/30 shadow-md select-none'
          : 'border-neutral-200/75 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700'
      } ${className}`}
    >
      {/* Card Header */}
      <div className={`flex items-start justify-between gap-2 ${density === 'compact' ? 'mb-2' : 'mb-3'}`}>
        <div className="min-w-0 flex-1">
          <h3 className={`font-display font-extrabold text-neutral-900 dark:text-white truncate ${
            density === 'compact' ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
          }`}>
            {title}
          </h3>
          {subtitle && (
            <p className={`text-neutral-500 dark:text-neutral-400 truncate ${
              density === 'compact' ? 'text-[10px] mt-0.5' : 'text-xs mt-0.5'
            }`}>
              {subtitle}
            </p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Chart Canvas Content */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        {children}
      </div>

      {/* ↕️ Bottom Edge Height Resizer (Drag anywhere along bottom border to change height) */}
      <div
        onMouseDown={handleCornerMouseDown}
        title="Drag up or down to resize card height"
        className="absolute bottom-0 left-0 right-6 h-2 cursor-s-resize select-none z-10 hover:bg-primary-500/10 active:bg-primary-500/20 transition-colors"
      />

      {/* ↘️ Invisible Natural Drag Corner (se-resize for width & height) */}
      <div
        onMouseDown={handleCornerMouseDown}
        title="Drag corner to resize card size (Height & Width)"
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize select-none z-20 hover:bg-neutral-400/10 active:bg-primary-500/20 rounded-tl-lg transition-colors"
      />
    </motion.div>
  );
};

export default ChartCard;




