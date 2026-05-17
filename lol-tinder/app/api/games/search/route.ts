import { createClient } from "@/src/utils/supabase/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const supabase = createClient();
  const { data } = await supabase
    .from("custom_games")
    .select("game_name, player_count")
    .ilike("game_name", `%${q}%`)
    .order("player_count", { ascending: false })
    .limit(8);
  return Response.json(data ?? []);
}