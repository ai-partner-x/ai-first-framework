import { jest } from '@jest/globals';

jest.setTimeout(10000);

beforeAll(() => {
  console.log('开始测试套件...');
});

afterAll(() => {
  console.log('测试套件完成');
});

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
