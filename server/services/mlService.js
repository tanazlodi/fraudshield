const axios = require('axios')

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

const scoreTransaction = async (transaction) => {
  try {
    const payload = {
      transaction_id: transaction.transactionId,
      amount: transaction.amount,
      merchant_category: transaction.merchantCategory,
      location_lat: transaction.location?.lat,
      location_lng: transaction.location?.lng,
      card_last_four: transaction.cardLastFour,
      timestamp: transaction.timestamp
    }

    const response = await axios.post(`${ML_SERVICE_URL}/score`, payload)

    return {
      fraudScore: response.data.fraud_score,
      isFraud: response.data.is_fraud
    }
  } catch (err) {
    console.error('❌ ML service error:', err.message)

    // Fail safe — if ML service is down, don't block the transaction
    return {
      fraudScore: null,
      isFraud: false
    }
  }
}

module.exports = { scoreTransaction }