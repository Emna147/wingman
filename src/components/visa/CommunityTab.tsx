'use client';

import { authClient } from '@/lib/auth-client';
import { Clock, Filter, MessageCircle, Plus, Search, Share2, ThumbsUp, TrendingUp, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import CommentsModal from './CommentsModal';
import ShareExperienceModal from './ShareExperienceModal';

interface VisaPost {
  _id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  country: string;
  category: 'visa-free' | 'visa-required' | 'e-visa' | 'visa-on-arrival' | 'rejection' | 'tips';
  title: string;
  content: string;
  helpful: number;
  helpfulBy: string[];
  comments: Array<{
    userId: string;
    userName: string;
    content: string;
    helpful: number;
    helpfulBy: string[];
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  isHelpfulByMe?: boolean;
}

const CATEGORIES = [
  { id: 'all', label: 'All Posts', icon: '📋' },
  { id: 'visa-free', label: 'Visa Free', icon: '✅' },
  { id: 'visa-required', label: 'Visa Required', icon: '📄' },
  { id: 'e-visa', label: 'E-Visa', icon: '💻' },
  { id: 'visa-on-arrival', label: 'Visa on Arrival', icon: '🎫' },
  { id: 'rejection', label: 'Rejections & Appeals', icon: '❌' },
  { id: 'tips', label: 'Tips & Tricks', icon: '💡' },
];

const SORT_OPTIONS = [
  { id: 'recent', label: 'Most Recent', icon: Clock },
  { id: 'helpful', label: 'Most Helpful', icon: TrendingUp },
  { id: 'comments', label: 'Most Discussed', icon: MessageCircle },
];

export default function CommunityTab() {
  const [posts, setPosts] = useState<VisaPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<VisaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<VisaPost | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  // Fetch posts
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Get current user ID to check which posts they marked as helpful
      const { data: session } = await authClient.getSession();
      const userId = session?.user?.id || 'user-default-123';

      const response = await fetch('/api/visa-posts', {
        headers: {
          'x-user-id': userId,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Mark posts that the current user has marked as helpful
        const postsWithUserData = (data.posts || []).map((post: VisaPost) => ({
          ...post,
          isHelpfulByMe: post.helpfulBy.includes(userId),
        }));
        setPosts(postsWithUserData);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort posts
  useEffect(() => {
    let results = [...posts];

    // Apply category filter
    if (selectedCategory !== 'all') {
      results = results.filter(post => post.category === selectedCategory);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.country.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'helpful':
        results.sort((a, b) => b.helpful - a.helpful);
        break;
      case 'comments':
        results.sort((a, b) => b.comments.length - a.comments.length);
        break;
      case 'recent':
      default:
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    setFilteredPosts(results);
  }, [posts, selectedCategory, sortBy, searchQuery]);

  const handleHelpful = async (postId: string) => {
    try {
      // Get current user ID
      const { data: session } = await authClient.getSession();
      const userId = session?.user?.id || 'user-default-123';

      // Optimistically update the UI
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            const isCurrentlyHelpful = post.isHelpfulByMe;
            return {
              ...post,
              helpful: isCurrentlyHelpful ? post.helpful - 1 : post.helpful + 1,
              isHelpfulByMe: !isCurrentlyHelpful,
            };
          }
          return post;
        })
      );

      const response = await fetch(`/api/visa-posts/${postId}/helpful`, {
        method: 'POST',
        headers: {
          'x-user-id': userId,
        },
      });
      
      if (!response.ok) {
        // Revert on error
        fetchPosts();
      }
    } catch (error) {
      console.error('Error marking helpful:', error);
      // Revert on error
      fetchPosts();
    }
  };

  const handleShare = async (post: VisaPost) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `${post.title}\n\n${post.content}\n\nShared from Wingman Visa Manager`
      );
      alert('Post copied to clipboard!');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'visa-free':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'visa-required':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      case 'e-visa':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400';
      case 'visa-on-arrival':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'rejection':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400';
      case 'tips':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Share Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Community Experiences</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Share your visa journey and learn from others
          </p>
        </div>
        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Share Experience
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search experiences..."
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
        {CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-500'
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
        {SORT_OPTIONS.map(option => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => setSortBy(option.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === option.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {filteredPosts.length} {filteredPosts.length === 1 ? 'experience' : 'experiences'} found
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Loading experiences...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-4">🌍</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
            No experiences found
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
            Be the first to share your visa journey!
          </p>
          <button
            onClick={() => setShowShareModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Share Your Experience
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPosts.map(post => {
            const isExpanded = expandedPost === post._id;
            const shouldTruncate = post.content.length > 300;
            const displayContent = isExpanded || !shouldTruncate 
              ? post.content 
              : post.content.substring(0, 300) + '...';

            return (
              <div
                key={post._id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                {/* Post Header */}
                <div className="flex items-start gap-4 mb-4">
                  {/* User Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {post.userName?.charAt(0).toUpperCase() || 'U'}
                  </div>

                  {/* Post Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {post.userName || 'Anonymous User'}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        • {formatDate(post.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                        {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        📍 {post.country}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Post Title */}
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {post.title}
                </h4>

                {/* Post Content */}
                <div className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                  {displayContent}
                  {shouldTruncate && (
                    <button
                      onClick={() => setExpandedPost(isExpanded ? null : post._id)}
                      className="text-blue-600 dark:text-blue-400 hover:underline ml-2 font-medium"
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>

                {/* Post Actions */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleHelpful(post._id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      post.isHelpfulByMe
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span className="font-medium">{post.helpful}</span>
                    <span className="text-sm">Helpful</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedPost(post);
                      setShowCommentsModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-medium">{post.comments.length}</span>
                    <span className="text-sm">Comments</span>
                  </button>

                  <button
                    onClick={() => handleShare(post)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Experience Modal */}
      {showShareModal && (
        <ShareExperienceModal
          onClose={() => setShowShareModal(false)}
          onSuccess={() => {
            setShowShareModal(false);
            fetchPosts();
          }}
        />
      )}

      {/* Comments Modal */}
      {showCommentsModal && selectedPost && (
        <CommentsModal
          postId={selectedPost._id}
          postTitle={selectedPost.title}
          onClose={() => {
            setShowCommentsModal(false);
            setSelectedPost(null);
            // Refresh posts to update comment count
            fetchPosts();
          }}
        />
      )}
    </div>
  );
}
