// Path: src/users/entities/owner-payout-method.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { EncryptionTransformer } from '../../common/transformers/encryption.transformer';
import { PayoutMethodType } from '../enums/user.enums';
import { User } from './user.entity';

@Entity('owner_payout_methods')
@Index(['owner_id', 'is_default'])
export class OwnerPayoutMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  owner_id: string;

  @ManyToOne(() => User, (user) => user.payout_methods, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ type: 'enum', enum: PayoutMethodType })
  method_type: PayoutMethodType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bank_name: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  account_holder_name: string | null;

  /**
   * Encrypted bank account number, InstaPay address/phone, or Vodafone Cash number
   */
  @Exclude()
  @Column({
    type: 'text',
    select: false,
    transformer: new EncryptionTransformer(),
  })
  account_identifier_enc: string;

  @Column({ type: 'varchar', length: 40 })
  account_identifier_masked: string;

  @Exclude()
  @Column({
    type: 'text',
    nullable: true,
    select: false,
    transformer: new EncryptionTransformer(),
  })
  iban_enc: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  iban_masked: string | null;

  @Column({ type: 'boolean', default: false })
  is_default: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}