import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getFraudLocations } from '../services/api'

export default function FraudMap() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await getFraudLocations()
        setLocations(response.data)
      } catch (err) {
        console.error('Failed to fetch fraud locations:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  // Group locations by city and count fraud per city
  const cityData = locations.reduce((acc, point) => {
    const key = point.city
    if (!acc[key]) {
      acc[key] = { lat: point.lat, lng: point.lng, city: point.city, count: 0, totalAmount: 0 }
    }
    acc[key].count += 1
    acc[key].totalAmount += point.amount
    return acc
  }, {})

  const cities = Object.values(cityData)
  const maxCount = Math.max(...cities.map(c => c.count), 1)

  if (loading) return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 animate-pulse">
      <div className="h-4 bg-gray-800 rounded w-1/3 mb-4" />
      <div className="h-80 bg-gray-800 rounded" />
    </div>
  )

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Fraud Hotspots</h2>
        <span className="text-gray-500 text-xs">{locations.length} flagged transactions across {cities.length} cities</span>
      </div>

      {locations.length === 0 ? (
        <div className="h-80 flex items-center justify-center">
          <p className="text-gray-500 text-sm">No fraud locations yet.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ height: '400px' }}>
          <MapContainer
            center={[39.5, -98.35]}
            zoom={4}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            {cities.map((city) => {
              const intensity = city.count / maxCount
              const radius = 8 + intensity * 20
              const opacity = 0.4 + intensity * 0.5

              return (
                <CircleMarker
                  key={city.city}
                  center={[city.lat, city.lng]}
                  radius={radius}
                  fillColor="#ef4444"
                  color="#ef4444"
                  weight={1}
                  opacity={opacity}
                  fillOpacity={opacity * 0.6}
                >
                  <Tooltip>
                    <div className="text-sm">
                      <p className="font-semibold">{city.city}</p>
                      <p>{city.count} fraud case{city.count !== 1 ? 's' : ''}</p>
                      <p>${city.totalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                    </div>
                  </Tooltip>
                </CircleMarker>
              )
            })}
          </MapContainer>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500 opacity-50" />
          <span className="text-gray-500 text-xs">Low activity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-red-500 opacity-90" />
          <span className="text-gray-500 text-xs">High activity</span>
        </div>
        <span className="text-gray-600 text-xs ml-auto">Hover cities for details</span>
      </div>
    </div>
  )
}