import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";
import { config, withAnalyzer } from "@repo/next-config";
import { withLogging, withSentry } from "@repo/observability/next-config";
import type { NextConfig } from "next";
import { env } from "@/env";

let nextConfig: NextConfig = {
  ...withLogging(config),
  outputFileTracingIncludes: {
    // Ensure Prisma engines and wasm are bundled into server output
    "/*": [
      "../../packages/database/generated/client/libquery_engine*",
      "../../packages/database/generated/client/query_engine*",
      "../../packages/database/generated/client/schema.prisma",
      "../../packages/database/generated/client/*.node",
      "../../packages/database/generated/client/*.wasm",
    ],
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
