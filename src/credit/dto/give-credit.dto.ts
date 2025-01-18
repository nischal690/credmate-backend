import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class GiveCreditDto {
  @IsString()
  @IsNotEmpty()
  borrowerMobileNumber: string;

  @IsNumber()
  @IsNotEmpty()
  loanAmount: number;

  @IsNumber()
  @IsNotEmpty()
  loanTerm: number;

  @IsString()
  @IsNotEmpty()
  timeUnit: string;

  @IsNumber()
  @IsNotEmpty()
  interestRate: number;

  @IsString()
  @IsNotEmpty()
  paymentType: string;

  @IsString()
  @IsNotEmpty()
  emiFrequency: string;
}
