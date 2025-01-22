import { IsString, IsNumber, IsEnum } from 'class-validator';

export enum PaymentType {
  EMI = 'emi',
  BULLET = 'bullet'
}

export enum EMIFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export enum TimeUnit {
  DAYS = 'days',
  WEEKS = 'weeks',
  MONTHS = 'months',
  YEARS = 'years'
}

export enum CreditRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export class CreateCreditRequestDto {
  @IsNumber()
  amount: number;

  @IsNumber()
  lendingTerm: number;

  @IsEnum(TimeUnit)
  timeUnit: TimeUnit;

  @IsNumber()
  interestRate: number;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsEnum(EMIFrequency)
  emiFrequency: EMIFrequency;
}
