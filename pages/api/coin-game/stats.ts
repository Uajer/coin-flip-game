// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'cors'
import connectDB from '../../../utils/mongodb'
import corsMiddleware from '../../../utils/corsMiddleware'
import CoinGame from '../../../models/CoinGame'

// Initializing the cors middleware
// You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = Cors({
  methods: ['GET'],
  origin: '*'
})

const handler = async(
  req: NextApiRequest,
  res: NextApiResponse<any>
) => {
  await corsMiddleware(req, res, cors)

  if (req.method === 'GET') {
    await connectDB()

    const { blockchain } = req.query;


    const games = await CoinGame.find({ blockchain }).sort('-createdAt').limit(10)

    return res.status(200).json({ games })
  } else {

    return res.status(400).json({ error: 'No access' })
  }
}

export default handler
