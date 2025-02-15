import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreditStatusUpdateDto {
  @IsOptional()
  @IsString()
  offerId?: string;

  @IsOptional()
  @IsString()
  requestId?: string;

  @IsNotEmpty()
  @IsString()
  status: string;
}
