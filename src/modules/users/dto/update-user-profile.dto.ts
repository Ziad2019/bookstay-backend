// Path: src/users/dto/update-user-profile.dto.ts
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  last_name?: string;

  @IsOptional()
  @Matches(/^01[0125][0-9]{8}$/)
  backup_phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  governorate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  detailed_address?: string;

  @IsOptional()
  @IsBoolean()
  two_factor_enabled?: boolean;
}