import { useState, useEffect } from 'react'
import { getSummary } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../hooks/useSocket'
import StatCard from '../components/StatCard'
import LiveFeed from '../components/LiveFeed'

export default function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = async () => {
    try {
      const response = await getSummary()
      setSummary(response.data)
    } catch (err) {
      console.error('Failed to fetch summary:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load summary on mount
  useEffect(() => {
    fetchSummary()
  }, [])

  // Refresh summary every time a new transaction comes in
  useSocket(
    () => fetchSummary(),
    null
  )

  const formatCurrency = (amount) =>
    `$${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.username} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Here's what's happening with your transactions
          </p>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 p-5 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-1/2 mb-3" />
                <div className="h-8 bg-gray-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Transactions"
              value={summary?.totalTransactions?.toLocaleString() || '0'}
              subtitle="All time"
              color="blue"
            />
            <StatCard
              title="Fraud Detected"
              value={summary?.totalFlagged?.toLocaleString() || '0'}
              subtitle="Flagged transactions"
              color="red"
            />
            <StatCard
              title="Fraud Rate"
              value={`${(summary?.fraudRate || 0).toFixed(2)}%`}
              subtitle="Of all transactions"
              color="yellow"
            />
            <StatCard
              title="Total Volume"
              value={formatCurrency(summary?.totalVolume)}
              subtitle="Transaction volume"
              color="green"
            />
          </div>
        )}

        {/* Live Feed */}
        <LiveFeed />

      </div>
    </div>
  )
}