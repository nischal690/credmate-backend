import { Controller, Post, Get, Body, UseGuards, Req, Query } from '@nestjs/common';
import { CreditService } from './credit.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { GiveCreditDto } from './dto/give-credit.dto';
import { GetCreditOffersDto } from './dto/get-credit-offers.dto';
import { RequestCreditDto } from './dto/request-credit.dto';
import { CreateCreditRequestDto } from './dto/create-credit-request.dto';
import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';

// Extend Express Request to include our user type
interface RequestWithUser extends Request {
  user: DecodedIdToken;
}

@Controller('credit')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Post('raise-request')
  @UseGuards(FirebaseAuthGuard)
  async raiseCreditRequest(
    @Body() createCreditRequestDto: CreateCreditRequestDto,
    @Req() request: RequestWithUser
  ) {
    return this.creditService.raiseCreditRequest(createCreditRequestDto, request.user);
  }

  @Post('offers')
  @UseGuards(FirebaseAuthGuard)
  async giveCredit(@Body() giveCreditDto: GiveCreditDto, @Req() request: RequestWithUser) {
    return this.creditService.createCreditOffer(giveCreditDto, request.user);
  }

  @Get('offers')
  @UseGuards(FirebaseAuthGuard)
  async getCreditOffers(@Query() filters: GetCreditOffersDto, @Req() request: RequestWithUser) {
    return this.creditService.getCreditOffers(filters, request.user);
  }

  @Post('offers/request')
  @UseGuards(FirebaseAuthGuard)
  async requestCredit(@Body() requestCreditDto: RequestCreditDto, @Req() request: RequestWithUser) {
    return this.creditService.createCreditRequest(requestCreditDto, request.user);
  }
}
