const express = require('express')
const multer = require('multer')
const sharp = require('sharp')

const User = require('../models/User')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')

const router = express.Router()
const avatar = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image')) 
        }

        cb(undefined, true)
    }
})

router.post('/', async (req, res) => {
    const user = new User(req.body)
    
    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})

    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/login', async (req, res) => {
    const email = req.body.email
    const password = req.body.password

    try {
        const user = await User.findByCredentials(email, password)
        const token = await user.generateAuthToken()
        res.send({ user, token })

    } catch (e) {
        res.status(400).send()
    }
})

router.post('/logout', auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((userToken) => {
            // compare if the client user token is the same token in the database
            return userToken.token !== req.token
        })

        await req.user.save()
        res.send()

    } catch (err) {
        res.status(500).send()
    }
})

router.post('/logoutAll', auth, async(req, res) => {
    try {
        // wipe all tokens
        req.user.tokens = []

        await req.user.save()
        res.send()

    } catch (err) {
        res.status(500).send()
    }
})

router.get('/me', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdate = ['name', 'email', 'password', 'age']

    const isValidOperation = updates.every((update) => allowedUpdate.includes(update))

    if (!isValidOperation) {
       return res.status(400).send('Invalid input!')
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()

        res.send(req.user)

    } catch (e) {
        res.status(500).send()
    }

})

router.delete('/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancelationEmail(req.user.email, req.user.name)
        res.send(req.user)
        
    } catch (e) {
        res.status(500).send()
    }
})

// key:avatar
router.post('/me/avatar', auth, avatar.single('avatar'), async (req, res) => {
    // sharp module
    const buffer = await sharp(req.file.buffer)
        .resize({ width: 250, height: 250 })
        .png()
        .toBuffer()

    req.user.avatar = buffer
    await req.user.save()
    res.send()

    // custom error handler
}, (err, req, res, next) => {
    res.status(400).send({ error: err.message })
})

// 
router.delete('/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send(req.user)
})

// user id  + avatar
router.get('/:id/avatar', async (req, res) => {
    const _id = req.params.id
    
    try {
        const user = await User.findById(_id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)

    } catch (err) {
        res.status(404).send()
    }
})

module.exports = router