import { database } from "./index";
import type {
  StravaActivityZone,
  StravaDetailedActivity,
  StravaSummaryActivity,
  StravaTokens,
} from "./strava-types";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const EXPIRY_BUFFER_MINUTES = 5;
const MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE;
const EXPIRY_BUFFER_MS =
  (EXPIRY_BUFFER_MINUTES * MINUTES_PER_HOUR * MS_PER_MINUTE) / MINUTES_PER_HOUR;

export class StravaClient {
  private readonly athleteId: string;
  private tokens: StravaTokens | null = null;

  constructor(athleteId: string) {
    this.athleteId = athleteId;
  }

  private async getAccessToken(): Promise<string> {
    if (!this.tokens) {
      const connection = await database.stravaConnection.findFirst({
        where: { athleteId: this.athleteId },
      });

      if (!connection) {
        throw new Error("Strava connection not found");
      }

      this.tokens = {
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken,
        expiresAt: connection.expiresAt,
      };
    }

    const now = new Date();
    const expiryBuffer = new Date(now.getTime() + EXPIRY_BUFFER_MS);

    if (this.tokens.expiresAt <= expiryBuffer) {
      await this.refreshAccessToken();
    }

    return this.tokens.accessToken;
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.tokens) {
      throw new Error("No tokens available to refresh");
    }

    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: this.tokens.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh Strava token");
    }

    const data = await response.json();

    this.tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(data.expires_at * MS_PER_SECOND),
    };

    await database.stravaConnection.updateMany({
      where: { athleteId: this.athleteId },
      data: {
        accessToken: this.tokens.accessToken,
        refreshToken: this.tokens.refreshToken,
        expiresAt: this.tokens.expiresAt,
      },
    });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${STRAVA_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Strava API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async getActivities(
    after?: number,
    perPage = 30,
    page = 1
  ): Promise<StravaSummaryActivity[]> {
    const params = new URLSearchParams({
      per_page: perPage.toString(),
      page: page.toString(),
    });

    if (after) {
      params.append("after", after.toString());
    }

    return await this.request<StravaSummaryActivity[]>(
      `/athlete/activities?${params.toString()}`
    );
  }

  async getActivity(activityId: string): Promise<StravaDetailedActivity> {
    return await this.request<StravaDetailedActivity>(
      `/activities/${activityId}?include_all_efforts=false`
    );
  }

  async getActivityZones(activityId: string): Promise<StravaActivityZone[]> {
    return await this.request<StravaActivityZone[]>(
      `/activities/${activityId}/zones`
    );
  }
}
