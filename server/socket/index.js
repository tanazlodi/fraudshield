const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ Dashboard connected: ${socket.id}`)

    socket.on('disconnect', () => {
      console.log(`❌ Dashboard disconnected: ${socket.id}`)
    })
  })
}

module.exports = initSocket