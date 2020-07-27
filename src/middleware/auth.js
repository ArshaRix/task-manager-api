const jwt = require('jsonwebtoken')
const User = require('../models/User')

const auth = async (req, res, next) => {    
    try {
        // looking for header that the user is suppose to provide
        const token = req.header('Authorization').replace('Bearer ', '')
        // validates the header
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        // find the associate user in db
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token })

        if (!user) {
            throw new Error()
        }

        req.token = token
        req.user = user
        next()

    } catch (err) {
        res.status(401).send({ error: 'Please authenticate.'})
    }
}

module.exports = auth