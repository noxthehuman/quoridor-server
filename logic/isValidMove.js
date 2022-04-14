const Game = require('../models/Game.model');
const Move = require('../models/Move.model')

async function isValidMove(move) {
    return (
    isPlayerTurn(move) 
    && isOrderCorrect(move)
    && isInRange(move)
    && canUseWall(move)
    && isWallPositionFree(move)
    && isMoveReachable(move)
    && isPositionFree(move)
    && dontCrossWall(move)
    && isJumpValid(move)
    )
}

async function isPlayerTurn(move) {
    const {order, player, game} = move;
    const previousMove = await Move.findOne({order: order-1, game: game});
    return !(player === previousMove.player);
}

async function isOrderCorrect(move) {
    const {order, game} = move;
    const lastAction = await Move.findOne({game: game}).sort({order: -1});
    return (order === lastAction.order + 1);
}

async function isInRange(move) {
    const {x, y, action, game} = move;
    const size = await Game.findOne({game: game}).boardsize;
    switch (action) {
        case "move":
            return (x >= 1 && x <= size && y >= 1 && y <= size);
        case "horizontal": case "vertical":
            return (x >= 1 && x < size && y >= 1 && y < size);
        default:
            return 1;
    }
}

async function canUseWall(move) {
    const {action, player, game} = move;
    if (action === ("horizontal" || "vertical")) {
        const availableWalls = await Game.findOne({game: game}).walls;
        const playerWalls = await Move.findAll({action: ("horizontal" || "vertical"), player: player, game: game});
        return (playerWalls.length <= availableWalls);
    }
    return 1;
}

function isAdjacent(x,y) {
    return (x === y - 1 || x === y || x === y + 1)
}

async function isWallPositionFree(move) {
    const {x,y, action, game} = move;
    if (action === "horizontal" ) {
        const playedWalls = await Move.findAll({action: ("horizontal" || "vertical"), game: game});
        playedWalls.forEach(wall => {
            if (y === wall.y) {
                if (x === wall.x && wall.action === "vertical") {
                    return 0;
                }
                if (isAdjacent(x, wall.x) && wall.action === "horizontal") {
                    return 0;
                }
            }
        });
    };
    if (action === "vertical") {
        const playedWalls = await Move.findAll({action: ("horizontal" || "vertical"), game: game});
        playedWalls.forEach(wall => {
            if (x === wall.x) {
                if (y === wall.y && wall.action === "horizontal") {
                    return 0;
                }
                if (isAdjacent(y, wall.y) && wall.action === "vertical") {
                    return 0;
                }
            }
        });
    };
    return 1;
}

async function isMoveReachable(move) {
    const {x, y, action, player, game} = move;
    const lastMove = await Move.findOne({action: "move", player: player, game: game}).sort({order: -1});
    return (!(x === lastMove.x && y === lastMove.y) 
            && ((Math.abs(x-lastMove.x) < 2 && Math.abs(y-lastMove.y) < 2)
            || ((x === lastMove.x) && (Math.abs(y-lastMove.y) === 2))
            || ((y === lastMove.y) && (Math.abs(x-lastMove.x) === 2))))
}

async function isPositionFree(move) {
    const {x, y, action, player, game} = move;
    const opponent = (player === white) ? "black" : "white";
    const lastOpponentMove = await Move.findOne({action: "move", player: opponent, game: game}).sort({order: -1});
    return (!(x === lastOpponentMove.x && y === lastOpponentMove.y))
}


async function dontCrossWall(move) {
    const {x, y, action, player, game} = move;
    let wall;
    const lastMove = await Move.findOne({action: "move", player: player, game: game}).sort({order: -1});
    switch (true) {
        case (x === lastMove.x - 1  && y === lastMove.y):
            wall = await Move.findOne({x: x, y: (y || y - 1), action: ("vertical"), game: game});
            return (wall === null);   
        case (x === lastMove.x + 1 && y === lastMove.y):
            wall = await Move.findOne({x: x - 1, y: (y || y - 1), action: ("vertical"), game: game});
            return (wall === null);   
        case (x === lastMove.x && y === lastMove.y + 1):
            wall = await Move.findOne({x: (x || x - 1), y: y - 1, action: ("horizontal"), game: game});
            return (wall === null);
        case (x === lastMove.x && y === lastMove.y - 1):
            wall = await Move.findOne({x: (x || x - 1), y: y, action: ("horizontal"), game: game});
            return (wall === null);
      default:
            return 1;
    }
}

async function isJumpValid(move) {
    return 1;
}




