import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { CreditOfferStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

export class GetCreditOffersDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  filterByMe?: boolean;

  @IsOptional()
  @IsString()
  offerByUserId?: string;

  @IsOptional()
  @IsString()
  offerToUserId?: string;

  @IsOptional()
  @IsNumber()
  minLoanAmount?: number;

  @IsOptional()
  @IsNumber()
  maxLoanAmount?: number;

  @IsOptional()
  @IsNumber()
  minInterestRate?: number;

  @IsOptional()
  @IsNumber()
  maxInterestRate?: number;

  @IsOptional()
  @IsEnum(CreditOfferStatus)
  status?: CreditOfferStatus;

  @IsOptional()
  @IsString()
  paymentType?: string;

  @IsOptional()
  @IsString()
  emiFrequency?: string;
}
