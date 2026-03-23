import { createClient } from '@/lib/supabase/client'
import type { ContentReport } from '@/types/database'

export async function getReports(eventId?: string): Promise<ContentReport[]> {
  const supabase = createClient()

  // Fetch reports with reporter profile info
  const { data: reports, error } = await supabase
    .from('content_reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reports:', error)
    throw error
  }

  if (!reports || reports.length === 0) return []

  const rows = reports as ContentReport[]

  // Get unique reporter IDs and content IDs
  const reporterIds = [...new Set(rows.map((r) => r.reporter_id))]
  const postContentIds = rows
    .filter((r) => r.content_type === 'post')
    .map((r) => r.content_id)
  const commentContentIds = rows
    .filter((r) => r.content_type === 'comment')
    .map((r) => r.content_id)

  // Fetch reporter profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', reporterIds)

  const profileList = (profiles || []) as { id: string; full_name: string | null; email: string | null }[]
  const profileMap = new Map(profileList.map((p) => [p.id, p]))

  // Fetch reported posts
  type PostInfo = { id: string; title: string; content: string; event_id: string; author_name: string }
  const postMap = new Map<string, PostInfo>()
  if (postContentIds.length > 0) {
    const { data: posts } = await supabase
      .from('community_posts')
      .select('id, title, content, event_id, author_name')
      .in('id', postContentIds)

    const postList = (posts || []) as PostInfo[]
    postList.forEach((p) => postMap.set(p.id, p))
  }

  // Fetch reported comments
  type CommentInfo = { id: string; content: string; post_id: string; author_name: string; event_id?: string }
  const commentMap = new Map<string, CommentInfo>()
  if (commentContentIds.length > 0) {
    const { data: comments } = await supabase
      .from('post_comments')
      .select('id, content, post_id, author_name')
      .in('id', commentContentIds)

    const commentList = (comments || []) as CommentInfo[]
    if (commentList.length > 0) {
      commentList.forEach((c) => commentMap.set(c.id, c))

      // Get parent post event_ids for comments
      const parentPostIds = [...new Set(commentList.map((c) => c.post_id))]
      const { data: parentPosts } = await supabase
        .from('community_posts')
        .select('id, event_id')
        .in('id', parentPostIds)

      const parentPostList = (parentPosts || []) as { id: string; event_id: string }[]
      const parentPostMap = new Map(parentPostList.map((p) => [p.id, p.event_id]))

      // Attach event_id to comments via their parent post
      commentList.forEach((c) => {
        const comment = commentMap.get(c.id)
        if (comment) {
          comment.event_id = parentPostMap.get(c.post_id)
        }
      })
    }
  }

  // Enrich reports
  const enriched: ContentReport[] = rows.map((r) => {
    const reporter = profileMap.get(r.reporter_id)
    const post = postMap.get(r.content_id)
    const comment = commentMap.get(r.content_id)

    let contentEventId: string | undefined
    let contentTitle: string | undefined
    let contentBody: string | undefined
    let contentAuthorName: string | undefined

    if (r.content_type === 'post' && post) {
      contentEventId = post.event_id
      contentTitle = post.title
      contentBody = post.content
      contentAuthorName = post.author_name
    } else if (r.content_type === 'comment' && comment) {
      contentEventId = (comment as Record<string, unknown>).event_id as string | undefined
      contentBody = comment.content
      contentAuthorName = comment.author_name
    }

    return {
      ...r,
      reporter_name: reporter?.full_name || 'Unknown',
      reporter_email: reporter?.email || undefined,
      content_title: contentTitle,
      content_body: contentBody,
      content_event_id: contentEventId,
      content_author_name: contentAuthorName,
    }
  })

  // Filter by event if specified
  if (eventId) {
    return enriched.filter((r) => r.content_event_id === eventId)
  }

  return enriched
}

export async function updateReportStatus(
  id: string,
  status: 'reviewed' | 'dismissed' | 'actioned',
  actionTaken: 'removed' | 'warned' | 'none' | null,
  reviewedBy: string,
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('content_reports')
    .update({
      status,
      action_taken: actionTaken,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating report:', error)
    throw error
  }
}

export async function deleteReportedContent(
  contentType: string,
  contentId: string,
): Promise<void> {
  const supabase = createClient()

  const table = contentType === 'post' ? 'community_posts' : 'post_comments'

  const { error } = await supabase.from(table).delete().eq('id', contentId)

  if (error) {
    console.error('Error deleting content:', error)
    throw error
  }
}
