const { Schema, model } = require("mongoose");

const moveSchema = new Schema(
  {
    x: {type: Number, min: 1, max: 9},
    y: {type: Number, min: 1, max: 9},
    action: {type: String, enum: ['move', 'horizontal', 'vertical', 'resign']},
    order: {type: Number},
    player: {type: String, enum: ['white', 'black']},
    game: {type: Schema.Types.ObjectId, ref: 'Game'}
  },
  {
    timestamps: true,
  }
);

const Move = model("Move", moveSchema);
module.exports = Move;
