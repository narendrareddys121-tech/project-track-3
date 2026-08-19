const mongoose = require('mongoose')

const connectMongo = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskai_db'
  try {
    await mongoose.connect(uri)
    // eslint-disable-next-line no-console
    console.log('✅ MongoDB connected')
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ MongoDB connection failed:', err.message)
    throw err
  }
}

mongoose.connection.on('disconnected', () => {
  // eslint-disable-next-line no-console
  console.warn('⚠️  MongoDB disconnected')
})

module.exports = connectMongo
