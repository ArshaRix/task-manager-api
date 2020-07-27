const express = require('express')
require('./db/mongoose')

const user = require('./routers/user')
const task = require('./routers/task')

const app = express()
const port = process.env.PORT

app.use(express.json())
app.use('/users', user)
app.use('/tasks', task)


app.listen(port, () => console.log(`Server running on port ${port}`))