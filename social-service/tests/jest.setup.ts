import { beforeEach, afterEach, jest } from '@jest/globals';

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
