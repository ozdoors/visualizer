import { NextResponse } from "next/server";
import { activeStorageDriver } from "@/lib/storage";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    storageDriver: activeStorageDriver(),
    maxUploadMb: env.maxUploadMb(),
  });
}
