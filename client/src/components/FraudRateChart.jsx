import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getFraudOverTime } from '../services/api'

export default function FraudRateChart() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await getFraudOverTime()
        const formatted = response.data.map((item) => ({
          time: `${item._id.month}/${item._id.day} ${item._id.hour}:00`,
          fraud: item.count
        }))
        setData(formatted)
      } catch (err) {
        console.error('Failed to fetch fraud over time:', err)
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
      <h2 className="text-white font-semibold mb-4">Fraud Over Time</h2>
      {data.length === 0 ? (
        <p className="text-gray-500 text-sm">No fraud detected yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
              labelStyle={{ color: '#f9fafb' }}
              itemStyle={{ color: '#ef4444' }}
            />
            <Line
              type="monotone"
              dataKey="fraud"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}