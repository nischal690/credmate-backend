import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

enum PaymentStatus {
  YET_TO_PAY = 'yet_to_pay',
  MISSED = 'missed'
}

async function updateDueDates() {
  try {
    // Get all active credits
    const credits = await prisma.credit.findMany({
      where: {
        status: 'ACTIVE'
      }
    });

    console.log(`Found ${credits.length} credits to update`);

    for (const credit of credits) {
      const dueDate: { [key: string]: string } = {};
      const startDate = credit.createdAt;
      const today = new Date();
      
      if (credit.paymentType === 'BULLET') {
        // For bullet payment
        const endDate = new Date(startDate);
        if (credit.timeUnit === 'DAYS') {
          endDate.setDate(endDate.getDate() + credit.loanTerm);
        } else if (credit.timeUnit === 'MONTHS') {
          endDate.setMonth(endDate.getMonth() + credit.loanTerm);
        } else if (credit.timeUnit === 'YEARS') {
          endDate.setFullYear(endDate.getFullYear() + credit.loanTerm);
        }
        
        dueDate[endDate.toISOString().split('T')[0]] = 
          endDate < today ? PaymentStatus.MISSED : PaymentStatus.YET_TO_PAY;
      } else {
        // For EMI payments
        const totalEMIs = credit.loanTerm;
        let currentDate = new Date(startDate);
        
        for (let i = 0; i < totalEMIs; i++) {
          if (credit.emiFrequency === 'WEEKLY') {
            currentDate.setDate(currentDate.getDate() + 7);
          } else if (credit.emiFrequency === 'MONTHLY') {
            currentDate.setMonth(currentDate.getMonth() + 1);
          } else if (credit.emiFrequency === 'QUARTERLY') {
            currentDate.setMonth(currentDate.getMonth() + 3);
          }
          
          const dateKey = currentDate.toISOString().split('T')[0];
          dueDate[dateKey] = currentDate < today ? PaymentStatus.MISSED : PaymentStatus.YET_TO_PAY;
        }
      }

      // Update the credit record
      await prisma.credit.update({
        where: { id: credit.id },
        data: { dueDate }
      });

      console.log(`Updated credit ${credit.id}`);
    }

    console.log('Successfully updated all credits');
  } catch (error) {
    console.error('Error updating due dates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDueDates();
