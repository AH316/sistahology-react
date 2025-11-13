import React from 'react';
import type { DashboardStats, Entry } from '../../types';

interface WeeklyActivityWidgetProps {
  stats: DashboardStats | null;
}

const WeeklyActivityWidget: React.FC<WeeklyActivityWidgetProps> = ({ stats }) => {
  // Calculate last 7 days of activity
  const getLast7Days = () => {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dateString = date.toISOString().split('T')[0];
      const dayLetter = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()];

      // Count entries for this day (use allEntries if available, otherwise recentEntries)
      const entries: Entry[] = stats?.allEntries || stats?.recentEntries || [];
      const entryCount = entries.filter(
        (entry: Entry) => entry.entryDate === dateString
      ).length;

      days.push({
        date: dateString,
        dayLetter,
        count: entryCount,
        isToday: i === 0
      });
    }

    return days;
  };

  const weeklyData = getLast7Days();
  const totalWeeklyEntries = weeklyData.reduce((sum, day) => sum + day.count, 0);

  return (
    <div className="bg-white/10 backdrop-blur-lg border-2 border-white/40 rounded-3xl p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white drop-shadow-lg">Weekly Activity</h3>
        <span className="text-white/90 text-sm drop-shadow-lg">{totalWeeklyEntries} entries</span>
      </div>

      <div className="flex justify-between items-end gap-2 h-32">
        {weeklyData.map((day, index) => {
          const hasEntries = day.count > 0;
          const height = hasEntries ? Math.min(100, 40 + (day.count * 20)) : 20;

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              {/* Bar */}
              <div className="w-full flex items-end justify-center" style={{ height: '100px' }}>
                <div
                  className={`w-full rounded-lg transition-all duration-300 ${
                    hasEntries
                      ? 'bg-gradient-to-t from-sistah-pink to-sistah-rose shadow-lg'
                      : 'bg-white/20'
                  } ${day.isToday ? 'ring-2 ring-white/60' : ''}`}
                  style={{ height: `${height}%` }}
                  title={`${day.count} ${day.count === 1 ? 'entry' : 'entries'} on ${day.date}`}
                >
                  {hasEntries && (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-white text-xs font-bold drop-shadow-lg">
                        {day.count}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Day label */}
              <span className={`text-xs font-medium ${
                day.isToday ? 'text-white drop-shadow-lg' : 'text-white/70'
              }`}>
                {day.dayLetter}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-white/30">
        <p className="text-white/80 text-xs drop-shadow-lg text-center">
          Last 7 days • {weeklyData.filter(d => d.count > 0).length} active days
        </p>
      </div>
    </div>
  );
};

export default WeeklyActivityWidget;
