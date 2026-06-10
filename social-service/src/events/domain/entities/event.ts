export interface EventCardSummary {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  faculty: string | null;
  eventDate: string;
  eventTime: string;
  capacity: number;
  availableSpots: number;
}

export interface EventDetail {
  id: string;
  profileId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  eventDate: string;
  eventTime: string;
  location: string | null;
  category: string | null;
  faculty: string | null;
  createdAt: string;
  organizerName: string | null;
  capacity: number;
  availableSpots: number;
  version: number;
  isRegistered?: boolean;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  eventDate: string;
  eventTime: string;
  location?: string;
  category: string;
  faculty?: string;
  profileId: string;
  capacity: number;
  availableSpots: number;
  version: number;
}

export const createEvent = (data: Omit<Event, 'id' | 'capacity' | 'availableSpots' | 'version'>): Event => {
  return {
    ...data,
    id: crypto.randomUUID(),
    capacity: 50, // Por defecto al crear
    availableSpots: 50,
    version: 1,
  };
};
