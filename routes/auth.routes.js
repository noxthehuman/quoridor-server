const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jsonwebtoken = require('jsonwebtoken')
const { isAuthenticated } = require('../middleware/jwt.middleware')
const User = require('../models/User.model')

router.post('/signup', async (req, res, next) => {
  const { username, password, email } = req.body

  const foundUser = await User.findOne({ username })

  if (foundUser) {
    res.status(400).json({ error: 'User already exists' })
    return
  }

  const salt = await bcrypt.genSalt(10)

  const hashedPassword = await bcrypt.hash(password, salt)

  const createdUser = await User.create({ username, password: hashedPassword, email })

  res.status(201).json(createdUser)
})

router.post('/login', async (req, res, next) => {
  const { username, password } = req.body

  const foundUser = await User.findOne({ username })

  if (!foundUser) {
    res.status(401).json({ error: 'Credentials not found' })
    return
  }

  if (bcrypt.compareSync(password, foundUser.password)) {
    const payload = { username }

    const authToken = jsonwebtoken.sign(payload, process.env.TOKEN_SECRET, {
      algorithm: 'HS256',
      expiresIn: '24h',
    })

    res.status(200).send({ authToken: authToken })
    return
  } else {
    res.status(401).json({ error: 'Credentials not found' })
  }
})

router.get('/verify', isAuthenticated, (req, res, next) => {
  res.status(200).json(req.payload)
})

// You put the next routes here 👇
// example: router.use("/auth", authRoutes)

module.exports = router