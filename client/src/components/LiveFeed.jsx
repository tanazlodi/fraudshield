import { useState, useEffect } from 'react'
import { getTransactions } from '../services/api'
import { useSocket } from '../hooks/useSocket'

export default function LiveFeed() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  // Load initial transactions on mount
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await getTransactions(1, 20)
        setTransactions(response.data.transactions)
      } catch (err) {
        console.error('Failed to fetch transactions:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  // Listen for real-time transactions via Socket.io
  useSocket(
    (transaction) => {
      setTransactions(prev => [transaction, ...prev].slice(0, 20))
    },
    null
  )

  const formatAmount = (amount) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString()

  if (loading) return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <p className="text-gray-400 text-sm">Loading transactions...</p>
    </div>
  )

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-white font-semibold">Live Transaction Feed</h2>
        <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          Live
        </span>
      </div>

      {/* Transactions */}
      <div className="divide-y divide-gray-800">
        {transactions.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500 text-sm">
            No transactions yet. Start the simulator to see live data.
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx._id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center gap-3">
                {/* Fraud indicator */}
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tx.flagged ? 'bg-red-500' : 'bg-green-500'}`} />
                <div>
                  <p className="text-white text-sm font-medium">{tx.merchantName}</p>
                  <p className="text-gray-500 text-xs capitalize">{tx.merchantCategory} · {formatTime(tx.timestamp)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-sm font-medium">{formatAmount(tx.amount)}</p>
                <p className={`text-xs font-medium ${tx.flagged ? 'text-red-400' : 'text-gray-500'}`}>
                  {tx.flagged ? ` ${tx.fraudScore}` : `score: ${tx.fraudScore}`}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}