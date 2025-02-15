import { CreditOffer, User } from '@prisma/client';

export interface CreditOfferWithUsers extends CreditOffer {
  offerByUser: Pick<User, 'id' | 'name' | 'phoneNumber'>;
  offerToUser: Pick<User, 'id' | 'name' | 'phoneNumber'>;
}
