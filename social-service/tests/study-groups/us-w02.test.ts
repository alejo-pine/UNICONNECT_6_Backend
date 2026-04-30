import assert from 'node:assert/strict';
import test from 'node:test';
import { CreateStudyGroupUseCase } from '../../src/study-groups/application/use-cases/createStudyGroupUseCase';
import { JoinStudyGroupUseCase } from '../../src/study-groups/application/use-cases/joinStudyGroupUseCase';
import { AcceptStudyGroupRequestUseCase } from '../../src/study-groups/application/use-cases/acceptStudyGroupRequestUseCase';
import { InitiateAdminTransferUseCase } from '../../src/study-groups/application/use-cases/initiateAdminTransferUseCase';
import { LeaveStudyGroupUseCase } from '../../src/study-groups/application/use-cases/leaveStudyGroupUseCase';
import { RejectStudyGroupRequestUseCase } from '../../src/study-groups/application/use-cases/rejectStudyGroupRequestUseCase';
import { RespondAdminTransferUseCase } from '../../src/study-groups/application/use-cases/respondAdminTransferUseCase';
import { StudyGroupRepositoryPort } from '../../src/study-groups/domain/ports/studyGroupRepositoryPort';

// ─── Shared fixtures ─────────────────────────────────────────────────────────

const groupDetail = {
  id: 'group-1',
  name: 'Algebra II',
  createdBy: 'admin-1',
  members: ['admin-1', 'member-1'],
  pendingRequests: ['user-pending-1'],
};

const groupWithSubject = {
  id: 'group-1',
  name: 'Algebra II',
  description: 'Grupo de estudio',
  subjectId: 'subject-1',
  creatorId: 'admin-1',
  createdAt: new Date().toISOString(),
  subject: { id: 'subject-1', name: 'Algebra' },
};

const makeRepository = (
  overrides: Partial<StudyGroupRepositoryPort> = {}
): StudyGroupRepositoryPort => ({
  create: async () => groupWithSubject,
  findByProfileId: async () => [],
  findAll: async () => [],
  verifyEnrollment: async () => true,
  findAvailableBySubject: async () => [],
  findById: async () => groupWithSubject,
  findDetailById: async () => groupDetail,
  isMember: async () => false,
  findMembers: async () => [],
  addMember: async () => undefined,
  removeMember: async () => undefined,
  userExists: async () => true,
  hasPendingRequest: async () => false,
  addPendingRequest: async () => undefined,
  removePendingRequest: async () => undefined,
  transferAdmin: async () => undefined,
  getPendingAdminTransfer: async () => null,
  setPendingAdminTransfer: async () => undefined,
  clearPendingAdminTransfer: async () => undefined,
  acceptAdminTransfer: async () => undefined,
  countBySubject: async () => 0,
  ...overrides,
});

const makeSubjectRepository = (exists = true) => ({
  exists: async () => exists,
});

// ─── create group ─────────────────────────────────────────────────────────────

test('create group should return 409 when subject already has 3 groups', async () => {
  const repository = makeRepository({ countBySubject: async () => 3 });
  const useCase = new CreateStudyGroupUseCase(repository, makeSubjectRepository());

  const result = await useCase.execute({
    name: 'New Group',
    description: 'A group',
    subjectId: 'subject-1',
    creatorId: 'admin-1',
  });

  assert.equal(result.statusCode, 409);
  assert.ok(result.error?.includes('maximum of 3 study groups'));
});

test('create group should return 400 when subject does not exist', async () => {
  const repository = makeRepository();
  const useCase = new CreateStudyGroupUseCase(repository, makeSubjectRepository(false));

  const result = await useCase.execute({
    name: 'New Group',
    description: 'A group',
    subjectId: 'nonexistent-subject',
    creatorId: 'admin-1',
  });

  assert.equal(result.statusCode, 400);
  assert.equal(result.error, 'Subject does not exist');
});

