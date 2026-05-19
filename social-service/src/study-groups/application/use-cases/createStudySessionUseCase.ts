import { HttpError } from '../../../utils/httpError';
import { CreateStudySessionInput, StudySession } from '../../domain/entities/studySession';
import { StudySessionRepositoryPort } from '../../domain/ports/studySessionRepositoryPort';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';
import { randomUUID } from 'crypto';

export class CreateStudySessionUseCase {
  constructor(
    private readonly studySessionRepository: StudySessionRepositoryPort,
    private readonly studyGroupRepository: StudyGroupRepositoryPort
  ) {}

  async execute(input: CreateStudySessionInput): Promise<StudySession[]> {
    // 1. Validate inputs
    if (!input.name.trim()) {
      throw new HttpError(400, 'Session name is required');
    }
    if (!input.startTime || !input.endTime) {
      throw new HttpError(400, 'Start time and end time are required');
    }

    const start = new Date(input.startTime);
    const end = new Date(input.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new HttpError(400, 'Invalid start time or end time format');
    }

    // Start must be at least 20 minutes from now
    const minStart = new Date(Date.now() + 20 * 60 * 1000);
    if (start < minStart) {
      throw new HttpError(400, 'Start time must be at least 20 minutes from now');
    }

    if (start >= end) {
      throw new HttpError(400, 'End time must be after start time');
    }

    // 2. Validate group and permissions
    const group = await this.studyGroupRepository.findById(input.groupId);
    if (!group) {
      throw new HttpError(404, 'Study group not found');
    }

    // Verify creator is admin (creatorId)
    if (group.creatorId !== input.creatorId) {
      throw new HttpError(403, 'Forbidden: only the group admin can create sessions');
    }

    // 3. Generate sessions
    const sessionsToCreate: Omit<StudySession, 'id' | 'createdAt'>[] = [];
    
    if (input.recurrenceType === 'none') {
      sessionsToCreate.push({
        groupId: input.groupId,
        creatorId: input.creatorId,
        name: input.name,
        description: input.description,
        location: input.location,
        startTime: input.startTime,
        endTime: input.endTime,
        recurrenceType: 'none',
        seriesId: null,
      });
    } else {
      if (!input.recurrenceEndDate) {
        throw new HttpError(400, 'recurrenceEndDate is required for recurring sessions');
      }

      const recurrenceEnd = new Date(input.recurrenceEndDate);
      if (isNaN(recurrenceEnd.getTime())) {
        throw new HttpError(400, 'Invalid recurrence end date format');
      }

      if (recurrenceEnd < start) {
        throw new HttpError(400, 'Recurrence end date must be after the first session start time');
      }

      const seriesId = randomUUID();
      let currentStart = new Date(start.getTime());
      let currentEnd = new Date(end.getTime());

      // Limit to max 50 sessions to prevent abuse
      const MAX_SESSIONS = 50;
      let count = 0;

      while (currentStart <= recurrenceEnd && count < MAX_SESSIONS) {
        sessionsToCreate.push({
          groupId: input.groupId,
          creatorId: input.creatorId,
          name: input.name,
          description: input.description,
          location: input.location,
          startTime: currentStart.toISOString(),
          endTime: currentEnd.toISOString(),
          recurrenceType: input.recurrenceType,
          seriesId,
        });

        // Advance to next interval
        if (input.recurrenceType === 'daily') {
          currentStart.setDate(currentStart.getDate() + 1);
          currentEnd.setDate(currentEnd.getDate() + 1);
        } else if (input.recurrenceType === 'weekly') {
          currentStart.setDate(currentStart.getDate() + 7);
          currentEnd.setDate(currentEnd.getDate() + 7);
        } else if (input.recurrenceType === 'monthly') {
          currentStart.setMonth(currentStart.getMonth() + 1);
          currentEnd.setMonth(currentEnd.getMonth() + 1);
        }
        
        count++;
      }
    }

    // 4. Save to repository
    return await this.studySessionRepository.createMany(sessionsToCreate);
  }
}
