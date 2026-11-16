// Path: src/users/dto/create-payout-method.dto.ts
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PayoutMethodType } from '../enums/user.enums';

export class CreatePayoutMethodDto {
  @IsEnum(PayoutMethodType)
  method_type: PayoutMethodType;

  @ValidateIf((o) => o.method_type === PayoutMethodType.BANK_ACCOUNT)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  bank_name?: string;

  @ValidateIf((o) => o.method_type === PayoutMethodType.BANK_ACCOUNT)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  account_holder_name?: string;

  /**
   * Bank Account Number, InstaPay IPA/Phone, or Vodafone Cash Wallet Number
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  account_identifier: string;

  @IsOptional()
  @Matches(/^EG\d{27}$/i, {
    message:
      'Egyptian IBAN must start with EG followed by 27 digits (29 chars total)',
  })
  iban?: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}