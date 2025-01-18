import { IsNotEmpty, IsNumber, IsString, IsEnum, IsOptional } from 'class-validator';

enum PaymentType {
  ONE_TIME = 'ONE_TIME',
  EMI = 'EMI'
}

enum TimeUnit {
  DAYS = 'DAYS',
  MONTHS = 'MONTHS',
  YEARS = 'YEARS'
}

enum EmiFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

export class CreateLenderRequestDto {
  @IsNumber()
  @IsNotEmpty()
  loanAmount: number;

  @IsNumber()
  @IsNotEmpty()
  loanTerms: number;

  @IsEnum(TimeUnit)
  @IsNotEmpty()
  timeUnit: string;

  @IsNumber()
  @IsNotEmpty()
  interestRate: number;

  @IsString()
  @IsNotEmpty()
  purpose: string;

  @IsEnum(PaymentType)
  @IsNotEmpty()
  paymentType: string;

  @IsEnum(EmiFrequency)
  @IsOptional()
  emiFrequency?: string;

  @IsNumber()
  @IsOptional()
  emiAmount?: number;
}
