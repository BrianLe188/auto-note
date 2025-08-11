import { insertUserSchema } from "@shared/schema";
import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { storage } from "@server/storage";
import {
  AuthRequest,
  comparePassword,
  generateToken,
  hashPassword,
} from "@server/middlewares/auth";
import { AppError } from "@server/middlewares/error-handler";
import { getUserInfoFromToken } from "@server/services/google";
import { randomUUID } from "crypto";

export async function signUp(req: Request, res: Response, next: NextFunction) {
  const signupSchema = insertUserSchema.extend({
    password: z.string().min(6),
  });

  try {
    const validatedData = signupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return next(new AppError("User already exists with this email", 400));
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

    await storage.createAsset({
      userId: user.id,
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
        profileImageUrl: user.profileImageUrl,
      },
    });
  } catch (error) {
    next(
      new AppError(
        error instanceof Error ? error.message : "Unknown error",
        500,
      ),
    );
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await storage.getUserByEmail(validatedData.email);
    if (!user || !user.password) {
      return next(new AppError("Invalid credentials", 401));
    }

    // Verify password
    const isValidPassword = await comparePassword(
      validatedData.password,
      user.password,
    );
    if (!isValidPassword) {
      return next(new AppError("Invalid credentials", 401));
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

        profileImageUrl: user.profileImageUrl,
      },
    });
  } catch (error) {
    next(
      new AppError(
        error instanceof Error ? error.message : "Unknown error",
        500,
      ),
    );
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  const user = req.user!;
  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
  });
}

export async function logout(req: Request, res: Response) {
  // In a JWT system, logout is handled client-side by removing the token
  // We could maintain a blacklist but for simplicity, we'll just respond with success
  res.json({ message: "Logged out successfully" });
}

export async function loginGoogle(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { token } = req.query;

    if (!token) {
      return next(new AppError("Missing token in google verify.", 400));
    }

    const googleUserInfo = await getUserInfoFromToken(token as string);

    let user = await storage.getUserByEmail(googleUserInfo.email);

    if (!user) {
      const hashedPassword = await hashPassword(randomUUID());

      user = await storage.createUser({
        email: googleUserInfo.email,
        password: hashedPassword,
        firstName: googleUserInfo?.given_name,
        lastName: googleUserInfo?.family_name,
        profileImageUrl: googleUserInfo?.picture,
        provider: "google",
        providerId: googleUserInfo?.sub,
        isEmailVerified: true,
      });

      await storage.createAsset({
        userId: user.id,
      });
    }

    const access_token = generateToken(user.id);

    res.json({
      token: access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      },
    });
  } catch (error) {
    console.log(error);
    next(new AppError("Google OAuth not yet implemented", 501));
  }
}

export async function loginApple(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  next(new AppError("Apple ID not yet implemented", 501));
}
