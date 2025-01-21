import { IsString, IsNumber, IsNotEmpty, IsEnum, ValidateIf, IsIn } from 'class-validator';

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
  @IsIn(['DAYS', 'MONTHS', 'YEARS'])
  timeUnit: string;

  @IsNumber()
  @IsNotEmpty()
  interestRate: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['EMI', 'BULLET'])
  paymentType: string;

  @ValidateIf(o => o.paymentType === 'EMI')
  @IsString()
  @IsNotEmpty()
  @IsIn(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'])
  emiFrequency: string;
}
