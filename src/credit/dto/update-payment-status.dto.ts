import { IsString, IsDateString, IsEnum } from 'class-validator';

export enum PaymentStatus {
  YET_TO_PAY = 'yet_to_pay',
  PAID = 'paid',
  BORROWER_MARKED_AS_PAID = 'borrower_marked_as_paid',
  MISSED = 'missed',
  PAID_LATE = 'paid_late'
}

export class UpdatePaymentStatusDto {
  @IsString()
  creditId: string;

  @IsDateString()
  paymentDate: string;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;
}
