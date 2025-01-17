import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('payment')
@UseGuards(FirebaseAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async createPayment(@Request() req, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPayment(
      req.user.phoneNumber,
      createPaymentDto,
    );
  }
}
