import assert from 'node:assert/strict';
import { test } from '@jest/globals';
import { CreateQuestionUseCase } from '../../src/forum/application/use-cases/createQuestionUseCase';
import { GetForumQuestionsUseCase } from '../../src/forum/application/use-cases/getForumQuestionsUseCase';
import { CreateAnswerUseCase } from '../../src/forum/application/use-cases/createAnswerUseCase';
import { VoteAnswerUseCase } from '../../src/forum/application/use-cases/voteAnswerUseCase';
import { AcceptAnswerUseCase } from '../../src/forum/application/use-cases/acceptAnswerUseCase';
import { GetForumAnswersUseCase } from '../../src/forum/application/use-cases/getForumAnswersUseCase';
import { ForumRepositoryPort } from '../../src/forum/domain/ports/forumRepositoryPort';

const mockQuestion = {
  id: 'question-1',
  subjectId: 'subject-1',
  authorId: 'student-1',
  title: 'Pregunta válida de prueba',
  content: 'Este es el contenido de prueba con suficiente longitud.',
  createdAt: new Date().toISOString(),
};

const mockQuestionDetail = {
  ...mockQuestion,
  authorName: 'Juan Perez',
  authorAvatar: null,
};

const mockAnswer = {
  id: 'answer-1',
  questionId: 'question-1',
  authorId: 'student-2',
  content: 'Esta es una respuesta de prueba.',
  isAccepted: false,
  createdAt: new Date().toISOString(),
};

const makeMockForumRepository = (
  overrides: Partial<ForumRepositoryPort> = {}
): ForumRepositoryPort => ({
  createQuestion: async () => mockQuestion,
  findQuestionsBySubject: async () => [mockQuestionDetail],
  findQuestionById: async () => mockQuestionDetail,
  createAnswer: async () => mockAnswer,
  findAnswersByQuestion: async () => [],
  findAnswerById: async () => mockAnswer,
  isTeacher: async () => false,
  acceptAnswer: async () => undefined,
  hasVoted: async () => false,
  addVote: async () => undefined,
  removeVote: async () => undefined,
  verifyEnrollment: async () => true,
  ...overrides,
});

// ─── CreateQuestionUseCase Tests ─────────────────────────────────────────────

test('createQuestion should fail (403) if user is not enrolled and not a teacher', async () => {
  const repository = makeMockForumRepository({
    verifyEnrollment: async () => false,
    isTeacher: async () => false,
  });
  const useCase = new CreateQuestionUseCase(repository);

  const result = await useCase.execute({
    subjectId: 'subject-1',
    authorId: 'student-unauthorized',
    title: 'Pregunta de prueba',
    content: 'Contenido largo de prueba para validar.',
  });

  assert.equal(result.statusCode, 403);
  assert.ok(result.error?.includes('debes estar matriculado o ser docente'));
});

test('createQuestion should fail (400) if title is too short', async () => {
  const repository = makeMockForumRepository({
    verifyEnrollment: async () => true,
  });
  const useCase = new CreateQuestionUseCase(repository);

  const result = await useCase.execute({
    subjectId: 'subject-1',
    authorId: 'student-1',
    title: 'abc', // Short (< 5)
    content: 'Contenido largo de prueba para validar.',
  });

  assert.equal(result.statusCode, 400);
  assert.ok(result.error?.includes('debe tener al menos 5 caracteres'));
});

test('createQuestion should fail (400) if content is too short', async () => {
  const repository = makeMockForumRepository({
    verifyEnrollment: async () => true,
  });
  const useCase = new CreateQuestionUseCase(repository);

  const result = await useCase.execute({
    subjectId: 'subject-1',
    authorId: 'student-1',
    title: 'Pregunta de prueba',
    content: 'Short', // Short (< 10)
  });

  assert.equal(result.statusCode, 400);
  assert.ok(result.error?.includes('debe tener al menos 10 caracteres'));
});

