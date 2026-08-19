const { createClient } = require('redis')

let client = null

const getRedisClient = async () => {
  if (client && client.isOpen) { return client }

  client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })

  client.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.warn('Redis error (non-fatal):', err.message)
  })

  try {
    await client.connect()
    // eslint-disable-next-line no-console
    console.log('✅ Redis connected')
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  Redis unavailable — caching disabled:', err.message)
    client = null
  }

  return client
}

const cacheGet = async (key) => {
  try {
    const c = await getRedisClient()
    if (!c) { return null }
    const val = await c.get(key)
    return val ? JSON.parse(val) : null
  } catch { return null }
}

const cacheSet = async (key, value, ttlSeconds = 300) => {
  try {
    const c = await getRedisClient()
    if (!c) { return }
    await c.setEx(key, ttlSeconds, JSON.stringify(value))
  } catch { /* non-fatal */ }
}

const cacheDel = async (key) => {
  try {
    const c = await getRedisClient()
    if (!c) { return }
    await c.del(key)
  } catch { /* non-fatal */ }
}

module.exports = { getRedisClient, cacheGet, cacheSet, cacheDel }
