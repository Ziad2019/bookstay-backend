// Path: src/users/users.controller.ts
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { RegisterOwnerKycDto } from './dto/register-owner-kyc.dto.js';
import { AdminFilterUsersDto, AdminReviewOwnerKycDto, AdminUpdateUserStatusDto } from './dto/admin-users.dto.js';
import { KycRequestStatus } from './enums/user.enums.js';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto.js';
import { CreatePayoutMethodDto } from './dto/create-payout-method.dto.js';


@UseInterceptors(ClassSerializerInterceptor)
@Controller('api/v1')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // --- Public Onboarding & Host Profile Endpoints ---

  @Post('users/register/client')
  async registerClient(@Body() dto: CreateClientDto) {
    return this.usersService.createClient(dto);
  }

  @Post('users/register/owner-kyc')
  async registerOwnerKyc(@Body() dto: RegisterOwnerKycDto) {
    return this.usersService.registerOwnerWithKyc(dto);
  }

  @Get('users/hosts/:ownerId')
  async getPublicHostCard(@Param('ownerId', ParseUUIDPipe) ownerId: string) {
    return this.usersService.getPublicHostCard(ownerId);
  }

  // --- Authenticated Profile & Owner Payout Endpoints ---
  // Note: Attach @UseGuards(JwtAuthGuard, RolesGuard) once AuthModule is wired

  @Get('users/me')
  async getMyProfile(@Req() req: any) {
    const userId = req.user?.id || req.headers['x-user-id'];
    return this.usersService.getMyProfile(userId);
  }

  @Patch('users/me')
  async updateMyProfile(@Req() req: any, @Body() dto: UpdateUserProfileDto) {
    const userId = req.user?.id || req.headers['x-user-id'];
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('users/me/payout-methods')
  async addPayoutMethod(@Req() req: any, @Body() dto: CreatePayoutMethodDto) {
    const ownerId = req.user?.id || req.headers['x-user-id'];
    return this.usersService.addPayoutMethod(ownerId, dto);
  }

  @Delete('users/me/payout-methods/:methodId')
  async removePayoutMethod(
    @Req() req: any,
    @Param('methodId', ParseUUIDPipe) methodId: string,
  ) {
    const ownerId = req.user?.id || req.headers['x-user-id'];
    await this.usersService.removePayoutMethod(ownerId, methodId);
    return { deleted: true };
  }

  // --- Admin Panel Endpoints (Tenants/Owners CRM & Owner KYC Queue) ---

  @Get('admin/users')
  async listUsersForAdmin(@Query() query: AdminFilterUsersDto) {
    return this.usersService.findAllUsersForAdmin(query);
  }

  @Patch('admin/users/:userId/status')
  async updateUserStatusByAdmin(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: AdminUpdateUserStatusDto,
  ) {
    return this.usersService.updateUserStatusByAdmin(userId, dto);
  }

  @Get('admin/owner-requests')
  async listOwnerKycRequests(
    @Query('status') status?: KycRequestStatus,
    @Query('search') search?: string,
  ) {
    return this.usersService.listOwnerKycRequestsForAdmin(status, search);
  }

  @Patch('admin/owner-requests/:requestId/review')
  async reviewOwnerKycRequest(
    @Req() req: any,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: AdminReviewOwnerKycDto,
  ) {
    const adminId = req.user?.id || req.headers['x-user-id'];
    return this.usersService.reviewOwnerKycRequest(adminId, requestId, dto);
  }
}