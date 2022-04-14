const router = require("express").Router();
const Move = require('../models/Move.model')
const Game = require('../models/Game.model')
const User = require('../models/User.model');
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { isValidMove } = require("../logic/isValidMove");

router.post('/', isAuthenticated, async (req, res, next) => {

    try {
        console.log(req.body)
        const userToken = req.payload
        const user = await User.findOne({username: userToken.username})
        const black = await User.findOne({username: req.body.username})
        const newGame = await Game.create(
        {   
            white: user._id,
            black: black._id,
            boardSize: req.body.boardSize,
            walls: req.body.walls

        })
        const game = await Game.findById(newGame._id).populate('white black')
        res.status(201).json({game})
    }
    catch(error) {
        next(error)
    }
    
})

router.post('/:id', isAuthenticated, async (req, res, next) => {
    try {
        const userToken = req.payload;
        // const gameId = req.params.id;
        //const {x, y, action, order, player, gameId} = req.body
        //console.log(req.body);
        if (isValidMove(req.body)) {
            const move = await Move.create(req.body)
            res.json({move})
        } else {
            res.json("Invalid move")
        }
    }
    catch(error) {
        next(error)
    }
})

module.exports = router