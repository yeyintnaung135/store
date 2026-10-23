import { AppService } from '../../src/app.service.js';

describe('AppService', () => {
  it('returns the greeting', () => {
    expect(new AppService().getHello()).toBe('Hello World!');
  });
});
