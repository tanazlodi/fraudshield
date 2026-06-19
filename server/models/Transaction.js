const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  merchantName: {
    type: String,
    required: true
  },
  merchantCategory: {
    type: String,
    enum: ['grocery', 'electronics', 'restaurant', 'travel', 'online', 'atm', 'gas', 'other'],
    required: true
  },
  location: {
    city: String,
    country: String,
    lat: Number,
    lng: Number
  },
  cardLastFour: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isFraud: {
    type: Boolean,
    default: false
  },
  fraudScore: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  flagged: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'scored', 'reviewed'],
    default: 'pending'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true // adds createdAt and updatedAt automatically
})

// Index for fast queries
transactionSchema.index({ timestamp: -1 })
transactionSchema.index({ flagged: 1 })
transactionSchema.index({ cardLastFour: 1 })

const Transaction = mongoose.model('Transaction', transactionSchema)

module.exports = Transaction