test('create group should succeed when subject has fewer than 3 groups', async () => {
  let created = false;

  const repository = makeRepository({
    countBySubject: async () => 2,
    create: async () => {
      created = true;
      return groupWithSubject;
    },
  });

  const useCase = new CreateStudyGroupUseCase(repository, makeSubjectRepository());
  const result = await useCase.execute({
    name: 'Third Group',
    description: 'Valid group',
    subjectId: 'subject-1',
    creatorId: 'admin-1',
  });

  assert.equal(result.statusCode, 201);
  assert.equal(result.error, null);
  assert.equal(created, true);
  assert.equal(result.data?.isAdmin, true);
  assert.equal(result.data?.isMember, true);
});

// ─── join group ───────────────────────────────────────────────────────────────

test('join group should return 409 when user is already a member', async () => {
  const repository = makeRepository({ isMember: async () => true });
  const useCase = new JoinStudyGroupUseCase(repository);

  const result = await useCase.execute({ groupId: 'group-1', profileId: 'admin-1' });

  assert.equal(result.statusCode, 409);
  assert.equal(result.error, 'You are already a member of this group');
});

test('join group should return 409 when user already has a pending request', async () => {
  const repository = makeRepository({
    isMember: async () => false,
    hasPendingRequest: async () => true,
  });
  const useCase = new JoinStudyGroupUseCase(repository);

  const result = await useCase.execute({ groupId: 'group-1', profileId: 'user-new' });

  assert.equal(result.statusCode, 409);
  assert.equal(result.error, 'You already have a pending request for this group');
});

test('join group should return 403 when user is not enrolled in subject', async () => {
  const repository = makeRepository({ verifyEnrollment: async () => false });
  const useCase = new JoinStudyGroupUseCase(repository);

  const result = await useCase.execute({ groupId: 'group-1', profileId: 'user-new' });

  assert.equal(result.statusCode, 403);
  assert.equal(result.error, 'Forbidden: You are not enrolled in the subject for this group');
});

test('join group should add a pending request when all validations pass', async () => {
  let requestAdded = false;

  const repository = makeRepository({
    isMember: async () => false,
    hasPendingRequest: async () => false,
    verifyEnrollment: async () => true,
    addPendingRequest: async (profileId, groupId) => {
      assert.equal(profileId, 'user-new');
      assert.equal(groupId, 'group-1');
      requestAdded = true;
    },
    findDetailById: async () => ({
      ...groupDetail,
      pendingRequests: ['user-pending-1', 'user-new'],
    }),
  });

  const useCase = new JoinStudyGroupUseCase(repository);
  const result = await useCase.execute({ groupId: 'group-1', profileId: 'user-new' });

  assert.equal(result.statusCode, 200);
  assert.equal(result.error, null);
  assert.equal(requestAdded, true);
  assert.equal(result.data?.isMember, false); // Not a member yet — pending approval
});

test('join group should return 404 when group does not exist', async () => {
  const repository = makeRepository({ findById: async () => null });
  const useCase = new JoinStudyGroupUseCase(repository);

  const result = await useCase.execute({ groupId: 'nonexistent', profileId: 'user-new' });

  assert.equal(result.statusCode, 404);
  assert.equal(result.error, 'Study group not found');
});

// ─── accept / reject requests ─────────────────────────────────────────────────

test('accept request should return 403 when caller is not admin', async () => {
  const repository = makeRepository({
    findDetailById: async () => ({ ...groupDetail, createdBy: 'admin-real' }),
  });

  const useCase = new AcceptStudyGroupRequestUseCase(repository);
  const result = await useCase.execute({
    groupId: 'group-1',
    currentUserId: 'user-not-admin',
    requestedUserId: 'user-pending-1',
  });

  assert.equal(result.statusCode, 403);
  assert.equal(result.error, 'Forbidden: only admin can accept requests');
});

