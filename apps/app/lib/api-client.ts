import type { StravaActivity } from "@repo/database";
import { env } from "@/env";

class ApiClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: "Failed to fetch",
      }));
      throw new Error(error.error || `HTTP error ${response.status}`);
    }

    return response.json();
  }

  // Strava Connection
  async getStravaConnection() {
    return await this.request<{
      connected: boolean;
      athleteId?: string;
      username?: string;
      firstname?: string;
      lastname?: string;
      city?: string;
      state?: string;
      country?: string;
      summit?: boolean;
      profile?: string;
    }>("/strava/connection");
  }

  async disconnectStrava() {
    return await this.request<{ success: boolean }>("/strava/disconnect", {
      method: "POST",
    });
  }

  // Strava Activities
  async getStravaActivities(params: {
    athleteId: string;
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const searchParams = new URLSearchParams();
    searchParams.append("athleteId", params.athleteId);
    if (params.limit) {
      searchParams.append("limit", params.limit.toString());
    }
    if (params.type) {
      searchParams.append("type", params.type);
    }
    if (params.startDate) {
      searchParams.append("startDate", params.startDate);
    }
    if (params.endDate) {
      searchParams.append("endDate", params.endDate);
    }

    return await this.request<{
      activities: StravaActivity[];
      stats: {
        total: number;
        types: Record<string, number>;
        totalDistance: number;
        totalTime: number;
      };
      athleteId: string;
    }>(`/strava/activities?${searchParams.toString()}`);
  }

  async syncStravaActivities(params: {
    athleteId: string;
    initialSyncDays?: number;
    editScanWindow?: number;
  }) {
    return await this.request<{
      success: boolean;
      created: number;
      updated: number;
      deleted: number;
      errors: number;
      total: number;
    }>("/strava/sync", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // Garmin Connection
  async getGarminConnection() {
    return await this.request<{
      connected: boolean;
      displayName?: string;
      fullName?: string;
      lastSync?: string;
      lastError?: string;
    }>("/garmin/connection");
  }

  async connectGarmin(credentials: { email: string; password: string }) {
    return await this.request<{
      success: boolean;
      displayName?: string;
      fullName?: string;
      error?: string;
    }>("/garmin/connect", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async disconnectGarmin() {
    return await this.request<{ success: boolean }>("/garmin/disconnect", {
      method: "POST",
    });
  }

  // Garmin Sleep
  async getGarminSleep(params?: { days?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.days) {
      searchParams.append("days", params.days.toString());
    }
    const query = searchParams.toString();
    return await this.request<{
      data: Array<{
        date: string;
        sleepScore: number | null;
        totalHours: number;
        deepHours: number;
        lightHours: number;
        remHours: number;
        awakeHours: number;
        sleepStart: string;
        sleepEnd: string;
        quality: "excellent" | "good" | "fair" | "poor";
      }>;
    }>(`/garmin/sleep${query ? `?${query}` : ""}`);
  }

  async syncGarminSleep(params?: { days?: number }) {
    return await this.request<{
      success: boolean;
      syncedDays: number;
      errors?: string[];
    }>("/garmin/sync", {
      method: "POST",
      body: JSON.stringify(params ?? {}),
    });
  }
}

export const apiClient = new ApiClient();
