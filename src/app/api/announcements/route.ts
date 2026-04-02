import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: Request) {
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch the linked community_post_id before deleting
  const { data: announcement } = await supabase
    .from("announcements")
    .select("community_post_id")
    .eq("id", id)
    .single();

  // Delete the announcement
  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also delete the linked community post so it disappears from the mobile app
  if (announcement?.community_post_id) {
    const { error: postError } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", announcement.community_post_id);

    if (postError) {
      console.error("Failed to delete linked community post:", postError.message);
    }
  }

  return NextResponse.json({ success: true });
}
