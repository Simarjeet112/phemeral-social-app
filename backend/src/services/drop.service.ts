import Drop from "../models/Drop";

export const createDrop = async (
  userId: string,
  text: string,
  image: string,
  durationMinutes: number,
  maxSize: number
) => {
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

  const drop = await Drop.create({
    content: { text, image },
    createdBy: userId,
    expiresAt,
    maxSize,
  });

  return drop;
};

export const getActiveDrops = async () => {
  const now = new Date();

  const drops = await Drop.find({ expiresAt: { $gt: now } })
    .populate("createdBy", "username")
    .sort({ createdAt: -1 })
    .limit(20);

  return drops;
};