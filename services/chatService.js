import { supabase } from "../lib/supabase";

export const fetchConversationsOptimized = async (userId) => {
  try {
    // Fetch conversations with all related data in a single optimized query
    const { data: conversationsData, error: conversationsError } = await supabase
      .from("conversations")
      .select(`
        id,
        vet_id,
        updated_at,
        vet_profiles!conversations_vet_id_fkey (
          id,
          name,
          profile_image_url
        )
      `)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (conversationsError) throw conversationsError;

    // Fetch latest messages for all conversations in batch
    const conversationIds = conversationsData.map(c => c.id);
    
    const { data: messagesData, error: messagesError } = await supabase
      .from("messages")
      .select("conversation_id, content, created_at, sender_id")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    if (messagesError) throw messagesError;

    // Fetch unread counts for all conversations in batch
    const { data: unreadData, error: unreadError } = await supabase
      .from("messages")
      .select("conversation_id", { count: "exact" })
      .in("conversation_id", conversationIds)
      .eq("is_read", false)
      .neq("sender_id", userId);

    if (unreadError) throw unreadError;

    // Group messages by conversation_id for quick lookup
    const messagesByConversation = {};
    messagesData?.forEach(message => {
      if (!messagesByConversation[message.conversation_id]) {
        messagesByConversation[message.conversation_id] = message;
      }
    });

    // Count unread messages by conversation
    const unreadByConversation = {};
    unreadData?.forEach(item => {
      unreadByConversation[item.conversation_id] = 
        (unreadByConversation[item.conversation_id] || 0) + 1;
    });

    // Combine all data
    const conversationsWithDetails = conversationsData.map(conversation => {
      const latestMessage = messagesByConversation[conversation.id];
      const unreadCount = unreadByConversation[conversation.id] || 0;
      const vetProfile = conversation.vet_profiles;

      return {
        id: conversation.id,
        vet_id: conversation.vet_id,
        updated_at: conversation.updated_at,
        vetName: vetProfile?.name || "Veterinarian",
        profile_image_url: vetProfile?.profile_image_url || null,
        latestMessage: latestMessage || null,
        unreadCount: unreadCount,
      };
    });

    return { data: conversationsWithDetails, error: null };
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return { data: null, error };
  }
};

export const fetchVeterinarians = async () => {
  try {
    const { data, error } = await supabase
      .from("vet_profiles")
      .select("id, name as display_name, profile_image_url")
      .order("name");

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching veterinarians:", error);
    return { data: null, error };
  }
};

export const deleteConversation = async (conversationId) => {
  try {
    // Delete all messages first (cascade should handle this, but explicit is better)
    await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", conversationId);

    // Delete the conversation
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return { success: false, error };
  }
};
