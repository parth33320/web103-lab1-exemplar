import express from 'express'
import giftsRouter from './routes/gifts.js'

const app = express()

app.use(express.static('./public'))
app.use('/public', express.static('./public'))
app.use('/scripts', express.static('./public/scripts'))

app.use('/gifts', giftsRouter)

app.get('/', (req, res) => {
  res.status(200).sendFile('./public/index.html', { root: '.' })
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:3001`)
})
