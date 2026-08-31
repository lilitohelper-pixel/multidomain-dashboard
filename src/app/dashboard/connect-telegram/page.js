import { createClient } from "@/lib/supabase/server";
import ConnectTelegramPanel from "./ConnectTelegramPanel";

export default async function ConnectTelegramPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("telegram_chat_id").eq("id", user.id).single();

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">Connect Telegram</h1>
      <ConnectTelegramPanel userId={user.id} initiallyLinked={!!profile?.telegram_chat_id} />
    </div>
  );
}
