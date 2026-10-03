import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';

export enum UserRole {
  CLIENT = 'client',
  OWNER = 'owner',
  ADMIN = 'admin',
}

export enum UserStatus {
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

export enum NationalIdType {
  NATIONAL_ID = 'national_id',
  PASSPORT = 'passport',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT
       })
  role: UserRole;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name'  }) 
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  // select:false => never returned by default queries (add it explicitly when logging in)
  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  // Owner-only fields (nullable for clients/admins)
  @Column({
    name: 'national_id_type', 
    type: 'enum',
    enum: NationalIdType,
    nullable: true,
  })
  nationalIdType: NationalIdType | null;

  // store encrypted; never expose through the API
  @Column({
    name: 'national_id_number',
    type: 'text',
    nullable: true,
    select: false,
  })
  nationalIdNumber: string | null;

  // store encrypted; API must return a masked version only
  @Column({
    name: 'bank_account_info',
    type: 'text',
    nullable: true,
    select: false,
  })
  bankAccountInfo: Record<string, unknown> | null;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_REVIEW
     })
  status: UserStatus;

  @Column({
    name: 'avg_rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true,
  })
  avgRating: string | null;
}
