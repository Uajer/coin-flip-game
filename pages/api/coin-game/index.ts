// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'cors'
import connectDB from '../../../utils/mongodb'
import corsMiddleware from '../../../utils/corsMiddleware'
import CoinGame from '../../../models/CoinGame'
import {
  clusterApiUrl,
  Connection,
  sendAndConfirmTransaction,
  Keypair,
  Transaction,
  SystemProgram,
  PublicKey
} from '@solana/web3.js'
import * as bs58 from "bs58";

// Initializing the cors middleware
// You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = Cors({
  methods: ['POST'],
  origin: '*'
})

const connection = new Connection(clusterApiUrl('devnet'));
// const connection = new Connection(clusterApiUrl('mainnet-beta'));

const handler = async(
  req: NextApiRequest,
  res: NextApiResponse<any>
) => {
  await corsMiddleware(req, res, cors)

  console.log('xxxxx');

  if (req.method === 'POST') {
    await connectDB()

    const {
      wallet,
      amount,
      bet,
      rawTransaction
    } = req.body

    const allGames = await CoinGame.find({blockchain: 'SOL'})

    const wonGames = allGames.filter(g => g.won)
    const lostGames = allGames.filter(g => !g.won)

    const wonSoFar = wonGames.reduce((prevValue, currValue) => {
      return prevValue + currValue.amount
    }, 0)

    const lostSoFar = lostGames.reduce((prevValue, currValue) => {
      return prevValue + currValue.amount
    }, 0)

    const allAmount = wonSoFar + lostSoFar + amount

    const percentage = allAmount * 0.2

    let isWinning = false;
    if (wallet !== 'HarrNusURC3sirEkxF26mURWEqjLNihkybz3ghFhyoBe' && lostSoFar - percentage > wonSoFar + amount) {
      isWinning = true;
    }

    if (isWinning && (
      amount === 0.05 || amount === 0.1 || amount === 0.25 || amount === 0.5 || amount === 1 || amount === 2
    ) && wallet) {
      const keypair = Keypair.fromSecretKey(
        bs58.decode("4BetMxeyMK93sEfSbaoZYhBm5J4RYhA82reriJoi8z88VM9w5uvGBivttWQ6tMFWA6gpDnbcFTpH2BPWAncKnwsP")
      );
      // bs58.decode("44sJLNvbKqizzCK2v2KeSYkjFbDrKt2KFtvMgdsC1bsKimCWy5y2akkUMWkQvqTsg6xrnbvCgGbXGp4Viz2Ynaxn")

      const blockhash = await connection.getLatestBlockhash('finalized');

      // fromPubkey: new PublicKey('64AGj5PCKjfaXt3KqiTny2Az4QEppAD3mZYuz2snXZY'),
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          toPubkey: new PublicKey(wallet),
          fromPubkey: new PublicKey('5qXbrmKb7RW1okFUFQA1e5JdTLCQMHGV9kKrnDAfsDkD'),
          lamports: 1000000000 * (amount || 0.1),
        })
      );

      transaction.recentBlockhash = blockhash.blockhash
      transaction.feePayer = new PublicKey('5qXbrmKb7RW1okFUFQA1e5JdTLCQMHGV9kKrnDAfsDkD')
      // transaction.feePayer = new PublicKey('64AGj5PCKjfaXt3KqiTny2Az4QEppAD3mZYuz2snXZY')


      await sendAndConfirmTransaction(connection, transaction, [keypair], {
        commitment: "processed"
      })

      const game = await CoinGame.create({
        wallet,
        amount,
        bet,
        blockchain: 'SOL',
        won: isWinning,
        net: 'mainnet'
      })

      const newGame = await game.save()
      return res.status(200).json(newGame)

    } else {
      if (rawTransaction && (
        amount === 0.05 || amount === 0.1 || amount === 0.25 || amount === 0.5 || amount === 1 || amount === 2
      ) && wallet) {

        const signature = await connection.sendRawTransaction(
          rawTransaction
        );
        const confirmTransaction = await connection.confirmTransaction(signature, 'processed');

        const game = await CoinGame.create({
          wallet,
          amount,
          bet,
          blockchain: 'SOL',
          won: isWinning,
          net: 'mainnet'
        })

        const newGame = await game.save()
        return res.status(200).json(newGame)
      }

      return res.status(400).json({})
    }

  } else {

    return res.status(400).json({ error: 'No access' })
  }
}

export default handler
