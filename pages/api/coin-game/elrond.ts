// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'cors'
import connectDB from '../../../utils/mongodb'
import corsMiddleware from '../../../utils/corsMiddleware'
import CoinGame from '../../../models/CoinGame'
import { ApiNetworkProvider } from "@elrondnetwork/erdjs-network-providers";
import { Transaction, TransactionPayload, Address, TokenPayment, Account } from "@elrondnetwork/erdjs";
import { Mnemonic, UserSigner } from '@elrondnetwork/erdjs-walletcore'

// Initializing the cors middleware
// You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = Cors({
  methods: ['POST'],
  // origin: '*'
})

const handler = async(
  req: NextApiRequest,
  res: NextApiResponse<any>
) => {
  console.log('log');
  console.log(req.body);
  await corsMiddleware(req, res, cors)
  console.log('xxxx',req.body);
  if (req.method === 'POST') {
    await connectDB()
    const {
      wallet,
      amount,
      bet,
      transaction
    } = req.body
    const allGames = await CoinGame.find({ blockchain: 'EGLD' })

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
    if (lostSoFar - percentage > wonSoFar + amount) {
      isWinning = true;
    }

    // const networkProvider = new ApiNetworkProvider("https://api.elrond.com");
    const networkProvider = new ApiNetworkProvider("https://devnet-api.elrond.com");

    if (isWinning) {
      const networkConfig = await networkProvider.getNetworkConfig();

      // const mnemonicKey = Mnemonic.fromString("color hover palm enhance skill decorate need swift wife cliff vanish great hello solve impulse nature increase gossip dynamic action frozen churn nothing fragile")
      const mnemonicKey = Mnemonic.fromString("feel skin good work math orbit lyrics burger fog hurdle scrub payment ghost acid leader flight loud stock health during again rocket enlist fiscal")
      const privateKey = mnemonicKey.deriveKey()

      const user = new UserSigner(privateKey)
      const data = new TransactionPayload("flip coin")

      // const senderAddress = new Address("erd1n63y70nsmh6hr9dde9spz4tk2gf42vskhus54mkc0unp4ssjt95s5zw6g4");
      const senderAddress = new Address("erd12l9glhqgz6qejznv2hed8j8yuat5k4lrjn9n8yqjlwswgcsyd6jqvyc33z");
      const sender = new Account(senderAddress);
      const senderOnNetwork = await networkProvider.getAccount(senderAddress);
      sender.update(senderOnNetwork);
      console.log(sender)
      const tx = new Transaction({
        nonce: Number(sender.nonce),
        data: data,
        gasLimit: networkConfig.MinGasLimit + (data.length() * networkConfig.GasPerDataByte),
        receiver: new Address(wallet),
        sender: senderAddress,
        value: TokenPayment.egldFromAmount(amount),
        chainID: networkConfig.ChainID,
        gasPrice: networkConfig.MinGasPrice,
      });

      user.sign(tx)

      const txHash = await networkProvider.sendTransaction(tx);
      console.log('won' , txHash);

      const game = await CoinGame.create({
        wallet,
        amount,
        bet,
        blockchain: 'EGLD',
        won: isWinning,
        net: 'mainnet'
      })

      const newGame = await game.save()

      return res.status(200).json(newGame)
    } else {
      console.log(transaction);
      const data = new TransactionPayload("Flip coin")
      const receiverAddress = new Address("erd10zemyy2hnlh93wxd7sxz0z5p6e5u42wmqdrvka8jf293r6yjk4asfk7mv9");

      const tx = new Transaction({
        nonce: transaction.nonce,
        data: data,
        gasLimit: transaction.gasLimit,
        receiver: receiverAddress,
        sender: new Address(transaction.sender),
        value: transaction.value,
        chainID: transaction.chainID,
        gasPrice: transaction.gasPrice,
        version: transaction.version,
      });

      tx.applySignature({hex: () => transaction.signature}, new Address(transaction.sender))

      const txHash = await networkProvider.sendTransaction(tx);

      console.log('loose' , txHash);

      if (txHash) {
        const game = await CoinGame.create({
          wallet,
          amount,
          bet,
          blockchain: 'EGLD',
          won: isWinning,
          net: 'mainnet'
        })

        const newGame = await game.save()
        return res.status(200).json(newGame)
      } else {
        return res.status(200).json({})
      }
    }

  } else {

    return res.status(400).json({ error: 'No access' })
  }
}

export default handler
