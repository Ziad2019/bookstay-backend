// Path: src/users/users.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity.js';
import { OwnerKycRequest } from './entities/owner-kyc-request.entity.js';
import { OwnerPayoutMethod } from './entities/owner-payout-method.entity.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { KycRequestStatus, UserBadge, UserRole, UserStatus } from './enums/user.enums.js';
import { RegisterOwnerKycDto } from './dto/register-owner-kyc.dto.js';
import { maskFinancialIdentifier } from '../../common/utils/masking.util.js';
import { CreatePayoutMethodDto } from './dto/create-payout-method.dto.js';
import { AdminFilterUsersDto, AdminReviewOwnerKycDto, AdminUpdateUserStatusDto } from './dto/admin-users.dto.js';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto.js';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(OwnerKycRequest)
    private readonly kycRepo: Repository<OwnerKycRequest>,
    @InjectRepository(OwnerPayoutMethod)
    private readonly payoutRepo: Repository<OwnerPayoutMethod>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Registers a new Client account (SRS AUTH-01)
   */
  async createClient(dto: CreateClientDto): Promise<User> {
    await this.ensureUniqueEmailAndPhone(dto.email, dto.phone);

    const password_hash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      first_name: dto.first_name.trim(),
      last_name: dto.last_name.trim(),
      email: dto.email.toLowerCase().trim(),
      phone: dto.phone.trim(),
      city: dto.city?.trim() || null,
      password_hash,
      terms_accepted_at: new Date(),
    });

    return this.userRepo.save(user);
  }

  /**
   * Registers a new Owner via the 4-Step KYC Wizard inside a database transaction
   * (SRS AUTH-05, AUTH-06, AUTH-07)
   */
  async registerOwnerWithKyc(dto: RegisterOwnerKycDto): Promise<{
    user: User;
    kyc_request_code: string;
    kyc_status: KycRequestStatus;
  }> {
    await this.ensureUniqueEmailAndPhone(dto.email, dto.phone);

    const password_hash = await bcrypt.hash(dto.password, 12);
    const now = new Date();

    return this.dataSource.transaction(async (manager) => {
      // 1. Create Owner User in 'pending_review' state with encrypted + masked National ID
      const owner = manager.create(User, {
        role: UserRole.OWNER,
        status: UserStatus.PENDING_REVIEW,
        badge: UserBadge.NONE,
        first_name: dto.first_name.trim(),
        last_name: dto.last_name.trim(),
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone.trim(),
        backup_phone: dto.backup_phone?.trim() || null,
        password_hash,
        governorate: dto.governorate.trim(),
        city: dto.city.trim(),
        detailed_address: dto.detailed_address.trim(),
        national_id_type: dto.national_id_type,
        national_id_enc: dto.national_id_number.trim(),
        national_id_masked: maskNationalId(dto.national_id_number),
        tax_number: dto.tax_number?.trim() || null,
        terms_accepted_at: now,
      });
      const savedOwner = await manager.save(User, owner);

      // 2. Generate sequential human-readable reference code (e.g., REQ-001)
      const count = await manager.count(OwnerKycRequest);
      const reference_code = `REQ-${String(count + 1).padStart(3, '0')}`;

      const kycRequest = manager.create(OwnerKycRequest, {
        reference_code,
        owner_id: savedOwner.id,
        document_type: dto.national_id_type,
        id_front_url: dto.id_front_url,
        id_back_url: dto.id_back_url,
        selfie_with_id_url: dto.selfie_with_id_url,
        tax_document_url: dto.tax_document_url || null,
        status: KycRequestStatus.PENDING_REVIEW,
        terms_accepted_at: now,
      });
      await manager.save(OwnerKycRequest, kycRequest);

      // 3. Save Owner Payout Methods (Bank Account, InstaPay, Vodafone Cash)
      const payoutEntities = dto.payout_methods.map((pm, idx) =>
        manager.create(OwnerPayoutMethod, {
          owner_id: savedOwner.id,
          method_type: pm.method_type,
          bank_name: pm.bank_name?.trim() || null,
          account_holder_name: pm.account_holder_name?.trim() || null,
          account_identifier_enc: pm.account_identifier.trim(),
          account_identifier_masked: maskFinancialIdentifier(
            pm.account_identifier,
          ),
          iban_enc: pm.iban ? pm.iban.toUpperCase().trim() : null,
          iban_masked: pm.iban ? maskFinancialIdentifier(pm.iban) : null,
          is_default: pm.is_default ?? idx === 0,
        }),
      );
      await manager.save(OwnerPayoutMethod, payoutEntities);

      return {
        user: savedOwner,
        kyc_request_code: reference_code,
        kyc_status: kycRequest.status,
      };
    });
  }

  /**
   * Used by AuthModule during login to retrieve User including password_hash
   */
  async findByEmailOrPhoneForAuth(identifier: string): Promise<User | null> {
    const clean = identifier.toLowerCase().trim();
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('LOWER(user.email) = :clean OR user.phone = :clean', { clean })
      .getOne();
  }

  /**
   * Retrieves the authenticated user's profile with masked payout methods & KYC status
   */
  async getMyProfile(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['payout_methods', 'kyc_requests'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(
    userId: string,
    dto: UpdateUserProfileDto,
  ): Promise<User> {
    const user = await this.getMyProfile(userId);
    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async addPayoutMethod(
    ownerId: string,
    dto: CreatePayoutMethodDto,
  ): Promise<OwnerPayoutMethod> {
    const user = await this.getMyProfile(ownerId);
    if (user.role !== UserRole.OWNER) {
      throw new BadRequestException(
        'Only property owners can configure payout methods',
      );
    }

    if (dto.is_default) {
      await this.payoutRepo.update(
        { owner_id: ownerId },
        { is_default: false },
      );
    }

    const method = this.payoutRepo.create({
      owner_id: ownerId,
      method_type: dto.method_type,
      bank_name: dto.bank_name?.trim() || null,
      account_holder_name: dto.account_holder_name?.trim() || null,
      account_identifier_enc: dto.account_identifier.trim(),
      account_identifier_masked: maskFinancialIdentifier(
        dto.account_identifier,
      ),
      iban_enc: dto.iban ? dto.iban.toUpperCase().trim() : null,
      iban_masked: dto.iban ? maskFinancialIdentifier(dto.iban) : null,
      is_default: dto.is_default ?? false,
    });

    return this.payoutRepo.save(method);
  }

  async removePayoutMethod(ownerId: string, methodId: string): Promise<void> {
    const count = await this.payoutRepo.count({ where: { owner_id: ownerId } });
    if (count <= 1) {
      throw new BadRequestException(
        'Cannot delete your only payout method; at least one active payout method is required',
      );
    }
    const res = await this.payoutRepo.delete({
      id: methodId,
      owner_id: ownerId,
    });
    if (!res.affected) throw new NotFoundException('Payout method not found');
  }

  /**
   * Returns public Host Card data shown on Client Property Detail screen
   */
  async getPublicHostCard(ownerId: string) {
    const owner = await this.userRepo.findOne({
      where: { id: ownerId, role: UserRole.OWNER },
    });
    if (!owner) throw new NotFoundException('Host not found');

    return {
      id: owner.id,
      display_name: `${owner.first_name} ${owner.last_name}`,
      joined_year: owner.created_at.getFullYear(),
      is_verified_host:
        owner.badge === UserBadge.VERIFIED ||
        owner.status === UserStatus.ACTIVE,
      response_rate: Number(owner.response_rate),
      response_time_mins: owner.response_time_mins,
      avg_rating: owner.avg_rating ? Number(owner.avg_rating) : null,
    };
  }

  // --------------------------------------------------------------------------
  // ADMIN PANEL METHODS
  // --------------------------------------------------------------------------

  async findAllUsersForAdmin(dto: AdminFilterUsersDto) {
    const roleFilter = dto.role || UserRole.CLIENT;
    const page = dto.page || 1;
    const limit = dto.limit || 10;

    const qb = this.userRepo
      .createQueryBuilder('u')
      .where('u.role = :roleFilter', { roleFilter });

    if (dto.status) {
      qb.andWhere('u.status = :status', { status: dto.status });
    }
    if (dto.badge) {
      qb.andWhere('u.badge = :badge', { badge: dto.badge });
    }
    if (dto.city) {
      qb.andWhere('u.city = :city', { city: dto.city });
    }
    if (dto.search) {
      const q = `%${dto.search.trim()}%`;
      qb.andWhere(
        new Brackets((b) => {
          b.where("CONCAT(u.first_name, ' ', u.last_name) ILIKE :q", { q })
            .orWhere('u.email ILIKE :q', { q })
            .orWhere('u.phone ILIKE :q', { q });
        }),
      );
    }

    switch (dto.sort_by) {
      case 'total_spent':
        qb.orderBy('u.total_spent', 'DESC');
        break;
      case 'bookings_count':
        qb.orderBy('u.bookings_count', 'DESC');
        break;
      case 'rating':
        qb.orderBy('u.avg_rating', 'DESC', 'NULLS LAST');
        break;
      default:
        qb.orderBy('u.created_at', 'DESC');
    }

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalRoleUsers, activeCount, suspendedCount, newThisMonth] =
      await Promise.all([
        this.userRepo.count({ where: { role: roleFilter } }),
        this.userRepo.count({
          where: { role: roleFilter, status: UserStatus.ACTIVE },
        }),
        this.userRepo.count({
          where: { role: roleFilter, status: UserStatus.SUSPENDED },
        }),
        this.userRepo
          .createQueryBuilder('u')
          .where('u.role = :roleFilter AND u.created_at >= :startOfMonth', {
            roleFilter,
            startOfMonth,
          })
          .getCount(),
      ]);

    return {
      kpis: {
        total_users: totalRoleUsers,
        active_users: activeCount,
        suspended_users: suspendedCount,
        new_this_month: newThisMonth,
      },
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
      items,
    };
  }

  async updateUserStatusByAdmin(
    userId: string,
    dto: AdminUpdateUserStatusDto,
  ): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.status) user.status = dto.status;
    if (dto.badge) user.badge = dto.badge;

    return this.userRepo.save(user);
  }

  async listOwnerKycRequestsForAdmin(
    status?: KycRequestStatus,
    search?: string,
  ) {
    const qb = this.kycRepo
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.owner', 'owner')
      .leftJoinAndSelect('owner.payout_methods', 'payout_methods')
      .orderBy('req.created_at', 'DESC');

    if (status) {
      qb.andWhere('req.status = :status', { status });
    }
    if (search) {
      const q = `%${search.trim()}%`;
      qb.andWhere(
        new Brackets((b) => {
          b.where('req.reference_code ILIKE :q', { q })
            .orWhere("CONCAT(owner.first_name, ' ', owner.last_name) ILIKE :q", {
              q,
            })
            .orWhere('owner.phone ILIKE :q', { q })
            .orWhere('owner.email ILIKE :q', { q });
        }),
      );
    }

    const [
      items,
      allCount,
      newCount,
      underReviewCount,
      needsDocsCount,
      approvedCount,
    ] = await Promise.all([
      qb.getMany(),
      this.kycRepo.count(),
      this.kycRepo.count({
        where: { status: KycRequestStatus.PENDING_REVIEW },
      }),
      this.kycRepo.count({ where: { status: KycRequestStatus.UNDER_REVIEW } }),
      this.kycRepo.count({
        where: { status: KycRequestStatus.NEEDS_DOCUMENTS },
      }),
      this.kycRepo.count({ where: { status: KycRequestStatus.APPROVED } }),
    ]);

    return {
      counters: {
        all: allCount,
        pending_review: newCount,
        under_review: underReviewCount,
        needs_documents: needsDocsCount,
        approved: approvedCount,
      },
      items,
    };
  }

  async reviewOwnerKycRequest(
    adminId: string,
    requestId: string,
    dto: AdminReviewOwnerKycDto,
  ): Promise<OwnerKycRequest> {
    return this.dataSource.transaction(async (manager) => {
      const kycReq = await manager.findOne(OwnerKycRequest, {
        where: { id: requestId },
        relations: ['owner'],
      });
      if (!kycReq) throw new NotFoundException('KYC request not found');

      kycReq.status = dto.status;
      kycReq.admin_notes = dto.admin_notes?.trim() || null;
      kycReq.reviewed_by_id = adminId;
      kycReq.reviewed_at = new Date();
      await manager.save(OwnerKycRequest, kycReq);

      if (dto.status === KycRequestStatus.APPROVED) {
        await manager.update(User, kycReq.owner_id, {
          status: UserStatus.ACTIVE,
          badge: UserBadge.VERIFIED,
        });
      } else if (dto.status === KycRequestStatus.REJECTED) {
        await manager.update(User, kycReq.owner_id, {
          status: UserStatus.REJECTED,
        });
      } else {
        await manager.update(User, kycReq.owner_id, {
          status: UserStatus.PENDING_REVIEW,
        });
      }

      return kycReq;
    });
  }

  private async ensureUniqueEmailAndPhone(email: string, phone: string) {
    const existing = await this.userRepo.findOne({
      where: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }],
    });
    if (existing) {
      throw new ConflictException(
        'An account with this email or mobile phone number already exists',
      );
    }
  }
}