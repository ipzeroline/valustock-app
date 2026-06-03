import { NextResponse } from "next/server";
import { getTelegramMiniAppUrl, getTelegramMiniBotUsername } from "@/lib/telegram-mini";

export async function GET() {
  return NextResponse.json({
    botUsername: getTelegramMiniBotUsername(),
    miniAppUrl: getTelegramMiniAppUrl(),
  });
}
