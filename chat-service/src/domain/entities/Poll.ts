// src/domain/entities/Poll.ts

export interface PollVote {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  createdAt: Date;
}

export interface PollOption {
  id: string;
  pollId: string;
  optionText: string;
}

export interface Poll {
  id: string;
  postId: string;
  question: string;
  expiresAt: Date;
  closed: boolean;
  createdAt: Date;
}

export interface PollOptionResults {
  id: string;
  optionText: string;
  votesCount: number;
  percentage: number;
}

export interface PollWithResults extends Poll {
  options: PollOptionResults[];
  userVotedOptionId: string | null;
}
