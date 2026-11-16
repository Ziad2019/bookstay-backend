// Path: src/users/dto/admin-users.dto.ts
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import {
  KycRequestStatus,
  UserBadge,
  UserRole,
  UserStatus,
} from '../enums/user.enums';

export class AdminFilterUsersDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(UserBadge)
  badge?: UserBadge;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sort_by?: 'latest' | 'total_spent' | 'bookings_count' | 'rating';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class AdminUpdateUserStatusDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(UserBadge)
  badge?: UserBadge;
}

export class AdminReviewOwnerKycDto {
  @IsEnum(KycRequestStatus)
  status: KycRequestStatus;

  @IsOptional()
  @IsString()
  admin_notes?: string;
}