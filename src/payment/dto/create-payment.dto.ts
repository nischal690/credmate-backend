import { IsNumber, Min, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Amount to be paid' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Purpose or reason for the payment' })
  @IsString()
  @IsNotEmpty()
  paymentFor: string;
}
