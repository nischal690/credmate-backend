import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DecodedIdToken } from 'firebase-admin/auth';
import { CreateCreditRequestDto, CreditRequestStatus } from './dto/create-credit-request.dto';
import { CreditOffer, User, Credit, CreditType, CreditStatus } from '@prisma/client';
import { CreditOfferWithUsers } from './types/credit.types';

// Payment status types
enum PaymentStatus {
  YET_TO_PAY = 'yet_to_pay',
  PAID = 'paid',
  BORROWER_MARKED_AS_PAID = 'borrower_marked_as_paid',
  MISSED = 'missed',
  PAID_LATE = 'paid_late'
}

// Type for due date record structure
interface DueDateRecord {
  [key: string]: PaymentStatus;
}

// Type for Credit with proper dueDate typing
interface CreditWithDueDate extends Omit<Credit, 'dueDate'> {
  dueDate: DueDateRecord | null;
}

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

interface CreditStatusUpdateDto {
  offerId?: string;
  requestId?: string;
  status: string;
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
      select: {
        id: true,
        phoneNumber: true,
        name: true,
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
      select: {
        id: true,
        phoneNumber: true,
        name: true,
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

  async getCreditOffersByUser(user: DecodedIdToken) {
    this.logger.debug('Getting credit offers made by user:', JSON.stringify(user));

    if (!user.phoneNumber) {
      throw new BadRequestException('User must have a verified phone number');
    }

    // Format the phone number to match our database format
    const formattedPhoneNumber = this.formatPhoneNumber(user.phoneNumber);
    this.logger.debug('Formatted phone number:', formattedPhoneNumber);

    // Find the user by phone number
    const dbUser = await this.prisma.user.findFirst({
      where: {
        phoneNumber: formattedPhoneNumber
      }
    });

    if (!dbUser) {
      throw new NotFoundException('User not found with the provided phone number');
    }

    this.logger.debug('Found user:', JSON.stringify(dbUser));

    // Get offers made by the user
    const offers = await this.prisma.creditOffer.findMany({
      where: {
        offerByUserId: dbUser.id,
        isLatest: true // Only get the latest version of each offer
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    this.logger.debug(`Found ${offers.length} offers made by user ${dbUser.id}`);
    return offers;
  }

  async getCreditOffersToUser(user: DecodedIdToken) {
    this.logger.debug('Getting credit offers made to user:', JSON.stringify(user));

    if (!user.phoneNumber) {
      throw new BadRequestException('User must have a verified phone number');
    }

    // Format the phone number to match our database format
    const formattedPhoneNumber = this.formatPhoneNumber(user.phoneNumber);
    this.logger.debug('Formatted phone number:', formattedPhoneNumber);

    // Find the user by phone number
    const dbUser = await this.prisma.user.findFirst({
      where: {
        phoneNumber: formattedPhoneNumber
      }
    });

    if (!dbUser) {
      throw new NotFoundException('User not found with the provided phone number');
    }

    this.logger.debug('Found user:', JSON.stringify(dbUser));

    // Get offers made to the user
    const offers = await this.prisma.creditOffer.findMany({
      where: {
        offerToUserId: dbUser.id,
        isLatest: true // Only get the latest version of each offer
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    this.logger.debug(`Found ${offers.length} offers made to user ${dbUser.id}`);
    return offers;
  }

  async getCreditOffers(filters: GetCreditOffersDto, user: DecodedIdToken) {
    this.logger.debug('Getting credit offers with filters:', JSON.stringify(filters));
    this.logger.debug('User context:', JSON.stringify(user));

    // If filterByMe is true, use phone number from Firebase token to find user
    if (filters.filterByMe) {
      if (!user.phoneNumber) {
        throw new BadRequestException('User must have a verified phone number');
      }

      // Format the phone number to match our database format
      const formattedPhoneNumber = this.formatPhoneNumber(user.phoneNumber);

      // Find the user by phone number
      const dbUser = await this.prisma.user.findFirst({
        where: {
          phoneNumber: formattedPhoneNumber
        }
      });

      if (!dbUser) {
        throw new NotFoundException('User not found with the provided phone number');
      }

      // Use the found user's ID to filter credit offers
      const where: any = {
        OR: [
          { offerByUserId: dbUser.id },
          { offerToUserId: dbUser.id }
        ]
      };

      this.logger.debug('Where clause after filterByMe:', JSON.stringify(where));

      const offers = await this.prisma.creditOffer.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return offers;
    }

    // If not filtering by logged-in user, proceed with regular filters
    const where: any = {};

    if (filters.offerByUserId) {
      where.offerByUserId = filters.offerByUserId;
    }

    if (filters.offerToUserId) {
      where.offerToUserId = filters.offerToUserId;
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

  async getCreditOfferById(offerId: string, user: FirebaseUser): Promise<CreditOfferWithUsers> {
    if (!user.phoneNumber) {
      throw new BadRequestException('User must have a verified phone number');
    }

    // First fetch the credit offer
    const creditOffer = await this.prisma.creditOffer.findUnique({
      where: {
        id: offerId
      }
    });

    if (!creditOffer) {
      throw new NotFoundException('Credit offer not found');
    }

    // Then fetch the related users
    const [offerByUser, offerToUser] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: creditOffer.offerByUserId },
        select: {
          id: true,
          name: true,
          phoneNumber: true
        }
      }),
      this.prisma.user.findUnique({
        where: { id: creditOffer.offerToUserId },
        select: {
          id: true,
          name: true,
          phoneNumber: true
        }
      })
    ]);

    if (!offerByUser || !offerToUser) {
      throw new NotFoundException('Related users not found');
    }

    // Check if the user is either the lender or borrower
    const userPhone = user.phoneNumber;
    if (offerByUser.phoneNumber !== userPhone && 
        offerToUser.phoneNumber !== userPhone) {
      throw new BadRequestException('You do not have permission to view this credit offer');
    }

    return {
      ...creditOffer,
      offerByUser,
      offerToUser
    };
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
      },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
      },
    });

    // Find borrower (current user) by uid
    const borrower = await this.prisma.user.findFirst({
      where: {
        phoneNumber: user.phone_number
      },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
      },
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

  async updateCreditStatus(
    creditStatusUpdateDto: CreditStatusUpdateDto,
    user: DecodedIdToken,
  ) {
    const { offerId, requestId, status } = creditStatusUpdateDto;

    if ((!offerId && !requestId) || (offerId && requestId)) {
      throw new BadRequestException('Please provide either offerId or requestId, but not both');
    }

    let creditData: Omit<Credit, 'id' | 'createdAt' | 'finalizedAt' | 'metadata'> = {
      creditType: CreditType.PERSONAL,
      status: status as CreditStatus,
      recoveryMode: false,
      requestId: '',
      requestedToUserId: '',
      requestByUserId: '',
      loanAmount: 0,
      loanTerm: 0,
      timeUnit: '',
      interestRate: 0,
      paymentType: '',
      emiFrequency: '',
      offeredId: null,
      offeredByUserId: '',
      offeredToUserId: '',
      dueDate: null
    };

    if (offerId) {
      // Fetch credit offer details
      const creditOffer = await this.prisma.creditOffer.findUnique({
        where: { id: offerId },
      });

      if (!creditOffer) {
        throw new NotFoundException('Credit offer not found');
      }

      // Update the creditoffer status based on the incoming status
      const updatedStatus = status === 'ACTIVE' ? 'ACCEPTED' : (status === 'CANCELLED' ? 'REJECTED' : status);
      await this.prisma.creditOffer.update({
        where: { id: offerId },
        data: {
          status: updatedStatus as any
        }
      });

      creditData = {
        ...creditData,
        requestId: offerId,
        loanAmount: creditOffer.loanAmount,
        loanTerm: creditOffer.loanTerm,
        timeUnit: creditOffer.timeUnit,
        interestRate: creditOffer.interestRate,
        paymentType: creditOffer.paymentType,
        emiFrequency: creditOffer.emiFrequency || '',
        offeredId: offerId,
        offeredByUserId: creditOffer.offerByUserId,
        offeredToUserId: creditOffer.offerToUserId,
      };
    } else {
      // Fetch credit request details
      const creditRequest = await this.prisma.creditRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          loanAmount: true,
          loanTerm: true,
          timeUnit: true,
          interestRate: true,
          paymentType: true,
          emiFrequency: true,
          requestByUserId: true,
          requestedToUserId: true,
          offerId: true
        }
      });

      if (!creditRequest) {
        throw new NotFoundException('Credit request not found');
      }

      // If there's an associated offer, update its status too
      if (creditRequest.offerId) {
        const updatedStatus = status === 'ACTIVE' ? 'ACCEPTED' : (status === 'CANCELLED' ? 'REJECTED' : status);
        await this.prisma.creditOffer.update({
          where: { id: creditRequest.offerId },
          data: {
            status: updatedStatus as any
          }
        });
      }

      creditData = {
        ...creditData,
        requestId: requestId,
        loanAmount: creditRequest.loanAmount,
        loanTerm: creditRequest.loanTerm,
        timeUnit: creditRequest.timeUnit,
        interestRate: creditRequest.interestRate,
        paymentType: creditRequest.paymentType,
        emiFrequency: creditRequest.emiFrequency || '',
        requestByUserId: creditRequest.requestByUserId,
        requestedToUserId: creditRequest.requestedToUserId,
        offeredId: '',
        offeredByUserId: '',
        offeredToUserId: '',
      };
    }

    // Calculate due dates and amounts if status is ACTIVE
    if (status === 'ACTIVE') {
      const dueDate: DueDateRecord = {};
      const startDate = new Date();
      
      if (creditData.paymentType === 'BULLET') {
        // For bullet payment, calculate single due date based on loan term and time unit
        const endDate = new Date(startDate);
        if (creditData.timeUnit === 'DAYS') {
          endDate.setDate(endDate.getDate() + creditData.loanTerm);
        } else if (creditData.timeUnit === 'MONTHS') {
          endDate.setMonth(endDate.getMonth() + creditData.loanTerm);
        } else if (creditData.timeUnit === 'YEARS') {
          endDate.setFullYear(endDate.getFullYear() + creditData.loanTerm);
        }
        
        dueDate[endDate.toISOString().split('T')[0]] = PaymentStatus.YET_TO_PAY;
      } else {
        // For EMI payments
        const totalEMIs = creditData.loanTerm;
        const emiAmount = this.calculateEMIAmount(
          creditData.loanAmount,
          creditData.interestRate,
          totalEMIs
        );
        
        let currentDate = new Date(startDate);
        for (let i = 0; i < totalEMIs; i++) {
          if (creditData.emiFrequency === 'WEEKLY') {
            currentDate.setDate(currentDate.getDate() + 7);
          } else if (creditData.emiFrequency === 'MONTHLY') {
            currentDate.setMonth(currentDate.getMonth() + 1);
          } else if (creditData.emiFrequency === 'QUARTERLY') {
            currentDate.setMonth(currentDate.getMonth() + 3);
          }
          
          const dateKey = currentDate.toISOString().split('T')[0];
          dueDate[dateKey] = PaymentStatus.YET_TO_PAY;
        }
      }
      
      creditData.dueDate = dueDate;
    }

    // Create credit entry
    const creditEntry = await this.prisma.credit.create({
      data: creditData,
    });

    return creditEntry;
  }

