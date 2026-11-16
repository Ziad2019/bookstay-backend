// Path: src/users/entities/user.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { EncryptionTransformer } from '../../common/transformers/encryption.transformer';
import {
  KycDocumentType,
  UserBadge,
  UserRole,
  UserStatus,
} from '../enums/user.enums';
import { OwnerKycRequest } from './owner-kyc-request.entity';
import { OwnerPayoutMethod } from './owner-payout-method.entity';

@Entity('users')
@Index(['role', 'status'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CLIENT })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'enum', enum: UserBadge, default: UserBadge.NONE })
  badge: UserBadge;

  @Column({ type: 'varchar', length: 80 })
  first_name: string;

  @Column({ type: 'varchar', length: 80 })
  last_name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'boolean', default: false })
  is_phone_verified: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  backup_phone: string | null;

  @Exclude()
  @Column({ type: 'varchar', length: 255, select: false })
  password_hash: string;

  @Column({ type: 'varchar', length: 120, nullable: true, unique: true })
  google_id: string | null;

  @Column({ type: 'boolean', default: false })
  two_factor_enabled: boolean;

  // Address fields (Owner KYC Step 3 & Admin Tenant CRM "المدينة")
  @Column({ type: 'varchar', length: 80, nullable: true })
  governorate: string | null;

  @Index()
  @Column({ type: 'varchar', length: 80, nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  detailed_address: string | null;

  // Encrypted KYC & Tax fields (Owner only)
  @Column({ type: 'enum', enum: KycDocumentType, nullable: true })
  national_id_type: KycDocumentType | null;

  @Exclude()
  @Column({
    type: 'text',
    nullable: true,
    select: false,
    transformer: new EncryptionTransformer(),
  })
  national_id_enc: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  national_id_masked: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tax_number: string | null;

  // Host & Tenant Metrics (Displayed in Client Host Card, Owner Earnings & Admin Users CRM)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100.0 })
  response_rate: number;

  @Column({ type: 'int', default: 60 })
  response_time_mins: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  withdrawable_balance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  total_spent: number;

  @Column({ type: 'int', default: 0 })
  bookings_count: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  avg_rating: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  terms_accepted_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  last_login_at: Date | null;

  @OneToMany(() => OwnerKycRequest, (kyc) => kyc.owner)
  kyc_requests: OwnerKycRequest[];

  @OneToMany(() => OwnerPayoutMethod, (pm) => pm.owner)
  payout_methods: OwnerPayoutMethod[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}