import { IsString, IsNumber, IsOptional } from 'class-validator';

export class RequestCreditDto {
  @IsString()
  offerId: string;

  @IsNumber()
  loanAmount: number;

  @IsNumber()
  @IsOptional()
  loanTerm?: number;

  @IsString()
  @IsOptional()
  timeUnit?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
