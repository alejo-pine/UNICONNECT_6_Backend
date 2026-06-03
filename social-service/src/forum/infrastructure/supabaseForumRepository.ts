import { supabase } from '../../utils/supabaseClient';
import { ForumRepositoryPort } from '../domain/ports/forumRepositoryPort';
import { SubjectQuestion, SubjectQuestionDetail } from '../domain/entities/question';
import { QuestionAnswer, QuestionAnswerDetail } from '../domain/entities/answer';

export class SupabaseForumRepository implements ForumRepositoryPort {
  async createQuestion(input: {
    subjectId: string;
    authorId: string;
    title: string;
    content: string;
  }): Promise<SubjectQuestion> {
    const { data, error } = await supabase
      .from('subject_question')
      .insert({
        subject_id: input.subjectId,
        author_id: input.authorId,
        title: input.title,
        content: input.content,
        is_resolved: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create question: ${error.message}`);
    }

    return {
      id: data.id,
      subjectId: data.subject_id,
      authorId: data.author_id,
      title: data.title,
      content: data.content,
      isResolved: data.is_resolved,
      createdAt: data.created_at,
    };
  }

  async findQuestionsBySubject(subjectId: string): Promise<SubjectQuestionDetail[]> {
    const { data, error } = await supabase
      .from('subject_question')
      .select('id, subject_id, author_id, title, content, is_resolved, created_at')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find questions: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    const questionIds = data.map((q) => q.id);
    const authorIds = Array.from(new Set(data.map((q) => q.author_id)));

    const [profilesResult, answersCountResult] = await Promise.all([
      supabase.from('profile').select('id, name, avatar_url').in('id', authorIds),
      supabase
        .from('question_answer')
        .select('question_id')
        .in('question_id', questionIds),
    ]);

    if (profilesResult.error) {
      throw new Error(`Failed to fetch profiles: ${profilesResult.error.message}`);
    }
    if (answersCountResult.error) {
      throw new Error(`Failed to fetch answer counts: ${answersCountResult.error.message}`);
    }

    const profileMap = new Map<string, { name: string; avatar_url: string | null }>();
    if (profilesResult.data) {
      profilesResult.data.forEach((p) => {
        profileMap.set(p.id, { name: p.name, avatar_url: p.avatar_url });
      });
    }

    const answerCountMap = new Map<string, number>();
    if (answersCountResult.data) {
      answersCountResult.data.forEach((a) => {
        const count = answerCountMap.get(a.question_id) ?? 0;
        answerCountMap.set(a.question_id, count + 1);
      });
    }

    return data.map((q) => {
      const profile = profileMap.get(q.author_id);
      return {
        id: q.id,
        subjectId: q.subject_id,
        authorId: q.author_id,
        title: q.title,
        content: q.content,
        isResolved: q.is_resolved,
        createdAt: q.created_at,
        authorName: profile?.name ?? 'Usuario Desconocido',
        authorAvatar: profile?.avatar_url ?? null,
        answerCount: answerCountMap.get(q.id) ?? 0,
      };
    });
  }

  async findQuestionById(questionId: string): Promise<SubjectQuestionDetail | null> {
    const { data, error } = await supabase
      .from('subject_question')
      .select('id, subject_id, author_id, title, content, is_resolved, created_at')
      .eq('id', questionId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find question by id: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const [profileResult, answerCountResult] = await Promise.all([
      supabase.from('profile').select('name, avatar_url').eq('id', data.author_id).maybeSingle(),
      supabase.from('question_answer').select('id').eq('question_id', questionId),
    ]);

    if (profileResult.error) {
      throw new Error(`Failed to fetch profile: ${profileResult.error.message}`);
    }
    if (answerCountResult.error) {
      throw new Error(`Failed to fetch answer count: ${answerCountResult.error.message}`);
    }

    return {
      id: data.id,
      subjectId: data.subject_id,
      authorId: data.author_id,
      title: data.title,
      content: data.content,
      isResolved: data.is_resolved,
      createdAt: data.created_at,
      authorName: profileResult.data?.name ?? 'Usuario Desconocido',
      authorAvatar: profileResult.data?.avatar_url ?? null,
      answerCount: answerCountResult.data?.length ?? 0,
    };
  }

  async createAnswer(input: {
    questionId: string;
    authorId: string;
    content: string;
  }): Promise<QuestionAnswer> {
    const { data, error } = await supabase
      .from('question_answer')
      .insert({
        question_id: input.questionId,
        author_id: input.authorId,
        content: input.content,
        is_accepted: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create answer: ${error.message}`);
    }

    return {
      id: data.id,
      questionId: data.question_id,
      authorId: data.author_id,
      content: data.content,
      isAccepted: data.is_accepted,
      createdAt: data.created_at,
    };
  }

