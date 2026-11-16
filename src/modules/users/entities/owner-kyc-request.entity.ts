// Path: src/users/entities/owner-kyc-request.entity.ts
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
import { KycDocumentType, KycRequestStatus } from '../enums/user.enums';
import { User } from './user.entity';

@Entity('owner_kyc_requests')
@Index(['status', 'created_at'])
export class OwnerKycRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Human-readable code shown in Admin Owner KYC Queue (e.g., "REQ-001")
   */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, unique: true })
  reference_code: string;

  @Column({ type: 'uuid' })
  owner_id: string;

  @ManyToOne(() => User, (user) => user.kyc_requests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ type: 'enum', enum: KycDocumentType })
  document_type: KycDocumentType;

  // Private S3 / Cloudinary object keys (never public URLs)
  @Column({ type: 'text' })
  id_front_url: string;

  @Column({ type: 'text' })
  id_back_url: string;

  @Column({ type: 'text' })
  selfie_with_id_url: string;

  @Column({ type: 'text', nullable: true })
  tax_document_url: string | null;

  @Column({
    type: 'enum',
    enum: KycRequestStatus,
    default: KycRequestStatus.PENDING_REVIEW,
  })
  status: KycRequestStatus;

  @Column({ type: 'text', nullable: true })
  admin_notes: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewed_by_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by_id' })
  reviewed_by: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at: Date | null;

  @Column({ type: 'timestamptz' })
  terms_accepted_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}