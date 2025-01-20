import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  Param,
  UploadedFile,
  UseInterceptors,
  Put,
  Logger,
} from '@nestjs/common';
import { UserService } from './user.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { UserProfileResponse } from './interfaces/user-profile.interface';
import { NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { SaveProfileDto } from './dto/save-profile.dto';
import { UpdateSavedProfileDto } from './dto/update-saved-profile.dto';
import { SaveProfileResponseDto } from './dto/save-profile-response.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@ApiTags('users')
@Controller('user')
@UseGuards(FirebaseAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('complete-profile')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get complete user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileResponseDto,
  })
  async getCompleteUserProfile(@Request() req): Promise<UserProfileResponse> {
    return this.userService.getCompleteUserProfile(req.user);
  }

  @Put('updateprofile')
  @ApiBearerAuth('Firebase-auth')
  @ApiOperation({
    summary: 'Update user profile with optional image upload',
    description:
      'Updates user profile information including name, date of birth, business type, and KYC details',
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('profileImage'))
  async updateProfile(
    @Request() req,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UserProfileResponse> {
    const logger = new Logger('UpdateProfile');
    
    // Log request details
    logger.log('Content-Type:', req.headers['content-type']);
    logger.log('Request body:', updateUserProfileDto);
    logger.log('File:', file ? {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    } : 'No file uploaded');

    try {
      const result = await this.userService.updateUserProfile(
        req.user,
        updateUserProfileDto,
        file,
      );
      logger.log('Update successful:', result);
      return result;
    } catch (error) {
      logger.error('Update failed:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('saved-profiles')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get saved profiles for current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of saved profiles'
  })
  @ApiResponse({
    status: 401,
    description: 'User not found in database'
  })
  async getSavedProfiles(@Request() req) {
    // req.user is already verified by JwtAuthGuard and contains Firebase user data
    return this.userService.getSavedProfiles(req.user.phoneNumber);
  }

  @Post('save-profile')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save another user\'s profile' })
  @ApiResponse({
    status: 201,
    description: 'Profile saved successfully',
    type: SaveProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Profile already saved or trying to save own profile',
  })
  @ApiResponse({
    status: 404,
    description: 'User to save not found',
  })
  async saveProfile(
    @Request() req,
    @Body() saveProfileDto: SaveProfileDto,
  ): Promise<SaveProfileResponseDto> {
    return this.userService.saveProfile(req.user, saveProfileDto.userIdToSave);
  }

  @Put('saved-profile/update')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update transaction count for a saved profile' })
  @ApiResponse({
    status: 200,
    description: 'Saved profile updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Cannot update inactive saved profile',
  })
  @ApiResponse({
    status: 404,
    description: 'Saved profile not found',
  })
  async updateSavedProfile(
    @Request() req,
    @Body() updateSavedProfileDto: UpdateSavedProfileDto,
  ) {
    return this.userService.updateSavedProfile(
      req.user,
      updateSavedProfileDto.savedUserId,
      updateSavedProfileDto.transactionCount,
    );
  }
}
