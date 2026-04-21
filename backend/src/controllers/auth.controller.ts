import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await registerUser(username, password);

    res.status(201).json({
      message: "User registered",
      userId: user._id,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const { token } = await loginUser(username, password);

    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};