import { database, type Prisma } from "@repo/database";
import { log } from "@repo/observability/log";
import { GarminConnect } from "garmin-connect";
import { decrypt } from "./crypto";
import type {
  GarminOAuth1Token,
  GarminOAuth2Token,
  GarminSleepResponse,
  IGarminTokens,
} from "./types";

export class GarminClient {
  private client: GarminConnect | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const connection = await database.garminConnection.findUnique({
      where: { id: 1 },
    });

    if (!connection) {
      throw new Error("Garmin connection not found");
    }

    const email = decrypt(connection.encryptedEmail);
    const password = decrypt(connection.encryptedPassword);

    this.client = new GarminConnect({
      username: email,
      password,
    });

    if (connection.oauth1Token && connection.oauth2Token) {
      try {
        this.client.loadToken(
          connection.oauth1Token as unknown as GarminOAuth1Token,
          connection.oauth2Token as unknown as GarminOAuth2Token
        );
        log.info("Restored Garmin session from cached tokens");
        this.initialized = true;
        return;
      } catch (_error) {
        log.warn("Failed to restore Garmin tokens, falling back to login");
      }
    }

    await this.client.login();
    await this.persistTokens();
    this.initialized = true;
  }

  private async persistTokens(): Promise<void> {
    if (!this.client) {
      return;
    }

    const tokens: IGarminTokens = this.client.exportToken();

    await database.garminConnection.update({
      where: { id: 1 },
      data: {
        oauth1Token: tokens.oauth1
          ? (tokens.oauth1 as unknown as Prisma.InputJsonValue)
          : undefined,
        oauth2Token: tokens.oauth2
          ? (tokens.oauth2 as unknown as Prisma.InputJsonValue)
          : undefined,
        lastError: null,
      },
    });
  }

  async testConnection(): Promise<{ displayName: string; fullName?: string }> {
    await this.initialize();

    if (!this.client) {
      throw new Error("Garmin client not initialized");
    }

    const profile = await this.client.getUserProfile();

    return {
      displayName: profile.displayName || profile.userName || "Unknown",
      fullName: profile.fullName,
    };
  }

  async getSleepData(date: Date): Promise<GarminSleepResponse> {
    await this.initialize();

    if (!this.client) {
      throw new Error("Garmin client not initialized");
    }

    const sleepData = await this.client.getSleepData(date);

    await this.persistTokens();

    return sleepData;
  }

  async recordError(error: string): Promise<void> {
    await database.garminConnection.update({
      where: { id: 1 },
      data: { lastError: error },
    });
  }
}
