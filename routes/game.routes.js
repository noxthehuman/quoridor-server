const router = require("express").Router();
const Move = require('../models/Move.model')
const Game = require('../models/Game.model')
const User = require('../models/User.model');
const { isAuthenticated } = require("../middleware/jwt.middleware");

router.post('/', isAuthenticated, async (req, res, next) => {

    try {
        const userToken = req.payload
        const user = await User.findOne({username: userToken.username})
        console.log(user)
        const black = await User.findOne({username: req.body.username})
        const newGame = await Game.create(
        {   
            white: user._id,
            black: black._id

        })

        res.status(201).json({newGame})
    }
    catch(error) {
        next(error)
    }
    
})

module.exports = router