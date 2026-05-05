
import React from 'react';
import { Selection, PricingConstants } from '../types';
import { COST_MULTIPLIER, DRONE_DISCOUNT_FACTOR } from '../constants';
import { translations, Language } from '../translations';

interface BudgetAllocationProps {
  lang: Language;
  selection: Selection;
  onUpdate: (update: Partial<Selection>) => void;
  maxBudget: number;
  pricing: PricingConstants;
  type: 'photo' | 'video' | 'content';
  showSpecialist?: boolean;
  allowedItems?: ('hours' | 'sessions' | 'books' | 'droneSessions')[];
}

const BudgetAllocation: React.FC<BudgetAllocationProps> = ({ 
  lang,
  selection, 
  onUpdate, 
  maxBudget, 
  pricing, 
  type,
  showSpecialist = true,
  allowedItems = ['hours', 'sessions', 'books', 'droneSessions']
}) => {
  const t = translations[lang].services;
  const currentHourPrice = selection.secondSpecialist ? pricing.HOUR_PRICE * 2 : pricing.HOUR_PRICE;

  const isFreeSessionEligible = type === 'photo' && selection.hours >= 10 && selection.sessions > 0;
  const effectiveSessions = isFreeSessionEligible ? Math.max(0, selection.sessions - 1) : (selection.sessionsEnabled ? selection.sessions : 0);

  // Drone Discount Math: First is full price, subsequent are discounted
  const droneCost = selection.droneEnabled && selection.droneSessions > 0
    ? pricing.DRONE_PRICE + (selection.droneSessions - 1) * (pricing.DRONE_PRICE * DRONE_DISCOUNT_FACTOR)
    : 0;

  const baseTotalCost = 
    (selection.hoursEnabled ? selection.hours * currentHourPrice : 0) +
    (effectiveSessions * pricing.SESSION_PRICE) +
    (selection.booksEnabled ? selection.books * pricing.BOOK_PRICE : 0) +
    droneCost;

  const actualTotalCost = Math.round(baseTotalCost * COST_MULTIPLIER);

  const labels = {
    hours: type === 'photo' ? t.photoHours : type === 'video' ? t.videoHours : t.contentHours,
    sessions: type === 'photo' ? t.photoSessions : t.loveStory,
    books: type === 'photo' ? t.photoBooks : t.crane,
    drone: type === 'photo' ? t.dronePhoto : t.droneVideo,
    specialist: type === 'photo' ? t.secondPhoto : t.secondVideo,
    totalCost: `${t.totalCost} ${type === 'photo' ? t.photography : type === 'video' ? t.videography : t.contentCreator}`
  };

  const allItems = [
    { 
      id: 'hours' as const,
      name: labels.hours, 
      count: selection.hours, 
      enabled: selection.hoursEnabled,
      price: currentHourPrice, 
      unitLabel: t.perHour,
      min: 4
    },
    { 
      id: 'sessions' as const,
      name: labels.sessions, 
      count: selection.sessions, 
      enabled: selection.sessionsEnabled,
      price: pricing.SESSION_PRICE, 
      unitLabel: type === 'photo' ? t.perSession : t.perLoveStory,
      min: 0,
      isFree: isFreeSessionEligible
    },
    { 
      id: 'books' as const,
      name: labels.books, 
      count: selection.books, 
      enabled: selection.booksEnabled,
      price: pricing.BOOK_PRICE, 
      unitLabel: type === 'photo' ? t.perBook : t.perLocation,
      min: 0
    },
    { 
      id: 'droneSessions' as const,
      name: labels.drone, 
      count: selection.droneSessions, 
      enabled: selection.droneEnabled,
      price: pricing.DRONE_PRICE, 
      unitLabel: t.perSession,
      min: 0,
      isDiscounted: selection.droneSessions > 1
    },
  ];

  const items = allItems.filter(item => allowedItems.includes(item.id));

  const handleAdjust = (id: string, delta: number) => {
    if (!selection.serviceEnabled) return;
    const currentVal = selection[id as keyof Selection] as number;
    const itemConfig = items.find(item => item.id === id);
    const minVal = itemConfig?.min ?? 0;
    
    const newVal = Math.max(minVal, currentVal + delta);
    const update: any = { [id]: newVal };
    
    if (id === 'hours') update.hoursEnabled = true;
    if (id === 'sessions') update.sessionsEnabled = true;
    if (id === 'books') update.booksEnabled = true;
    if (id === 'droneSessions') update.droneEnabled = true;
    
    onUpdate(update);
  };

  return (
    <div className="space-y-6 mt-10 w-full overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div 
            key={item.id} 
            className={`relative group overflow-hidden bg-white py-4 pl-6 pr-3 rounded-2xl shadow-sm border transition-all hover:shadow-md flex flex-col ${
              item.enabled ? 'border-accent ring-1 ring-accent/20' : 'border-gray-100 opacity-60'
            }`}
          >
            {/* Header info */}
            <div className="flex justify-between items-start mb-1 gap-2">
              <div className="flex flex-col min-w-0 flex-1">
                <h4 className="text-[12px] md:text-[14.4px] font-bold text-gray-800 leading-tight pt-1">
                  {item.name}
                </h4>
                {item.id === 'sessions' && type === 'photo' && item.isFree && (
                  <span className="text-[9px] font-black text-accent uppercase tracking-tighter bg-accent/10 px-1.5 py-0.5 rounded inline-block w-fit mt-1">
                    {t.freeSession}
                  </span>
                )}
                {item.id === 'droneSessions' && item.isDiscounted && (
                  <span className="text-[9px] font-black text-accent uppercase tracking-tighter bg-accent/10 px-1.5 py-0.5 rounded inline-block w-fit mt-1">
                    {t.droneDiscount}
                  </span>
                )}
              </div>
              <div className="text-lg font-bold text-accent bg-accent/5 px-2 py-1 rounded-lg whitespace-nowrap">
                {Math.round(
                  (item.id === 'sessions' && item.isFree 
                    ? Math.max(0, item.count - 1) * item.price 
                    : item.id === 'droneSessions' && item.count > 0 
                      ? pricing.DRONE_PRICE + (item.count - 1) * (pricing.DRONE_PRICE * DRONE_DISCOUNT_FACTOR)
                      : item.count * item.price
                  ) * COST_MULTIPLIER
                )} €
              </div>
            </div>
            
            {/* Pricing Details */}
            <div className="text-[11px] text-gray-500 mb-3 leading-relaxed min-h-[50px]">
              <span className="block">{item.price} € {item.unitLabel}</span>
              {item.id === 'sessions' && type === 'photo' && (
                <span className="text-[11px] text-accent font-bold block mt-1">
                   {t.freeSessionHint}
                </span>
              )}
              {item.id === 'droneSessions' && (
                <span className="text-[11px] text-accent font-bold block mt-1">
                   {t.droneDiscountHint}
                </span>
              )}
            </div>

            {/* Specialist Checkbox - Positioned ABOVE the quantity selector */}
            <div className="mb-4">
              {item.id === 'hours' && showSpecialist ? (
                <label className="flex items-center space-x-2 cursor-pointer group/check">
                  <input 
                    type="checkbox"
                    checked={selection.secondSpecialist}
                    onChange={(e) => onUpdate({ secondSpecialist: e.target.checked })}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 group-hover/check:text-accent transition-colors break-words">
                    {labels.specialist}
                  </span>
                </label>
              ) : (
                <div className="h-[18px]" aria-hidden="true" /> /* Spacer to maintain height alignment */
              )}
            </div>
            
            {/* Quantity Selector - Pushed to the bottom to ensure they align in the same line across row */}
            <div className="mt-auto flex items-center justify-between bg-gray-50 rounded-xl p-1.5">
              <button 
                onClick={() => handleAdjust(item.id, -1)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors text-[26.4px] font-bold"
                aria-label="Decrease"
              >
                -
              </button>
              <span className="text-[26.4px] font-serif font-bold text-primary px-3">
                {item.count}
              </span>
              <button 
                onClick={() => handleAdjust(item.id, 1)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors text-[26.4px] font-bold"
                aria-label="Increase"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="py-6 px-4 md:px-8 rounded-[2rem] border transition-all bg-accent/5 border-accent/20 shadow-sm overflow-hidden">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 w-full">
            <p className="text-[10px] md:text-xs uppercase tracking-[0.05em] md:tracking-widest text-gray-500 font-bold mb-1 break-words">{labels.totalCost}</p>
            <p className="text-3xl md:text-4xl font-serif font-bold text-primary whitespace-nowrap">
              {selection.serviceEnabled ? actualTotalCost : 0} €
            </p>
          </div>
          {type === 'photo' && selection.hours < 10 && (
            <div className="text-center">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.1em]">{t.promoAlert}</p>
              <p className="text-[11px] text-gray-500 italic px-2">{t.promoText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetAllocation;
