import { Controller, Post, Get, Body, UseGuards, Req, Query, Param } from '@nestjs/common';
import { CreditService } from './credit.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { GiveCreditDto } from './dto/give-credit.dto';
import { GetCreditOffersDto } from './dto/get-credit-offers.dto';
import { RequestCreditDto } from './dto/request-credit.dto';
import { CreateCreditRequestDto } from './dto/create-credit-request.dto';
import { CreditStatusUpdateDto } from './dto/credit-status-update.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { CreditStatus } from '@prisma/client';

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

  @Get('offers/by-me')
  @UseGuards(FirebaseAuthGuard)
  async getCreditOffersByUser(@Req() request: RequestWithUser) {
    return this.creditService.getCreditOffersByUser(request.user);
  }

  @Get('offers/to-me')
  @UseGuards(FirebaseAuthGuard)
  async getCreditOffersToUser(@Req() request: RequestWithUser) {
    return this.creditService.getCreditOffersToUser(request.user);
  }

  @Get('offers')
  @UseGuards(FirebaseAuthGuard)
  async getCreditOffers(@Query() filters: GetCreditOffersDto, @Req() request: RequestWithUser) {
    return this.creditService.getCreditOffers(filters, request.user);
  }

  @Get('offers/:id')
  @UseGuards(FirebaseAuthGuard)
  async getCreditOfferById(@Param('id') id: string, @Req() request: RequestWithUser) {
    return this.creditService.getCreditOfferById(id, request.user);
  }

  @Post('offers/request')
  @UseGuards(FirebaseAuthGuard)
  async requestCredit(@Body() requestCreditDto: RequestCreditDto, @Req() request: RequestWithUser) {
    return this.creditService.createCreditRequest(requestCreditDto, request.user);
  }

  @Post('creditstatusupdated')
  @UseGuards(FirebaseAuthGuard)
  async updateCreditStatus(
    @Body() creditStatusUpdateDto: CreditStatusUpdateDto,
    @Req() request: RequestWithUser,
  ) {
    return this.creditService.updateCreditStatus(creditStatusUpdateDto, request.user);
  }

  @Post('payment-status')
  @UseGuards(FirebaseAuthGuard)
  async updatePaymentStatus(
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
    @Req() request: RequestWithUser
  ) {
    return this.creditService.updatePaymentStatus(
      updatePaymentStatusDto.creditId,
      updatePaymentStatusDto.paymentDate,
      updatePaymentStatusDto.status,
      request.user
    );
  }

  @Get('transactions')
  @UseGuards(FirebaseAuthGuard)
  async getUserCreditTransactions(
    @Req() request: RequestWithUser,
    @Query('status') status?: CreditStatus,
  ) {
    return this.creditService.getUserCreditTransactions(status, request.user);
  }

  // Cron job endpoint to update missed payments (should be called daily)
  @Post('update-missed-payments')
  @UseGuards(FirebaseAuthGuard)
  async updateMissedPayments() {
    return this.creditService.updateMissedPayments();
  }
}
