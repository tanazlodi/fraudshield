import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getScoreDistribution } from '../services/api'

export default function ScoreDistribution() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await getScoreDistribution()
        const formatted = response.data.map((item) => ({
          range: `${item._id.toFixed(1)}-${(item._id + 0.1).toFixed(1)}`,
          count: item.count
        }))
        setData(formatted)
      } catch (err) {
        console.error('Failed to fetch score distribution:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 animate-pulse">
      <div className="h-4 bg-gray-800 rounded w-1/3 mb-4" />
      <div className="h-48 bg-gray-800 rounded" />
    </div>
  )

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <h2 className="text-white font-semibold mb-4">Fraud Score Distribution</h2>
      {data.length === 0 ? (
        <p className="text-gray-500 text-sm">No scored transactions yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="range" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
              labelStyle={{ color: '#f9fafb' }}
              itemStyle={{ color: '#3b82f6' }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}