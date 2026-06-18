import { createClient } from "@/src/utils/supabase/client";
import { rateLimit } from "@/src/lib/rateLimit";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Простий rate-limit за IP, щоб не зловживали пошуком.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`games-search:${ip}`, 30, 60_000)) {
    return Response.json([], { status: 429 });
  }

  // Обмежуємо довжину і екрануємо LIKE-метасимволи (% _ \), щоб користувацький
  // ввід не діяв як wildcard.
  const raw = (searchParams.get("q") || "").slice(0, 50);
  const q = raw.replace(/[\\%_]/g, (m) => `\\${m}`);

  const supabase = createClient();
  const { data } = await supabase
    .from("custom_games")
    .select("game_name, player_count")
    .ilike("game_name", `%${q}%`)
    .order("player_count", { ascending: false })
    .limit(8);
  return Response.json(data ?? []);
}