  async findAnswersByQuestion(
    questionId: string,
    currentProfileId: string
  ): Promise<QuestionAnswerDetail[]> {
    const { data: answers, error: answersError } = await supabase
      .from('question_answer')
      .select('id, question_id, author_id, content, is_accepted, created_at')
      .eq('question_id', questionId);

    if (answersError) {
      throw new Error(`Failed to find answers: ${answersError.message}`);
    }

    if (!answers || answers.length === 0) {
      return [];
    }

    const answerIds = answers.map((a) => a.id);
    const authorIds = Array.from(new Set(answers.map((a) => a.author_id)));

    const [profilesResult, votesResult] = await Promise.all([
      supabase.from('profile').select('id, name, avatar_url').in('id', authorIds),
      supabase.from('answer_vote').select('answer_id, profile_id').in('answer_id', answerIds),
    ]);

    if (profilesResult.error) {
      throw new Error(`Failed to fetch profiles: ${profilesResult.error.message}`);
    }
    if (votesResult.error) {
      throw new Error(`Failed to fetch votes: ${votesResult.error.message}`);
    }

    const profileMap = new Map<string, { name: string; avatar_url: string | null }>();
    if (profilesResult.data) {
      profilesResult.data.forEach((p) => {
        profileMap.set(p.id, { name: p.name, avatar_url: p.avatar_url });
      });
    }

    const voteCountsMap = new Map<string, number>();
    const userVotesSet = new Set<string>();

    if (votesResult.data) {
      votesResult.data.forEach((v) => {
        const count = voteCountsMap.get(v.answer_id) ?? 0;
        voteCountsMap.set(v.answer_id, count + 1);

        if (v.profile_id === currentProfileId) {
          userVotesSet.add(v.answer_id);
        }
      });
    }

    const mappedAnswers: QuestionAnswerDetail[] = answers.map((a) => {
      const profile = profileMap.get(a.author_id);
      return {
        id: a.id,
        questionId: a.question_id,
        authorId: a.author_id,
        content: a.content,
        isAccepted: a.is_accepted,
        createdAt: a.created_at,
        authorName: profile?.name ?? 'Usuario Desconocido',
        authorAvatar: profile?.avatar_url ?? null,
        voteCount: voteCountsMap.get(a.id) ?? 0,
        hasVoted: userVotesSet.has(a.id),
      };
    });

    // Ordenamiento: aceptada al tope, luego por votos desc, desempate por fecha asc
    mappedAnswers.sort((a, b) => {
      if (a.isAccepted && !b.isAccepted) return -1;
      if (!a.isAccepted && b.isAccepted) return 1;
      if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return mappedAnswers;
  }

  async findAnswerById(answerId: string): Promise<QuestionAnswer | null> {
    const { data, error } = await supabase
      .from('question_answer')
      .select('id, question_id, author_id, content, is_accepted, created_at')
      .eq('id', answerId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find answer by id: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      questionId: data.question_id,
      authorId: data.author_id,
      content: data.content,
      isAccepted: data.is_accepted,
      createdAt: data.created_at,
    };
  }

  async findQuestionIdByAnswerId(answerId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('question_answer')
      .select('question_id')
      .eq('id', answerId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find question id by answer id: ${error.message}`);
    }

    return data?.question_id ?? null;
  }

  async isTeacher(profileId: string, subjectId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('subject_teacher')
      .select('profile_id')
      .eq('profile_id', profileId)
      .eq('subject_id', subjectId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to verify teacher status: ${error.message}`);
    }

    return data !== null;
  }

  async acceptAnswer(answerId: string, isAccepted: boolean): Promise<void> {
    const { error } = await supabase
      .from('question_answer')
      .update({ is_accepted: isAccepted })
      .eq('id', answerId);

    if (error) {
      throw new Error(`Failed to update answer acceptance: ${error.message}`);
    }
  }

  async clearAcceptedAnswer(questionId: string): Promise<void> {
    const { error } = await supabase
      .from('question_answer')
      .update({ is_accepted: false })
      .eq('question_id', questionId)
      .eq('is_accepted', true);

    if (error) {
      throw new Error(`Failed to clear accepted answer: ${error.message}`);
    }
  }

  async markQuestionResolved(questionId: string, isResolved: boolean): Promise<void> {
    const { error } = await supabase
      .from('subject_question')
      .update({ is_resolved: isResolved })
      .eq('id', questionId);

    if (error) {
      throw new Error(`Failed to update question resolved status: ${error.message}`);
    }
  }

  async hasVoted(profileId: string, answerId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('answer_vote')
      .select('profile_id')
      .eq('profile_id', profileId)
      .eq('answer_id', answerId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to verify vote status: ${error.message}`);
    }

    return data !== null;
  }

  async addVote(profileId: string, answerId: string): Promise<void> {
    const { error } = await supabase
      .from('answer_vote')
      .insert({
        profile_id: profileId,
        answer_id: answerId,
      });

    if (error) {
      throw new Error(`Failed to add vote: ${error.message}`);
    }
  }

  async removeVote(profileId: string, answerId: string): Promise<void> {
    const { error } = await supabase
      .from('answer_vote')
      .delete()
      .eq('profile_id', profileId)
      .eq('answer_id', answerId);

    if (error) {
      throw new Error(`Failed to remove vote: ${error.message}`);
    }
  }

  async verifyEnrollment(profileId: string, subjectId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profile_subject')
      .select('profile_id')
      .eq('profile_id', profileId)
      .eq('subject_id', subjectId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to verify enrollment: ${error.message}`);
    }

    return data !== null;
  }
}
