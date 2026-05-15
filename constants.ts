
import { PricingConstants } from './types';

export const COST_MULTIPLIER = 1.0;
export const DRONE_DISCOUNT_FACTOR = 0.5;

export const PHOTO_PRICING: PricingConstants = {
  HOUR_PRICE: 35,
  SESSION_PRICE: 99,
  BOOK_PRICE: 199,
  BOOK_ADDITIONAL_PRICE: 129,
  DRONE_PRICE: 99,
  MIN_BUDGET: 50,
  STEP: 25,
};

export const VIDEO_PRICING: PricingConstants = {
  HOUR_PRICE: 35,
  SESSION_PRICE: 249, // Updated for Love-Story
  BOOK_PRICE: 299,    // Updated for Crane
  DRONE_PRICE: 99,
  MIN_BUDGET: 50,
  STEP: 25,
};

export const CONTENT_PRICING: PricingConstants = {
  HOUR_PRICE: 25,
  SESSION_PRICE: 0,
  BOOK_PRICE: 0,
  DRONE_PRICE: 0,
  MIN_BUDGET: 50,
  STEP: 25,
};

// Deprecated: use PHOTO_PRICING or VIDEO_PRICING
export const PRICING = PHOTO_PRICING;

export const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200', // Wedding session (user placeholder)
  'https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&q=80&w=1200', // Professional camera
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200', // Wedding Couple 1
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200', // Wedding Reception
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1200'  // Wedding Ceremony
];

export const PORTFOLIO_IMAGES = [
  'https://images.unsplash.com/photo-1519741497674-511285560929?auto=format&fit=crop&q=80&w=800', // Wedding session (user placeholder)
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1470217957101-da7150b9b681?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1520852758249-f47262176377?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800'
];
