import { EventEmitter } from 'events';
import { StudyGroupDetailResponse, PendingAdminTransfer } from '../study-groups/domain/entities/studyGroup';

export const STUDY_GROUP_ROOM_PREFIX = 'study-group:';
export const STUDY_GROUP_UPDATED_EVENT = 'study-group:updated';
export const STUDY_GROUP_JOIN_EVENT = 'study-group:join';
export const STUDY_GROUP_LEAVE_EVENT = 'study-group:leave';
export const STUDY_GROUP_ADMIN_TRANSFER_REQUESTED_EVENT = 'admin_transfer_requested';
export const STUDY_GROUP_ADMIN_TRANSFER_ACCEPTED_EVENT = 'admin_transfer_accepted';
export const STUDY_GROUP_ADMIN_TRANSFER_REJECTED_EVENT = 'admin_transfer_rejected';

export type StudyGroupRealtimeAction = 'request_accepted' | 'request_rejected';

export interface StudyGroupUpdatedPayload {
  groupId: string;
  action: StudyGroupRealtimeAction;
  requestedUserId: string;
  actorUserId: string;
  updatedGroup: StudyGroupDetailResponse;
  timestamp: string;
}

export interface AdminTransferEventPayload {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

class StudyGroupRealtimeBus extends EventEmitter {
  publishStudyGroupUpdated(payload: StudyGroupUpdatedPayload): void {
    this.emit(STUDY_GROUP_UPDATED_EVENT, payload);
  }

  publishAdminTransferRequested(payload: AdminTransferEventPayload): void {
    this.emit(STUDY_GROUP_ADMIN_TRANSFER_REQUESTED_EVENT, payload);
  }

  publishAdminTransferAccepted(payload: AdminTransferEventPayload): void {
    this.emit(STUDY_GROUP_ADMIN_TRANSFER_ACCEPTED_EVENT, payload);
  }

  publishAdminTransferRejected(payload: AdminTransferEventPayload): void {
    this.emit(STUDY_GROUP_ADMIN_TRANSFER_REJECTED_EVENT, payload);
  }
}

export const studyGroupRealtimeBus = new StudyGroupRealtimeBus();