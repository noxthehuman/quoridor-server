const Game = require('../models/Game.model');
const Move = require('../models/Move.model');

function startPos(player, boardSize) {
    return (player === "white" ? {x: boardSize - ~~(.5 * boardSize), y: 1} : {x: ~~(.5 * boardSize) + 1, y: boardSize});
}

async function isValidMove(move) {
    if (!(await isPlayerTurn(move) && await isOrderCorrect(move))) {
        return (0);
    }
    const {boardSize} = await Game.findById(move.game);
    if (!isInRange(move, boardSize)) {
        return (0);
    }
    if (move.action === "move") {
        const Pos = await Move.findOne({action: "move", player: move.player, game: move.game}).sort({order: -1}) || startPos(move.player, boardSize);
        const opponent = (move.player === "white") ? "black" : "white";
        const oppPos = await Move.findOne({action: "move", player: opponent, game: move.game}).sort({order: -1}) || startPos(opponent, boardSize);
        console.log("player", Pos)
        console.log("opponent", oppPos)
        return (1 
            && isMoveReachable(move, boardSize, Pos)
            && isPositionFree(move, oppPos)
            // && await dontCrossWall(move, Pos)
            && await isStraightJumpValid(move, Pos, oppPos)
            && await isSideJumpValid(move, boardSize, Pos, oppPos)
        );
    }
    if (move.action === "horizontal" || move.action === "vertical") {
        return (1
            && await canUseWall(move)
            // && await isWallPositionFree(move)
        );
    }
    return 1;
}

async function isPlayerTurn(move) {
    const {order, player, game} = move;
    if (order === 1) {return 1};
    const previousAction = await Move.findOne({order: order-1, game: game});
    return !(player === previousAction.player);
}

async function isOrderCorrect(move) {
    const {order, game} = move;
    if (order === 1) {return 1};
    const lastAction = await Move.findOne({game: game}).sort({order: -1});
    console.log('last move', lastAction)
    return (order === lastAction.order + 1);
}

function isInRange(move, boardSize) {
    const {x, y, action, game} = move;

    switch (action) {
        case "move":
            return (x >= 1 && x <= boardSize && y >= 1 && y <= boardSize);
        case "horizontal": case "vertical":
            return (x >= 1 && x < boardSize && y >= 1 && y < boardSize);
        default:
            return (1);
    }
}

function isMoveReachable(move, boardSize, Pos) {
    console.log("Pos", Pos)
    return (!(move.x === Pos.x && move.y === Pos.y) 
            && ((Math.abs(move.x-Pos.x) < 2 && Math.abs(move.y-Pos.y) < 2)
            || ((move.x === Pos.x) && (Math.abs(move.y-Pos.y) === 2))
            || ((move.y === Pos.y) && (Math.abs(move.x-Pos.x) === 2))))
}

function isPositionFree(move, oppPos) {
    return (!(move.x === oppPos.x && move.y === oppPos.y))
}

function isAdjacent(x,y) {
    return (x === y - 1 || x === y || x === y + 1)
}

async function dontCrossWall(move, Pos) {
    let wall;
    if (isAdjacent(move.x, Pos.x) && move.y === Pos.y + 1) {
        wall = await Move.findOne({x: (move.x || move.x - 1), y: move.y - 1, action: "horizontal", game: move.game});
    } else if (isAdjacent(move.x, Pos.x) && move.y === Pos.y - 1) {
        wall = await Move.findOne({x: (move.x || move.x - 1), y: move.y, action: "horizontal", game: move.game});
    } else if (move.x === Pos.x - 1  && isAdjacent(move.y, Pos.y)) {
        wall = await Move.findOne({x: move.x, y: (move.y || move.y - 1), action: "vertical", game: move.game});
    } else if (move.x === Pos.x + 1 && isAdjacent(move.y, Pos.y)) {
        wall = await Move.findOne({x: move.x - 1, y: (move.y || move.y - 1), action: "vertical", game: move.game});
    }   
    console.log("wall", wall)
    return (wall === null);   
}

async function isStraightJumpValid(move, Pos, oppPos) {
    let wall;
    if (move.x === Pos.x && move.y === Pos.y + 2) {
        wall = await Move.findOne({x: (oppPos.x || oppPos.x - 1), y: (oppPos.y || oppPos.y - 1), action: "horizontal", game: move.game});
        return (oppPos.x === Pos.x && oppPos.y === Pos.y + 1 && !wall);
    } else if (move.x === Pos.x + 2 && move.y === Pos.y) {
        wall = await Move.findOne({x: (oppPos.x || oppPos.x - 1), y: (oppPos.y || oppPos.y - 1), action: "vertical", game: move.game});
        return (oppPos.x === Pos.x + 1 && oppPos.y === Pos.y && !wall);
    } else if (move.x === Pos.x && move.y === Pos.y - 2) {
        wall = await Move.findOne({x: (oppPos.x || oppPos.x - 1), y: (oppPos.y || oppPos.y - 1), action: "horizontal", game: move.game});
        return (oppPos.x === Pos.x && oppPos.y === Pos.y - 1 && !wall);
    } else if (move.x === Pos.x - 2 && move.y === Pos.y) {
        wall = await Move.findOne({x: (oppPos.x || oppPos.x - 1), y: (oppPos.y || oppPos.y - 1), action: "vertical", game: move.game});
        return (oppPos.x === Pos.x - 1 && oppPos.y === Pos.y && !wall);
    } else {return 1};
}

