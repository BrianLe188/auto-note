import { getProducts, gumroadWebhook } from "@server/controllers/gumroad";
import { authenticateUser } from "@server/middlewares/auth";
import { Router } from "express";

export function registerGumroadRoutes() {
  const router = Router();

  router.get("/products", authenticateUser, getProducts);

  router.post("/webhook", gumroadWebhook);

  return router;
}
