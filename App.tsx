
import React, { useState, useCallback, useMemo } from 'react';
import BudgetAllocation from './components/BudgetAllocation';
import EventScheduling from './components/EventScheduling';
import HeroSlideshow from './components/HeroSlideshow';
import { Instagram, Facebook, Phone, Mail, Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { PHOTO_PRICING, VIDEO_PRICING, CONTENT_PRICING, COST_MULTIPLIER, DRONE_DISCOUNT_FACTOR } from './constants';
import { Selection, PricingConstants } from './types';
import { translations, Language } from './translations';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('mk');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const t = translations[lang];

  // Dark mode effect
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    town: '',
    phone: '',
    additionalNote: ''
  });

  // Helper to format date
  const formatDateNarrative = (dateStr: string, langOverride?: Language): string => {
    if (!dateStr) return '';
    const targetLang = langOverride || lang;
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = translations[targetLang].scheduling.months[date.getMonth()];
    const year = date.getFullYear();

    const getOrdinal = (n: number) => {
      if (targetLang !== 'en') return n;
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return targetLang === 'en' 
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

  const calculateTotal = useCallback((sel: Selection, pricing: PricingConstants, isPhoto: boolean = false, isBundle: boolean = false, isEarlyBird: boolean = false) => {
    if (!sel.serviceEnabled) return 0;
    let hourPrice = getHourPrice(sel.secondSpecialist, pricing);
    
    // Apply discounts on hourly rates (per hour)
    if (isBundle) hourPrice *= 0.90;
    if (isEarlyBird) hourPrice *= 0.80;
    
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

  const isBundle = photoSelection.serviceEnabled && videoSelection.serviceEnabled;
  const isEarlyBird = new Date(eventSchedule.date) < new Date('2028-01-01');

  const currentPhotoTotal = useMemo(() => calculateTotal(photoSelection, PHOTO_PRICING, true, isBundle, isEarlyBird), [photoSelection, calculateTotal, isBundle, isEarlyBird]);
  const currentVideoTotal = useMemo(() => calculateTotal(videoSelection, VIDEO_PRICING, false, isBundle, isEarlyBird), [videoSelection, calculateTotal, isBundle, isEarlyBird]);
  const currentContentTotal = useMemo(() => calculateTotal(contentSelection, CONTENT_PRICING), [contentSelection, calculateTotal]);

  const grandTotal = currentPhotoTotal + currentVideoTotal + currentContentTotal;

  // Narrative summary construction logic
  const getNarrativeParagraphs = useCallback((targetLang: Language) => {
    const formattedDate = formatDateNarrative(eventSchedule.date, targetLang);
    const name = bookingForm.name.trim();
    const town = bookingForm.town.trim();
    const email = bookingForm.email.trim();
    const phone = bookingForm.phone.trim();
    
    const paragraphs: string[] = [];
    const targetT = translations[targetLang];
    const nt = targetT.summary.narrativeTemplates;

    // First Paragraph: Intro + Schedule + Contact
    let p1Parts: string[] = [];
    
    // Intro part - strictly conditional
    if (name && town) p1Parts.push(nt.introNameTown.replace('{name}', name).replace('{town}', town).replace('{date}', formattedDate));
    else if (name) p1Parts.push(nt.introName.replace('{name}', name).replace('{date}', formattedDate));
    else if (town) p1Parts.push(nt.introTown.replace('{town}', town).replace('{date}', formattedDate));
    else p1Parts.push(nt.introBase.replace('{date}', formattedDate));

    // Schedule part
    p1Parts.push(nt.schedule.replace('{start}', eventSchedule.startTime));

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
  }, [bookingForm, eventSchedule, photoSelection, videoSelection, contentSelection, grandTotal, formatDateNarrative]);

  const narrativeParagraphs = useMemo(() => getNarrativeParagraphs(lang), [lang, getNarrativeParagraphs]);

  const handleSendBooking = async () => {
    if (!bookingForm.email.trim() || isSending) return;

    setIsSending(true);
    setSendError(null);

    const packageSummary = getNarrativeParagraphs(lang).join('\n\n');
    const englishNarrative = lang === 'en' ? '' : `--- English Translation ---\n\n${getNarrativeParagraphs('en').join('\n\n')}\n\n`;
    
    try {
      const response = await fetch('/api/send-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: bookingForm.name,
          email: bookingForm.email,
          phone: bookingForm.phone,
          location: bookingForm.town,
          packageSummary: `${packageSummary}\n\n${englishNarrative}`,
          investment: grandTotal,
          additionalNote: bookingForm.additionalNote,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to send request';
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          const textError = await response.text();
          console.error('Non-JSON error response:', textError);
          // If it looks like HTML, give a generic error
          if (textError.includes('<!DOCTYPE html>') || textError.includes('<html')) {
            errorMessage = 'Server error: Invalid response format (HTML instead of JSON). The API route might be missing or the server might have crashed.';
          } else {
            errorMessage = textError.slice(0, 100);
          }
        }
        throw new Error(errorMessage);
      }

      // Success!
      setIsModalOpen(false);
      // Reset form
      setBookingForm({ name: '', email: '', town: '', phone: '', additionalNote: '' });
      alert(t.modal.successAlert);
    } catch (error) {
      console.error('Error sending booking:', error);
      setSendError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsSending(false);
    }
  };

  const isEmailValid = bookingForm.email.trim().length > 0;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDarkMode ? 'bg-[#0d0d0d] text-white' : 'bg-white text-primary'} relative overflow-x-hidden`}>
      <nav className={`fixed top-0 w-full z-50 glass-morphism border-b ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-start space-x-2">
            <div className="cursor-pointer flex-shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img 
                src="https://www.image2url.com/r2/default/images/1779451396078-8d666ff6-50b9-4276-a4a8-f7b4e9d7339c.png" 
                alt="D" 
                className="w-10 h-10 object-contain rounded"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span 
                className="font-serif text-xl font-bold tracking-tight leading-[0.85] dark:text-white transition-colors cursor-pointer"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                DIGITALIN<br />STUDIO
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDarkMode(!isDarkMode);
                }}
                className="mt-1 flex items-center space-x-1.5 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-accent transition-colors w-fit"
              >
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                {isDarkMode ? (
                  <Sun className="w-3 h-3" />
                ) : (
                  <Moon className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 md:space-x-8">
            <div className="flex space-x-2 md:space-x-3 items-center">
               <button onClick={() => setLang('en')} className={`w-7 h-7 rounded-full flex items-center justify-center text-lg hover:scale-110 transition-transform ${lang === 'en' ? 'ring-2 ring-accent ring-offset-2 dark:ring-offset-[#1a1a1a]' : 'grayscale opacity-60'}`}>🇺🇸</button>
               <button onClick={() => setLang('mk')} className={`w-7 h-7 rounded-full flex items-center justify-center text-lg hover:scale-110 transition-transform ${lang === 'mk' ? 'ring-2 ring-accent ring-offset-2 dark:ring-offset-[#1a1a1a]' : 'grayscale opacity-60'}`}>🇲🇰</button>
               <button onClick={() => setLang('sq')} className={`w-7 h-7 rounded-full flex items-center justify-center text-lg hover:scale-110 transition-transform ${lang === 'sq' ? 'ring-2 ring-accent ring-offset-2 dark:ring-offset-[#1a1a1a]' : 'grayscale opacity-60'}`}>🇦🇱</button>
               <button onClick={() => setLang('tr')} className={`w-7 h-7 rounded-full flex items-center justify-center text-lg hover:scale-110 transition-transform ${lang === 'tr' ? 'ring-2 ring-accent ring-offset-2 dark:ring-offset-[#1a1a1a]' : 'grayscale opacity-60'}`}>🇹🇷</button>
            </div>
          </div>
        </div>
      </nav>

      <header className={`pt-32 pb-16 px-6 transition-colors duration-300 ${isDarkMode ? 'bg-[#121212]' : 'bg-[#fafafa]'}`}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-[3.375rem] md:text-[4.05rem] font-serif font-bold leading-tight dark:text-white transition-colors">
              {t.hero.title.split(' ')[0]} <br />
              <span className="text-accent italic">{t.hero.title.split(' ')[1]}</span> <br />
              {t.hero.title.split(' ').slice(2).join(' ')}
            </h1>
            <div className="space-y-4">
              <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md leading-relaxed transition-colors">{t.hero.description}</p>
              <p className="text-lg text-gray-500 dark:text-gray-400 font-semibold max-w-md leading-relaxed transition-colors">{t.hero.descriptionPromo}</p>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5]">
              <HeroSlideshow />
            </div>
          </div>
        </div>
      </header>

      <section id="planner" className={`py-20 px-6 transition-colors duration-300 ${isDarkMode ? 'bg-[#0d0d0d]' : 'bg-white'} pb-40`}>
        <div className="max-w-7xl mx-auto space-y-16 md:space-y-24">
          <EventScheduling 
            lang={lang} date={eventSchedule.date} startTime={eventSchedule.startTime} endTime={eventSchedule.endTime}
            photoEnabled={photoSelection.serviceEnabled} videoEnabled={videoSelection.serviceEnabled} contentEnabled={contentSelection.serviceEnabled}
            onUpdate={handleScheduleUpdate} onTogglePhoto={(v) => updatePhoto({ serviceEnabled: v })} onToggleVideo={(v) => updateVideo({ serviceEnabled: v })} onToggleContent={(v) => updateContent({ serviceEnabled: v })}
            isDarkMode={isDarkMode}
          />

          {[
            { selection: photoSelection, update: updatePhoto, pricing: PHOTO_PRICING, type: 'photo' as const, label: t.services.photography, specialist: true, toggle: (v: boolean) => updatePhoto({ serviceEnabled: v }) },
            { selection: videoSelection, update: updateVideo, pricing: VIDEO_PRICING, type: 'video' as const, label: t.services.videography, specialist: true, toggle: (v: boolean) => updateVideo({ serviceEnabled: v }) },
            { selection: contentSelection, update: updateContent, pricing: CONTENT_PRICING, type: 'content' as const, label: t.services.contentCreator, specialist: false, items: ['hours'] as any, toggle: (v: boolean) => updateContent({ serviceEnabled: v }) }
          ].map((srv) => (
            <div key={srv.type} className="transition-all duration-500">
              <div className={`${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50/50 border-gray-100'} py-6 px-4 md:py-10 md:px-12 rounded-[2rem] border max-w-7xl mx-auto transition-colors`}>
                <div className="mb-4 text-center flex flex-col items-center">
                  <div className="flex items-center justify-center space-x-3 mb-4 group cursor-pointer" onClick={() => srv.toggle(!srv.selection.serviceEnabled)}>
                    <h3 className={`text-[21.6px] md:text-[40px] uppercase tracking-[0.1em] md:tracking-[0.2em] font-serif font-bold block transition-colors ${srv.selection.serviceEnabled ? (isDarkMode ? 'text-white' : 'text-gray-400') : (isDarkMode ? 'text-white/30' : 'text-gray-300')}`}>
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
                  <BudgetAllocation 
                    lang={lang} 
                    selection={srv.selection} 
                    onUpdate={srv.update} 
                    maxBudget={0} 
                    pricing={srv.pricing} 
                    type={srv.type} 
                    showSpecialist={srv.specialist} 
                    allowedItems={srv.items}
                    isBundle={isBundle}
                    isEarlyBird={isEarlyBird}
                    isDarkMode={isDarkMode}
                  />
                )}
              </div>
            </div>
          ))}

          <div className="space-y-8">
            <div className={`py-6 px-4 md:py-10 md:px-12 rounded-[2rem] md:rounded-[3rem] border transition-all shadow-xl relative max-w-5xl mx-auto ${isDarkMode ? 'bg-accent/20 border-accent/40' : 'bg-accent/15 border-accent/30'}`}>
              <div className="relative z-10">
                 <p className={`text-[10px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.2em] font-black mb-6 border-b pb-4 break-words transition-colors ${isDarkMode ? 'text-white border-white/10' : 'text-primary border-primary/10'}`}>
                   {t.summary.previewTitle}
                 </p>
                 <div className="mb-10 space-y-4">
                   {narrativeParagraphs.map((p, idx) => (
                     <p key={idx} className={`text-sm leading-relaxed font-medium italic transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{p}</p>
                   ))}
                 </div>
                 <div className={`pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6 transition-colors ${isDarkMode ? 'border-white/10' : 'border-primary/10'}`}>
                   <div className="flex-1 w-full overflow-hidden">
                     <div className={`flex items-center justify-between text-xs font-bold p-4 rounded-2xl border shadow-sm transition-colors ${isDarkMode ? 'bg-black/50 border-white/10 text-white' : 'bg-white/50 border-primary/10 text-primary'}`}>
                        <span className="uppercase tracking-widest opacity-60">{t.footer.calculatedInvestment}</span>
                        <span className={`text-3xl md:text-4xl font-serif flex flex-col items-end transition-colors ${isDarkMode ? 'text-white' : 'text-primary'}`}>
                          <span>{grandTotal} €</span>
                          <span className="text-sm md:text-lg font-sans opacity-60 font-normal italic">
                            ({Math.round(grandTotal * 61.5).toLocaleString()} {t.footer.denarSuffix})
                          </span>
                        </span>
                     </div>
                   </div>
                   <button onClick={() => setIsModalOpen(true)} className={`w-full md:w-auto px-8 md:px-10 py-5 rounded-full font-bold uppercase tracking-widest text-[10px] md:text-xs hover:scale-105 transition-transform shadow-lg whitespace-nowrap ${isDarkMode ? 'bg-accent text-white' : 'bg-primary text-white'}`}>
                     {t.summary.bookExperience}
                   </button>
                 </div>
              </div>
            </div>

            {/* Contact Box */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`py-6 px-4 md:py-10 rounded-[2rem] border shadow-xl max-w-5xl mx-auto overflow-hidden flex flex-col items-center transition-colors ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}
            >
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
                <a 
                  href="https://www.instagram.com/digitalin.studio/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`w-14 h-14 rounded-[1rem] flex items-center justify-center transition-all shadow-sm group ${isDarkMode ? 'bg-white/10 text-gray-400 hover:bg-accent' : 'bg-gray-50 text-gray-400 hover:bg-accent hover:text-white'}`}
                  title="Instagram"
                >
                  <Instagram className="w-6 h-6 group-hover:stroke-[2.5px] group-hover:text-white" />
                </a>
                <a 
                  href="https://www.facebook.com/snimanje/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`w-14 h-14 rounded-[1rem] flex items-center justify-center transition-all shadow-sm group ${isDarkMode ? 'bg-white/10 text-gray-400 hover:bg-accent' : 'bg-gray-50 text-gray-400 hover:bg-accent hover:text-white hover:scale-110'}`}
                  title="Facebook"
                >
                  <Facebook className="w-6 h-6 group-hover:stroke-[2.5px] group-hover:text-white" />
                </a>
                <a 
                  href="tel:+070767902" 
                  className={`w-14 h-14 rounded-[1rem] flex items-center justify-center transition-all shadow-sm group ${isDarkMode ? 'bg-white/10 text-gray-400 hover:bg-accent' : 'bg-gray-50 text-gray-400 hover:bg-accent hover:text-white hover:scale-110'}`}
                  title="Phone"
                >
                  <Phone className="w-6 h-6 group-hover:stroke-[2.5px] group-hover:text-white" />
                </a>
                <a 
                  href="mailto:digitalin.studio@gmail.com" 
                  className={`w-14 h-14 rounded-[1rem] flex items-center justify-center transition-all shadow-sm group ${isDarkMode ? 'bg-white/10 text-gray-400 hover:bg-accent' : 'bg-gray-50 text-gray-400 hover:bg-accent hover:text-white hover:scale-110'}`}
                  title="Email"
                >
                  <Mail className="w-6 h-6 group-hover:stroke-[2.5px] group-hover:text-white" />
                </a>
              </div>
              <p className={`mt-6 text-[12.5px] md:text-[15px] tracking-[0.2em] font-bold transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t.footer.address}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/40 backdrop-blur-md">
          <div className={`${isDarkMode ? 'bg-[#1a1a1a] border border-white/10' : 'bg-white'} w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors`}>
            <div className="p-10 space-y-6 overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className={`text-3xl font-serif font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-primary'}`}>{t.modal.title}</h2>
                  <p className={`text-sm mt-1 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.modal.subtitle}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-primary'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-accent">{t.modal.fullName}</label>
                    <input type="text" value={bookingForm.name} onChange={(e) => setBookingForm(prev => ({ ...prev, name: e.target.value }))} className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none transition-colors ${isDarkMode ? 'bg-[#2a2a2a] border-white/10 text-white focus:border-accent/40' : 'bg-gray-50 border-gray-100 focus:border-accent/20'}`}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-accent">{t.modal.email} *</label>
                    <input 
                      type="email" 
                      required 
                      value={bookingForm.email} 
                      onChange={(e) => setBookingForm(prev => ({ ...prev, email: e.target.value }))} 
                      className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none transition-colors ${isDarkMode ? 'bg-[#2a2a2a] text-white focus:border-accent/40' : 'bg-gray-50 focus:border-accent/20'} ${!isEmailValid ? 'border-red-500/50' : (isDarkMode ? 'border-white/10' : 'border-gray-100')}`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-accent">{t.modal.location}</label>
                    <input type="text" value={bookingForm.town} onChange={(e) => setBookingForm(prev => ({ ...prev, town: e.target.value }))} className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none transition-colors ${isDarkMode ? 'bg-[#2a2a2a] border-white/10 text-white focus:border-accent/40' : 'bg-gray-50 border-gray-100 focus:border-accent/20'}`}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-accent">{t.modal.phone}</label>
                    <input type="tel" value={bookingForm.phone} onChange={(e) => setBookingForm(prev => ({ ...prev, phone: e.target.value }))} className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none transition-colors ${isDarkMode ? 'bg-[#2a2a2a] border-white/10 text-white focus:border-accent/40' : 'bg-gray-50 border-gray-100 focus:border-accent/20'}`}/>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-accent">{t.modal.summaryLabel}</label>
                  <div className={`border rounded-2xl p-4 max-h-[160px] overflow-y-auto space-y-3 transition-colors ${isDarkMode ? 'bg-[#2a2a2a] border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                    {narrativeParagraphs.map((p, idx) => (<p key={idx} className={`text-xs italic leading-relaxed transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{p}</p>))}
                    <div className={`text-sm font-bold mt-3 border-t pt-2 transition-colors ${isDarkMode ? 'text-white border-white/10' : 'text-primary border-gray-200'}`}>
                      <p>Investment: {grandTotal} €</p>
                      <p className="font-normal opacity-70">({Math.round(grandTotal * 61.5).toLocaleString()} {t.footer.denarSuffix})</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-accent">{t.modal.noteLabel}</label>
                  <textarea rows={3} value={bookingForm.additionalNote} onChange={(e) => setBookingForm(prev => ({ ...prev, additionalNote: e.target.value }))} className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none resize-none transition-colors ${isDarkMode ? 'bg-[#2a2a2a] border-white/10 text-white focus:border-accent/40' : 'bg-gray-50 border-gray-100 focus:border-accent/20'}`} placeholder={t.modal.notePlaceholder}/>
                </div>
                {sendError && (
                  <p className="text-red-500 text-xs font-bold text-center animate-pulse">{sendError}</p>
                )}
              </div>
              <button 
                onClick={handleSendBooking} 
                disabled={!isEmailValid || isSending}
                className={`w-full py-4 rounded-full font-bold uppercase tracking-widest text-xs shadow-lg transition-all ${isEmailValid && !isSending ? (isDarkMode ? 'bg-accent text-white hover:bg-accent/80' : 'bg-primary text-white hover:bg-gray-800') : (isDarkMode ? 'bg-white/10 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')}`}
              >
                {isSending ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{lang === 'mk' ? 'Се испраќа...' : lang === 'sq' ? 'Duke u dërguar...' : lang === 'tr' ? 'Gönderiliyor...' : 'Sending...'}</span>
                  </span>
                ) : t.modal.sendButton}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className={`fixed bottom-0 left-0 w-full z-40 glass-morphism border-t py-4 px-6 md:px-12 transition-colors ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-center text-center">
          <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-4 overflow-hidden w-full justify-center lg:justify-between">
            <p className={`text-[9px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.3em] font-bold whitespace-nowrap transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.footer.calculatedInvestment}</p>
            <p className={`text-xl md:text-4xl font-serif font-bold whitespace-nowrap transition-colors ${isDarkMode ? 'text-white' : 'text-primary'}`}>
              {grandTotal} € <span className="text-xs md:text-xl font-sans opacity-50 font-normal">({Math.round(grandTotal * 61.5).toLocaleString()} {t.footer.denarSuffix})</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
