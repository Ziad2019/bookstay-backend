// Path: src/users/dto/register-owner-kyc.dto.ts
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  Equals,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { KycDocumentType } from '../enums/user.enums';
import { CreateClientDto } from './create-client.dto';
import { CreatePayoutMethodDto } from './create-payout-method.dto';

export class RegisterOwnerKycDto extends CreateClientDto {
  // Step 1: Optional Backup Phone
  @IsOptional()
  @Matches(/^01[0125][0-9]{8}$/, {
    message: 'Backup phone must be a valid 11-digit Egyptian mobile number',
  })
  backup_phone?: string;

  // Step 2: Identity Verification (KYC)
  @IsEnum(KycDocumentType)
  national_id_type: KycDocumentType;

  @ValidateIf((o) => o.national_id_type === KycDocumentType.NATIONAL_ID)
  @Matches(/^[23]\d{13}$/, {
    message: 'Egyptian National ID must be exactly 14 digits without spaces',
  })
  @IsString()
  @IsNotEmpty()
  national_id_number: string;

  @IsString()
  @IsNotEmpty()
  id_front_url: string;

  @IsString()
  @IsNotEmpty()
  id_back_url: string;

  @IsString()
  @IsNotEmpty()
  selfie_with_id_url: string;

  // Step 3: Current Address, Payout Methods & Optional Tax Info
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  governorate: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  city: string;

  @IsString()
  @IsNotEmpty()
  detailed_address: string;

  @IsArray()
  @ArrayMinSize(1, {
    message:
      'At least one complete payout method (Bank, InstaPay, or Vodafone Cash) is required',
  })
  @ValidateNested({ each: true })
  @Type(() => CreatePayoutMethodDto)
  payout_methods: CreatePayoutMethodDto[];

  @IsOptional()
  @Matches(/^\d{9}$/, {
    message: 'Tax number must be exactly 9 digits',
  })
  tax_number?: string;

  @IsOptional()
  @IsString()
  tax_document_url?: string;

  // Step 4: Terms Acceptance
  @IsBoolean()
  @Equals(true, {
    message: 'You must accept the platform terms and confirm KYC accuracy',
  })
  terms_accepted: boolean;
}