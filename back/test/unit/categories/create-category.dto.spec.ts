import { CreateCategoryDto } from '../../../src/categories/types/create-category.dto.js';

describe('CreateCategoryDto', () => {
  it('should be defined', () => {
    expect(new CreateCategoryDto()).toBeDefined();
  });
});
