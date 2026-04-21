import { User } from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (username: string, password: string) => {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        throw new Error("User already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    password: hashedPassword,
  });

  return user;
};
  
export const loginUser = async (username: string, password: string) => {
    const user = await User.findOne({ username });
  
    if (!user) {
      throw new Error("Invalid credentials");
    }
  
    const isMatch = await bcrypt.compare(password, user.password);
  
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }
  
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );
  
    return { user, token };
  };