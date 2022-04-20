const Game = require('../models/Game.model');
const Move = require('../models/Move.model');

function startPos(player, boardSize) {
    return (player === "white" ? 
    {x: boardSize - ~~(.5 * boardSize), y: 1} 
    : {x: ~~(.5 * boardSize) + 1, y: boardSize});
}

async function isValidMove(move) {
    if (!(await isPlayerTurn(move) && await isOrderCorrect(move))) {return 0};
    const {boardSize} = await Game.findById(move.game);
    if (!isInRange(move, boardSize)) {return 0};
    if (move.action === "move") {
        const opponent = (move.player === "white") ? "black" : "white";
        const Pos = await Move.findOne({action: "move", player: move.player, game: move.game}).sort({order: -1}) || startPos(move.player, boardSize);
        const oppPos = await Move.findOne({action: "move", player: opponent, game: move.game}).sort({order: -1}) || startPos(opponent, boardSize);
        return (isMoveReachable(move, boardSize, Pos) && isPositionFree(move, oppPos)
            && await dontCrossWall(move, Pos)
            && await isStraightJumpValid(move, Pos, oppPos)
            && await isSideJumpValid(move, boardSize, Pos, oppPos));
    }
    if (move.action === "horizontal" || move.action === "vertical") {
        let test = await isWallPositionFree(move)
        return (await canUseWall(move) && await isWallPositionFree(move));
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
    if (move.x ===  Pos.x && move.y === Pos.y + 1) {
        wall = await Move.findOne({x: [Pos.x, Pos.x - 1], y: Pos.y, action: "horizontal", game: move.game});
    } else if (move.x === Pos.x && move.y === Pos.y - 1) {
        wall = await Move.findOne({x: [Pos.x, Pos.x - 1], y: Pos.y - 1, action: "horizontal", game: move.game});
    } else if (move.x === Pos.x - 1  && move.y === Pos.y) {
        wall = await Move.findOne({x: Pos.x - 1, y: [Pos.y, Pos.y - 1], action: "vertical", game: move.game});
    } else if (move.x === Pos.x + 1 && move.y === Pos.y) {
        wall = await Move.findOne({x: Pos.x, y: [Pos.y, Pos.y - 1], action: "vertical", game: move.game});
    } return (!wall);   
}

async function isStraightJumpValid(move, Pos, oppPos) {
    let wall;
    if (move.x === Pos.x && move.y === Pos.y + 2) {
        wall = await Move.findOne({x: [oppPos.x, oppPos.x - 1], y: [oppPos.y, oppPos.y - 1], action: "horizontal", game: move.game});
        return (oppPos.x === Pos.x && oppPos.y === Pos.y + 1 && !wall);
    } else if (move.x === Pos.x + 2 && move.y === Pos.y) {
        wall = await Move.findOne({x: [oppPos.x, oppPos.x - 1], y: [oppPos.y, oppPos.y - 1], action: "vertical", game: move.game});
        return (oppPos.x === Pos.x + 1 && oppPos.y === Pos.y && !wall);
    } else if (move.x === Pos.x && move.y === Pos.y - 2) {
        wall = await Move.findOne({x: [oppPos.x, oppPos.x - 1], y: [oppPos.y, oppPos.y - 1], action: "horizontal", game: move.game});
        return (oppPos.x === Pos.x && oppPos.y === Pos.y - 1 && !wall);
    } else if (move.x === Pos.x - 2 && move.y === Pos.y) {
        wall = await Move.findOne({x: [oppPos.x, oppPos.x - 1], y: [oppPos.y, oppPos.y - 1], action: "vertical", game: move.game});
        return (oppPos.x === Pos.x - 1 && oppPos.y === Pos.y && !wall);
    } else {return 1};
}

async function isSideJumpValid(move, boardSize, Pos, oppPos) {
    if ((move.x !== Pos.x - 1 && move.x !== Pos.x + 1) || (move.y !== Pos.y - 1 && move.y !== Pos.y + 1)) {return 1};
    if (oppPos.x === Pos.x && oppPos.y === Pos.y + 1) {
        let frontWall = await Move.findOne({x: [oppPos.x, oppPos.x - 1], y: oppPos.y, action: "horizontal", game: move.game});
        let sideWall = await Move.findOne({x: Pos.x - (move.x === Pos.x - 1), y: [Pos.y, Pos.y + 1], action: "vertical", game: move.game});
        return (!sideWall && (frontWall || oppPos.y === boardSize));
    } else if (oppPos.x === Pos.x + 1 && oppPos.y === Pos.y) {
        let frontWall = await Move.findOne({x: oppPos.x, y: [oppPos.y, oppPos.y - 1], action: "vertical", game: move.game});
        let sideWall = await Move.findOne({x: [Pos.x, Pos.x + 1], y: Pos.y - (move.y === Pos.y - 1), action: "horizontal", game: move.game});
        return (!sideWall && (frontWall || oppPos.x === boardSize));
    } else if  (oppPos.x === Pos.x && oppPos.y === Pos.y - 1) {
        let wall = await Move.findOne({x: [oppPos.x, oppPos.x - 1], y: oppPos.y - 1, action: "horizontal", game: move.game});
        let sideWall = await Move.findOne({x: Pos.x - (move.x === Pos.x - 1), y: [Pos.y - 1, Pos.y - 2], action: "vertical", game: move.game});
        return (!sideWall && (wall || oppPos.y === 1));
    } else if (oppPos.x === Pos.x - 1 && oppPos.y === Pos.y) {
        let wall = await Move.findOne({x: oppPos.x - 1, y: [oppPos.y, oppPos.y - 1], action: "vertical", game: move.game});
        let sideWall = await Move.findOne({x: [Pos.x - 1, Pos.x - 2], y: Pos.y - (move.y === Pos.y - 1), action: "horizontal", game: move.game});
        return (!sideWall && (wall || oppPos.x === 1));
    }  else {return 0};
}

async function canUseWall(move) {
    const {player, game} = move;
    const {walls} = await Game.findById(game);
    const playerWalls = await Move.find({action: ["horizontal",  "vertical"], player: player, game: game});
    return (playerWalls.length <= walls);
}

async function isWallPositionFree(move) {
    const {x, y, action, game} = move;
    const placedWalls = await Move.find({action: ["horizontal", "vertical"], game: game});
    if (action === "horizontal") {
        return (!(placedWalls.reduce((n, wall) => (y === wall.y && ((x === wall.x && wall.action === "vertical") || (isAdjacent(x, wall.x) && wall.action === "horizontal")) ? n + 1 : n), 0)));
    }
    if (action === "vertical") {
        return (!(placedWalls.reduce((n, wall) => (x === wall.x && ((y === wall.y && wall.action === "horizontal") || (isAdjacent(y, wall.y) && wall.action === "vertical")) ? n + 1 : n), 0)));
    }
}

module.exports = {isValidMove}