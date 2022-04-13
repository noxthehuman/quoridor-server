async function isPlayerTurn(move) {
    const {order, player, game} = move;
    // if (order === 1) {return 1};
    const previousMove = await Move.findOne({order: order-1, game: game});
    return !(player === previousMove.player);
}

async function isOrderCorrect(move) {
    const {order, game} = move;
    const lastMove = await Move.findOne({game: game }).sort({order: -1});
    return (order === lastMove.order + 1);
}

async function isInRange(move) {
    const {x, y, action, game} = move;
    const size = await Game.findOne({game: game}).boardsize;
    switch (action) {
        case "move":
            return (x >= 1 && x <= size && y >= 1 && y <= size);
        case "horizontal":
            return (x >= 1 && x < size && y >= 1 && y < size);
        case "vertical":
            return (x >= 1 && x < size && y >= 1 && y < size);
        default:
            return 1;
    }
}


