import type { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import connectDB from "../../../utils/mongodb";
import corsMiddleware from "../../../utils/corsMiddleware";
import FlappyDegen from "../../../models/FlappyDegen";

const cors = Cors({
  methods: ["POST"],
  origin: "https://www.newdegenorder.com",
});

const handler = async (req: NextApiRequest, res: NextApiResponse<any>) => {
  await corsMiddleware(req, res, cors);

  if (req.method === "POST") {
    await connectDB();

    const { username, score } = req.body;

    const flappyUser = await FlappyDegen.create({
      username,
      score,
    });

    await flappyUser.save();

    return res.status(200).json(flappyUser);
  } else {
    return res.status(400).json({ error: "No access" });
  }
};

export default handler;
