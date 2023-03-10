import { Schema, model, models } from 'mongoose';

const coinGameSchema = new Schema({
  amount: {
    required: true,
    type: Number
  },
  wallet: {
    required: true,
    type: String
  },
  won: {
    type: Boolean,
    default: false
  },
  bet: {
    required: true,
    type: String // HEADS or TAILS
  },
  blockchain: {
    required: true,
    type: String // SOL or EGLD
  },
  net: {
    type: String
  }
}, { timestamps: true });

const CoinGame = models.CoinGame || model('CoinGame', coinGameSchema);

export default CoinGame;