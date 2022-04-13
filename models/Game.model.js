const { Schema, model } = require("mongoose");

const gameSchema = new Schema(
  {
    white: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    black: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    boardsize: {type: Number, default: 9},
    walls: {type: Number, default: 10},
    status: {type: String, enum: ['win','loss', 'draw', 'undefined'], default: 'undefined'}
  },
  {
    timestamps: true,
  }
);

const Game = model("Game", gameSchema);
module.exports = Game;
