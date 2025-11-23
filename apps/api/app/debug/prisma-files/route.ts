import { execSync } from "node:child_process";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const searches = [
      // Check what's in the generated client directory
      "ls -laR /var/task/packages/database/generated/client/ | head -100",

      // Look for ALL .node files anywhere
      "find /var/task -name '*.node' -type f 2>/dev/null | head -50",

      // Check if files are in .next build output
      "ls -la /var/task/apps/api/.next/server/ 2>/dev/null | head -20",
      "find /var/task/apps/api/.next -name '*query_engine*' 2>/dev/null | head -20",

      // Check node_modules
      "ls -la /var/task/node_modules/.prisma/ 2>/dev/null || echo 'not found'",
      "find /var/task/node_modules -name 'libquery_engine*.node' 2>/dev/null | head -10",

      // Check what the PrismaPlugin might have done
      "find /var/task -type f -name 'schema.prisma' 2>/dev/null",

      // Size check
      "du -sh /var/task/packages/database/generated/client/ 2>/dev/null || echo 'not found'",
    ];

    const results: Record<string, string> = {};

    for (const cmd of searches) {
      try {
        const output = execSync(cmd, { encoding: "utf-8", timeout: 10_000 });
        results[cmd] = output || "(empty result)";
      } catch (error) {
        results[cmd] = `Error: ${error}`;
      }
    }

    return await NextResponse.json({
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      env: {
        PRISMA_QUERY_ENGINE_LIBRARY: process.env.PRISMA_QUERY_ENGINE_LIBRARY,
        NODE_ENV: process.env.NODE_ENV,
      },
      searches: results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: String(error),
      },
      { status: 500 }
    );
  }
}
