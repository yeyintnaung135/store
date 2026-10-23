import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from '../../../src/categories/categories.controller.js';
import { CategoriesService } from '../../../src/categories/categories.service.js';

describe('CategoriesController', () => {
  let controller: CategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        { provide: CategoriesService, useValue: {} },
        { provide: JwtService, useValue: { verify: vi.fn() } },
      ],
    }).compile();

    controller = module.get(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
