// Path: src/users/dto/create-client.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  first_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  last_name: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @Matches(/^01[0125][0-9]{8}$/, {
    message:
      'Phone number must be a valid 11-digit Egyptian mobile number (01xxxxxxxxx)',
  })
  phone: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message:
      'Password must be at least 8 characters and contain both letters and numbers',
  })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;
}