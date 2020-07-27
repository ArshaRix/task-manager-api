const mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB_URI, {
    useUnifiedTopology: true,
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false
})