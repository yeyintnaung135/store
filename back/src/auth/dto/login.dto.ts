import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email address or phone number',
    example: 'aung@example.com',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(254)
  identifier: string;

  @ApiProperty({
    example: 'password123',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
