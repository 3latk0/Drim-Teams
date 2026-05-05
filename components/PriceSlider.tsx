
import React from 'react';

interface PriceSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  title?: string;
  onChange: (val: number) => void;
}

const PriceSlider: React.FC<PriceSliderProps> = ({ 
  value, 
  min = 50, 
  max = 3000, 
  step = 25, 
  title = "Target Budget", 
  onChange 
}) => {
  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-end mb-1">
        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</h3>
          <p className="text-3xl font-serif font-bold text-primary whitespace-nowrap">
            {value} €
          </p>
        </div>
        <div className="text-right pb-1">
          <span className="text-[9px] text-accent font-bold uppercase tracking-tighter bg-accent/10 px-2 py-0.5 rounded-full">Interactive Goal</span>
        </div>
      </div>
      
      <div className="relative group flex items-center h-6">
        <input 
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-accent"
        />
      </div>
      
      <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
        <span>{min} €</span>
        <span>1500 €</span>
        <span>{max} €+</span>
      </div>
    </div>
  );
};

export default PriceSlider;
