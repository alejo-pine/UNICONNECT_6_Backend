export interface ProfileRepositoryPort {
  getUserEmail(userId: string): Promise<string | null>;
}
