export interface EventCardSummary {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  faculty: string | null;
  eventDate: string;
  eventTime: string;
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
}
