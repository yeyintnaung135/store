import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Wireless Headphones' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'wireless-headphones' })
  @IsString()
  @MinLength(2)
  @MaxLength(220)
  slug: string;

  @ApiPropertyOptional({ example: 'Bluetooth headphones' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 59.99, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 10, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiProperty({ example: '00000000-0000-4000-8000-000000000001' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/headphones.jpg',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  photoUrl?: string | null;
}
