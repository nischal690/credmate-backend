import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { CreditService } from './credit.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { GiveCreditDto } from './dto/give-credit.dto';
import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';

// Extend Express Request to include our user type
interface RequestWithUser extends Request {
  user: DecodedIdToken;
}

@Controller('credit')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Post('give-credit')
  @UseGuards(FirebaseAuthGuard)
  async giveCredit(@Body() giveCreditDto: GiveCreditDto, @Req() request: RequestWithUser) {
    return this.creditService.createCreditOffer(giveCreditDto, request.user);
  }
}
