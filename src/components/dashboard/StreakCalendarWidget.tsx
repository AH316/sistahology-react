import React from 'react';
import type { DashboardStats, Entry } from '../../types';
import { Flame } from 'lucide-react';

interface StreakCalendarWidgetProps {
  stats: DashboardStats | null;
}

const StreakCalendarWidget: React.FC<StreakCalendarWidgetProps> = ({ stats }) => {
  // Get all entries for calculating 30-day view
  const getLast30Days = () => {
    const days = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dateString = date.toISOString().split('T')[0];

      // Check if there's an entry for this day (use allEntries if available)
      const entries: Entry[] = stats?.allEntries || stats?.recentEntries || [];
      const hasEntry = entries.some(
        (entry: Entry) => entry.entryDate === dateString
      );

      days.push({
        date: dateString,
        hasEntry,
        isToday: i === 0
      });
    }

    return days;
  };

  const thirtyDayData = getLast30Days();
  const daysWithEntries = thirtyDayData.filter(d => d.hasEntry).length;
  const streak = stats?.writingStreak || 0;

  // Group into weeks (rows of 7)
  const weeks: Array<typeof thirtyDayData> = [];
  for (let i = 0; i < thirtyDayData.length; i += 7) {
    weeks.push(thirtyDayData.slice(i, i + 7));
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg border-2 border-white/40 rounded-3xl p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white drop-shadow-lg">30-Day Streak</h3>
        <div className="flex items-center gap-1">
          <Flame className="w-5 h-5 text-orange-400 drop-shadow-lg" />
          <span className="text-white font-bold text-xl drop-shadow-lg">{streak}</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="space-y-1.5 mb-4">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex gap-1.5 justify-center">
            {week.map((day, dayIndex) => {
              const hasEntry = day.hasEntry;
              const isToday = day.isToday;

              return (
                <div
                  key={dayIndex}
                  className={`w-6 h-6 rounded transition-all duration-200 ${
                    hasEntry
                      ? 'bg-gradient-to-br from-sistah-pink to-sistah-rose shadow-lg'
                      : 'bg-white/20'
                  } ${isToday ? 'ring-2 ring-white/80' : ''}`}
                  title={`${day.date}${hasEntry ? ' - Entry written' : ' - No entry'}`}
                >
                  {hasEntry && (
                    <div className="flex items-center justify-center h-full">
                      <svg
                        className="w-3 h-3 text-white drop-shadow-lg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-white text-2xl font-bold drop-shadow-lg">{daysWithEntries}</div>
          <div className="text-white/80 text-xs drop-shadow-lg">Active Days</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-white text-2xl font-bold drop-shadow-lg">
            {Math.round((daysWithEntries / 30) * 100)}%
          </div>
          <div className="text-white/80 text-xs drop-shadow-lg">Consistency</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-3 border-t border-white/30">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-sistah-pink to-sistah-rose" />
          <span className="text-white/80 text-xs drop-shadow-lg">Entry</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-white/20" />
          <span className="text-white/80 text-xs drop-shadow-lg">Missed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded ring-2 ring-white/80" />
          <span className="text-white/80 text-xs drop-shadow-lg">Today</span>
        </div>
      </div>
    </div>
  );
};

export default StreakCalendarWidget;
