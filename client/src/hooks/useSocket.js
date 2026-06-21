import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:5001'

export const useSocket = (onNewTransaction, onFraudAlert) => {
  const socketRef = useRef(null)

  useEffect(() => {
    // Create socket connection
    socketRef.current = io(SOCKET_URL)

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected')
    })

    // Listen for new transactions
    if (onNewTransaction) {
      socket.on('new_transaction', onNewTransaction)
    }

    // Listen for fraud alerts
    if (onFraudAlert) {
      socket.on('fraud_alert', onFraudAlert)
    }

    // Cleanup on unmount — very important
    return () => {
      socket.off('new_transaction')
      socket.off('fraud_alert')
      socket.disconnect()
    }
  }, [])

  return socketRef.current
}