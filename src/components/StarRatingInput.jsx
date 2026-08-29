import React, { useState } from 'react';
import { Star } from 'lucide-react';

const RATING_LABELS = {
  0.5: '0.5 - Very Poor',
  1: '1.0 - Terrible',
  1.5: '1.5 - Poor',
  2: '2.0 - Below Average',
  2.5: '2.5 - Fair',
  3: '3.0 - Average',
  3.5: '3.5 - Good',
  4: '4.0 - Very Good',
  4.5: '4.5 - Excellent',
  5: '5.0 - Superb / Flawless',
};

/**
 * Standard 5-Star Interactive Rating Component with Half-Star and Full-Star support.
 *
 * @param {Object} props
 * @param {number} props.value - Currently selected rating value (1.0 to 5.0)
 * @param {function} props.onChange - Callback triggered when rating is selected (newVal) => void
 * @param {string} [props.size] - Size of the star icons ('sm' | 'md' | 'lg')
 * @param {boolean} [props.showLabel] - Whether to show the text label beside/below
 * @param {string} [props.className] - Additional classes
 */
export const StarRatingInput = ({
  value = 5,
  onChange,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  const starSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };

  const starSizeClass = starSizes[size] || starSizes.md;
  const activeRating = hoverValue || value || 0;

  const handleStarClick = (ratingVal) => {
    if (onChange) {
      onChange(ratingVal);
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-2.5 ${className}`}>
      {/* 5 Interactive Stars */}
      <div
        className="flex items-center gap-1 cursor-pointer select-none"
        onMouseLeave={() => setHoverValue(0)}
      >
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFull = activeRating >= starIndex;
          const isHalf = !isFull && activeRating >= starIndex - 0.5;

          return (
            <div
              key={starIndex}
              className="relative group p-0.5 transition-transform duration-150 hover:scale-110 active:scale-95"
            >
              {/* Background Empty Star */}
              <Star
                className={`${starSizeClass} text-neutral-300 dark:text-neutral-700 transition-colors`}
              />

              {/* Filled Star Overlay (Full or Half) */}
              {isFull && (
                <Star
                  className={`${starSizeClass} fill-primary-500 text-primary-500 absolute inset-0.5 drop-shadow-xs transition-all`}
                />
              )}

              {isHalf && (
                <div className="absolute inset-0.5 overflow-hidden w-[50%] pointer-events-none">
                  <Star
                    className={`${starSizeClass} fill-primary-500 text-primary-500 drop-shadow-xs`}
                  />
                </div>
              )}

              {/* Left Half Click/Hover Target (sets index - 0.5) */}
              <button
                type="button"
                aria-label={`${starIndex - 0.5} stars`}
                onClick={() => handleStarClick(starIndex - 0.5)}
                onMouseEnter={() => setHoverValue(starIndex - 0.5)}
                className="absolute inset-y-0 left-0 w-1/2 z-10 cursor-pointer focus:outline-none"
              />

              {/* Right Half Click/Hover Target (sets index) */}
              <button
                type="button"
                aria-label={`${starIndex} stars`}
                onClick={() => handleStarClick(starIndex)}
                onMouseEnter={() => setHoverValue(starIndex)}
                className="absolute inset-y-0 right-0 w-1/2 z-10 cursor-pointer focus:outline-none"
              />
            </div>
          );
        })}
      </div>

      {/* Label and Badge */}
      {showLabel && activeRating > 0 && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 text-xs font-black font-display tracking-wide">
            <Star className="w-3.5 h-3.5 fill-current" />
            {Number(activeRating).toFixed(1)} / 5.0
          </span>
          <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            {RATING_LABELS[activeRating] ? RATING_LABELS[activeRating].split(' - ')[1] : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default StarRatingInput;
