const express = require('express')
const Transaction = require('../models/Transaction')
const { scoreTransaction } = require('../services/mlService')

module.exports = (io) => {
  const router = express.Router()

// GET /api/transactions - paginated transaction history
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const transactions = await Transaction.find({ userId: req.user?._id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Transaction.countDocuments({ userId: req.user?._id })

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/transactions/:id - single transaction
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' })
    res.json(transaction)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/transactions - ingest a new transaction and score it
router.post('/', async (req, res) => {
  try {
    // Save transaction as pending
    const transaction = new Transaction({ ...req.body, userId: req.user?._id })
    await transaction.save()

    // Send to ML service for scoring
    const { fraudScore, isFraud } = await scoreTransaction(transaction)

    // Update with score
    transaction.fraudScore = fraudScore
    transaction.isFraud = isFraud
    transaction.flagged = isFraud
    transaction.status = 'scored'
    await transaction.save()

    // Emit to all connected dashboard clients in real time
    io.emit('new_transaction', transaction)
    if (isFraud) io.emit('fraud_alert', transaction)

    res.status(201).json(transaction)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/transactions/flagged - only fraudulent transactions
router.get('/filter/flagged', async (req, res) => {
  try {
    const flagged = await Transaction.find({ flagged: true, userId: req.user?._id }).sort({ timestamp: -1 }).limit(50)
    res.json(flagged)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

  return router
}