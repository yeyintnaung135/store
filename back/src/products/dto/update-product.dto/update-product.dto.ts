import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from '../create-product.dto/create-product.dto.js';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
