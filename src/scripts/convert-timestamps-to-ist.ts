import { PrismaClient } from '@prisma/client';

async function convertTimestampsToIST() {
  const prisma = new PrismaClient();

  try {
    // Get all users
    const users = await prisma.user.findMany();
    
    // Convert and update timestamps for each user
    for (const user of users) {
      const createdAtIST = new Date(user.createdAt.getTime() + (5.5 * 60 * 60 * 1000));
      const updatedAtIST = user.updatedAt ? new Date(user.updatedAt.getTime() + (5.5 * 60 * 60 * 1000)) : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          createdAt: createdAtIST,
          updatedAt: updatedAtIST
        }
      });
    }

    console.log('Successfully converted all timestamps to IST');
  } catch (error) {
    console.error('Error converting timestamps:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
convertTimestampsToIST();
