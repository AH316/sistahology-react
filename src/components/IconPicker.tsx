import React from 'react';

interface IconPickerProps {
  selectedIcon: string;
  onIconChange: (icon: string) => void;
}

// Emoji options for journal icons
const ICONS = [
  { emoji: '📔', name: 'Notebook' },
  { emoji: '💭', name: 'Thought Bubble' },
  { emoji: '🌸', name: 'Blossom' },
  { emoji: '⭐', name: 'Star' },
  { emoji: '💖', name: 'Sparkling Heart' },
  { emoji: '✨', name: 'Sparkles' },
  { emoji: '🎨', name: 'Artist Palette' },
  { emoji: '🌙', name: 'Crescent Moon' }
];

const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onIconChange }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-800">
        Journal Icon (Optional)
      </label>
      <div className="grid grid-cols-4 gap-3">
        {ICONS.map((icon) => {
          const isSelected = selectedIcon === icon.emoji;

          return (
            <button
              key={icon.emoji}
              type="button"
              onClick={() => onIconChange(icon.emoji)}
              className={`
                relative w-full h-12 rounded-lg transition-all duration-200
                bg-white/20 hover:bg-white/30 backdrop-blur-sm
                border-2 flex items-center justify-center text-2xl
                focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2
                ${isSelected
                  ? 'border-sistah-pink bg-white/40 shadow-lg scale-105'
                  : 'border-white/30 hover:scale-105 hover:shadow-md'
                }
              `}
              aria-label={`Select ${icon.name} icon`}
              aria-pressed={isSelected}
              title={icon.name}
            >
              {icon.emoji}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-800">
        Optional: Pick an icon to personalize your journal
      </p>
    </div>
  );
};

export default IconPicker;
