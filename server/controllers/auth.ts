import { insertUserSchema } from "@shared/schema";
import { Request, Response } from "express";
import { z } from "zod";
import { storage } from "@server/storage";
import {
  AuthRequest,
  comparePassword,
  generateToken,
  hashPassword,
} from "@server/middlewares/auth";

export async function signUp(req: Request, res: Response) {
  const signupSchema = insertUserSchema.extend({
    password: z.string().min(6),
  });

  try {
    const validatedData = signupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User already exists with this email" });
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const user = await storage.createUser({
      ...validatedData,
      password: hashedPassword,
      provider: "email",
      isEmailVerified: false,
    });

    // Generate token
    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid input",
    });
  }
}

export async function login(req: Request, res: Response) {
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await storage.getUserByEmail(validatedData.email);
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await comparePassword(
      validatedData.password,
      user.password,
    );
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid input",
    });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  const user = req.user!;
  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  });
}

export async function logout(req: Request, res: Response) {
  // In a JWT system, logout is handled client-side by removing the token
  // We could maintain a blacklist but for simplicity, we'll just respond with success
  res.json({ message: "Logged out successfully" });
}

export async function loginGoogle(req: Request, res: Response) {
  res.status(501).json({ error: "Google OAuth not yet implemented" });
}

export async function loginApple(req: Request, res: Response) {
  res.status(501).json({ error: "Apple ID not yet implemented" });
}
