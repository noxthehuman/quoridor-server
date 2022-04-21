const router = require("express").Router();
const Move = require('../models/Move.model')
const Game = require('../models/Game.model')
const User = require('../models/User.model');
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { isValidMove } = require("../logic/isValidMove");

router.get('/:id', async (req, res, next) => {
    try {
        const game = await Game.findById(req.params.id)
        res.status(200).json(game)
    }
    catch(error) {
        next(error)
    }
})

router.post('/', isAuthenticated, async (req, res, next) => {

    try {
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
        const valid = await isValidMove(req.body)
        if (valid) {
            const move = await Move.create(req.body)
            res.json(move)
        } else {
            res.json("Invalid move")
        }
    }
    catch(error) {
        next(error)
    }
})

router.put('/:id', isAuthenticated, async (req,res, next) => {
    try {
        const game = await Game.findById(req.body.game)
        if(req.body.player === 'white' && req.body.y === game.boardSize) {
            await Game.findByIdAndUpdate(req.body.game, {status: 'white', duration:req.body.time})
        }
        if(req.body.player === 'black' && req.body.y === 1) {
            await Game.findByIdAndUpdate(req.body.game, {status: 'black', duration:req.body.time})
        }
        res.status(200).json(game)
    }
    catch(error) {
        next(error)
    }
})

module.exports = router