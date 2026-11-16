// Path: src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { OwnerKycRequest } from './entities/owner-kyc-request.entity.js';
import { OwnerPayoutMethod } from './entities/owner-payout-method.entity.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';


@Module({
  imports: [
    TypeOrmModule.forFeature([User, OwnerKycRequest, OwnerPayoutMethod]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}