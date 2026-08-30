import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2, MoveDiagonal, Scaling } from 'lucide-react';

// ---------------------------------------------------------------------------
// ChartCard.jsx
//
// Shared card shell for Admin Dashboard charts.
// Features image-crop style corner resize handles, dynamic col-span controls,
// height resizing, and expand/collapse modal views.
// ---------------------------------------------------------------------------

export const ChartCard = ({
  id,
  title,
  subtitle,
  action,
  children,
  className = '',
  isExpanded = false,
  onToggleExpand,
  expandable = true,
  colSpan = 1,
  height,
  maxCols = 3,
  onResize,
  isCustomizeMode = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0, startSpan: 1, startHeight: 340 });

  // Handle Drag Resizing (Like Image Crop / Resizer)
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      startSpan: typeof colSpan === 'number' ? colSpan : 1,
      startHeight: height || 340,
    };

    const handleMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = moveEvent.clientX - startPosRef.current.x;
      const deltaY = moveEvent.clientY - startPosRef.current.y;

      let newSpan = startPosRef.current.startSpan;
      if (deltaX > 140 && newSpan < maxCols) {
        newSpan = Math.min(maxCols, startPosRef.current.startSpan + 1);
      } else if (deltaX < -140 && newSpan > 1) {
        newSpan = Math.max(1, startPosRef.current.startSpan - 1);
      }

      const newHeight = Math.max(260, Math.min(600, startPosRef.current.startHeight + deltaY));

      if (onResize) {
        onResize(id, {
          colSpan: newSpan,
          height: Math.round(newHeight),
        });
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Quick click to cycle card width (1x -> 2x -> Full -> 1x)
  const handleCycleSpan = (e) => {
    e.stopPropagation();
    if (!onResize) return;
    const current = typeof colSpan === 'number' ? colSpan : 1;
    let nextSpan = 1;
    if (current === 1) nextSpan = Math.min(2, maxCols);
    else if (current === 2 && maxCols >= 3) nextSpan = maxCols;
    else nextSpan = 1;

    onResize(id, { colSpan: nextSpan, height: height || 340 });
  };

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ minHeight: isExpanded ? 'auto' : (height ? `${height}px` : undefined) }}
      className={`group/card bg-white dark:bg-neutral-900 border rounded-3xl shadow-xs p-5 sm:p-6 transition-all relative flex flex-col justify-between ${
        isExpanded
          ? 'col-span-full ring-2 ring-primary-500/40 border-primary-500/30'
          : isCustomizeMode
          ? 'border-primary-500/50 ring-2 ring-primary-500/20 border-dashed'
          : 'border-neutral-200/70 dark:border-neutral-800/70 hover:border-neutral-300 dark:hover:border-neutral-700'
      } ${className}`}
    >
      {/* 🖼️ Crop/Resize Corner Bracket Visual Guides (Image Editor Style) */}
      {(isCustomizeMode || isHovered) && !isExpanded && (
        <>
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-primary-500/60 rounded-tl-sm pointer-events-none" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-primary-500/60 rounded-tr-sm pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-primary-500/60 rounded-bl-sm pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-primary-500/60 rounded-br-sm pointer-events-none" />
        </>
      )}

      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white">
              {title}
            </h3>
            {isExpanded && (
              <span className="px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-bold">
                Expanded View
              </span>
            )}
            {!isExpanded && colSpan > 1 && (
              <span className="px-1.5 py-0.2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[10px] font-extrabold">
                {colSpan === maxCols ? 'Full' : `${colSpan}x`}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {action}

          {/* Quick Span Selector Pill */}
          {!isExpanded && onResize && (
            <button
              type="button"
              onClick={handleCycleSpan}
              title={`Current size: ${colSpan} Column(s). Click to cycle size.`}
              className="px-2 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 hover:scale-105 active:scale-95 shadow-xs"
            >
              <Scaling className="w-3 h-3" />
              <span>{colSpan === maxCols ? 'Full' : `${colSpan} Col`}</span>
            </button>
          )}

          {/* Expand / Collapse Button */}
          {expandable && onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              title={isExpanded ? 'Collapse View' : 'Expand to Full Width'}
              className="p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
            >
              {isExpanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas Content */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        {children}
      </div>

      {/* ↘️ Bottom-Right Drag & Crop Resize Handle */}
      {!isExpanded && onResize && (
        <div
          onMouseDown={handleMouseDown}
          onClick={handleCycleSpan}
          title="Drag to resize card width/height or click to cycle width (1x, 2x, Full)"
          className={`absolute bottom-1.5 right-1.5 p-1.5 rounded-xl cursor-se-resize select-none transition-all z-20 flex items-center justify-center ${
            isCustomizeMode || isHovered
              ? 'bg-primary-500 text-white shadow-md scale-105 opacity-100'
              : 'text-neutral-400 dark:text-neutral-600 opacity-40 hover:opacity-100'
          }`}
        >
          <MoveDiagonal className="w-3.5 h-3.5 rotate-90" />
        </div>
      )}
    </motion.div>
  );
};

export default ChartCard;

