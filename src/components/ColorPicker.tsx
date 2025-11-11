import React from 'react';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

// Sistahology brand colors with names
const COLORS = [
  { name: 'Sistah Pink', value: '#FF69B4' },
  { name: 'Deep Rose', value: '#FF1493' },
  { name: 'Soft Purple', value: '#DDA0DD' },
  { name: 'Warm Orange', value: '#FFA07A' },
  { name: 'Sunset Coral', value: '#FF7F50' },
  { name: 'Golden Yellow', value: '#FFD700' },
  { name: 'Lavender', value: '#E6E6FA' },
  { name: 'Peachy Pink', value: '#FFDAB9' }
];

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorChange }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-800">
        Journal Color
      </label>
      <div className="grid grid-cols-4 gap-3">
        {COLORS.map((color) => {
          const isSelected = selectedColor === color.value;

          return (
            <button
              key={color.value}
              type="button"
              onClick={() => onColorChange(color.value)}
              className={`
                relative w-full h-12 rounded-lg transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2
                ${isSelected
                  ? 'ring-2 ring-offset-2 ring-gray-800 shadow-lg scale-105'
                  : 'hover:scale-105 hover:shadow-md'
                }
              `}
              style={{ backgroundColor: color.value }}
              aria-label={`Select ${color.name}`}
              aria-pressed={isSelected}
              title={color.name}
            >
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                    <Check className="w-4 h-4 text-gray-800" strokeWidth={3} />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-800">
        Choose a color to represent your journal
      </p>
    </div>
  );
};

export default ColorPicker;
