import { IsString, IsNumber, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export enum PaymentType {
  EMI = 'EMI',
  BULLET = 'BULLET'
}

export enum EMIFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

export enum TimeUnit {
  DAYS = 'DAYS',
  MONTHS = 'MONTHS',
  YEARS = 'YEARS'
}

export enum CreditRequestStatus {
  PROPOSED = 'PROPOSED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  NEGOTIATED = 'NEGOTIATED'
}

export class CreateCreditRequestDto {
  @IsString()
  @IsNotEmpty()
  lenderMobileNo: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @IsNotEmpty()
  lendingTerm: number;

  @IsEnum(TimeUnit)
  @IsNotEmpty()
  timeUnit: TimeUnit;

  @IsNumber()
  @IsNotEmpty()
  interestRate: number;

  @IsString()
  @IsNotEmpty()
  purposeOfLoan: string;

  @IsEnum(PaymentType)
  @IsNotEmpty()
  paymentType: PaymentType;

  @IsEnum(EMIFrequency)
  @IsOptional()
  emiFrequency?: EMIFrequency;
}
