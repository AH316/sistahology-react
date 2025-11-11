import React from 'react';
import { Edit3, Trash2, BookOpen, Check } from 'lucide-react';
import type { Journal } from '../types';
import { formatDate } from '../utils/performance';

interface JournalCardProps {
  journal: Journal;
  entryCount: number;
  lastEntryDate: string | null;
  onEdit: (journal: Journal) => void;
  onDelete: (journal: Journal) => void;
  onSelect: (journalId: string) => void;
  isSelected: boolean;
}

const JournalCard: React.FC<JournalCardProps> = ({
  journal,
  entryCount,
  lastEntryDate,
  onEdit,
  onDelete,
  onSelect,
  isSelected
}) => {
  const handleCardClick = () => {
    onSelect(journal.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(journal);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(journal);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`
        glass rounded-2xl p-6 backdrop-blur-lg border-2 bg-white/10 shadow-xl
        transition-all duration-300 cursor-pointer group
        hover:shadow-2xl hover:-translate-y-1
        ${isSelected
          ? 'border-sistah-pink bg-white/20 ring-2 ring-sistah-pink ring-offset-2'
          : 'border-white/40 hover:border-white/60 hover:bg-white/15'
        }
      `}
      role="button"
      tabIndex={0}
      aria-label={`${journal.journalName} journal${isSelected ? ', currently selected' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Header with Icon and Color */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-lg transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: journal.color }}
          >
            {journal.icon || '📔'}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-2">
              {journal.journalName}
            </h3>
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: journal.color }}
              ></div>
              <span className="text-xs text-gray-800">
                {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
              </span>
            </div>
          </div>
        </div>

        {/* Selected Indicator */}
        {isSelected && (
          <div className="bg-sistah-pink text-white rounded-full p-1.5 shadow-lg">
            <Check className="w-4 h-4" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="space-y-2 mb-4 pt-4 border-t border-white/20">
        <div className="flex items-center text-sm text-gray-800">
          <BookOpen className="w-4 h-4 mr-2" />
          <span>
            {entryCount === 0 ? 'No entries yet' : `${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`}
          </span>
        </div>
        <div className="text-sm text-gray-800">
          <span className="font-medium">Last updated:</span>{' '}
          {lastEntryDate ? formatDate(lastEntryDate) : 'Never'}
        </div>
        <div className="text-xs text-gray-800">
          Created {formatDate(journal.createdAt)}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 pt-4 border-t border-white/20">
        <button
          onClick={handleEdit}
          className="flex-1 px-3 py-2 bg-white/20 hover:bg-white/30 text-gray-800 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 border border-white/30 hover:border-white/50 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
          aria-label={`Edit ${journal.journalName}`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit</span>
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-700 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 border border-red-500/30 hover:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
          aria-label={`Delete ${journal.journalName}`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};

export default JournalCard;