function configuration(lastX, lastY, currentX, currentY, opponentX, opponentY, direction) {
    return (currentX === lastX && opponentY === lastY + direction 
        && opponentY === currentY && (currentX === currentX - 1 || currentX === currentX + 1))
}

async function isSideJumpValid(move, boardSize, Pos, oppPos) {
    let wall;
    if ((move.x === Pos.x - 1 || move.x === Pos.x + 1) && move.y === Pos.y + 1) {
        wall = await Move.findOne({x: (oppPos.x || oppPos.x - 1), y: oppPos.y, action: "horizontal", game: move.game});
        console.log("1",wall)
        return (oppPos.x === Pos.x && oppPos.y === Pos.y + 1 && (wall || oppPos.y === boardSize));
    } else if (move.x === Pos.x + 1 && (move.y === Pos.y - 1 || move.y === Pos.y + 1)) {
        wall = await Move.findOne({x: oppPos.x, y: (oppPos.y || oppPos.y - 1), action: "vertical", game: move.game});
        console.log("2", oppPos.x === Pos.x + 1 && oppPos.y === Pos.y && (wall || oppPos.x === boardSize))
        console.log("2", oppPos.x === Pos.x + 1 && oppPos.y === Pos.y)
        console.log("2",wall)
        return (oppPos.x === Pos.x + 1 && oppPos.y === Pos.y && (wall || oppPos.x === boardSize));
    } else if  ((move.x === Pos.x - 1 || move.x === Pos.x + 1) && move.y === Pos.y - 1) {
        wall = await Move.findOne({x: (oppPos.x || oppPos.x - 1), y: oppPos.y - 1, action: "horizontal", game: move.game});
        console.log("3", oppPos.x === Pos.x && oppPos.y === Pos.y - 1 && (wall || oppPos.y === 1))
        return (oppPos.x === Pos.x && oppPos.y === Pos.y - 1 && (wall || oppPos.y === 1));
    } else if (move.x === Pos.x - 1 && (move.y === Pos.y - 1 || move.y === Pos.y + 1)) {
        wall = await Move.findOne({x: oppPos.x - 1, y: (oppPos.y || oppPos.y - 1), action: "vertical", game: move.game});
        console.log("4",  wall)
        return (oppPos.x === Pos.x - 1 && oppPos.y === Pos.y && (wall || oppPos.x === 1));
    }  else {return 1};
}


// async function isSideJumpValid(move, boardSize, Pos, oppPos) {
//     let wall;
//     if ((move.x === Pos.x - 1 || move.x === Pos.x + 1) && move.y === Pos.y + 1 && oppPos.x === Pos.x && oppPos.y === Pos.y + 1) {
//         wall = await Move.findOne({x: (oppPos.x || oppPos.x - 1), y: oppPos.y, action: "horizontal", game: move.game});
//         console.log("1",wall)
//         return (wall || oppPos.y === boardSize);
//     } else if (move.x === Pos.x + 1 && (move.y === Pos.y - 1 || move.y === Pos.y + 1) && oppPos.x === Pos.x + 1 && oppPos.y === Pos.y) {
//         wall = await Move.findOne({x: oppPos.x, y: (oppPos.y || oppPos.y - 1), action: "vertical", game: move.game});
//         console.log("2", oppPos.x === Pos.x + 1 && oppPos.y === Pos.y && (wall || oppPos.x === boardSize))
//         console.log("2", oppPos.x === Pos.x + 1 && oppPos.y === Pos.y)
//         console.log("2",wall)
//         return (wall || oppPos.x === boardSize);
//     } else if  ((move.x === Pos.x - 1 || move.x === Pos.x + 1) && move.y === Pos.y - 1 && oppPos.x === Pos.x && oppPos.y === Pos.y - 1) {
//         wall = await Move.findOne({x: (oppPos.x || oppPos.x - 1), y: oppPos.y - 1, action: "horizontal", game: move.game});
//         console.log("3", oppPos.x === Pos.x && oppPos.y === Pos.y - 1 && (wall || oppPos.y === 1))
//         return (wall || oppPos.y === 1);
//     } else if (move.x === Pos.x - 1 && (move.y === Pos.y - 1 || move.y === Pos.y + 1) && oppPos.x === Pos.x - 1 && oppPos.y === Pos.y) {
//         wall = await Move.findOne({x: oppPos.x - 1, y: (oppPos.y || oppPos.y - 1), action: "vertical", game: move.game});
//         console.log("4",  wall)
//         return (wall || oppPos.x === 1);
//     }  else {return 1};
// }

async function canUseWall(move) {
    const {player, game} = move;
    const {walls} = await Game.findById(game);
    const playerWalls = await Move.find({action: ("horizontal" || "vertical"), player: player, game: game});
    return (playerWalls.length <= walls);
}

async function isWallPositionFree(move) {
    const {x, y, action, game} = move;
    const placedWalls = await Move.find({action: ("horizontal" || "vertical"), game: game});
    if (action === "horizontal" ) {
        placedWalls.forEach(wall => {
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
        placedWalls.forEach(wall => {
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


module.exports = {isValidMove}