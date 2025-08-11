import { GUMROAD_CONFIG, gumroadFetch } from "@server/core/gumroad";
import { AuthRequest } from "@server/middlewares/auth";
import { AppError } from "@server/middlewares/error-handler";
import { storage } from "@server/storage";
import { GumroadWebhookEvent, SubscriptionTier } from "@server/types/gumroad";
import { InsertAsset, InsertSubscription } from "@shared/schema";
import { NextFunction, Request, Response } from "express";

export async function getProducts(
  _req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const gumRes = await gumroadFetch(
      `/v2/products?access_token=${GUMROAD_CONFIG.accessToken}`,
    );

    const data = await gumRes.json();

    if (!data.success) {
      return next(new AppError("Failed to fetch products from Gumroad", 502));
    }

    res.json(data.products);
  } catch (error) {
    next(
      new AppError(
        error instanceof Error ? error.message : "Unknown error",
        500,
      ),
    );
  }
}

export async function gumroadWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const event: GumroadWebhookEvent = req.body;

    if (event.subscription_id) {
      const user = await storage.getUserByEmail(event.email);

      if (!user) return next(new AppError("User not found", 404));

      const subscriptionPayload: InsertSubscription = {
        userId: user.id,
        productId: event.product_id,
        subscriptionId: event.subscription_id,
        tier: event["variants[Tier]"],
      };

      await storage.createSubscription(subscriptionPayload);

      const assetTemplate = getSubscriptionAssetTemplate(
        event["variants[Tier]"] as SubscriptionTier,
      );

      const existingAsset = await storage.getAssetByUser(user.id);

      const assetPayload: InsertAsset = {
        userId: user.id,
        currentTier: event["variants[Tier]"],
        ...assetTemplate,
      };

      if (existingAsset) {
        await storage.updateAsset(existingAsset.id, assetPayload);
      } else {
        await storage.createAsset(assetPayload);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(
      new AppError(
        error instanceof Error ? error.message : "Unknown error",
        500,
      ),
    );
  }
}

function getSubscriptionAssetTemplate(tier: SubscriptionTier) {
  switch (tier) {
    case "Free": {
      return {
        transcriptionCount: 5,
        actionPerTime: 10,
        actionDescriptionAllow: false,
      };
    }
    case "Basic": {
      return {
        transcriptionCount: 15,
        actionPerTime: 15,
        actionDescriptionAllow: true,
      };
    }
    case "Pro": {
      return {
        transcriptionCount: Infinity,
        actionPerTime: Infinity,
        actionDescriptionAllow: true,
      };
    }
  }
}
