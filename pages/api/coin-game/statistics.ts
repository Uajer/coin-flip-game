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
  // origin: 'http://localhost:3000'
})

const handler = async(
  req: NextApiRequest,
  res: NextApiResponse<any>
) => {
  await corsMiddleware(req, res, cors)

  if (req.method === 'GET') {
    await connectDB()

    const { blockchain } = req.query;

    if (blockchain === 'SOL' || blockchain === 'EGLD') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayData = await CoinGame.find({ blockchain, createdAt: {$gte: startOfToday} })

      const todayVolume = todayData.reduce((prevValue, currValue) => {
        return prevValue + currValue.amount
      }, 0)

      const top24h = todayData.reduce((acc, currValue) => {
        if (currValue.won) {
          if (acc.winners[currValue.wallet]) {
            acc.winners[currValue.wallet] += currValue.amount
          } else {
            acc.winners[currValue.wallet] = currValue.amount
          }
          return acc
        } else {
          if (acc.lossers[currValue.wallet]) {
            acc.lossers[currValue.wallet] += currValue.amount
          } else {
            acc.lossers[currValue.wallet] = currValue.amount
          }
        }
        return acc
      }, {
        winners: {},
        lossers: {}
      })

      const winners24hKeys = Object.keys(top24h.winners)
      const lossers24hKeys = Object.keys(top24h.lossers)
      const topWinners24h = winners24hKeys.map(key => {
        return {
          wallet: key,
          amount: top24h.winners[key]
        }
      }).sort((a, b) => {
        return b.amount - a.amount;
      }).slice(0, 5)

      const topLossers24h = lossers24hKeys.map(key => {
        return {
          wallet: key,
          amount: top24h.lossers[key]
        }
      }).sort((a, b) => {
        return b.amount - a.amount;
      }).slice(0, 5)





      const allData = await CoinGame.find({ blockchain })
      const allVolume = allData.reduce((prevValue, currValue) => {
        return prevValue + currValue.amount
      }, 0)

      const topAllTime = allData.reduce((acc, currValue) => {
        if (currValue.won) {
          if (acc.winners[currValue.wallet]) {
            acc.winners[currValue.wallet] += currValue.amount
          } else {
            acc.winners[currValue.wallet] = currValue.amount
          }
          return acc
        } else {
          if (acc.lossers[currValue.wallet]) {
            acc.lossers[currValue.wallet] += currValue.amount
          } else {
            acc.lossers[currValue.wallet] = currValue.amount
          }
        }
        return acc
      }, {
        winners: {},
        lossers: {}
      })

      const winnersAllKeys = Object.keys(topAllTime.winners)
      const lossersAllKeys = Object.keys(topAllTime.lossers)
      const topWinnersAll = winnersAllKeys.map(key => {
        return {
          wallet: key,
          amount: topAllTime.winners[key]
        }
      }).sort((a, b) => {
        return b.amount - a.amount;
      }).slice(0, 5)

      const topLossersAll = lossersAllKeys.map(key => {
        return {
          wallet: key,
          amount: topAllTime.lossers[key]
        }
      }).sort((a, b) => {
        return b.amount - a.amount;
      }).slice(0, 5)

      const wonGames = allData.filter(g => g.won)
      const lostGames = allData.filter(g => !g.won)

      const wonSoFar = wonGames.reduce((prevValue, currValue) => {
        return prevValue + currValue.amount
      }, 0)

      const lostSoFar = lostGames.reduce((prevValue, currValue) => {
        return prevValue + currValue.amount
      }, 0)

      const difference = lostSoFar - wonSoFar

      return res.status(200).json({
        todayVolume,
        allVolume,
        daoProfit: difference * 0.77,
        topWinners24h,
        topLossers24h,
        topLossersAll,
        topWinnersAll
      })
    }

    return res.status(200).json({})
  } else {

    return res.status(400).json({ error: 'No access' })
  }
}

export default handler
