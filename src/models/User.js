const mongoose = require('mongoose')
const validator = require('validator')
const brcypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const Task = require('./Task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Incorrect email format!')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password must not contain "password"!')
            }
        }
    },
    age: {
        type: Number,
        trim: true,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be in positive number!')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})


// virtual field
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'creator'
})


// use to modify response 
userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()

    // hiding fields in response.body
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}


// custom instance
// use for signup and login
userSchema.methods.generateAuthToken = async function() {
    const user = this
    // generate token
    const token = jwt.sign({ _id: user._id.toString()}, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}


// custom method
// use for login
userSchema.statics.findByCredentials = async (email, password) => {
    // use to find specific email
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await brcypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    // return if user found
    return user
}


// Hash the plain text password before saving
// use for signup
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await brcypt.hash(user.password, 8)
    }

    next()
})


// Delete user tasks when user is removed
// use for deleting user
userSchema.pre('remove', async function(next) {
    const user = this
    await Task.deleteMany({ creator: user._id})
    next()
})


const User = mongoose.model('User', userSchema)

module.exports = User