import { useState, useEffect } from 'react'
import { getFlaggedTransactions } from '../services/api'
import { useSocket } from '../hooks/useSocket'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = async () => {
    try {
      const response = await getFlaggedTransactions()
      setAlerts(response.data)
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  // Add new fraud alerts in real time
  useSocket(
    null,
    (transaction) => {
      setAlerts(prev => [transaction, ...prev])
    }
  )

  const formatAmount = (amount) =>
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const formatDate = (timestamp) =>
    new Date(timestamp).toLocaleString()

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Fraud Alerts</h1>
            <p className="text-gray-400 text-sm mt-1">
              {alerts.length} flagged transaction{alerts.length !== 1 ? 's' : ''}
            </p>
          </div>
          {alerts.length > 0 && (
            <span className="flex items-center gap-1.5 text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
              {alerts.length} Active Alert{alerts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Alerts list */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 p-6 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-white font-medium">No fraud detected</p>
            <p className="text-gray-500 text-sm mt-1">All transactions are looking legitimate</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert._id} className="bg-gray-900 rounded-xl border border-red-500/20 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🚨</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold">{alert.merchantName}</p>
                        <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full capitalize">
                          {alert.merchantCategory}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-0.5">
                        Card ···· {alert.cardLastFour} · {alert.location?.city || 'Unknown'}, {alert.location?.country || ''}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">{formatDate(alert.timestamp)}</p>
                    </div>
                  </div>

                  {/* Amount + score */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-bold text-xl">{formatAmount(alert.amount)}</p>
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      <div className="w-16 bg-gray-800 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-red-500"
                          style={{ width: `${(alert.fraudScore || 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-red-400 text-xs font-medium">{alert.fraudScore}</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">fraud score</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}