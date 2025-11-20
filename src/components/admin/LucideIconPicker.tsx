import React from 'react';
import * as Icons from 'lucide-react';

interface LucideIconPickerProps {
  selectedIcon: string;
  onIconChange: (icon: string) => void;
}

// Common icons used throughout the app
const COMMON_ICONS = [
  'Heart',
  'Users',
  'Sparkles',
  'BookOpen',
  'Lock',
  'Search',
  'Calendar',
  'Mail',
  'Phone',
  'MapPin',
  'Star',
  'Flower2',
  'Gift',
  'Smile',
  'TrendingUp',
  'Target',
  'Award',
  'Zap',
  'Coffee',
  'Sun',
];

const LucideIconPicker: React.FC<LucideIconPickerProps> = ({
  selectedIcon,
  onIconChange,
}) => {
  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Heart;
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-black">
        Icon (Lucide React)
      </label>
      <div className="grid grid-cols-5 gap-2">
        {COMMON_ICONS.map((iconName) => {
          const isSelected = selectedIcon === iconName;
          const IconComponent = getIconComponent(iconName);

          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onIconChange(iconName)}
              className={`
                relative w-full h-12 rounded-lg transition-all duration-200
                bg-white/20 hover:bg-white/30 backdrop-blur-sm
                border-2 flex items-center justify-center
                focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2
                ${
                  isSelected
                    ? 'border-pink-500 bg-white/40 shadow-lg scale-105'
                    : 'border-gray-300 hover:scale-105 hover:shadow-md'
                }
              `}
              aria-label={`Select ${iconName} icon`}
              aria-pressed={isSelected}
              title={iconName}
            >
              <IconComponent className="w-6 h-6 text-gray-700" />
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-600">
        Selected: <span className="font-mono font-semibold">{selectedIcon}</span>
      </p>
    </div>
  );
};

export default LucideIconPicker;
