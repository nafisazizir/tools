import { execSync } from "node:child_process";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const searches = [
      "find /var/task -name 'libquery_engine*.node' 2>/dev/null | head -20",
      "find /var/task -type d -name 'client' 2>/dev/null | head -20",
      "ls -la /var/task/node_modules/@repo/ 2>/dev/null || echo 'not found'",
      "ls -la /var/task/packages/ 2>/dev/null || echo 'not found'",
      "ls -R /var/task | grep -E 'libquery|prisma' | head -50",
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
