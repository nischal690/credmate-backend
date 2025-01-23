import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DecodedIdToken } from 'firebase-admin/auth';
import { CreateCreditRequestDto, CreditRequestStatus } from './dto/create-credit-request.dto';

// Custom type for our Firebase user from the auth guard
interface FirebaseUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  name?: string;
  picture?: string;
}

interface GetCreditOffersDto {
  offerByUserId?: string;
  offerToUserId?: string;
  status?: string;
  paymentType?: string;
  emiFrequency?: string;
  minLoanAmount?: number;
  maxLoanAmount?: number;
  minInterestRate?: number;
  maxInterestRate?: number;
  filterByMe?: boolean;
}

interface RequestCreditDto {
  offerId: string;
  loanAmount: number;
  loanTerm?: number;
  timeUnit?: string;
  note?: string;
}

@Injectable()
export class CreditService {
  private readonly logger = new Logger(CreditService.name);
  constructor(private readonly prisma: PrismaService) {}

  private formatPhoneNumber(phoneNumber: string | undefined | null): string {
    if (!phoneNumber) {
      throw new BadRequestException('Phone number is required');
    }
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    // Always add +91 prefix
    return `+91${cleaned.slice(-10)}`;
  }

  async createCreditOffer(giveCreditDto: any, user: FirebaseUser) {
    this.logger.debug('Firebase user data:', JSON.stringify(user, null, 2));

    if (!user.phoneNumber) {
      throw new BadRequestException('Lender must have a verified phone number');
    }

    // Get the lender's user record using phone number
    const lender = await this.prisma.user.findFirst({
      where: {
        phoneNumber: user.phoneNumber, // Already formatted by FirebaseAuthGuard
      },
    });

    if (!lender) {
      throw new NotFoundException('Lender not found');
    }

    if (!giveCreditDto.borrowerMobileNumber) {
      throw new BadRequestException('Borrower mobile number is required');
    }

    // Format the borrower's phone number with +91 prefix
    const formattedPhoneNumber = this.formatPhoneNumber(giveCreditDto.borrowerMobileNumber);
    
    // Find borrower by formatted phone number
    const borrower = await this.prisma.user.findFirst({
      where: {
        phoneNumber: formattedPhoneNumber,
      },
    });

    // Create the credit offer
    const creditOffer = await this.prisma.creditOffer.create({
      data: {
        offerByUserId: lender.id,
        offerToUserId: borrower?.id || formattedPhoneNumber, // Use borrower's ID if exists, otherwise use formatted phone number
        loanAmount: giveCreditDto.loanAmount,
        loanTerm: giveCreditDto.loanTerm,
        timeUnit: giveCreditDto.timeUnit,
        interestRate: giveCreditDto.interestRate,
        paymentType: giveCreditDto.paymentType,
        emiFrequency: giveCreditDto.paymentType === 'BULLET' ? 'NONE' : giveCreditDto.emiFrequency,
        status: 'PROPOSED',
        versionNumber: 1,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      },
    });

    // Update parentOfferId to be the same as id
    const updatedOffer = await this.prisma.creditOffer.update({
      where: { id: creditOffer.id },
      data: { parentOfferId: creditOffer.id },
    });

    return updatedOffer;
  }

  async getCreditOffers(filters: GetCreditOffersDto, user: DecodedIdToken) {
    const where: any = {
      isLatest: true,
    };

    // Handle filterByMe option
    if (filters.filterByMe) {
      where.OR = [
        { offerByUserId: user.uid },
        { offerToUserId: user.uid }
      ];
    } else {
      // Apply regular user filters only if not filtering by logged-in user
      if (filters.offerByUserId) {
        where.offerByUserId = filters.offerByUserId;
      }

      if (filters.offerToUserId) {
        where.offerToUserId = filters.offerToUserId;
      }
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.paymentType) {
      where.paymentType = filters.paymentType;
    }

    if (filters.emiFrequency) {
      where.emiFrequency = filters.emiFrequency;
    }

    if (filters.minLoanAmount || filters.maxLoanAmount) {
      where.loanAmount = {};
      if (filters.minLoanAmount) {
        where.loanAmount.gte = filters.minLoanAmount;
      }
      if (filters.maxLoanAmount) {
        where.loanAmount.lte = filters.maxLoanAmount;
      }
    }

    if (filters.minInterestRate || filters.maxInterestRate) {
      where.interestRate = {};
      if (filters.minInterestRate) {
        where.interestRate.gte = filters.minInterestRate;
      }
      if (filters.maxInterestRate) {
        where.interestRate.lte = filters.maxInterestRate;
      }
    }

    return this.prisma.creditOffer.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createCreditRequest(requestCreditDto: RequestCreditDto, user: DecodedIdToken) {
    const { offerId, loanAmount, loanTerm, timeUnit, note } = requestCreditDto;

    // Find the credit offer
    const creditOffer = await this.prisma.creditOffer.findUnique({
      where: { id: offerId }
    });

    if (!creditOffer) {
      throw new NotFoundException('Credit offer not found');
    }

    // Create the credit request
    return this.prisma.creditRequest.create({
      data: {
        loanAmount,
        loanTerm: loanTerm || creditOffer.loanTerm,
        timeUnit: timeUnit || creditOffer.timeUnit,
        interestRate: creditOffer.interestRate,
        paymentType: creditOffer.paymentType,
        emiFrequency: creditOffer.paymentType === 'BULLET' ? 'NONE' : 'MONTHLY', // Set to MONTHLY as it's the most common frequency
        status: 'PROPOSED',
        requestByUserId: user.uid,
        requestedToUserId: creditOffer.offerByUserId,
        metadata: note ? { note } : undefined
      }
    });
  }

  async raiseCreditRequest(
    createCreditRequestDto: CreateCreditRequestDto,
    user: DecodedIdToken
  ) {
    const { 
      amount, 
      lendingTerm, 
      timeUnit, 
      interestRate, 
      paymentType, 
      emiFrequency,
      lenderMobileNo,
      purposeOfLoan 
    } = createCreditRequestDto;

    // Format the lender's phone number
    const formattedLenderPhone = this.formatPhoneNumber(lenderMobileNo);

    // Find lender by phone number
    const lender = await this.prisma.user.findFirst({
      where: {
        phoneNumber: formattedLenderPhone
      }
    });

    // Find borrower (current user) by uid
    const borrower = await this.prisma.user.findFirst({
      where: {
        phoneNumber: user.phone_number
      }
    });

    if (!borrower) {
      throw new NotFoundException('Borrower not found');
    }

    // Create a new credit request in the database
    const creditRequest = await this.prisma.creditRequest.create({
      data: {
        loanAmount: amount,
        loanTerm: lendingTerm,
        timeUnit,
        interestRate,
        paymentType,
        emiFrequency: paymentType === 'BULLET' ? 'NONE' : emiFrequency, // Always include an emiFrequency value
        requestByUserId: borrower.id,
        requestedToUserId: lender ? lender.id : formattedLenderPhone,
        status: CreditRequestStatus.PROPOSED,
        versionNumber: 1,
        isLatest: true,
        metadata: { purposeOfLoan }
      },
    });

    // Update parentRequestId to be the same as id
    const updatedRequest = await this.prisma.creditRequest.update({
      where: { id: creditRequest.id },
      data: { parentRequestId: creditRequest.id }
    });

    return updatedRequest;
  }
}
