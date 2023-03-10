import type { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import connectDB from "../../../utils/mongodb";
import corsMiddleware from "../../../utils/corsMiddleware";
import FlappyDegen from "../../../models/FlappyDegen";

const cors = Cors({
  methods: ["POST"],
});

const handler = async (req: NextApiRequest, res: NextApiResponse<any>) => {
  await corsMiddleware(req, res, cors);
  await connectDB();

  if (req.method === "POST") {
    const { limit, page } = req.body;

    const flappyUsers = await FlappyDegen.find()
      .sort("-score")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await FlappyDegen.countDocuments();

    return res.status(200).json({
      flappyUsers,
      totalPages: Math.ceil(count / limit),
    });
  } else {
    return res.status(400).json({ error: "No access" });
  }
};

export default handler;
