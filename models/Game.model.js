const { Schema, model } = require("mongoose");

const gameSchema = new Schema(
  {
    white: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    black: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    boardSize: {type: Number, default: 9},
    walls: {type: Number, default: 10},
    duration: {type: String, default: '0'},
    status: {type: String, enum: ['white', 'black', 'draw', 'pending'], default: 'pending'}
  },
  {
    timestamps: true,
  }
);

const Game = model("Game", gameSchema);
module.exports = Game;
