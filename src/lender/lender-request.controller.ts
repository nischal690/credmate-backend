import { Controller, Post, Body, UseGuards, Req, UnauthorizedException, Logger } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { LenderRequestService } from './lender-request.service';
import { CreateLenderRequestDto } from './lender-request.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('lender-requests')
export class LenderRequestController {
  private readonly logger = new Logger(LenderRequestController.name);

  constructor(
    private readonly lenderRequestService: LenderRequestService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async createLenderRequest(
    @Body() dto: CreateLenderRequestDto,
    @Req() req: any,
  ) {
    // Log the entire Firebase user object for debugging
    this.logger.debug('Complete Firebase user object:', JSON.stringify(req.user, null, 2));

    // Get phone number from Firebase user
    const phoneNumber = req.user?.phoneNumber;
    this.logger.debug('Phone number from Firebase token:', phoneNumber);
    
    if (!phoneNumber) {
      throw new UnauthorizedException('Phone number not found in Firebase token');
    }

    // Query all users to check phone numbers
    const allUsers = await this.prisma.user.findMany({
      select: { 
        id: true,
        phoneNumber: true,
        email: true 
      }
    });
    
    this.logger.debug('All users in database:', JSON.stringify(allUsers, null, 2));
    this.logger.debug('Looking for phone number:', phoneNumber);
    this.logger.debug('Phone number type:', typeof phoneNumber);
    
    // Find user by phone number
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber }
    });

    if (!user) {
      throw new UnauthorizedException(
        `User not found. Firebase phone: ${phoneNumber}. Available numbers: ${JSON.stringify(allUsers.map(u => u.phoneNumber))}`
      );
    }

    // Create lender request with user's ID
    return this.lenderRequestService.createLenderRequest(dto, user.id);
  }
}
