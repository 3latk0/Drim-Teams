
import React, { useState, useEffect, useRef } from 'react';
import { HERO_IMAGES } from '../constants';

const HeroSlideshow: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  // Minimum swipe distance in pixels to trigger a slide change
  const minSwipeDistance = 50;

  const nextSlide = () => {
    setPreviousIndex(currentIndex);
    setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
  };

  const prevSlide = () => {
    setPreviousIndex(currentIndex);
    setCurrentIndex((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length);
  };

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    setPreviousIndex(currentIndex);
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (previousIndex !== null) {
      const timer = setTimeout(() => {
        setPreviousIndex(null);
      }, 1000); // 1000ms duration of crossfade
      return () => clearTimeout(timer);
    }
  }, [currentIndex, previousIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [currentIndex]); // Reset timer whenever index changes (manual or auto)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden rounded-3xl shadow-2xl bg-gray-100 touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {HERO_IMAGES.map((src, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img
            src={src}
            alt={`Slide ${index + 1}`}
            style={{
              transform: index === currentIndex 
                ? undefined 
                : index === previousIndex 
                ? 'scale(1.00)' 
                : 'scale(1.15)'
            }}
            className={`w-full h-full object-cover select-none ${
              index === currentIndex ? 'animate-slow-zoom' : ''
            }`}
            referrerPolicy="no-referrer"
          />
        </div>
      ))}
      
      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {HERO_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-white w-6' : 'bg-white/40'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlideshow;
