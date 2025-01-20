import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    const updateUsers = await prisma.user.updateMany({
      data: {
        kyc: false
      } as any
    });
    
    console.log(`Updated ${updateUsers.count} users with kyc = false`);
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
