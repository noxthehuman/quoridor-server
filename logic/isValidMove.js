const Game = require('../models/Game.model');
const Move = require('../models/Move.model')

async function isValidMove(move){
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
    const boardsize = await Game.findOne({game: game}).boardsize;
    switch (action) {
        case "move":
            return (x >= 1 && x <= boardsize && y >= 1 && y <= boardsize);
        case "horizontal": case "vertical":
            return (x >= 1 && x < boardsize && y >= 1 && y < boardsize);
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

function validJump(lastX, lastY, currentX, currentY, opponentX, opponentY, wall, direction, boardsize) {
    return ((currentX === lastX && opponentY === lastY + direction)
        && (opponentY === currentY && (currentX === currentX - 1 || currentX === currentX + 1))
        && (wall || opponentY === (direction === 1) ? boardsize : 1))
}

async function isJumpValid(move) {
    if (move.action !== "move")
        return 1;
    const boardsize = await Game.findOne({game: move.game}).boardsize;
    const lastPosition = await Move.findOne({action: "move", player: move.player, game: move.game}).sort({order: -1});
    const opponent = (move.player === white) ? "black" : "white";
    const opponentPosition = await Move.findOne({action: "move", player: opponent, game: move.game}).sort({order: -1});
    const horizontalWall = await Move.findOne({x: (opponentPosition.x || opponentPosition.x + 1), y: opponentPosition.y , action: "horizontal", game: move.game});
    const verticalWall = await Move.findOne({x: opponentPosition.x, y: (opponentPosition.y || opponentPosition.y + 1) , action: "vertical", game: move.game});
    return (validJump(lastPosition.x, lastPosition.y, move.x, move.y, opponentPosition.x, opponentPosition.y, horizontalWall, 1, boardsize)
        || validJump(lastPosition.y, lastPosition.x, move.y, move.x, opponentPosition.y, opponentPosition.x, verticalWall, 1, boardsize)
        || validJump(lastPosition.x, lastPosition.y, move.x, move.y, opponentPosition.x, opponentPosition.y, horizontalWall, -1, boardsize)
        || validJump(lastPosition.y, lastPosition.x, move.y, move.x, opponentPosition.y, opponentPosition.x, verticalWall, -1, boardsize)
    )
}

module.exports = {isValidMove}