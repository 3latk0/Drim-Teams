
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
  isBundle?: boolean;
  isEarlyBird?: boolean;
  isDarkMode?: boolean;
}

const BudgetAllocation: React.FC<BudgetAllocationProps> = ({ 
  lang,
  selection, 
  onUpdate, 
  maxBudget, 
  pricing, 
  type,
  showSpecialist = true,
  allowedItems = ['hours', 'sessions', 'books', 'droneSessions'],
  isBundle = false,
  isEarlyBird = false,
  isDarkMode = false
}) => {
  const t = translations[lang].services;
  // Base hourly price calculation
  let baseHourPrice = pricing.HOUR_PRICE;
  let discountedBaseHourPrice = baseHourPrice;
  if (isBundle && (type === 'photo' || type === 'video')) discountedBaseHourPrice *= 0.90;
  if (isEarlyBird && (type === 'photo' || type === 'video')) discountedBaseHourPrice *= 0.80;

  let currentHourPrice = discountedBaseHourPrice;
  let originalHourPrice = selection.secondSpecialist ? baseHourPrice * 2 : baseHourPrice;

  if (selection.secondSpecialist) {
    if (type === 'video') {
      // Fixed 35, no discount for second videographer
      currentHourPrice = discountedBaseHourPrice + 35;
      originalHourPrice = baseHourPrice + 35;
    } else {
      // Standard logic for others
      currentHourPrice = discountedBaseHourPrice * 2;
    }
  }

  const isFreeSessionEligible = type === 'photo' && selection.hours >= 10 && selection.sessions > 0;
  const effectiveSessions = isFreeSessionEligible ? Math.max(0, selection.sessions - 1) : (selection.sessionsEnabled ? selection.sessions : 0);

  // Drone Discount Math: First is full price, subsequent are discounted
  const droneCost = selection.droneEnabled && selection.droneSessions > 0
    ? pricing.DRONE_PRICE + (selection.droneSessions - 1) * (pricing.DRONE_PRICE * DRONE_DISCOUNT_FACTOR)
    : 0;

  const booksCost = selection.booksEnabled && selection.books > 0
    ? pricing.BOOK_PRICE + (selection.books - 1) * (pricing.BOOK_ADDITIONAL_PRICE ?? pricing.BOOK_PRICE)
    : 0;

  const baseTotalCost = 
    (selection.hoursEnabled ? selection.hours * currentHourPrice : 0) +
    (effectiveSessions * pricing.SESSION_PRICE) +
    booksCost +
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
            className={`relative group overflow-hidden py-4 pl-6 pr-3 rounded-2xl shadow-sm border transition-all hover:shadow-md flex flex-col ${
              isDarkMode 
                ? (item.enabled ? 'bg-white/10 border-accent ring-1 ring-accent/40' : 'bg-white/5 border-white/10 opacity-60')
                : (item.enabled ? 'bg-white border-accent ring-1 ring-accent/20' : 'bg-white border-gray-100 opacity-60')
            }`}
          >
            {/* Header info */}
            <div className="flex justify-between items-start mb-1 gap-2">
              <div className="flex flex-col min-w-0 flex-1">
                <h4 className={`text-[14.4px] md:text-lg font-bold leading-tight pt-1 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {item.name}
                </h4>
                {item.id === 'sessions' && type === 'photo' && item.isFree && (
                  <span className="text-[10.8px] md:text-xs font-black text-accent uppercase tracking-tighter bg-accent/10 px-1.5 py-0.5 rounded inline-block w-fit mt-1">
                    {t.freeSession}
                  </span>
                )}
                {item.id === 'droneSessions' && item.isDiscounted && (
                  <span className="text-[10.8px] md:text-xs font-black text-accent uppercase tracking-tighter bg-accent/10 px-1.5 py-0.5 rounded inline-block w-fit mt-1">
                    {t.droneDiscount}
                  </span>
                )}
              </div>
              <div className={`text-[21.6px] md:text-xl font-bold text-accent px-2 py-1 rounded-lg whitespace-nowrap transition-colors ${isDarkMode ? 'bg-accent/20' : 'bg-accent/5'}`}>
                {Math.round(
                  (item.id === 'sessions' && item.isFree 
                    ? Math.max(0, item.count - 1) * item.price 
                    : item.id === 'droneSessions' && item.count > 0 
                      ? pricing.DRONE_PRICE + (item.count - 1) * (pricing.DRONE_PRICE * DRONE_DISCOUNT_FACTOR)
                      : item.id === 'books' && item.count > 0 && pricing.BOOK_ADDITIONAL_PRICE
                        ? pricing.BOOK_PRICE + (item.count - 1) * pricing.BOOK_ADDITIONAL_PRICE
                        : item.count * item.price
                  ) * COST_MULTIPLIER
                )} €
              </div>
            </div>
            
            {/* Pricing Details */}
            <div className={`text-[13.2px] md:text-sm mb-3 leading-relaxed min-h-[50px] transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="block italic">
                {item.id === 'hours' && (type === 'photo' || type === 'video') ? (
                  <>
                    {(isBundle || isEarlyBird) && <span className="line-through mr-1 opacity-50">{originalHourPrice} €</span>}
                    <span className="font-bold text-accent">{item.price.toFixed(1)} €</span>
                  </>
                ) : item.id === 'books' && pricing.BOOK_ADDITIONAL_PRICE && item.count > 1 ? (
                  <>
                    <span className="font-bold text-accent">{pricing.BOOK_PRICE} €</span> + {(item.count - 1)} × <span className="font-bold text-accent">{pricing.BOOK_ADDITIONAL_PRICE} €</span>
                  </>
                ) : (
                  <>{item.price} €</>
                )}
                {' '}{item.unitLabel}
              </span>
              {item.id === 'hours' && (type === 'photo' || type === 'video') && (isBundle || isEarlyBird) && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {isBundle && (
                    <span className="text-[10.8px] md:text-xs font-black text-accent uppercase tracking-tighter bg-accent/10 px-1.5 py-0.5 rounded inline-block w-fit not-italic">
                      -10% {t.bundleDiscount}
                    </span>
                  )}
                  {isEarlyBird && (
                    <span className="text-[10.8px] md:text-xs font-black text-accent uppercase tracking-tighter bg-accent/10 px-1.5 py-0.5 rounded inline-block w-fit not-italic">
                      -20% {t.earlyBirdDiscount}
                    </span>
                  )}
                </div>
              )}
              {item.id === 'sessions' && type === 'photo' && (
                <span className="text-[13.2px] md:text-sm text-accent font-bold block mt-1">
                   {t.freeSessionHint}
                </span>
              )}
              {item.id === 'droneSessions' && (
                <span className="text-[13.2px] md:text-sm text-accent font-bold block mt-1">
                   {t.droneDiscountHint}
                </span>
              )}
              {item.id === 'books' && type === 'photo' && (
                <span className="text-[10.8px] md:text-xs font-black text-accent uppercase tracking-tighter bg-accent/10 px-1.5 py-0.5 rounded inline-block w-fit mt-1 not-italic">
                  {t.bookAdditional}
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
                  <div className="flex flex-col">
                    <span className={`text-[13.2px] md:text-sm font-bold uppercase tracking-wider group-hover/check:text-accent transition-colors break-words ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {labels.specialist}
                    </span>
                    {type === 'video' && (
                      <span className={`text-[10px] md:text-[11px] font-bold transition-colors group-hover/check:text-accent ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {translations[lang].services.multiCam}
                      </span>
                    )}
                  </div>
                </label>
              ) : (
                <div className="h-[18px]" aria-hidden="true" /> /* Spacer to maintain height alignment */
              )}
            </div>
            
            {/* Quantity Selector - Pushed to the bottom to ensure they align in the same line across row */}
            <div className={`mt-auto flex items-center justify-between rounded-xl p-1.5 transition-colors ${isDarkMode ? 'bg-white/10' : 'bg-gray-50'}`}>
              <button 
                onClick={() => handleAdjust(item.id, -1)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors text-[31.7px] md:text-3xl font-bold ${isDarkMode ? 'bg-white/10 border-white/10 text-white hover:bg-white/20' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                aria-label="Decrease"
              >
                -
              </button>
              <span className={`text-[31.7px] md:text-3xl font-serif font-bold px-3 transition-colors ${isDarkMode ? 'text-white' : 'text-primary'}`}>
                {item.count}
              </span>
              <button 
                onClick={() => handleAdjust(item.id, 1)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors text-[31.7px] md:text-3xl font-bold ${isDarkMode ? 'bg-white/10 border-white/10 text-white hover:bg-white/20' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                aria-label="Increase"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={`py-6 px-4 md:px-8 rounded-[2rem] border transition-all shadow-sm overflow-hidden ${isDarkMode ? 'bg-accent/10 border-accent/40' : 'bg-accent/5 border-accent/20'}`}>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 w-full">
            <p className={`text-[12px] md:text-sm uppercase tracking-[0.05em] md:tracking-widest font-bold mb-1 break-words transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{labels.totalCost}</p>
            <p className={`text-[36px] md:text-5xl font-serif font-bold whitespace-nowrap transition-colors ${isDarkMode ? 'text-white' : 'text-primary'}`}>
              {selection.serviceEnabled ? actualTotalCost : 0} €
            </p>
          </div>
          <div className="text-center space-y-4">
            {type === 'photo' && selection.hours < 10 && (
              <div>
                <p className={`text-[12px] md:text-xs font-medium uppercase tracking-[0.1em] transition-colors ${isDarkMode ? 'text-accent' : 'text-gray-400'}`}>{t.promoAlert}</p>
                <p className={`text-[13.2px] md:text-sm italic px-2 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.promoText}</p>
              </div>
            )}
            {isBundle && (type === 'photo' || type === 'video') && (
              <div>
                <p className="text-[12px] md:text-xs text-accent font-medium uppercase tracking-[0.1em]">{t.bundleAlert}</p>
                <p className={`text-[13.2px] md:text-sm italic px-2 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.bundleText}</p>
              </div>
            )}
            {isEarlyBird && (type === 'photo' || type === 'video') && (
              <div>
                <p className="text-[12px] md:text-xs text-accent font-medium uppercase tracking-[0.1em]">{t.earlyBirdAlert}</p>
                <p className={`text-[13.2px] md:text-sm italic px-2 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.earlyBirdText}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetAllocation;
