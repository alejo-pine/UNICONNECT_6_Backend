// src/infrastructure/database/repositories/PollRepository.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { IPollRepository } from '../../../domain/repositories/IPollRepository';
import { Poll, PollWithResults } from '../../../domain/entities/Poll';
import { logger } from '../../../shared/logger';

export class PollRepository implements IPollRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(
    postId: string,
    question: string,
    options: string[],
    expiresAt: Date
  ): Promise<PollWithResults> {
    const { data: pollData, error: pollError } = await this.supabase
      .from('poll')
      .insert({
        post_id: postId,
        question,
        expires_at: expiresAt.toISOString(),
        closed: false,
      })
      .select('id, post_id, question, expires_at, closed, created_at')
      .single();

    if (pollError || !pollData) {
      logger.error('Error inserting poll', { error: pollError?.message });
      throw new Error(`Database error creating poll: ${pollError?.message ?? 'No row returned'}`);
    }

    const optionRows = options.map((opt) => ({
      poll_id: pollData.id,
      option_text: opt,
    }));

    const { error: optionsError } = await this.supabase
      .from('poll_option')
      .insert(optionRows);

    if (optionsError) {
      logger.error('Error inserting poll options', { error: optionsError.message });
      throw new Error(`Database error creating poll options: ${optionsError.message}`);
    }

    const results = await this.findWithResults(pollData.id);
    if (!results) {
      throw new Error('Error retrieving newly created poll results');
    }

    return results;
  }

  async findWithResults(pollId: string, userId?: string): Promise<PollWithResults | null> {
    const { data: pollData, error: pollError } = await this.supabase
      .from('poll')
      .select('id, post_id, question, expires_at, closed, created_at')
      .eq('id', pollId)
      .maybeSingle();

    if (pollError) {
      logger.error('Error fetching poll data', { pollId, error: pollError.message });
      throw new Error(`Database error fetching poll: ${pollError.message}`);
    }

    if (!pollData) {
      return null;
    }

    const { data: optionsData, error: optionsError } = await this.supabase
      .from('poll_option')
      .select('id, option_text')
      .eq('poll_id', pollId);

    if (optionsError) {
      logger.error('Error fetching poll options', { pollId, error: optionsError.message });
      throw new Error(`Database error fetching poll options: ${optionsError.message}`);
    }

    const { data: votesData, error: votesError } = await this.supabase
      .from('poll_vote')
      .select('id, option_id, user_id')
      .eq('poll_id', pollId);

    if (votesError) {
      logger.error('Error fetching poll votes', { pollId, error: votesError.message });
      throw new Error(`Database error fetching poll votes: ${votesError.message}`);
    }

    const totalVotes = votesData ? votesData.length : 0;
    const options = (optionsData || []).map((opt) => {
      const votesCount = votesData ? votesData.filter((v) => v.option_id === opt.id).length : 0;
      const percentage = totalVotes === 0 ? 0 : Math.round((votesCount / totalVotes) * 100);
      return {
        id: opt.id,
        optionText: opt.option_text,
        votesCount,
        percentage,
      };
    });

    let userVotedOptionId: string | null = null;
    if (userId && votesData) {
      const userVote = votesData.find((v) => v.user_id === userId);
      if (userVote) {
        userVotedOptionId = userVote.option_id;
      }
    }

    return {
      id: pollData.id,
      postId: pollData.post_id,
      question: pollData.question,
      expiresAt: new Date(pollData.expires_at),
      closed: pollData.closed,
      createdAt: new Date(pollData.created_at),
      options,
      userVotedOptionId,
    };
  }

  async findWithResultsByPostId(postId: string, userId?: string): Promise<PollWithResults | null> {
    const { data: pollData, error: pollError } = await this.supabase
      .from('poll')
      .select('id')
      .eq('post_id', postId)
      .maybeSingle();

    if (pollError) {
      logger.error('Error fetching poll by postId', { postId, error: pollError.message });
      throw new Error(`Database error fetching poll: ${pollError.message}`);
    }

    if (!pollData) {
      return null;
    }

    return this.findWithResults(pollData.id, userId);
  }

  async registerVote(pollId: string, optionId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('poll_vote')
      .insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: userId,
      });

    if (error) {
      logger.error('Error registering poll vote', { pollId, optionId, userId, error: error.message });
      throw new Error(`Database error registering vote: ${error.message}`);
    }
  }

  async hasUserVoted(pollId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('poll_vote')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      logger.error('Error checking user vote status', { pollId, userId, error: error.message });
      throw new Error(`Database error checking vote: ${error.message}`);
    }

    return !!data;
  }

  async close(pollId: string): Promise<PollWithResults> {
    const { data, error } = await this.supabase
      .from('poll')
      .update({ closed: true })
      .eq('id', pollId)
      .select('id')
      .single();

    if (error || !data) {
      logger.error('Error closing poll', { pollId, error: error?.message });
      throw new Error(`Database error closing poll: ${error?.message ?? 'No row returned'}`);
    }

    const results = await this.findWithResults(pollId);
    if (!results) {
      throw new Error('Error retrieving closed poll results');
    }

    return results;
  }

  async listExpiredNotClosed(): Promise<Poll[]> {
    const { data, error } = await this.supabase
      .from('poll')
      .select('id, post_id, question, expires_at, closed, created_at')
      .eq('closed', false)
      .lt('expires_at', new Date().toISOString());

    if (error) {
      logger.error('Error listing expired polls', { error: error.message });
      throw new Error(`Database error listing expired polls: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      postId: row.post_id,
      question: row.question,
      expiresAt: new Date(row.expires_at),
      closed: row.closed,
      createdAt: new Date(row.created_at),
    }));
  }
}
