import { Module } from '@nestjs/common';
import { LenderRequestController } from './lender-request.controller';
import { LenderRequestService } from './lender-request.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule
  ],
  controllers: [LenderRequestController],
  providers: [LenderRequestService],
})
export class LenderRequestModule {}
