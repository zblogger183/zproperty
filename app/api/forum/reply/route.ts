import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to reply" }, { status: 401 });
  }

  const body = await request.json();
  const { topic_id: topicId, body: replyBody } = body;

  if (!topicId || typeof replyBody !== "string" || replyBody.trim().length < 10) {
    return NextResponse.json({ error: "Reply must be at least 10 characters" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: topic } = await admin.from("forum_topics").select("id, reply_count").eq("id", topicId).single();
  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const { error: insertError } = await admin.from("forum_replies").insert({
    topic_id: topicId,
    user_id: user.id,
    body: replyBody.trim(),
  });

  if (insertError) {
    return NextResponse.json({ error: "Could not post reply" }, { status: 500 });
  }

  await admin
    .from("forum_topics")
    .update({ reply_count: (topic.reply_count ?? 0) + 1, last_reply: new Date().toISOString() })
    .eq("id", topicId);

  return NextResponse.json({ ok: true });
}
