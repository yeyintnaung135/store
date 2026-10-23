import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../../src/auth/roles.guard.js';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: vi.fn(),
  };
  const guard = new RolesGuard(reflector as unknown as Reflector);

  function context(role?: 'ADMIN' | 'CUSTOMER'): ExecutionContext {
    return {
      getHandler: () => 'handler',
      getClass: () => 'class',
      switchToHttp: () => ({
        getRequest: () => ({
          user: role ? { sub: 'user-1', role } : undefined,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows a route that does not declare roles', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(context('CUSTOMER'))).toBe(true);
  });

  it('allows an admin when the route requires ADMIN', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(guard.canActivate(context('ADMIN'))).toBe(true);
  });

  it('rejects a customer when the route requires ADMIN', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(() => guard.canActivate(context('CUSTOMER'))).toThrow(
      ForbiddenException,
    );
  });
});
