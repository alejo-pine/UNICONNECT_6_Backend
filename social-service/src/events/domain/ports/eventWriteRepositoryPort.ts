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
}

export interface EventWriteRepositoryPort {
  create(dto: CreateEventDto): Promise<string>;
}
