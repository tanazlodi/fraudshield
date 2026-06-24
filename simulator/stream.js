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
  { city: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437 },
  { city: 'Chicago', country: 'USA', lat: 41.8781, lng: -87.6298 },
  { city: 'Houston', country: 'USA', lat: 29.7604, lng: -95.3698 },
  { city: 'Phoenix', country: 'USA', lat: 33.4484, lng: -112.0740 },
  { city: 'Philadelphia', country: 'USA', lat: 39.9526, lng: -75.1652 },
  { city: 'San Antonio', country: 'USA', lat: 29.4241, lng: -98.4936 },
  { city: 'San Diego', country: 'USA', lat: 32.7157, lng: -117.1611 },
  { city: 'Dallas', country: 'USA', lat: 32.7767, lng: -96.7970 },
  { city: 'Austin', country: 'USA', lat: 30.2672, lng: -97.7431 },
  { city: 'San Francisco', country: 'USA', lat: 37.7749, lng: -122.4194 },
  { city: 'Seattle', country: 'USA', lat: 47.6062, lng: -122.3321 },
  { city: 'Denver', country: 'USA', lat: 39.7392, lng: -104.9903 },
  { city: 'Boston', country: 'USA', lat: 42.3601, lng: -71.0589 },
  { city: 'Atlanta', country: 'USA', lat: 33.7490, lng: -84.3880 },
  { city: 'Miami', country: 'USA', lat: 25.7617, lng: -80.1918 },
  { city: 'Las Vegas', country: 'USA', lat: 36.1699, lng: -115.1398 },
  { city: 'Minneapolis', country: 'USA', lat: 44.9778, lng: -93.2650 },
  { city: 'Portland', country: 'USA', lat: 45.5051, lng: -122.6750 },
  { city: 'Detroit', country: 'USA', lat: 42.3314, lng: -83.0458 }
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