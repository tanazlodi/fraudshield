import { useState, useEffect } from 'react'
import { getSummary, getByCategory } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../hooks/useSocket'
import StatCard from '../components/StatCard'
import LiveFeed from '../components/LiveFeed'
import FraudRateChart from '../components/FraudRateChart'
import ScoreDistribution from '../components/ScoreDistribution'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import FraudMap from '../components/FraudMap'


export default function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)

  const fetchSummary = async () => {
    try {
      const response = await getSummary()
      setSummary(response.data)
    } catch (err) {
      console.error('Failed to fetch summary:', err)
    } finally {
      setLoadingSummary(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await getByCategory()
      const formatted = response.data.map((item) => ({
        category: item.category,
        fraudRate: parseFloat(item.fraudRate.toFixed(2))
      }))
      setCategories(formatted)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    } finally {
      setLoadingCategories(false)
    }
  }

  useEffect(() => {
    fetchSummary()
    fetchCategories()
  }, [])

  useSocket(
    () => {
      fetchSummary()
      fetchCategories()
    },
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
        {loadingSummary ? (
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

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FraudRateChart />
          <ScoreDistribution />
        </div>

        {/* Fraud by Category */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-white font-semibold mb-4">Fraud Rate by Category</h2>
          {loadingCategories ? (
            <div className="h-48 bg-gray-800 rounded animate-pulse" />
          ) : categories.length === 0 ? (
            <p className="text-gray-500 text-sm">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categories}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="category" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
                  labelStyle={{ color: '#f9fafb' }}
                  itemStyle={{ color: '#f59e0b' }}
                  formatter={(value) => [`${value}%`, 'Fraud Rate']}
                />
                <Bar dataKey="fraudRate" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Fraud Map */}
        <FraudMap />

        {/* Live Feed */}
        <LiveFeed />

      </div>
    </div>
  )
}