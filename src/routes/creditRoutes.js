const express = require('express');
const { PrismaClient } = require('@prisma/client');
const admin = require('firebase-admin');
const router = express.Router();
const prisma = new PrismaClient();

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// POST /credit/give-credit
router.post('/give-credit', verifyToken, async (req, res) => {
    try {
        const {
            borrowerMobileNumber,
            loanAmount,
            loanTerm,
            timeUnit,
            interestRate,
            paymentType,
            emiFrequency
        } = req.body;

        // Get the lender's phone number from Firebase token
        const lenderFirebaseUid = req.user.uid;
        const lender = await prisma.user.findFirst({
            where: {
                phoneNumber: req.user.phone_number
            }
        });

        if (!lender) {
            return res.status(404).json({ error: 'Lender not found' });
        }

        // Find borrower by mobile number
        const borrower = await prisma.user.findFirst({
            where: {
                phoneNumber: borrowerMobileNumber
            }
        });

        // Create credit offer
        const creditOffer = await prisma.creditOffer.create({
            data: {
                parentOfferId: null, // Same as id for new offers
                offerByUserId: lender.id,
                offerToUserId: borrower ? borrower.id : 'NR',
                loanAmount: parseFloat(loanAmount),
                loanTerm: parseInt(loanTerm),
                timeUnit: timeUnit,
                interestRate: parseFloat(interestRate),
                paymentType: paymentType,
                emiFrequency: emiFrequency,
                status: 'ACTIVE',
                versionNumber: 1,
                expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            }
        });

        // Update the parentOfferId to be the same as id
        const updatedOffer = await prisma.creditOffer.update({
            where: { id: creditOffer.id },
            data: { parentOfferId: creditOffer.id }
        });

        res.status(201).json(updatedOffer);
    } catch (error) {
        console.error('Error creating credit offer:', error);
        res.status(500).json({ error: 'Failed to create credit offer' });
    }
});

// POST /credit/request-credit
router.post('/request-credit', verifyToken, async (req, res) => {
    try {
        const {
            lenderMobileNo,
            loanAmount,
            loanTerm,
            timeUnit,
            interestRate,
            purposeOfLoan,
            paymentType,
            emiFrequency
        } = req.body;

        // Get the borrower's details from Firebase token
        const borrowerFirebaseUid = req.user.uid;
        const borrower = await prisma.user.findFirst({
            where: {
                phoneNumber: req.user.phone_number
            }
        });

        if (!borrower) {
            return res.status(404).json({ error: 'Borrower not found' });
        }

        // Find lender by mobile number
        const lender = await prisma.user.findFirst({
            where: {
                phoneNumber: lenderMobileNo
            }
        });

        // Create credit request
        const creditRequest = await prisma.creditRequest.create({
            data: {
                requestByUserId: borrower.id,
                requestedToUserId: lender ? lender.id : lenderMobileNo,
                loanAmount: parseFloat(loanAmount),
                loanTerm: parseInt(loanTerm),
                timeUnit: timeUnit,
                interestRate: parseFloat(interestRate),
                paymentType: paymentType,
                emiFrequency: emiFrequency,
                status: 'PROPOSED',
                versionNumber: 1,
                metadata: { purposeOfLoan },
                isLatest: true
            }
        });

        // Update the parentRequestId to be the same as id
        const updatedRequest = await prisma.creditRequest.update({
            where: { id: creditRequest.id },
            data: { parentRequestId: creditRequest.id }
        });

        res.status(201).json(updatedRequest);
    } catch (error) {
        console.error('Error creating credit request:', error);
        res.status(500).json({ error: 'Failed to create credit request' });
    }
});

module.exports = router;
