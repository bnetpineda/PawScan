import { supabase } from "../lib/supabase";

/**
 * Submit a report for a post
 * @param {string} postId - The ID of the post being reported
 * @param {string} reporterUserId - The ID of the user submitting the report
 * @param {string} reason - The reason for the report
 * @param {string} description - Additional details about the report
 * @returns {Object} - The result of the report submission
 */
export async function submitPostReport(postId, reporterUserId, reason, description = "") {
  try {
    // Check if user has already reported this post
    const { data: existingReport, error: checkError } = await supabase
      .from("newsfeed_reports")
      .select("id")
      .eq("post_id", postId)
      .eq("reporter_user_id", reporterUserId)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Error checking existing reports: ${checkError.message}`);
    }

    if (existingReport) {
      throw new Error("You have already reported this post");
    }

    // Insert the new report
    const { data, error } = await supabase
      .from("newsfeed_reports")
      .insert([
        {
          post_id: postId,
          reporter_user_id: reporterUserId,
          reason: reason,
          description: description,
          status: "pending"
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Error submitting report: ${error.message}`);
    }

    return {
      success: true,
      data: data,
      message: "Report submitted successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "Failed to submit report"
    };
  }
}

/**
 * Get reports for a specific user
 * @param {string} userId - The ID of the user
 * @returns {Object} - The user's reports
 */
export async function getUserReports(userId) {
  try {
    const { data, error } = await supabase
      .from("newsfeed_reports")
      .select(`
        *,
        newsfeed_posts (
          id,
          image_url,
          analysis_result,
          display_name,
          created_at
        )
      `)
      .eq("reporter_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Error fetching reports: ${error.message}`);
    }

    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "Failed to fetch reports"
    };
  }
}

/**
 * Get reports for posts owned by a user (for post owners to see reports on their posts)
 * @param {string} userId - The ID of the user who owns the posts
 * @returns {Object} - The reports on the user's posts
 */
export async function getReportsOnUserPosts(userId) {
  try {
    const { data, error } = await supabase
      .from("newsfeed_reports")
      .select(`
        *,
        newsfeed_posts!inner (
          id,
          image_url,
          analysis_result,
          display_name,
          created_at,
          user_id
        )
      `)
      .eq("newsfeed_posts.user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Error fetching reports: ${error.message}`);
    }

    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "Failed to fetch reports"
    };
  }
}