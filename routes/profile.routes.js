const router = require("express").Router();
const { isAuthenticated } = require("../middleware/jwt.middleware");
const User = require('../models/User.model')
const Game = require('../models/Game.model')

router.get('/', isAuthenticated, async (req, res, next)=> {
    try {
        const user = req.payload
        //console.log(req.payload)
        const userInfo = await User.findOne({username: user.username})
        const gamesInfo = await Game.find().populate("white black")
        res.status(201).json({userInfo: userInfo, gamesInfo: gamesInfo})
    }
    catch(error) {
        next(error)
    }

})

router.delete('/delete', isAuthenticated, async (req, res, next)=>{
    try {
        const user = req.payload
        await User.findOneAndDelete({username: user.username})
        res.status(200).json('User succesfully deleted')

    }
    catch(error) {
        next(error)
    }
})

module.exports = router;
