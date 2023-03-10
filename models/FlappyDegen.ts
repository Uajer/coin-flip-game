import {Schema, model, models} from 'mongoose';

const flappyDegenUserSchema = new Schema({
  username: {
    required: true,
    type: String
  },
  score: {
    required: true,
    type: Number
  }
})

const FlappyDegenUser = models.FlappyDegenUser || model('FlappyDegenUser', flappyDegenUserSchema)

export default FlappyDegenUser