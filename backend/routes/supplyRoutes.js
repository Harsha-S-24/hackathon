// routes/supplyRoutes.js
const express = require('express');
const router = express.Router();
const Supply = require('../database/Supply');
const Donation = require('../database/ordersSchema');
const User = require('../database/User');
const authMiddleware = require('../authMiddleware');

// Route to request supplies
router.post('/supplies', authMiddleware, async (req, res) => {
    const { category, itemName, quantity, expiryDate } = req.body;
    const recipientId = req.userId;

    try {
        const newSupply = new Supply({
            recipientId,
            category,
            itemName,
            quantity,
            expiryDate
        });
        await newSupply.save();
        res.status(201).json(newSupply);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Route to get supplies for a recipient
router.get('/supplies', authMiddleware, async (req, res) => {
    const recipientId = req.userId;

    try {
        const supplies = await Supply.find({ recipientId });
        res.json(supplies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Route to find matched donations
router.get('/supplies/matches', authMiddleware, async (req, res) => {
    const recipientId = req.userId;

    try {
        const supplies = await Supply.find({ recipientId });
        const matches = [];

        for (const supply of supplies) {
            const matchedDonations = await Donation.find({
                category: supply.category,
                itemName: supply.itemName,
                quantity: { $gte: supply.quantity }
            });

            for (const donation of matchedDonations) {
                const donor = await User.findById(donation.donorId);
                if (!donor) {
                    console.warn(`Donor not found for donation ID: ${donation._id}`);
                    continue; // Skip this iteration if donor is not found
                }
                matches.push({
                    ...donation._doc,
                    donorName: donor.name
                });
            }
        }

        res.json(matches);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