  async updatePaymentStatus(
    creditId: string,
    paymentDate: string,
    newStatus: PaymentStatus,
  ) {
    const credit = await this.prisma.credit.findUnique({
      where: { id: creditId },
      select: {
        id: true,
        creditType: true,
        requestId: true,
        requestByUserId: true,
        requestedToUserId: true,
        loanAmount: true,
        loanTerm: true,
        timeUnit: true,
        interestRate: true,
        paymentType: true,
        emiFrequency: true,
        status: true,
        offeredId: true,
        recoveryMode: true,
        createdAt: true,
        finalizedAt: true,
        offeredByUserId: true,
        offeredToUserId: true,
        metadata: true,
        dueDate: true
      }
    }) as CreditWithDueDate;

    if (!credit) {
      throw new NotFoundException('Credit not found');
    }

    // Get the current due dates map
    const dueDate = credit.dueDate || {};
    
    if (!dueDate[paymentDate]) {
      throw new BadRequestException('Invalid payment date');
    }

    // Update the status for this payment date
    dueDate[paymentDate] = newStatus;

    // Update the credit record
    const updatedCredit = await this.prisma.credit.update({
      where: { id: creditId },
      data: {
        dueDate
      }
    });

    return updatedCredit;
  }

  async updateMissedPayments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeCredits = await this.prisma.credit.findMany({
      where: {
        status: 'ACTIVE',
        dueDate: {
          not: null
        }
      }
    }) as CreditWithDueDate[];

