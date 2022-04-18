const Game = require('../models/Game.model');
const Move = require('../models/Move.model');

async function isValidMove(move) {
    if (move.action === "move") {
        return (
            // await isPlayerTurn(move) 
            // && await isOrderCorrect(move)
            await isInRange(move)
            && await isMoveReachable(move)
            // && await isPositionFree(move)
            // && await dontCrossWall(move)
            // && await isJumpValid(move)
        );
    }
    if (move.action === "horizontal" || move.action === "vertical") {
        return (
            // await isPlayerTurn(move) 
            // && await isOrderCorrect(move)
            await isInRange(move)
            // && await canUseWall(move)
            // && await isWallPositionFree(move)
        );
    }
    return 1;
}

async function isPlayerTurn(move) {
    const {order, player, game} = move;
    if (order === 1) {return};
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
    const {boardSize} = await Game.findOne({game: game});
    switch (action) {
        case "move":
            return (x >= 1 && x <= boardSize && y >= 1 && y <= boardSize);
        case "horizontal": case "vertical":
            return (x >= 1 && x < boardSize && y >= 1 && y < boardSize);
        default:
            return 1;
    }
}

async function canUseWall(move) {
    const {player, game} = move;
    const availableWalls = await Game.findOne({game: game}).walls;
    const playerWalls = await Move.findAll({action: ("horizontal" || "vertical"), player: player, game: game});
    return (playerWalls.length <= availableWalls);
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
    const {x, y, player, game} = move;
    const lastMove = await Move.findOne({action: "move", player: player, game: game}).sort({order: -1});
    console.log("lastMove", lastMove)
    return (!(x === lastMove.x && y === lastMove.y) 
            && ((Math.abs(x-lastMove.x) < 2 && Math.abs(y-lastMove.y) < 2)
            || ((x === lastMove.x) && (Math.abs(y-lastMove.y) === 2))
            || ((y === lastMove.y) && (Math.abs(x-lastMove.x) === 2))))
}

async function isPositionFree(move) {
    const {x, y, player, game} = move;
    const opponent = (player === white) ? "black" : "white";
    const lastOpponentMove = await Move.findOne({action: "move", player: opponent, game: game}).sort({order: -1});
    return (!(x === lastOpponentMove.x && y === lastOpponentMove.y))
}

async function dontCrossWall(move) {
    const {x, y, player, game} = move;
    const lastMove = await Move.findOne({action: "move", player: player, game: game}).sort({order: -1});
    let wall;
    if (isAdjacent(x,lastMove.x) && y === lastMove.y + 1) {
        wall = await Move.findOne({x: (x || x - 1), y: y - 1, action: ("horizontal"), game: game});
    } else if (isAdjacent(x,lastMove.x) && y === lastMove.y - 1) {
        wall = await Move.findOne({x: (x || x - 1), y: y, action: ("horizontal"), game: game});
    } else if (x === lastMove.x - 1  && isAdjacent(y,lastMove.y)) {
        wall = await Move.findOne({x: x, y: (y || y - 1), action: ("vertical"), game: game});
    } else if (x === lastMove.x + 1 && isAdjacent(y,lastMove.y)) {
        wall = await Move.findOne({x: x - 1, y: (y || y - 1), action: ("vertical"), game: game});
    }   
    return (wall === null);   
}

async function validStraightJump(move) {
    const lastPos = await Move.findOne({action: "move", player: move.player, game: move.game}).sort({order: -1});
    const opponent = (move.player === white) ? "black" : "white";
    const advPos = await Move.findOne({action: "move", player: opponent, game: move.game}).sort({order: -1});
    let wall;
    if (advPos.x === lastPos.x && advPos.x === move.x && advPos.y === lastPos.y + 1 && advPos.y === move.y - 1) {
        wall = await Move.findOne({x: (advPos.x || advPos.x - 1), y: (advPos.y || advPos.y - 1), action: "horizontal", game: move.game});
    } else if (advPos.x === lastPos.x + 1 && advPos.x === move.x - 1 && advPos.y === lastPos.y && advPos.y === move.y) {
        wall = await Move.findOne({x: (advPos.x || advPos.x - 1), y: (advPos.y || advPos.y - 1), action: "vertical", game: move.game});
    } else if (advPos.x === lastPos.x && advPos.x === move.x && advPos.y === lastPos.y - 1 && advPos.y === move.y + 1) {
        wall = await Move.findOne({x: (advPos.x || advPos.x - 1), y: (advPos.y || advPos.y - 1), action: "horizontal", game: move.game});
    } else if (advPos.x === lastPos.x && advPos.x === move.x && advPos.y === lastPos.y - 1 && advPos.y === move.y + 1) {
        wall = await Move.findOne({x: (advPos.x || advPos.x - 1), y: (advPos.y || advPos.y - 1), action: "vertical", game: move.game});
    }   
    return (wall === null);   
}

function configuration(lastX, lastY, currentX, currentY, opponentX, opponentY, direction) {
    return (currentX === lastX && opponentY === lastY + direction 
        && opponentY === currentY && (currentX === currentX - 1 || currentX === currentX + 1))
}

async function validSideJump(move) {
    const {boardSize} = await Game.findOne({game: game});
    const lastPosition = await Move.findOne({action: "move", player: move.player, game: move.game}).sort({order: -1});
    const opponent = (move.player === white) ? "black" : "white";
    const opponentPosition = await Move.findOne({action: "move", player: opponent, game: move.game}).sort({order: -1});
    let wall;
    if (configuration(lastPosition.x, lastPosition.y, move.x, move.y, opponentPosition.x, opponentPosition.y, 1)) {
        wall = await Move.findOne({x: (opponentPosition.x || opponentPosition.x - 1), y: opponentPosition.y , action: "horizontal", game: move.game});
        return (wall || opponent.y === boardSize);
    } else if (configuration(lastPosition.y, lastPosition.x, move.y, move.x, opponentPosition.y, opponentPosition.x, 1)) {
        wall = await Move.findOne({x: opponentPosition.x, y: (opponentPosition.y || opponentPosition.y - 1) , action: "vertical", game: move.game});
        return (wall || opponent.x === boardSize);
    } else if (configuration(lastPosition.x, lastPosition.y, move.x, move.y, opponentPosition.x, opponentPosition.y, -1)) {
        wall = await Move.findOne({x: (opponentPosition.x || opponentPosition.x - 1), y: opponentPosition.y - 1, action: "horizontal", game: move.game});
        return (wall || opponent.y === 1);
    } else if (configuration(lastPosition.y, lastPosition.x, move.y, move.x, opponentPosition.y, opponentPosition.x, -1))  {
        wall = await Move.findOne({x: opponentPosition.x - 1, y: (opponentPosition.y || opponentPosition.y - 1) , action: "vertical", game: move.game});
        return (wall || opponent.x === 1);
    }   
    return 1;
}

async function isJumpValid(move) {
    return (validSideJump(move) || validSraightJump(move));
}

module.exports = {isValidMove}