import { CreateCategoryDto } from '../../../src/categories/dto/create-category.dto.js';

describe('CreateCategoryDto', () => {
  it('should be defined', () => {
    expect(new CreateCategoryDto()).toBeDefined();
  });
});