test('createQuestion should succeed when validation passes', async () => {
  let created = false;
  const repository = makeMockForumRepository({
    verifyEnrollment: async () => true,
    createQuestion: async (input) => {
      created = true;
      return {
        id: 'question-new',
        subjectId: input.subjectId,
        authorId: input.authorId,
        title: input.title,
        content: input.content,
        createdAt: new Date().toISOString(),
      };
    },
  });
  const useCase = new CreateQuestionUseCase(repository);

  const result = await useCase.execute({
    subjectId: 'subject-1',
    authorId: 'student-1',
    title: 'Pregunta válida de prueba',
    content: 'Contenido de prueba de suficiente longitud.',
  });

  assert.equal(result.statusCode, 201);
  assert.equal(result.error, null);
  assert.equal(created, true);
  assert.equal(result.data?.title, 'Pregunta válida de prueba');
});

// ─── GetForumQuestionsUseCase Tests ──────────────────────────────────────────

test('getForumQuestions should fail (403) if user has no access', async () => {
  const repository = makeMockForumRepository({
    verifyEnrollment: async () => false,
    isTeacher: async () => false,
  });
  const useCase = new GetForumQuestionsUseCase(repository);

  const result = await useCase.execute('subject-1', 'student-unauthorized');

  assert.equal(result.statusCode, 403);
  assert.ok(result.error?.includes('No tienes acceso al foro de esta asignatura'));
});

test('getForumQuestions should return list of questions if user is enrolled', async () => {
  const repository = makeMockForumRepository({
    verifyEnrollment: async () => true,
  });
  const useCase = new GetForumQuestionsUseCase(repository);

  const result = await useCase.execute('subject-1', 'student-1');

  assert.equal(result.statusCode, 200);
  assert.equal(result.error, null);
  assert.equal(result.data?.length, 1);
  assert.equal(result.data?.[0].authorName, 'Juan Perez');
});

// ─── CreateAnswerUseCase Tests ────────────────────────────────────────────────

test('createAnswer should fail (404) if question does not exist', async () => {
  const repository = makeMockForumRepository({
    findQuestionById: async () => null,
  });
  const useCase = new CreateAnswerUseCase(repository);

  const result = await useCase.execute({
    questionId: 'nonexistent-question',
    authorId: 'student-1',
    content: 'Mi respuesta a la pregunta inexistente.',
  });

  assert.equal(result.statusCode, 404);
  assert.ok(result.error?.includes('La pregunta especificada no existe'));
});

test('createAnswer should fail (403) if user is not enrolled in the question\'s subject', async () => {
  const repository = makeMockForumRepository({
    verifyEnrollment: async () => false,
    isTeacher: async () => false,
  });
  const useCase = new CreateAnswerUseCase(repository);

  const result = await useCase.execute({
    questionId: 'question-1',
    authorId: 'student-unauthorized',
    content: 'Mi respuesta a la pregunta válida.',
  });

  assert.equal(result.statusCode, 403);
  assert.ok(result.error?.includes('debes estar matriculado o ser docente'));
});

test('createAnswer should succeed if user is enrolled', async () => {
  let answerCreated = false;
  const repository = makeMockForumRepository({
    verifyEnrollment: async () => true,
    createAnswer: async (input) => {
      answerCreated = true;
      return {
        id: 'answer-new',
        questionId: input.questionId,
        authorId: input.authorId,
        content: input.content,
        isAccepted: false,
        createdAt: new Date().toISOString(),
      };
    },
  });
  const useCase = new CreateAnswerUseCase(repository);

  const result = await useCase.execute({
    questionId: 'question-1',
    authorId: 'student-1',
    content: 'Mi respuesta a la pregunta válida.',
  });

  assert.equal(result.statusCode, 201);
  assert.equal(result.error, null);
  assert.equal(answerCreated, true);
  assert.equal(result.data?.content, 'Mi respuesta a la pregunta válida.');
});

