import { supabase } from '../../utils/supabaseClient';
import { eventLogger } from '../../utils/eventLogger';
import { StudyGroup, StudyGroupWithSubject, SubjectSummary, GroupMember } from '../domain/entities/studyGroup';
import { StudyGroupRepositoryPort } from '../domain/ports/studyGroupRepositoryPort';

const STUDY_GROUPS_TABLE = 'study_group';
const GROUP_MEMBERS_TABLE = 'group_member';
const PROFILE_SUBJECT_TABLE = 'profile_subject';

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
          )
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
        subject: Array<SubjectSummary>;
      }>;
    }>;

    return rows
      .flatMap((row) => row.study_group || [])
      .map((group) => ({
        ...mapStudyGroup(group),
        subject: Array.isArray(group.subject) && group.subject.length > 0 ? group.subject[0] : undefined,
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

    return rows.map((group) => ({
      ...mapStudyGroup(group),
      subject: Array.isArray(group.subject) && group.subject.length > 0 ? group.subject[0] : undefined,
    }));
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

    return rows.map((group) => ({
      ...mapStudyGroup(group),
      subject: Array.isArray(group.subject) && group.subject.length > 0 ? group.subject[0] : undefined,
    }));
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
      .single();

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

    return {
      ...mapStudyGroup(group),
      subject: Array.isArray(group.subject) && group.subject.length > 0 ? group.subject[0] : undefined,
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
}
