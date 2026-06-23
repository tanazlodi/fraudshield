import { useState, useEffect } from 'react'
import { getTransactions } from '../services/api'
import { useSocket } from '../hooks/useSocket'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchTransactions = async (currentPage) => {
    try {
      setLoading(true)
      const response = await getTransactions(currentPage, 20)
      setTransactions(response.data.transactions)
      setTotalPages(response.data.totalPages)
      setTotal(response.data.total)
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions(page)
  }, [page])

  // Refresh when new transaction comes in and we're on page 1
  useSocket(
    () => { if (page === 1) fetchTransactions(1) },
    null
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
            <h1 className="text-2xl font-bold text-white">Transactions</h1>
            <p className="text-gray-400 text-sm mt-1">
              {total.toLocaleString()} total transactions
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">Status</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">Merchant</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">Category</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">Amount</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">Fraud Score</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">Location</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  [...Array(10)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">
                      No transactions yet. Start the simulator to see data.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                          tx.flagged
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-green-500/10 text-green-400 border border-green-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tx.flagged ? 'bg-red-400' : 'bg-green-400'}`} />
                          {tx.flagged ? 'Fraud' : 'Legitimate'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white text-sm font-medium">{tx.merchantName}</p>
                        <p className="text-gray-500 text-xs">···· {tx.cardLastFour}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm capitalize">{tx.merchantCategory}</td>
                      <td className="px-6 py-4 text-white text-sm font-medium">{formatAmount(tx.amount)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-800 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${tx.fraudScore > 0.5 ? 'bg-red-500' : 'bg-green-500'}`}
                              style={{ width: `${(tx.fraudScore || 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-400 text-xs">{tx.fraudScore ?? 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{tx.location?.city || 'Unknown'}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(tx.timestamp)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
              <p className="text-gray-500 text-sm">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}