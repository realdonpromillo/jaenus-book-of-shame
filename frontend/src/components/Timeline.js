// hello/frontend/src/components/Timeline.js
import React, { useMemo } from 'react';
import { format, startOfDay, compareAsc } from 'date-fns';

function Timeline({ events, selectedDate, onDateSelect }) {

  // Memoize unique dates from events, sorted chronologically
  const uniqueDates = useMemo(() => {
    const dates = events.map(event => startOfDay(event.date).getTime());
    const uniqueTimestamps = [...new Set(dates)];
    return uniqueTimestamps.map(ts => new Date(ts)).sort(compareAsc);
  }, [events]);

  if (!uniqueDates.length) {
    return <div className="timeline-container"><p>No events found to display on timeline.</p></div>;
  }

  return (
    <div className="timeline-container">
      <h2>Timeline</h2>
      {uniqueDates.map(date => {
        const isSelected = selectedDate && startOfDay(selectedDate).getTime() === date.getTime();
        return (
          <button
            key={date.getTime()}
            className={`timeline-date ${isSelected ? 'selected' : ''}`}
            onClick={() => onDateSelect(date)}
          >
            {format(date, 'MMM dd, yyyy')} {/* Format date nicely */}
          </button>
        );
      })}
    </div>
  );
}

export default Timeline;