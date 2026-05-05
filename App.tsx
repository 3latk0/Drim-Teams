
import React, { useState, useCallback, useMemo } from 'react';
import BudgetAllocation from './components/BudgetAllocation';
import ChatAssistant from './components/ChatAssistant';
import EventScheduling from './components/EventScheduling';
import HeroSlideshow from './components/HeroSlideshow';
import { PHOTO_PRICING, VIDEO_PRICING, CONTENT_PRICING, COST_MULTIPLIER, DRONE_DISCOUNT_FACTOR } from './constants';
import { Selection, PricingConstants } from './types';
import { translations, Language } from './translations';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    town: '',
    phone: '',
    additionalNote: ''
  });

  // Helper to format date
  const formatDateNarrative = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = t.scheduling.months[date.getMonth()];
    const year = date.getFullYear();

    const getOrdinal = (n: number) => {
      if (lang !== 'en') return n;
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return lang === 'en' 
      ? `${getOrdinal(day)} of ${month} ${year}`
      : `${day} ${month} ${year}`;
  };

  // Helper to calculate hours
  const getDurationHours = (start: string, end: string): number => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let startMins = h1 * 60 + m1;
    let endMins = h2 * 60 + m2;
    if (endMins <= startMins) endMins += 24 * 60;
    return (endMins - startMins) / 60;
  };

  // Scheduling State
  const [eventSchedule, setEventSchedule] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '14:00',
  });

  // Service States
  const [photoSelection, setPhotoSelection] = useState<Selection>({
    hours: 4, sessions: 0, books: 0, droneSessions: 0,
    booksEnabled: true, sessionsEnabled: true, hoursEnabled: true, droneEnabled: true,
    secondSpecialist: false, serviceEnabled: true,
  });

  const [videoSelection, setVideoSelection] = useState<Selection>({
    hours: 4, sessions: 0, books: 0, droneSessions: 0,
    booksEnabled: true, sessionsEnabled: true, hoursEnabled: true, droneEnabled: true,
    secondSpecialist: false, serviceEnabled: true,
  });

  const [contentSelection, setContentSelection] = useState<Selection>({
    hours: 4, sessions: 0, books: 0, droneSessions: 0,
    booksEnabled: false, sessionsEnabled: false, hoursEnabled: true, droneEnabled: false,
    secondSpecialist: false, serviceEnabled: false,
  });

  const getHourPrice = useCallback((isSecond: boolean, pricing: PricingConstants) => 
    isSecond ? pricing.HOUR_PRICE * 2 : pricing.HOUR_PRICE, []);

  const calculateTotal = useCallback((sel: Selection, pricing: PricingConstants, isPhoto: boolean = false) => {
    if (!sel.serviceEnabled) return 0;
    const hourPrice = getHourPrice(sel.secondSpecialist, pricing);
    
    // Sessions math (including photo promo)
    let sessionCost = (sel.sessionsEnabled ? sel.sessions * pricing.SESSION_PRICE : 0);
    if (isPhoto && sel.hours >= 10 && sel.sessions > 0) {
      sessionCost = Math.max(0, sel.sessions - 1) * pricing.SESSION_PRICE;
    }

    // Drone Multi-Discount Logic: First is full price, others are 50% off
    let droneCost = 0;
    if (sel.droneEnabled && sel.droneSessions > 0) {
      droneCost = pricing.DRONE_PRICE + (sel.droneSessions - 1) * (pricing.DRONE_PRICE * DRONE_DISCOUNT_FACTOR);
    }

    const baseTotal = (
      (sel.hoursEnabled ? sel.hours * hourPrice : 0) +
      sessionCost +
      (sel.booksEnabled ? sel.books * pricing.BOOK_PRICE : 0) +
      droneCost
    );
    return Math.round(baseTotal * COST_MULTIPLIER);
  }, [getHourPrice]);

  const updatePhoto = useCallback((update: Partial<Selection>) => setPhotoSelection(prev => ({ ...prev, ...update })), []);
  const updateVideo = useCallback((update: Partial<Selection>) => setVideoSelection(prev => ({ ...prev, ...update })), []);
  const updateContent = useCallback((update: Partial<Selection>) => setContentSelection(prev => ({ ...prev, ...update })), []);

  const handleScheduleUpdate = (data: { date?: string; startTime?: string; endTime?: string }) => {
    const nextSchedule = { ...eventSchedule, ...data };
    setEventSchedule(nextSchedule);
    const newDuration = getDurationHours(nextSchedule.startTime, nextSchedule.endTime);
    const minHours = 4;
    const finalHours = Math.max(minHours, newDuration);
    updatePhoto({ hours: finalHours });
    updateVideo({ hours: finalHours });
    updateContent({ hours: finalHours });
  };

  const currentPhotoTotal = useMemo(() => calculateTotal(photoSelection, PHOTO_PRICING, true), [photoSelection, calculateTotal]);
  const currentVideoTotal = useMemo(() => calculateTotal(videoSelection, VIDEO_PRICING), [videoSelection, calculateTotal]);
  const currentContentTotal = useMemo(() => calculateTotal(contentSelection, CONTENT_PRICING), [contentSelection, calculateTotal]);

  const grandTotal = currentPhotoTotal + currentVideoTotal + currentContentTotal;

  // Narrative summary construction
  const narrativeParagraphs = useMemo(() => {
    const formattedDate = formatDateNarrative(eventSchedule.date);
    const name = bookingForm.name.trim();
    const town = bookingForm.town.trim();
    const email = bookingForm.email.trim();
    const phone = bookingForm.phone.trim();
    const durationHours = getDurationHours(eventSchedule.startTime, eventSchedule.endTime);
    const durationText = durationHours === 1 ? (lang === 'en' ? "1 hour" : `1 ${lang === 'mk' ? 'час' : 'orë'}`) : `${durationHours} ${lang === 'en' ? 'hours' : lang === 'mk' ? 'часови' : 'orë'}`;

    const paragraphs: string[] = [];
    const nt = t.summary.narrativeTemplates;

    // First Paragraph: Intro + Schedule + Contact
    let p1Parts: string[] = [];
    
    // Intro part - strictly conditional
    if (name && town) p1Parts.push(nt.introNameTown.replace('{name}', name).replace('{town}', town).replace('{date}', formattedDate));
    else if (name) p1Parts.push(nt.introName.replace('{name}', name).replace('{date}', formattedDate));
    else if (town) p1Parts.push(nt.introTown.replace('{town}', town).replace('{date}', formattedDate));
    else p1Parts.push(nt.introBase.replace('{date}', formattedDate));

    // Schedule part
    p1Parts.push(nt.schedule.replace('{start}', eventSchedule.startTime).replace('{end}', eventSchedule.endTime).replace('{duration}', durationText));

    // Contact part - strictly conditional
    if (email && phone) p1Parts.push(nt.contactEmailPhone.replace('{email}', email).replace('{phone}', phone));
    else if (email) p1Parts.push(nt.contactEmail.replace('{email}', email));
    else if (phone) p1Parts.push(nt.contactPhone.replace('{phone}', phone));

    paragraphs.push(p1Parts.join(' '));

    // Service Paragraphs
    if (photoSelection.serviceEnabled) {
      const spec = photoSelection.secondSpecialist ? nt.photoSpecDouble : nt.photoSpecSingle;
      const sessionsPart = photoSelection.sessions > 0 ? nt.photoSessions.replace('{count}', photoSelection.sessions.toString()).replace('{complimentary}', photoSelection.hours >= 10 ? nt.photoComplimentary : '') : '';
      const booksPart = photoSelection.books > 0 ? nt.photoBooks.replace('{count}', photoSelection.books.toString()) : '';
      const dronePart = photoSelection.droneSessions > 0 ? nt.photoDrone.replace('{count}', photoSelection.droneSessions.toString()) : '';
      paragraphs.push(nt.photo.replace('{spec}', spec).replace('{hours}', photoSelection.hours.toString()).replace('{sessions}', sessionsPart).replace('{books}', booksPart).replace('{drone}', dronePart));
    }

    if (videoSelection.serviceEnabled) {
      const spec = videoSelection.secondSpecialist ? nt.videoSpecDouble : nt.videoSpecSingle;
      const sessionsPart = videoSelection.sessions > 0 ? nt.videoSessions.replace('{count}', videoSelection.sessions.toString()) : '';
      const cranePart = videoSelection.books > 0 ? nt.videoCrane.replace('{count}', videoSelection.books.toString()) : '';
      const dronePart = videoSelection.droneSessions > 0 ? nt.videoDrone.replace('{count}', videoSelection.droneSessions.toString()) : '';
      paragraphs.push(nt.video.replace('{spec}', spec).replace('{hours}', videoSelection.hours.toString()).replace('{sessions}', sessionsPart).replace('{crane}', cranePart).replace('{drone}', dronePart));
    }

    if (contentSelection.serviceEnabled) paragraphs.push(nt.content.replace('{hours}', contentSelection.hours.toString()));

    // Total Paragraph
    paragraphs.push(nt.total.replace('{total}', grandTotal.toString()));

    return paragraphs;
  }, [bookingForm, eventSchedule, photoSelection, videoSelection, contentSelection, grandTotal, lang, t]);

  const handleSendBooking = () => {
    if (!bookingForm.email.trim()) return;

    const narrativeText = narrativeParagraphs.join('\n\n');
    const noteBlock = bookingForm.additionalNote ? `${t.modal.noteLabel}:\n"${bookingForm.additionalNote}"\n\n` : '';
    const body = `Hello DRIM TEAMS,\n\nI would like to inquire about a booking with the following details:\n\n${narrativeText}\n\n${noteBlock}I look forward to hearing from you soon!\n\nBest regards,\n${bookingForm.name || 'Client'}`;
    const mailtoUrl = `mailto:3latko@gmail.com?subject=Booking Request - DRIM TEAMS&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setIsModalOpen(false);
  };

  const isEmailValid = bookingForm.email.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col font-sans text-primary relative overflow-x-hidden">
      <nav className="fixed top-0 w-full z-50 glass-morphism border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-serif font-bold italic">D</span>
            </div>
            <span className="font-serif text-xl font-bold tracking-tight">DRIM TEAMS</span>
          </div>
          
          <div className="flex items-center space-x-4 md:space-x-8">
            <div className="flex space-x-2 md:space-x-3 items-center">
               <button onClick={() => setLang('en')} className={`w-7 h-7 rounded-full flex items-center justify-center text-lg hover:scale-110 transition-transform ${lang === 'en' ? 'ring-2 ring-accent ring-offset-2' : 'grayscale opacity-60'}`}>🇺🇸</button>
               <button onClick={() => setLang('mk')} className={`w-7 h-7 rounded-full flex items-center justify-center text-lg hover:scale-110 transition-transform ${lang === 'mk' ? 'ring-2 ring-accent ring-offset-2' : 'grayscale opacity-60'}`}>🇲🇰</button>
               <button onClick={() => setLang('sq')} className={`w-7 h-7 rounded-full flex items-center justify-center text-lg hover:scale-110 transition-transform ${lang === 'sq' ? 'ring-2 ring-accent ring-offset-2' : 'grayscale opacity-60'}`}>🇦🇱</button>
            </div>
          </div>
        </div>
      </nav>

      <header className="pt-32 pb-16 px-6 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-[3.375rem] md:text-[4.05rem] font-serif font-bold leading-tight">
              {t.hero.title.split(' ')[0]} <br />
              <span className="text-accent italic">{t.hero.title.split(' ')[1]}</span> <br />
              {t.hero.title.split(' ').slice(2).join(' ')}
            </h1>
            <p className="text-lg text-gray-500 max-w-md leading-relaxed">{t.hero.description}</p>
          </div>
          <div className="relative">
            <div className="aspect-[4/5]">
              <HeroSlideshow />
            </div>
          </div>
        </div>
      </header>

      <section id="planner" className="py-20 px-6 bg-white pb-40">
        <div className="max-w-7xl mx-auto space-y-16 md:space-y-24">
          <EventScheduling 
            lang={lang} date={eventSchedule.date} startTime={eventSchedule.startTime} endTime={eventSchedule.endTime}
            photoEnabled={photoSelection.serviceEnabled} videoEnabled={videoSelection.serviceEnabled} contentEnabled={contentSelection.serviceEnabled}
            onUpdate={handleScheduleUpdate} onTogglePhoto={(v) => updatePhoto({ serviceEnabled: v })} onToggleVideo={(v) => updateVideo({ serviceEnabled: v })} onToggleContent={(v) => updateContent({ serviceEnabled: v })}
          />

          {[
            { selection: photoSelection, update: updatePhoto, pricing: PHOTO_PRICING, type: 'photo' as const, label: t.services.photography, specialist: true, toggle: (v: boolean) => updatePhoto({ serviceEnabled: v }) },
            { selection: videoSelection, update: updateVideo, pricing: VIDEO_PRICING, type: 'video' as const, label: t.services.videography, specialist: true, toggle: (v: boolean) => updateVideo({ serviceEnabled: v }) },
            { selection: contentSelection, update: updateContent, pricing: CONTENT_PRICING, type: 'content' as const, label: t.services.contentCreator, specialist: false, items: ['hours'] as any, toggle: (v: boolean) => updateContent({ serviceEnabled: v }) }
          ].map((srv) => (
            <div key={srv.type} className="transition-all duration-500">
              <div className="bg-gray-50/50 py-6 px-4 md:py-10 md:px-12 rounded-[2rem] border border-gray-100 max-w-5xl mx-auto">
                <div className="mb-4 text-center flex flex-col items-center">
                  <div className="flex items-center justify-center space-x-3 mb-4 group cursor-pointer" onClick={() => srv.toggle(!srv.selection.serviceEnabled)}>
                    <h3 className={`text-lg md:text-3xl uppercase tracking-[0.1em] md:tracking-[0.3em] font-bold block break-words transition-colors ${srv.selection.serviceEnabled ? 'text-gray-400' : 'text-gray-300'}`}>
                      {srv.label}
                    </h3>
                    <input 
                      type="checkbox" 
                      checked={srv.selection.serviceEnabled} 
                      onChange={(e) => {
                        e.stopPropagation();
                        srv.toggle(e.target.checked);
                      }}
                      className="w-5 h-5 md:w-7 md:h-7 accent-accent rounded cursor-pointer"
                    />
                  </div>
                  <div className="w-16 md:w-24 h-[1px] bg-accent/30 mx-auto"></div>
                </div>
                {srv.selection.serviceEnabled && (
                  <BudgetAllocation lang={lang} selection={srv.selection} onUpdate={srv.update} maxBudget={0} pricing={srv.pricing} type={srv.type} showSpecialist={srv.specialist} allowedItems={srv.items} />
                )}
              </div>
            </div>
          ))}

          <div className="grid lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2 space-y-8">
              <div className="py-6 px-4 md:py-10 md:px-12 rounded-[2rem] md:rounded-[3rem] border transition-all shadow-xl relative bg-accent/15 border-accent/30">
                <div className="relative z-10">
                   <p className="text-[10px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.2em] text-primary font-black mb-6 border-b border-primary/10 pb-4 break-words">
                     {t.summary.previewTitle}
                   </p>
                   <div className="mb-10 space-y-4">
                     {narrativeParagraphs.map((p, idx) => (
                       <p key={idx} className="text-sm text-gray-800 leading-relaxed font-medium italic">{p}</p>
                     ))}
                   </div>
                   <div className="pt-8 border-t border-primary/10 flex flex-col md:flex-row justify-between items-center gap-6">
                     <div className="flex-1 w-full overflow-hidden">
                       <div className="flex items-center justify-between text-xs font-bold text-primary bg-white/50 p-4 rounded-2xl border border-primary/10 shadow-sm">
                          <span className="uppercase tracking-widest opacity-60">{t.footer.calculatedInvestment}</span>
                          <span className="text-3xl md:text-4xl font-serif text-primary">{grandTotal} €</span>
                       </div>
                     </div>
                     <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto bg-primary text-white px-8 md:px-10 py-5 rounded-full font-bold uppercase tracking-widest text-[10px] md:text-xs hover:scale-105 transition-transform shadow-lg whitespace-nowrap">
                       {t.summary.bookExperience}
                     </button>
                   </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <ChatAssistant lang={lang} budget={grandTotal} />
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 space-y-6 overflow-y-auto">
              <div className="flex justify-between items-start">
                <div><h2 className="text-3xl font-serif font-bold">{t.modal.title}</h2><p className="text-gray-500 text-sm mt-1">{t.modal.subtitle}</p></div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest text-accent">{t.modal.fullName}</label><input type="text" value={bookingForm.name} onChange={(e) => setBookingForm(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none"/></div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-accent">{t.modal.email} *</label>
                    <input type="email" required value={bookingForm.email} onChange={(e) => setBookingForm(prev => ({ ...prev, email: e.target.value }))} className={`w-full bg-gray-50 border rounded-2xl px-4 py-3 text-sm focus:outline-none ${!isEmailValid ? 'border-red-200' : 'border-gray-100'}`}/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest text-accent">{t.modal.location}</label><input type="text" value={bookingForm.town} onChange={(e) => setBookingForm(prev => ({ ...prev, town: e.target.value }))} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none"/></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest text-accent">{t.modal.phone}</label><input type="tel" value={bookingForm.phone} onChange={(e) => setBookingForm(prev => ({ ...prev, phone: e.target.value }))} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none"/></div>
                </div>
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest text-accent">{t.modal.summaryLabel}</label><div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 max-h-[160px] overflow-y-auto space-y-3">{narrativeParagraphs.map((p, idx) => (<p key={idx} className="text-xs text-gray-600 italic leading-relaxed">{p}</p>))}<p className="text-sm font-bold text-primary mt-3 border-t pt-2 border-gray-200">Investment: {grandTotal} €</p></div></div>
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest text-accent">{t.modal.noteLabel}</label><textarea rows={3} value={bookingForm.additionalNote} onChange={(e) => setBookingForm(prev => ({ ...prev, additionalNote: e.target.value }))} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none resize-none" placeholder={t.modal.notePlaceholder}/></div>
              </div>
              <button 
                onClick={handleSendBooking} 
                disabled={!isEmailValid}
                className={`w-full py-4 rounded-full font-bold uppercase tracking-widest text-xs shadow-lg transition-all ${isEmailValid ? 'bg-primary text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                {t.modal.sendButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 left-0 w-full z-40 glass-morphism border-t border-gray-200 py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
            <p className="text-[9px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.3em] text-gray-500 font-bold whitespace-nowrap">{t.footer.calculatedInvestment}</p>
            <p className="text-2xl md:text-4xl font-serif font-bold text-primary whitespace-nowrap">{grandTotal} €</p>
          </div>
          <div className="flex items-center text-accent flex-shrink-0"><div className="w-2 h-2 rounded-full bg-accent animate-pulse mr-2"></div><span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold">{t.footer.liveEstimate}</span></div>
        </div>
      </footer>
    </div>
  );
};

export default App;