test('accept request should move pending request to members', async () => {
  let addedMember = false;
  let removedPending = false;

  const repository = makeRepository({
    isMember: async () => false,
    addMember: async (profileId, groupId) => {
      assert.equal(profileId, 'user-pending-1');
      assert.equal(groupId, 'group-1');
      addedMember = true;
    },
    removePendingRequest: async (profileId, groupId) => {
      assert.equal(profileId, 'user-pending-1');
      assert.equal(groupId, 'group-1');
      removedPending = true;
    },
    findDetailById: async () => ({
      ...groupDetail,
      members: ['admin-1', 'member-1', 'user-pending-1'],
      pendingRequests: [],
    }),
  });

  const useCase = new AcceptStudyGroupRequestUseCase(repository);
  const result = await useCase.execute({
    groupId: 'group-1',
    currentUserId: 'admin-1',
    requestedUserId: 'user-pending-1',
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.error, null);
  assert.equal(addedMember, true);
  assert.equal(removedPending, true);
  assert.deepEqual(result.data?.pendingRequests, []);
});

test('reject request should return 409 when request was already processed', async () => {
  const repository = makeRepository({ hasPendingRequest: async () => false });
  const useCase = new RejectStudyGroupRequestUseCase(repository);

  const result = await useCase.execute({
    groupId: 'group-1',
    currentUserId: 'admin-1',
    requestedUserId: 'user-pending-1',
  });

  assert.equal(result.statusCode, 409);
  assert.equal(result.error, 'Request already processed or does not exist');
});

// ─── admin transfer ────────────────────────────────────────────────────────────

test('transfer admin should return 409 when new admin is not a member', async () => {
  const repository = makeRepository({ isMember: async () => false });
  const useCase = new InitiateAdminTransferUseCase(repository);

  const result = await useCase.execute({
    groupId: 'group-1',
    currentUserId: 'admin-1',
    newAdminUserId: 'user-not-member',
  });

  assert.equal(result.statusCode, 409);
  assert.equal(result.error, 'User is not a member of this group');
});

test('initiate transfer should create a pending admin transfer', async () => {
  let created = false;

  const repository = makeRepository({
    isMember: async () => true,
    setPendingAdminTransfer: async (groupId, fromUserId, toUserId) => {
      assert.equal(groupId, 'group-1');
      assert.equal(fromUserId, 'admin-1');
      assert.equal(toUserId, 'user-pending-1');
      created = true;
    },
  });

  const useCase = new InitiateAdminTransferUseCase(repository);
  const result = await useCase.execute({
    groupId: 'group-1',
    currentUserId: 'admin-1',
    newAdminUserId: 'user-pending-1',
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.error, null);
  assert.equal(created, true);
});

test('respond transfer should accept only the requested user', async () => {
  let accepted = false;

  const repository = makeRepository({
    getPendingAdminTransfer: async () => ({
      fromUserId: 'admin-1',
      toUserId: 'user-pending-1',
      status: 'pending',
    }),
    acceptAdminTransfer: async () => {
      accepted = true;
    },
    findDetailById: async () => ({
      ...groupDetail,
      createdBy: 'user-pending-1',
      pendingRequests: [],
    }),
  });

  const useCase = new RespondAdminTransferUseCase(repository);
  const result = await useCase.execute({
    groupId: 'group-1',
    respondingUserId: 'user-pending-1',
    action: 'accept',
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.error, null);
  assert.equal(accepted, true);
  assert.equal(result.data?.createdBy, 'user-pending-1');
});

// ─── leave group ──────────────────────────────────────────────────────────────

test('leave group should return 409 when any admin transfer is pending', async () => {
  const repository = makeRepository({
    isMember: async () => true,
    getPendingAdminTransfer: async () => ({
      fromUserId: 'admin-1',
      toUserId: 'member-1',
      status: 'pending',
    }),
    findDetailById: async () => ({
      ...groupDetail,
      createdBy: 'admin-1',
      members: ['admin-1', 'member-1'],
    }),
  });

  const useCase = new LeaveStudyGroupUseCase(repository);
  const result = await useCase.execute({ groupId: 'group-1', profileId: 'admin-1' });

  assert.equal(result.statusCode, 409);
  assert.equal(result.error, 'Debes completar la transferencia de administración antes de salir');
});
