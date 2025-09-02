import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useProfileData = (user) => {
  const [userPosts, setUserPosts] = useState([]);
  const [petScanCount, setPetScanCount] = useState(0);
  const [historyImages, setHistoryImages] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchUserPosts = async () => {
    if (!user) return;
    
    setPostsLoading(true);
    try {
      // Fetch posts from the newsfeed_posts table for this user
      const { data: posts, error } = await supabase
        .from('newsfeed_posts')
        .select('id, image_url, pet_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user posts:', error);
        setUserPosts([]);
        return;
      }

      // Map the posts to match the expected format
      const postsWithUrls = posts.map(post => ({
        id: post.id,
        url: post.image_url,
        name: post.pet_name || 'Unnamed Pet',
        createdAt: post.created_at
      }));

      setUserPosts(postsWithUrls);
    } catch (error) {
      console.error('Error processing user posts:', error);
      setUserPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchPetScanCount = async () => {
    if (!user) return;
    
    try {
      // Count the number of analysis history records for this user
      const { count, error } = await supabase
        .from('analysis_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching pet scan count:', error);
        return;
      }

      setPetScanCount(count || 0);
    } catch (error) {
      console.error('Error processing pet scan count:', error);
    }
  };

  const fetchHistoryImages = async () => {
    if (!user) return;
    
    setHistoryLoading(true);
    try {
      // Fetch analysis history records for this user
      const { data: history, error } = await supabase
        .from('analysis_history')
        .select('id, image_url, analysis_result, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching history images:', error);
        setHistoryImages([]);
        return;
      }

      // Map the history to match the expected format
      const historyWithUrls = history.map(item => ({
        id: item.id,
        url: item.image_url,
        result: item.analysis_result,
        createdAt: item.created_at
      }));

      setHistoryImages(historyWithUrls);
    } catch (error) {
      console.error('Error processing history images:', error);
      setHistoryImages([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const refreshAllData = async () => {
    setPostsLoading(true);
    setHistoryLoading(true);
    await fetchUserPosts();
    await fetchPetScanCount();
    await fetchHistoryImages();
  };

  return {
    userPosts,
    petScanCount,
    historyImages,
    postsLoading,
    historyLoading,
    fetchUserPosts,
    fetchPetScanCount,
    fetchHistoryImages,
    refreshAllData
  };
};

export default useProfileData;