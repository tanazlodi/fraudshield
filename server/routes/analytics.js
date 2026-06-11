const express = require('express')
const router = express.Router()
const Transaction = require('../models/Transaction')

// GET /api/analytics/summary - high level stats for dashboard cards
router.get('/summary', async (req, res) => {
  try {
    const total = await Transaction.countDocuments()
    const totalFlagged = await Transaction.countDocuments({ flagged: true })
    const totalAmount = await Transaction.aggregate([
      { $group: { _id: null, sum: { $sum: '$amount' } } }
    ])
    const avgFraudScore = await Transaction.aggregate([
      { $match: { fraudScore: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$fraudScore' } } }
    ])

    res.json({
      totalTransactions: total,
      totalFlagged,
      fraudRate: total > 0 ? (totalFlagged / total) * 100 : 0,
      totalVolume: totalAmount[0]?.sum || 0,
      avgFraudScore: avgFraudScore[0]?.avg || 0
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/analytics/fraud-over-time - fraud count grouped by hour
router.get('/fraud-over-time', async (req, res) => {
  try {
    const data = await Transaction.aggregate([
      { $match: { flagged: true } },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
            hour: { $hour: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
      { $limit: 24 }
    ])

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/analytics/by-category - fraud breakdown by merchant category
router.get('/by-category', async (req, res) => {
  try {
    const data = await Transaction.aggregate([
      {
        $group: {
          _id: '$merchantCategory',
          total: { $sum: 1 },
          flagged: { $sum: { $cond: ['$flagged', 1, 0] } }
        }
      },
      {
        $project: {
          category: '$_id',
          total: 1,
          flagged: 1,
          fraudRate: {
            $multiply: [{ $divide: ['$flagged', '$total'] }, 100]
          }
        }
      },
      { $sort: { fraudRate: -1 } }
    ])

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/analytics/score-distribution - histogram data for fraud scores
router.get('/score-distribution', async (req, res) => {
  try {
    const data = await Transaction.aggregate([
      { $match: { fraudScore: { $ne: null } } },
      {
        $bucket: {
          groupBy: '$fraudScore',
          boundaries: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
          default: 'other',
          output: { count: { $sum: 1 } }
        }
      }
    ])

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router