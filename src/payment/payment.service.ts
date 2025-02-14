import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { format } from 'date-fns';
import { PaymentFor } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async createPayment(phoneNumber: string, createPaymentDto: CreatePaymentDto) {
    // Find user by phone number
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber },
      select: { id: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create payment
    const payment = await this.prisma.payment.create({
      data: {
        uid: user.id,
        amount: createPaymentDto.amount,
        paymentFor: createPaymentDto.paymentFor,
        requestRaised: true,
        paid: false,
        createdTime: format(new Date(), 'HH:mm:ss'),
      },
    });

    return payment;
  }
}
