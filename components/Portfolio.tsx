
import React from 'react';
import { PORTFOLIO_IMAGES } from '../constants';
import { translations, Language } from '../translations';

interface PortfolioProps {
  lang: Language;
}

const Portfolio: React.FC<PortfolioProps> = ({ lang }) => {
  const t = translations[lang].nav;
  
  return (
    <section id="portfolio" className="py-24 px-6 bg-[#fcfcfc]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-primary mb-6">{t.portfolio}</h2>
          <div className="w-24 h-[1px] bg-accent mx-auto"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PORTFOLIO_IMAGES.map((src, index) => (
            <div 
              key={index} 
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-200 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-700"
            >
              <img 
                src={src} 
                alt={`Portfolio work ${index + 1}`} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center border-0 group-hover:border-[12px] border-accent/20">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                   <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                   </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
