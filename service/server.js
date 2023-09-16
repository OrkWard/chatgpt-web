const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())

app.use(express.json())

app.post('/model', (req, res) => {
  const { prompt, image } = req.body

  // 进行处理逻辑，如果只是原样返回的话，可以直接将数据返回
  const response = { message: 'Response Successfully', status: 'Success', data: { result: 'description' } }

  res.json(response)
})

app.listen(3002, () => { })