    for (const credit of activeCredits) {
      const dueDate = credit.dueDate || {};
      let updated = false;

      // Check each payment date
      Object.entries(dueDate).forEach(([date, status]) => {
        if (status === PaymentStatus.YET_TO_PAY && new Date(date) < today) {
          dueDate[date] = PaymentStatus.MISSED;
          updated = true;
        }
      });

      if (updated) {
        await this.prisma.credit.update({
          where: { id: credit.id },
          data: {
            dueDate
          }
        });
      }
    }
  }

  async updateExistingCreditsDueDate() {
    // Find credits without due dates
    const credits = await this.prisma.credit.findMany({
      where: {
        OR: [
          { dueDate: null },
          { dueDate: {} }
        ]
      }
    });

    this.logger.log(`Found ${credits.length} credits without due dates`);

    for (const credit of credits) {
      let dueDate: DueDateRecord = {};

      if (credit.paymentType === 'BULLET') {
        // For bullet payment, calculate the due date based on loan term
        const dueDateTime = new Date(credit.createdAt);
        if (credit.timeUnit === 'DAYS') {
          dueDateTime.setDate(dueDateTime.getDate() + credit.loanTerm);
        } else if (credit.timeUnit === 'MONTHS') {
          dueDateTime.setMonth(dueDateTime.getMonth() + credit.loanTerm);
        }
        dueDate[dueDateTime.toISOString().split('T')[0]] = PaymentStatus.YET_TO_PAY;
      } else if (credit.paymentType === 'EMI') {
        // For EMI, calculate multiple due dates based on frequency
        const startDate = new Date(credit.createdAt);
        let currentDate = new Date(startDate);

        for (let i = 0; i < credit.loanTerm; i++) {
          if (credit.emiFrequency === 'MONTHLY') {
            currentDate.setMonth(currentDate.getMonth() + 1);
          } else if (credit.emiFrequency === 'WEEKLY') {
            currentDate.setDate(currentDate.getDate() + 7);
          }
          dueDate[currentDate.toISOString().split('T')[0]] = PaymentStatus.YET_TO_PAY;
        }
      }

      // Update the credit record with calculated due dates
      await this.prisma.credit.update({
        where: { id: credit.id },
        data: {
          dueDate
        }
      });

      this.logger.log(`Updated credit ${credit.id} with due dates`);
    }

    return { message: `Updated ${credits.length} credit records with due dates` };
  }

  async getUserCreditTransactions(status: string | undefined, user: FirebaseUser) {
    if (!user.phoneNumber) {
      throw new BadRequestException('User must have a verified phone number');
    }

    // Get user ID from phone number
    const userRecord = await this.prisma.user.findUnique({
      where: {
        phoneNumber: user.phoneNumber,
      },
      select: {
        id: true,
      },
    });

    if (!userRecord) {
      throw new NotFoundException('User not found');
    }

    const where: any = {
      offeredToUserId: userRecord.id,
    };

    if (status) {
      where.status = status;
    }

    const credits = await this.prisma.credit.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        creditType: true,
        loanAmount: true,
        loanTerm: true,
        timeUnit: true,
        interestRate: true,
        paymentType: true,
        emiFrequency: true,
        status: true,
        recoveryMode: true,
        createdAt: true,
        finalizedAt: true,
        dueDate: true,
        requestByUserId: true,
        requestedToUserId: true,
        offeredByUserId: true,
        offeredToUserId: true,
      },
    });

    // Get the user details for each offeredByUserId
    const offeredByUserIds = [...new Set(credits.map(credit => credit.offeredByUserId))];
    const offeredByUsers = await this.prisma.user.findMany({
      where: {
        phoneNumber: {
          in: offeredByUserIds
        }
      },
      select: {
        phoneNumber: true,
        name: true,
        email: true,
      }
    });

    // Create a map of offeredByUserId to user details
    const userDetailsMap = new Map(
      offeredByUsers.map(user => [user.phoneNumber, user])
    );

    // Combine credit data with user details
    const creditsWithUserDetails = credits.map(credit => ({
      ...credit,
      offeredByUser: userDetailsMap.get(credit.offeredByUserId) || null
    }));

    return creditsWithUserDetails;
  }

  // Helper function to calculate EMI amount with interest
  private calculateEMIAmount(principal: number, interestRate: number, tenure: number): number {
    const monthlyRate = interestRate / (12 * 100); // Convert annual rate to monthly
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1);
    return Math.round(emi * 100) / 100; // Round to 2 decimal places
  }
}
