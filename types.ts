
export interface ItineraryItem {
  id: string;
  time: string;
  activity: string;
  location?: string;
  type?: 'flight' | 'transport' | 'activity' | 'food' | 'hotel' | 'important';
  notes?: string;
  mapsLink?: string;
  // New: Precise navigation target
  linkTo?: {
    tab: Tab;
    targetId: string;
  };
  // New: Nested items (e.g., specific shows inside a theme park day)
  subItems?: ItineraryItem[];
}

export interface WeatherInfo {
  condition: 'sunny' | 'cloudy' | 'rainy';
  temp: string;
}

export interface DaySchedule {
  date: string;
  fullDate: string; // YYYY-MM-DD
  dayOfWeek: string;
  weather: WeatherInfo;
  items: ItineraryItem[];
}

export interface PackingItem {
  id: string;
  text: string;
  checked: boolean;
}

export enum Tab {
  PLAN = 'PLAN',
  GUIDE = 'GUIDE',
  RATE = 'RATE',
  LISTS = 'LISTS',
  BOOKINGS = 'BOOKINGS',
}

export interface GuideLocation {
  id: string; // Added ID
  date?: string; // New: Organize by date (e.g. "12/19")
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  imageUrl: string;
  mapEmbedUrl?: string; // Deprecated but kept for type compatibility if needed, though UI won't show it
}

export type BookingType = 'flight' | 'hotel' | 'dining';

export interface BookingItem {
  id: string;
  type: BookingType;
  title: string; // Airline, Hotel Name, Restaurant Name
  subTitle?: string; // Flight No, Room Type, Branch Name
  date: string;
  time?: string;
  imageUrl?: string; // URL or Base64 string
  details: {
    // Flight
    from?: string;
    to?: string;
    departTime?: string;
    arriveTime?: string;
    seat?: string;
    gate?: string;
    terminal?: string; // New: Terminal Info
    counter?: string;  // New: Check-in Counter
    baggage?: string;  // New: Baggage Claim
    
    // Hotel
    checkIn?: string;
    checkOut?: string;
    address?: string;

    // Dining
    pax?: number;
    mapLink?: string;
    cancelLink?: string;
  };
}