// ─── GetForumAnswersUseCase Tests ─────────────────────────────────────────────

test('getForumAnswers should fail (404) if question does not exist', async () => {
  const repository = makeMockForumRepository({
    findQuestionById: async () => null,
  });
  const useCase = new GetForumAnswersUseCase(repository);

  const result = await useCase.execute('nonexistent', 'student-1');

  assert.equal(result.statusCode, 404);
});

test('getForumAnswers should return answers if user has access', async () => {
  const repository = makeMockForumRepository({
    verifyEnrollment: async () => true,
    findAnswersByQuestion: async () => [
      {
        id: 'answer-1',
        questionId: 'question-1',
        authorId: 'student-2',
        content: 'Respuesta',
        isAccepted: false,
        createdAt: new Date().toISOString(),
        authorName: 'Estudiante 2',
        authorAvatar: null,
        voteCount: 5,
        hasVoted: false,
      },
    ],
  });
  const useCase = new GetForumAnswersUseCase(repository);

  const result = await useCase.execute('question-1', 'student-1');

  assert.equal(result.statusCode, 200);
  assert.equal(result.error, null);
  assert.equal(result.data?.length, 1);
  assert.equal(result.data?.[0].voteCount, 5);
});

// ─── VoteAnswerUseCase Tests ──────────────────────────────────────────────────

test('voteAnswer should fail (404) if answer does not exist', async () => {
  const repository = makeMockForumRepository({
    findAnswerById: async () => null,
  });
  const useCase = new VoteAnswerUseCase(repository);

  const result = await useCase.execute('nonexistent', 'student-1');

  assert.equal(result.statusCode, 404);
});

test('voteAnswer should add vote if not already voted', async () => {
  let voteAdded = false;
  const repository = makeMockForumRepository({
    findAnswerById: async () => mockAnswer,
    hasVoted: async () => false,
    addVote: async () => {
      voteAdded = true;
    },
  });
  const useCase = new VoteAnswerUseCase(repository);

  const result = await useCase.execute('answer-1', 'student-1');

  assert.equal(result.statusCode, 200);
  assert.equal(result.data?.voted, true);
  assert.equal(voteAdded, true);
});

test('voteAnswer should remove vote if already voted', async () => {
  let voteRemoved = false;
  const repository = makeMockForumRepository({
    findAnswerById: async () => mockAnswer,
    hasVoted: async () => true,
    removeVote: async () => {
      voteRemoved = true;
    },
  });
  const useCase = new VoteAnswerUseCase(repository);

  const result = await useCase.execute('answer-1', 'student-1');

  assert.equal(result.statusCode, 200);
  assert.equal(result.data?.voted, false);
  assert.equal(voteRemoved, true);
});

// ─── AcceptAnswerUseCase Tests ────────────────────────────────────────────────

test('acceptAnswer should fail (403) if caller is not a teacher of the subject', async () => {
  const repository = makeMockForumRepository({
    isTeacher: async () => false,
  });
  const useCase = new AcceptAnswerUseCase(repository);

  const result = await useCase.execute('answer-1', 'student-1', true);

  assert.equal(result.statusCode, 403);
  assert.ok(result.error?.includes('Solo el docente de la asignatura puede aceptar'));
});

test('acceptAnswer should succeed if caller is teacher of the subject', async () => {
  let accepted = false;
  const repository = makeMockForumRepository({
    isTeacher: async () => true,
    acceptAnswer: async (answerId, isAcc) => {
      assert.equal(answerId, 'answer-1');
      assert.equal(isAcc, true);
      accepted = true;
    },
  });
  const useCase = new AcceptAnswerUseCase(repository);

  const result = await useCase.execute('answer-1', 'teacher-1', true);

  assert.equal(result.statusCode, 200);
  assert.equal(result.error, null);
  assert.equal(accepted, true);
});
