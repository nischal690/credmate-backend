import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DecodedIdToken } from 'firebase-admin/auth';

// Custom type for our Firebase user from the auth guard
interface FirebaseUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  name?: string;
  picture?: string;
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
        emiFrequency: giveCreditDto.emiFrequency,
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
}
