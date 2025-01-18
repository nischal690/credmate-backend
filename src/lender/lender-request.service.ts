import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLenderRequestDto } from './lender-request.dto';

@Injectable()
export class LenderRequestService {
  constructor(private prisma: PrismaService) {}

  async createLenderRequest(dto: CreateLenderRequestDto, uid: string) {
    return this.prisma.allLenderRequest.create({
      data: {
        uid,
        loanAmount: dto.loanAmount,
        loanTerms: dto.loanTerms,
        timeUnit: dto.timeUnit,
        interestRate: dto.interestRate,
        purpose: dto.purpose,
        paymentType: dto.paymentType,
        emiFrequency: dto.emiFrequency,
        emiAmount: dto.emiAmount,
        status: 'PENDING'
      }
    });
  }
}
