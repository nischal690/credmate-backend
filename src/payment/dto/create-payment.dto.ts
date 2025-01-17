import { IsNumber, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @Min(0)
  amount: number;
}
