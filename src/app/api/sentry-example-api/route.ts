import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}

// A faulty API route to test Sentry's error monitoring
export function GET() {
  // Only throw error in development or when explicitly requested
  if (process.env.NODE_ENV === 'development' && process.env.THROW_SENTRY_ERROR === 'true') {
    throw new SentryExampleAPIError("This error is raised on the backend called by the example page.");
  }
  return NextResponse.json({ data: "Sentry API route working correctly" });
}
