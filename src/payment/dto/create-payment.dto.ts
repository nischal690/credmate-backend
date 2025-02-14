import { IsNumber, Min, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentFor } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Amount to be paid' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ 
    description: 'Purpose of the payment',
    enum: PaymentFor,
    example: PaymentFor.SUBSCRIPTION
  })
  @IsEnum(PaymentFor)
  @IsNotEmpty()
  paymentFor: PaymentFor;
}
