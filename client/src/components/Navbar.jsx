import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/transactions', label: 'Transactions' },
    { path: '/alerts', label: 'Alerts' },
  ]

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link to="/dashboard" className="text-white font-bold text-xl">
          🛡️ FraudShield
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6">
          {navLinks.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`text-sm font-medium transition-colors ${
                location.pathname === path
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* User info + logout */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-white text-sm font-medium">{user?.username}</p>
            <p className="text-gray-500 text-xs capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>

      </div>
    </nav>
  )
}