import { Router } from "express";
import {
  getMe,
  login,
  loginApple,
  loginGoogle,
  logout,
  signUp,
} from "@server/controllers/auth";
import { authenticateUser } from "@server/middlewares/auth";

export function registerAuthRoutes() {
  const router = Router();

  router.post("/signup", signUp);

  router.post("/login", login);

  router.get("/me", authenticateUser, getMe);

  router.post("/logout", authenticateUser, logout);

  router.get("/google", loginGoogle);

  router.get("/apple", loginApple);

  return router;
}
