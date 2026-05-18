import { supabase } from '../../utils/supabaseClient';
import { eventLogger } from '../../utils/eventLogger';
import {
  StudyGroup,
  StudyGroupDetailResponse,
  StudyGroupWithSubject,
  SubjectSummary,
  GroupMember,
} from '../domain/entities/studyGroup';
import { StudyGroupRepositoryPort } from '../domain/ports/studyGroupRepositoryPort';

const STUDY_GROUPS_TABLE = 'study_group';
const GROUP_MEMBERS_TABLE = 'group_member';
const PROFILE_SUBJECT_TABLE = 'profile_subject';
const PROFILES_TABLE = 'profile';
const PENDING_REQUEST_TABLES = ['group_join_request', 'group_member_request'] as const;

const mapStudyGroup = (row: {
  id: string;
  name: string;
  description: string;
  subject_id: string;
  creator_id: string;
  created_at: string;
}): StudyGroup => ({
  id: row.id,
  name: row.name,
  description: row.description,
  subjectId: row.subject_id,
  creatorId: row.creator_id,
  createdAt: row.created_at,
});

export class SupabaseStudyGroupRepository implements StudyGroupRepositoryPort {
  private isMissingTableError(error: unknown): boolean {
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code ?? '')
        : '';

    return errorCode === '42P01';
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String((error as { message?: unknown }).message ?? 'Unknown error');
    }

    return 'Unknown error';
  }

  private async resolvePendingRequestTable(): Promise<string> {
    for (const table of PENDING_REQUEST_TABLES) {
      const { error } = await supabase.from(table).select('group_id').limit(1);
      if (!error) {
        return table;
      }

      if (!this.isMissingTableError(error)) {
        throw new Error(`Failed to resolve pending request table: ${this.toErrorMessage(error)}`);
      }
    }

    throw new Error('Pending request table not found. Expected one of: group_join_request, group_member_request');
  }

  async verifyEnrollment(profileId: string, subjectId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(PROFILE_SUBJECT_TABLE)
      .select('profile_id')
      .eq('profile_id', profileId)
      .eq('subject_id', subjectId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to verify enrollment: ${error.message}`);
    }

    return data !== null;
  }

  async create(input: {
    name: string;
    description: string;
    subjectId: string;
    creatorId: string;
  }): Promise<StudyGroup> {
    const { data: studyGroupData, error: studyGroupError } = await supabase
      .from(STUDY_GROUPS_TABLE)
      .insert({
        name: input.name,
        description: input.description,
        subject_id: input.subjectId,
        creator_id: input.creatorId,
      })
      .select('id, name, description, subject_id, creator_id, created_at')
      .single();

    if (studyGroupError) {
      throw new Error(`Failed to create study group: ${studyGroupError.message}`);
    }

    if (!studyGroupData) {
      throw new Error('Study group created but no data returned');
    }

    const groupId = studyGroupData.id;

    const { error: memberError } = await supabase
      .from(GROUP_MEMBERS_TABLE)
      .insert({
        group_id: groupId,
        profile_id: input.creatorId,
      })
      .select('group_id, profile_id, created_at')
      .single();

    if (memberError) {
      eventLogger.warn(
        'SupabaseStudyGroupRepository.create',
        'Member insertion failed, rolling back',
        {
          groupId,
          error: memberError.message,
        }
      );

      const { error: deleteError } = await supabase.from(STUDY_GROUPS_TABLE).delete().eq('id', groupId);

      if (deleteError) {
        eventLogger.error('SupabaseStudyGroupRepository.create', 'Rollback failed, orphaned group', {
          groupId,
          deleteError: deleteError.message,
        });
      }

      throw new Error(`Failed to add creator as group member: ${memberError.message}`);
    }

    return mapStudyGroup(studyGroupData);
  }

  async findByProfileId(profileId: string): Promise<StudyGroupWithSubject[]> {
    const { data, error } = await supabase
      .from(GROUP_MEMBERS_TABLE)
      .select(
        `
        study_group!group_id(
          id,
          name,
          description,
          subject_id,
          creator_id,
          created_at,
          subject!subject_id(
            id,
            name
          ),
          group_member!group_id(profile_id)
        )
        `
      )
      .eq('profile_id', profileId);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const rows = (data ?? []) as Array<{
      study_group: Array<{
        id: string;
        name: string;
        description: string;
        subject_id: string;
        creator_id: string;
        created_at: string;
        subject: SubjectSummary | SubjectSummary[] | null;
        group_member: Array<{ profile_id: string }> | null;
      }>;
    }>;

    const resolveSubject = (
      raw: SubjectSummary | SubjectSummary[] | null | undefined,
    ): SubjectSummary | undefined => {
      if (!raw) return undefined;
      if (Array.isArray(raw)) return raw.length > 0 ? raw[0] : undefined;
      if (typeof raw === 'object' && raw.id && raw.name) return raw;
      return undefined;
    };

    return rows
      .flatMap((row) => row.study_group || [])
      .map((group) => ({
        ...mapStudyGroup(group),
        subject: resolveSubject(group.subject),
        member_count: Array.isArray(group.group_member) ? group.group_member.length : 0,
      }));
  }


  async findAll(limit: number): Promise<StudyGroupWithSubject[]> {
    const { data, error } = await supabase
      .from(STUDY_GROUPS_TABLE)
      .select(
        `
        id,
        name,
        description,
        subject_id,
        creator_id,
        created_at,
        subject!subject_id(
          id,
          name
        )
        `
      )
      .limit(limit);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const rows = (data ?? []) as Array<{
      id: string;
      name: string;
      description: string;
      subject_id: string;
      creator_id: string;
      created_at: string;
      subject: Array<SubjectSummary>;
    }>;

    return rows.map((group) => {
      const subj = group.subject as any;
      return {
        ...mapStudyGroup(group),
        subject: Array.isArray(subj) ? subj[0] : (subj || undefined),
      };
    });
  }

  async findAvailableBySubject(
    subjectId: string,
    currentProfileId: string
  ): Promise<StudyGroupWithSubject[]> {
    const { data, error } = await supabase
      .from(STUDY_GROUPS_TABLE)
      .select(
        `
        id,
        name,
        description,
        subject_id,
        creator_id,
        created_at,
        subject!subject_id(
          id,
          name
        )
        `
      )
      .eq('subject_id', subjectId)
      .neq('creator_id', currentProfileId);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const rows = (data ?? []) as Array<{
      id: string;
      name: string;
      description: string;
      subject_id: string;
      creator_id: string;
      created_at: string;
      subject: Array<SubjectSummary>;
    }>;

    return rows.map((group) => {
      const subj = group.subject as any;
      return {
        ...mapStudyGroup(group),
        subject: Array.isArray(subj) ? subj[0] : (subj || undefined),
      };
    });
  }

  async findById(groupId: string): Promise<StudyGroupWithSubject | null> {
    const { data, error } = await supabase
      .from(STUDY_GROUPS_TABLE)
      .select(
        `
        id,
        name,
        description,
        subject_id,
        creator_id,
        created_at,
        subject!subject_id(
          id,
          name
        )
        `
      )
      .eq('id', groupId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const group = data as {
      id: string;
      name: string;
      description: string;
      subject_id: string;
      creator_id: string;
      created_at: string;
      subject: Array<SubjectSummary>;
    };

    const subj = group.subject as any;
    return {
      ...mapStudyGroup(group),
      subject: Array.isArray(subj) ? subj[0] : (subj || undefined),
    };
  }

  async findDetailById(groupId: string): Promise<StudyGroupDetailResponse | null> {
    const group = await this.findById(groupId);
    if (!group) {
      return null;
    }

    const { data: membersData, error: membersError } = await supabase
      .from(GROUP_MEMBERS_TABLE)
      .select('profile_id')
      .eq('group_id', groupId);

    if (membersError) {
      throw new Error(`Failed to fetch members: ${membersError.message}`);
    }

    eventLogger.info('SupabaseStudyGroupRepository.findDetailById', 'Members query result', {
      groupId,
      membersData,
      rowCount: Array.isArray(membersData) ? membersData.length : 0,
    });

    let pendingData: Array<{ profile_id: string }> = [];
    try {
      const pendingTable = await this.resolvePendingRequestTable();
      const { data, error: pendingError } = await supabase
        .from(pendingTable)
        .select('profile_id')
        .eq('group_id', groupId);

      if (!pendingError) {
        pendingData = data ?? [];
      }
    } catch (err: unknown) {
      eventLogger.warn('SupabaseStudyGroupRepository.findDetailById', 'Pending requests table not available', {
        groupId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }

    const members = Array.from(
      new Set((membersData ?? []).map((row) => String((row as { profile_id: string }).profile_id)))
    );
    const pendingRequests = Array.from(
      new Set(pendingData.map((row) => String(row.profile_id)))
    );

    eventLogger.info('SupabaseStudyGroupRepository.findDetailById', 'Final result', {
      groupId,
      membersCount: members.length,
      members,
      pendingCount: pendingRequests.length,
    });

    const pendingAdminTransfer = await this.getPendingAdminTransfer(groupId);

    return {
      id: group.id,
      name: group.name,
      createdBy: group.creatorId,
      members,
      pendingRequests,
      subject: group.subject,
      pendingAdminTransfer: pendingAdminTransfer || undefined,
    };
  }

  async isMember(profileId: string, groupId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(GROUP_MEMBERS_TABLE)
      .select('profile_id')
      .eq('profile_id', profileId)
      .eq('group_id', groupId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to verify membership: ${error.message}`);
    }

    return data !== null;
  }

  async addMember(profileId: string, groupId: string): Promise<void> {
    const alreadyMember = await this.isMember(profileId, groupId);
    if (alreadyMember) {
      return;
    }

    const { error } = await supabase
      .from(GROUP_MEMBERS_TABLE)
      .insert({
        group_id: groupId,
        profile_id: profileId,
      });

    if (error) {
      throw new Error(`Failed to add member: ${error.message}`);
    }
  }

  async userExists(profileId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(PROFILES_TABLE)
      .select('id')
      .eq('id', profileId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to verify user existence: ${error.message}`);
    }

    return data !== null;
  }

  async hasPendingRequest(profileId: string, groupId: string): Promise<boolean> {
    const pendingTable = await this.resolvePendingRequestTable();
    const { data, error } = await supabase
      .from(pendingTable)
      .select('profile_id')
      .eq('profile_id', profileId)
      .eq('group_id', groupId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to verify pending request: ${error.message}`);
    }

    return data !== null;
  }

  async addPendingRequest(profileId: string, groupId: string): Promise<void> {
    const hasPendingRequest = await this.hasPendingRequest(profileId, groupId);
    if (hasPendingRequest) {
      return;
    }

    const pendingTable = await this.resolvePendingRequestTable();
    const { error } = await supabase.from(pendingTable).insert({
      group_id: groupId,
      profile_id: profileId,
    });

    if (error) {
      throw new Error(`Failed to add pending request: ${error.message}`);
    }
  }

  async removePendingRequest(profileId: string, groupId: string): Promise<void> {
    const pendingTable = await this.resolvePendingRequestTable();
    const { error } = await supabase
      .from(pendingTable)
      .delete()
      .eq('profile_id', profileId)
      .eq('group_id', groupId);

    if (error) {
      throw new Error(`Failed to remove pending request: ${error.message}`);
    }
  }

  async transferAdmin(groupId: string, newAdminProfileId: string): Promise<void> {
    const { error } = await supabase
      .from(STUDY_GROUPS_TABLE)
      .update({ creator_id: newAdminProfileId })
      .eq('id', groupId);

    if (error) {
      throw new Error(`Failed to transfer admin: ${error.message}`);
    }
  }

  async getPendingAdminTransfer(groupId: string): Promise<{ fromUserId: string; toUserId: string; status: 'pending' | 'accepted' | 'rejected' } | null> {
    const { data, error } = await supabase
      .from(STUDY_GROUPS_TABLE)
      .select('pending_admin_transfer')
      .eq('id', groupId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get pending admin transfer: ${error.message}`);
    }

    if (!data || !data.pending_admin_transfer) {
      return null;
    }

    return data.pending_admin_transfer as { fromUserId: string; toUserId: string; status: 'pending' | 'accepted' | 'rejected' };
  }

  async setPendingAdminTransfer(groupId: string, fromUserId: string, toUserId: string): Promise<void> {
    const { error } = await supabase
      .from(STUDY_GROUPS_TABLE)
      .update({
        pending_admin_transfer: {
          fromUserId,
          toUserId,
          status: 'pending',
        },
      })
      .eq('id', groupId);

    if (error) {
      throw new Error(`Failed to set pending admin transfer: ${error.message}`);
    }
  }

  async clearPendingAdminTransfer(groupId: string): Promise<void> {
    const { error } = await supabase
      .from(STUDY_GROUPS_TABLE)
      .update({ pending_admin_transfer: null })
      .eq('id', groupId);

    if (error) {
      throw new Error(`Failed to clear pending admin transfer: ${error.message}`);
    }
  }

  async acceptAdminTransfer(groupId: string): Promise<void> {
    const transfer = await this.getPendingAdminTransfer(groupId);
    if (!transfer) {
      throw new Error('No pending admin transfer found');
    }

    // Update creator_id and clear pending transfer
    const { error } = await supabase
      .from(STUDY_GROUPS_TABLE)
      .update({
        creator_id: transfer.toUserId,
        pending_admin_transfer: null,
      })
      .eq('id', groupId);

    if (error) {
      throw new Error(`Failed to accept admin transfer: ${error.message}`);
    }
  }

  async removeMember(profileId: string, groupId: string): Promise<void> {
    const { error } = await supabase
      .from(GROUP_MEMBERS_TABLE)
      .delete()
      .eq('profile_id', profileId)
      .eq('group_id', groupId);

    if (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }

  async findMembers(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await supabase
      .from(GROUP_MEMBERS_TABLE)
      .select(`
        profile_id,
        profile!profile_id(
          name
        )
      `)
      .eq('group_id', groupId);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const rows = (data ?? []) as Array<{
      profile_id: string;
      profile?: { name: string } | { name: string }[];
    }>;

    return rows.map((row) => {
      const p = Array.isArray(row.profile) ? row.profile[0] : row.profile;
      return {
        id: row.profile_id,
        name: p?.name ?? 'Unknown User',
      };
    });
  }

  async countBySubject(subjectId: string): Promise<number> {
    const { count, error } = await supabase
      .from(STUDY_GROUPS_TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', subjectId);

    if (error) {
      throw new Error(`Failed to count groups by subject: ${error.message}`);
    }

    return count ?? 0;
  }
}
