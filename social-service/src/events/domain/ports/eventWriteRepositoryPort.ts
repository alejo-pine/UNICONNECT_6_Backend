export interface CreateEventDto {
  title: string;
  description: string | null;
  imageUrl: string | null;
  eventDate: string;
  eventTime: string;
  location: string | null;
  category: string;
  faculty: string | null;
  profileId: string;
  capacity?: number;
}

export interface EventWriteRepositoryPort {
  create(dto: CreateEventDto): Promise<string>;
  registerUser(eventId: string, profileId: string, expectedVersion: number): Promise<void>;
  cancelRegistration(eventId: string, profileId: string): Promise<void>;
}
