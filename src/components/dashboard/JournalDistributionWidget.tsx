import React from 'react';
import type { Journal, Entry } from '../../types';
import { BookOpen } from 'lucide-react';

interface JournalDistributionWidgetProps {
  journals: Journal[];
  entries: Entry[];
}

const JournalDistributionWidget: React.FC<JournalDistributionWidgetProps> = ({ journals, entries }) => {
  // Calculate entry count per journal
  const getJournalDistribution = () => {
    const distribution = journals.map(journal => {
      const entryCount = entries.filter(
        entry => entry.journalId === journal.id && !entry.isArchived
      ).length;

      return {
        journalId: journal.id,
        journalName: journal.journalName,
        color: journal.color,
        count: entryCount
      };
    });

    // Sort by entry count (descending)
    return distribution.sort((a, b) => b.count - a.count);
  };

  const distribution = getJournalDistribution();
  const maxCount = Math.max(...distribution.map(d => d.count), 1);
  const displayedJournals = distribution.slice(0, 5);
  const hasMore = distribution.length > 5;

  if (journals.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg border-2 border-white/40 rounded-3xl p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
        <h3 className="text-lg font-semibold text-white drop-shadow-lg mb-4">Journal Distribution</h3>

        <div className="text-center py-8">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/80 text-sm drop-shadow-lg">
            Create a journal to see distribution
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg border-2 border-white/40 rounded-3xl p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white drop-shadow-lg">Journal Distribution</h3>
        <span className="text-white/90 text-sm drop-shadow-lg">{journals.length} journals</span>
      </div>

      <div className="space-y-3">
        {displayedJournals.map((journal) => {
          const widthPercentage = maxCount > 0 ? (journal.count / maxCount) * 100 : 0;

          return (
            <div key={journal.journalId} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: journal.color }}
                  />
                  <span className="text-white text-sm drop-shadow-lg truncate">
                    {journal.journalName}
                  </span>
                </div>
                <span className="text-white/90 text-sm font-medium drop-shadow-lg ml-2">
                  {journal.count}
                </span>
              </div>

              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${widthPercentage}%`,
                    backgroundColor: journal.color,
                    boxShadow: `0 0 8px ${journal.color}40`
                  }}
                />
              </div>
            </div>
          );
        })}

        {hasMore && (
          <div className="pt-2 text-center">
            <span className="text-white/70 text-xs drop-shadow-lg">
              +{distribution.length - 5} more journals
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-white/30">
        <p className="text-white/80 text-xs drop-shadow-lg text-center">
          Showing top {Math.min(5, journals.length)} by entry count
        </p>
      </div>
    </div>
  );
};

export default JournalDistributionWidget;
