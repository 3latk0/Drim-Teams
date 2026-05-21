
import React, { useMemo } from 'react';
import { translations, Language } from '../translations';

interface EventSchedulingProps {
  lang: Language;
  date: string;
  startTime: string;
  endTime: string;
  photoEnabled: boolean;
  videoEnabled: boolean;
  contentEnabled: boolean;
  onUpdate: (data: { date?: string; startTime?: string; endTime?: string }) => void;
  onTogglePhoto: (val: boolean) => void;
  onToggleVideo: (val: boolean) => void;
  onToggleContent: (val: boolean) => void;
  isDarkMode?: boolean;
}

const EventScheduling: React.FC<EventSchedulingProps> = ({ 
  lang,
  date, 
  startTime, 
  endTime, 
  photoEnabled,
  videoEnabled,
  contentEnabled,
  onUpdate,
  onTogglePhoto,
  onToggleVideo,
  onToggleContent,
  isDarkMode = false
}) => {
  const t = translations[lang].scheduling;
  
  const times = useMemo(() => {
    const list = [];
    for (let h = 0; h < 24; h++) {
      const hour = h.toString().padStart(2, '0');
      list.push(`${hour}:00`);
    }
    return list;
  }, []);

  const [currentYear, currentMonth, currentDay] = useMemo(() => {
    const parts = date.split('-');
    return [parts[0], parts[1], parts[2]];
  }, [date]);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (current + i).toString());
  }, []);

  const monthOptions = useMemo(() => 
    t.months.map((name, i) => ({ val: (i + 1).toString().padStart(2, '0'), name })),
  [t.months]);

  const days = useMemo(() => {
    const yearNum = parseInt(currentYear);
    const monthNum = parseInt(currentMonth);
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => (i + 1).toString().padStart(2, '0'));
  }, [currentYear, currentMonth]);

  const handleDatePartChange = (part: 'year' | 'month' | 'day', value: string) => {
    let y = currentYear;
    let m = currentMonth;
    let d = currentDay;
    if (part === 'year') y = value;
    if (part === 'month') m = value;
    if (part === 'day') d = value;
    const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
    if (parseInt(d) > lastDay) d = lastDay.toString().padStart(2, '0');
    onUpdate({ date: `${y}-${m}-${d}` });
  };

  const calculateDuration = () => {
    if (!startTime || !endTime) return null;
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    let startMins = h1 * 60 + m1;
    let endMins = h2 * 60 + m2;
    
    // Support cross-midnight spanning
    if (endMins <= startMins) {
      endMins += 24 * 60;
    }
    
    const diff = endMins - startMins;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    
    const hText = lang === 'en' ? (hours === 1 ? 'hour' : 'hours') : lang === 'mk' ? (hours === 1 ? 'час' : 'часови') : lang === 'tr' ? 'saat' : 'orë';
    const mText = lang === 'en' ? 'm' : lang === 'mk' ? 'м' : lang === 'tr' ? 'dk' : 'm';

    if (mins > 0) {
      const hUnit = lang === 'en' ? 'h' : lang === 'mk' ? 'ч' : lang === 'tr' ? 'sa' : 'h';
      return `${hours}${hUnit} ${mins}${mText}`;
    }
    return `${hours} ${hText}`;
  };

  const duration = calculateDuration();
  const selectBaseStyles = `bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2.5 focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all font-medium appearance-none cursor-pointer text-[16.1px] ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-primary'}`;

  return (
    <div className="w-full mb-12">
      <div className="text-center mb-8">
        <h2 className={`text-[41.4px] md:text-[57.5px] font-serif font-bold mb-4 transition-colors ${isDarkMode ? 'text-white' : 'text-primary'}`}>{t.title}</h2>
        <div className="w-20 h-[2px] bg-accent mx-auto"></div>
      </div>

      <div className={`shadow-xl rounded-[2.5rem] py-6 px-8 md:py-8 md:px-10 space-y-8 transition-colors ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          <div className="space-y-2">
            <label className="text-[11.5px] font-bold uppercase tracking-widest text-accent flex items-center">
              {t.dateLabel}
            </label>
            <div className="flex gap-2">
              <select value={currentDay} onChange={(e) => handleDatePartChange('day', e.target.value)} className={`${selectBaseStyles} flex-[0.6] w-0`}>
                {days.map(d => <option key={d} value={d} className={isDarkMode ? 'bg-[#1a1a1a]' : ''}>{d}</option>)}
              </select>
              <select value={currentMonth} onChange={(e) => handleDatePartChange('month', e.target.value)} className={`${selectBaseStyles} flex-[1.6] w-0`}>
                {monthOptions.map(m => <option key={m.val} value={m.val} className={isDarkMode ? 'bg-[#1a1a1a]' : ''}>{m.name}</option>)}
              </select>
              <select value={currentYear} onChange={(e) => handleDatePartChange('year', e.target.value)} className={`${selectBaseStyles} flex-[1] w-0`}>
                {years.map(y => <option key={y} value={y} className={isDarkMode ? 'bg-[#1a1a1a]' : ''}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11.5px] font-bold uppercase tracking-widest text-accent flex items-center">
              {t.startLabel}
            </label>
            <select value={startTime} onChange={(e) => onUpdate({ startTime: e.target.value })} className={`${selectBaseStyles} w-full`}>
              {times.map(t => <option key={t} value={t} className={isDarkMode ? 'bg-[#1a1a1a]' : ''}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-2 relative">
            <label className="text-[11.5px] font-bold uppercase tracking-widest text-accent flex items-center">
              {t.endLabel}
            </label>
            <select value={endTime} onChange={(e) => onUpdate({ endTime: e.target.value })} className={`${selectBaseStyles} w-full`}>
              {times.map(t => <option key={t} value={t} className={isDarkMode ? 'bg-[#1a1a1a]' : ''}>{t}</option>)}
            </select>
            {duration && (
              <div className={`absolute -bottom-6 right-0 text-[10.4px] font-bold text-accent uppercase tracking-tighter px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-accent/20' : 'bg-accent/5'}`}>
                {t.duration}: {duration}
              </div>
            )}
          </div>
        </div>

        <div className={`pt-6 border-t transition-colors ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
          <p className="text-[11.5px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 text-center">{t.includeServices}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className={`flex items-center justify-between py-3 px-4 rounded-2xl border transition-all cursor-pointer group ${photoEnabled ? 'bg-accent/5 border-accent shadow-sm' : isDarkMode ? 'bg-white/5 border-white/10 opacity-60' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
              <div className="flex items-center space-x-3">
                <span className={`text-[13.8px] font-bold uppercase tracking-widest transition-colors ${photoEnabled ? (isDarkMode ? 'text-white' : 'text-primary') : 'text-gray-400'}`}>{t.photography}</span>
              </div>
              <input type="checkbox" checked={photoEnabled} onChange={(e) => onTogglePhoto(e.target.checked)} className="w-5 h-5 accent-accent rounded cursor-pointer" />
            </label>

            <label className={`flex items-center justify-between py-3 px-4 rounded-2xl border transition-all cursor-pointer group ${videoEnabled ? 'bg-accent/5 border-accent shadow-sm' : isDarkMode ? 'bg-white/5 border-white/10 opacity-60' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
              <div className="flex items-center space-x-3">
                <span className={`text-[13.8px] font-bold uppercase tracking-widest transition-colors ${videoEnabled ? (isDarkMode ? 'text-white' : 'text-primary') : 'text-gray-400'}`}>{t.videography}</span>
              </div>
              <input type="checkbox" checked={videoEnabled} onChange={(e) => onToggleVideo(e.target.checked)} className="w-5 h-5 accent-accent rounded cursor-pointer" />
            </label>

            <label className={`flex items-center justify-between py-3 px-4 rounded-2xl border transition-all cursor-pointer group ${contentEnabled ? 'bg-accent/5 border-accent/40 shadow-sm' : isDarkMode ? 'bg-white/5 border-white/10 opacity-60' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
              <div className="flex items-center space-x-3">
                <span className={`text-[13.8px] font-bold uppercase tracking-widest transition-colors ${contentEnabled ? (isDarkMode ? 'text-white' : 'text-primary') : 'text-gray-400'}`}>{t.contentCreator}</span>
              </div>
              <input type="checkbox" checked={contentEnabled} onChange={(e) => onToggleContent(e.target.checked)} className="w-5 h-5 accent-accent rounded cursor-pointer" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventScheduling;
