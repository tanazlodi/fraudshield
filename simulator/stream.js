const axios = require('axios')

const API_URL = 'http://localhost:5001/api/transactions'
const AUTH_URL = 'http://localhost:5001/api/auth/login'

// Credentials for the simulator user
const SIMULATOR_CREDENTIALS = {
  email: 'tanaz@fraudshield.com',
  password: 'password123'
}

const merchantCategories = ['grocery', 'electronics', 'restaurant', 'travel', 'online', 'atm', 'gas', 'other']
const merchants = {
  grocery: ['Whole Foods', 'Trader Joes', 'Kroger'],
  electronics: ['Best Buy', 'Apple Store', 'Newegg'],
  restaurant: ['Chipotle', 'Olive Garden', "McDonald's"],
  travel: ['Delta Airlines', 'Marriott', 'Expedia'],
  online: ['Amazon', 'eBay', 'Etsy'],
  atm: ['Chase ATM', 'Bank of America ATM'],
  gas: ['Shell', 'Chevron', 'Exxon'],
  other: ['Unknown Merchant']
}
const cities = [
  { city: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
  { city: 'Austin', country: 'USA', lat: 30.2672, lng: -97.7431 },
  { city: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
  { city: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  { city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 }
]

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateTransaction() {
  const category = randomFrom(merchantCategories)
  const location = randomFrom(cities)

  const isSuspiciousAmount = Math.random() < 0.05
  const amount = isSuspiciousAmount
    ? +(Math.random() * 5000 + 2000).toFixed(2)
    : +(Math.random() * 200 + 5).toFixed(2)

  return {
    transactionId: `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    amount,
    merchantName: randomFrom(merchants[category]),
    merchantCategory: category,
    location,
    cardLastFour: String(Math.floor(1000 + Math.random() * 9000)),
    timestamp: new Date().toISOString()
  }
}

async function sendTransaction(token) {
  const transaction = generateTransaction()

  try {
    const response = await axios.post(API_URL, transaction, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const { fraudScore, isFraud, merchantName, amount } = response.data
    const flag = isFraud ? '🚨 FRAUD' : '✅ OK'
    console.log(`${flag} | $${amount} at ${merchantName} | score: ${fraudScore}`)
  } catch (err) {
    console.error('❌ Failed to send transaction:', err.response?.data || err.message)
  }
}

async function start() {
  console.log('🔐 Logging in...')

  try {
    const res = await axios.post(AUTH_URL, SIMULATOR_CREDENTIALS)
    const token = res.data.token
    console.log('✅ Logged in successfully')
    console.log('🚀 Starting transaction simulator...')
    console.log('Sending a transaction every 2 seconds. Press Ctrl+C to stop.\n')

    sendTransaction(token)
    setInterval(() => sendTransaction(token), 2000)
  } catch (err) {
    console.error('❌ Login failed:', err.response?.data || err.message)
    process.exit(1)
  }
}

start()