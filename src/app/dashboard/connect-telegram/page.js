import { createClient } from "@/lib/supabase/server";
import ConnectTelegramPanel from "./ConnectTelegramPanel";
import { getUserLanguage, t } from "@/lib/i18n";

export default async function ConnectTelegramPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("telegram_chat_id").eq("id", user.id).single();
  const lang = await getUserLanguage(supabase, user.id);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">{t(lang, "connect_telegram_title")}</h1>
      <ConnectTelegramPanel userId={user.id} initiallyLinked={!!profile?.telegram_chat_id} lang={lang} />
    </div>
  );
}
