import {
  Injectable,
  UnauthorizedException,
  Logger,
  ExecutionContext,
  CanActivate,
} from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    try {
      const decodedToken = await this.firebaseService.verifyIdToken(token);

      // Format phone number - ensure it has + prefix and no spaces
      let formattedPhoneNumber = decodedToken.phone_number;
      if (formattedPhoneNumber) {
        // Remove any spaces
        formattedPhoneNumber = formattedPhoneNumber.replace(/\s/g, '');
        // Ensure it has + prefix
        if (!formattedPhoneNumber.startsWith('+')) {
          formattedPhoneNumber = '+' + formattedPhoneNumber;
        }
        this.logger.debug('Formatted phone number:', formattedPhoneNumber);
      }

      // Add user data to request
      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        phoneNumber: formattedPhoneNumber,
        name: decodedToken.name,
        picture: decodedToken.picture,
      };

      return true;
    } catch (error) {
      this.logger.error('Authentication failed', {
        error: error.message,
        code: error.code,
      });

      throw new UnauthorizedException(
        error.message || 'Invalid or expired token',
      );
    }
  }
}
