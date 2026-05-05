
export interface ServiceSelection {
  hours: number;
  sessions: number;
  books: number;
  droneSessions: number;
  booksEnabled: boolean;
  sessionsEnabled: boolean;
  hoursEnabled: boolean;
  droneEnabled: boolean;
  secondSpecialist: boolean;
  serviceEnabled: boolean;
}

export type Selection = ServiceSelection;

export interface PricingConstants {
  HOUR_PRICE: number;
  SESSION_PRICE: number;
  BOOK_PRICE: number;
  DRONE_PRICE: number;
  MIN_BUDGET: number;
  STEP: number;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
