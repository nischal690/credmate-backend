import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { Express } from 'express';

export class UpdateUserProfileDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Date of birth in ISO format',
    example: '1990-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiProperty({
    description: 'Type of business',
    example: 'Retail',
    required: false,
  })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiProperty({
    description: 'Referral code used when joining',
    example: 'ABC123',
    required: false,
  })
  @IsOptional()
  @IsString()
  joinedReferralCode?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Profile image file',
  })
  @IsOptional()
  profileImage?: Express.Multer.File;

  @ApiProperty({
    description: 'Aadhar card document/image',
    example: 'path/to/aadhar/card',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toString())
  aadharcard?: string;

  @ApiProperty({
    description: 'KYC verification status',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    return value === true || value === 'true';
  })
  kyc?: boolean;

  @ApiProperty({
    description: 'Aadhaar number',
    example: '123456789012',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toString())
  aadhaarNumber?: string;
}
