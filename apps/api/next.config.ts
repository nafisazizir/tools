import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";
import { config, withAnalyzer } from "@repo/next-config";
import { withLogging, withSentry } from "@repo/observability/next-config";
import type { NextConfig } from "next";
import { env } from "@/env";

let nextConfig: NextConfig = {
  ...withLogging(config),
  outputFileTracingIncludes: {
    "/*": ["../../packages/database/generated/client/**/*"],
  },
  webpack: (webpackConfig, { isServer }) => {
    if (isServer) {
      webpackConfig.plugins = [...webpackConfig.plugins, new PrismaPlugin()];
    }
    return webpackConfig;
  },
};

if (env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

if (env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;
