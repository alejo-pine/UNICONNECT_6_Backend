import { EventCardSummary, EventDetail } from '../../../domain/entities/event';

export interface EventCardSummaryApiResponse {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  faculty: string | null;
  event_date: string;
  event_time: string;
}

export interface EventDetailApiResponse {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  event_date: string;
  event_time: string;
  location: string | null;
  category: string | null;
  faculty: string | null;
  created_at: string;
  organizer_name: string | null;
}

export const toEventCardSummaryApiResponse = (input: EventCardSummary): EventCardSummaryApiResponse => ({
  id: input.id,
  title: input.title,
  description: input.description,
  image_url: input.imageUrl,
  faculty: input.faculty,
  event_date: input.eventDate,
  event_time: input.eventTime,
});

export const toEventCardSummaryApiResponseList = (
  inputs: EventCardSummary[]
): EventCardSummaryApiResponse[] => inputs.map(toEventCardSummaryApiResponse);

export const toEventDetailApiResponse = (input: EventDetail): EventDetailApiResponse => ({
  id: input.id,
  profile_id: input.profileId,
  title: input.title,
  description: input.description,
  image_url: input.imageUrl,
  event_date: input.eventDate,
  event_time: input.eventTime,
  location: input.location,
  category: input.category,
  faculty: input.faculty,
  created_at: input.createdAt,
  organizer_name: input.organizerName,
});
