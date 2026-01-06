import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth';
import { Send, User, Clock, MessageCircle, Heart, AlertCircle, Loader, Trash2, Edit3, Check, X, RefreshCw } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CommentSection = ({ movieId, onCommentCountChange }) => {
  const { 
    user, 
    token: authToken, 
    isAuthenticated, 
    setToken, 
    setIsAuthenticated,
    logout 
  } = useAuth();
  
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalComments, setTotalComments] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [likingComments, setLikingComments] = useState(new Set());
  const [deletingComments, setDeletingComments] = useState(new Set());
  const [updatingComments, setUpdatingComments] = useState(new Set());
  
  // Helper function to check response and parse JSON
  const checkAndParseJson = async (response) => {
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch (err) {
      console.error('JSON Parse Error:', err, 'Response text:', text);
      throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`);
    }
  };

  // Enhanced token management
  const getToken = useCallback(() => {
    if (authToken) return authToken;
    
    const localToken = localStorage.getItem('token');
    const sessionToken = sessionStorage.getItem('token');
    
    const token = localToken || sessionToken;
    
    if (token && !authToken) {
      setToken(token);
      setIsAuthenticated(true);
    }
    
    return token;
  }, [authToken, setToken, setIsAuthenticated]);

  // Enhanced token validation with better error handling
  const validateAuth = useCallback(() => {
    if (!isAuthenticated) {
      throw new Error('Please log in to perform this action.');
    }

    const token = getToken();
    
    if (!token) {
      logout();
      throw new Error('No authentication token found. Please log in again.');
    }
    
    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp < Date.now() / 1000) {
        logout();
        throw new Error('Your session has expired. Please log in again.');
      }
    } catch (tokenError) {
      console.warn('Token validation warning:', tokenError);
      // Don't logout immediately for minor token issues
      if (!user) {
        logout();
        throw new Error('Invalid token. Please log in again.');
      }
    }
    
    if (!user || (!user.id && !user._id)) {
      logout();
      throw new Error('User information is incomplete. Please log in again.');
    }
    
    return { token, userId: user.id || user._id };
  }, [isAuthenticated, getToken, logout, user]);

  // Show success message temporarily
  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Show error message temporarily
  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  // Load comments with enhanced error handling
  const loadComments = async (pageNum = 1, append = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { token } = validateAuth();
      
      const response = await fetch(`${API_BASE_URL}/api/movie/${movieId}/comments?page=${pageNum}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Failed to load comments: ${response.status} ${response.statusText}`);
      }
      
      const data = await checkAndParseJson(response);
      
      if (data.success) {
        const newComments = data.comments || [];
        if (append) {
          setComments(prev => [...prev, ...newComments]);
      } else {
          setComments(newComments);
        }
        
        const total = data.totalComments || data.total || data.count || newComments.length;
        setTotalComments(total);
        setHasMore(data.hasMore !== undefined ? data.hasMore : (pageNum * 10 < total));
        setPage(pageNum);
        
        if (onCommentCountChange) {
          onCommentCountChange(total);
        }
      } else {
        throw new Error(data.message || 'Failed to load comments');
      }
    } catch (err) {
      console.error('Error loading comments:', err);
      showError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced comment submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    const trimmedComment = newComment.trim();
    if (trimmedComment.length < 3) {
      showError('Comment must be at least 3 characters long');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const { token } = validateAuth();
      
      const response = await fetch(`${API_BASE_URL}/api/movie/${movieId}/comments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
          content: trimmedComment
            })
          });
      
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Failed to post comment: ${response.status} ${response.statusText}`);
      }
      
      const data = await checkAndParseJson(response);
      
      if (data.success) {
        setNewComment('');
        showSuccess('Comment posted successfully!');
        await loadComments(1);
      } else {
        throw new Error(data.message || 'Failed to post comment');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      showError(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Enhanced delete function with optimistic updates
  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    setDeletingComments(prev => new Set(prev).add(commentId));
    setError(null);

    try {
      const { token, userId } = validateAuth();
      
      const response = await fetch(`${API_BASE_URL}/api/user/${userId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error('Session expired. Please log in again.');
        }
        if (response.status === 404) {
          throw new Error('Only the owner of the comment can delete it');
        }
        throw new Error(`Failed to delete comment: ${response.status} ${response.statusText}`);
      }

      const data = await checkAndParseJson(response);
      
      if (data.success) {
        setComments(prev => prev.filter(comment => 
          (comment._id || comment.id) !== commentId
        ));
        showSuccess('Comment deleted successfully!');
        if (onCommentCountChange) {
          onCommentCountChange(prev => prev - 1);
        }
      } else {
        throw new Error(data.message || 'Failed to delete comment');
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      showError(err.message || 'Failed to delete comment');
    } finally {
      setDeletingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment._id || comment.id);
    setEditContent(comment.content);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
    setError(null);
  };

  const saveEdit = async () => {
    const trimmedContent = editContent.trim();
    if (!trimmedContent) {
      showError('Comment cannot be empty');
      return;
    }
    
    if (trimmedContent.length < 3) {
      showError('Comment must be at least 3 characters long');
      return;
    }

    await handleUpdate(editingId, trimmedContent);
  };

  // Enhanced update function
  const handleUpdate = async (commentId, content) => {
    if (!content.trim()) {
      showError('Comment cannot be empty');
      return;
    }

    setUpdatingComments(prev => new Set(prev).add(commentId));
    setError(null);

    try {
      const { token, userId } = validateAuth();
      
      const response = await fetch(`${API_BASE_URL}/api/user/${userId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: content.trim() })
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Only the owner of the comment can update it: ${response.status} ${response.statusText}`);
      }

      const data = await checkAndParseJson(response);
      
      if (data.success) {
        setComments(prev => prev.map(comment => 
          (comment._id || comment.id) === commentId 
            ? { ...comment, content: content.trim() }
            : comment
        ));
      setEditingId(null);
        setEditContent('');
        showSuccess('Comment updated successfully!');
      } else {
        throw new Error(data.message || 'Failed to update comment');
      }
    } catch (err) {
      console.error('Error updating comment:', err);
      showError(err.message || 'Failed to update comment');
    } finally {
      setUpdatingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  // Enhanced like function with optimistic updates
  const handleLikeComment = async (commentId) => {
    setLikingComments(prev => new Set(prev).add(commentId));
    setError(null);

    try {
      const { token, userId } = validateAuth();
      
      const response = await fetch(`${API_BASE_URL}/api/user/${userId}/comments/${commentId}/like`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Failed to like comment: ${response.status} ${response.statusText}`);
      }
      
      const data = await checkAndParseJson(response);
      
      if (data.success) {
      setComments(prev => prev.map(comment => 
          (comment._id || comment.id) === commentId 
            ? { ...comment, likes: (comment.likes || 0) + 1 }
          : comment
      ));
        showSuccess('Comment liked successfully!');
      } else {
        throw new Error(data.message || 'Failed to like comment');
      }
    } catch (err) {
      console.error('Error liking comment:', err);
      showError(err.message || 'Failed to like comment');
    } finally {
      setLikingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  const loadMoreComments = async () => {
    if (!loading && hasMore) {
      await loadComments(page + 1, true);
    }
  };

  const refreshComments = async () => {
    await loadComments(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTimeAgo = (dateString) => {
    try {
      const now = new Date();
      const commentDate = new Date(dateString);
      const diffInSeconds = Math.floor((now - commentDate) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return commentDate.toLocaleDateString();
    } catch (error) {
      return 'Unknown time';
    }
  };

  // Load comments when component mounts or movieId changes
  useEffect(() => {
    if (movieId && isAuthenticated) {
      loadComments(1);
    }
  }, [movieId, isAuthenticated]);

  const renderComment = (comment) => {
    const commentId = comment._id || comment.id;
    const isOwner = isAuthenticated && user && (
      user.id === comment.user?._id || 
      user._id === comment.user?._id ||
      user.id === comment.user?.id ||
      user._id === comment.user?.id ||
      user.id === comment.userId ||
      user._id === comment.userId
    );

    const isBeingDeleted = deletingComments.has(commentId);
    const isBeingLiked = likingComments.has(commentId);
    const isBeingUpdated = updatingComments.has(commentId);
    const isCurrentlyEditing = editingId === commentId;

    // Get user's display name
    const getDisplayName = () => {
      if (comment.userId?.firstName) {
        return comment.userId.firstName;
      }
      if (comment.user?.firstName) {
        return comment.user.firstName;
      }
      if (comment.userId?.username) {
        return comment.userId.username;
      }
      if (comment.user?.username) {
        return comment.user.username;
      }
      return 'Anonymous';
    };

    return (
      <div key={commentId} style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '16px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        opacity: isBeingDeleted ? 0.5 : 1,
        transition: 'all 0.3s ease',
        position: 'relative'
      }}>
        {(isBeingUpdated || isBeingDeleted) && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '50%',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Loader size={16} className="animate-spin" style={{ color: 'white' }} />
          </div>
        )}
        
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #BE2952, #E91E63)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px'
          }}>
              {getDisplayName().charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                {getDisplayName()}
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} />
                {formatTimeAgo(comment.createdAt || comment.created_at)}
                {(comment.updatedAt && comment.updatedAt !== comment.createdAt) || comment.isEdited && (
                  <span style={{ fontStyle: 'italic' }}> (edited)</span>
                )}
            </div>
          </div>
        </div>
        
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAuthenticated && (
          <button
                onClick={() => handleLikeComment(commentId)}
                disabled={isBeingLiked || isBeingDeleted || isCurrentlyEditing}
            style={{
              background: 'none',
              border: 'none',
                  color: comment.isLiked ? '#E91E63' : 'rgba(255, 255, 255, 0.7)',
                  cursor: (isBeingLiked || isBeingDeleted || isCurrentlyEditing) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              fontSize: '14px',
                  opacity: isBeingLiked ? 0.6 : 1
                }}
                title={comment.isLiked ? 'Unlike comment' : 'Like comment'}
              >
                {isBeingLiked ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Heart size={16} fill={comment.isLiked ? '#E91E63' : 'none'} />
                )}
            {comment.likes || 0}
          </button>
            )}
          
            {isOwner && (
            <>
              <button
                onClick={() => startEdit(comment)}
                  disabled={isCurrentlyEditing || isBeingDeleted || isBeingUpdated}
                style={{
                  background: 'none',
                  border: 'none',
                    color: isCurrentlyEditing ? '#10B981' : 'rgba(255, 255, 255, 0.7)',
                    cursor: (isCurrentlyEditing || isBeingDeleted || isBeingUpdated) ? 'not-allowed' : 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                    transition: 'all 0.3s ease',
                    opacity: (isBeingDeleted || isBeingUpdated) ? 0.5 : 1
                }}
                  title={isCurrentlyEditing ? 'Currently editing' : 'Edit comment'}
              >
                <Edit3 size={16} />
              </button>
              
              <button
                  onClick={() => handleDelete(commentId)}
                  disabled={isBeingDeleted || isCurrentlyEditing}
                style={{
                  background: 'none',
                  border: 'none',
                    color: isBeingDeleted ? '#ff6b6b' : 'rgba(255, 255, 255, 0.7)',
                    cursor: (isBeingDeleted || isCurrentlyEditing) ? 'not-allowed' : 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                    transition: 'all 0.3s ease',
                    opacity: isBeingDeleted ? 0.6 : 1
                }}
                title="Delete comment"
              >
                  {isBeingDeleted ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                <Trash2 size={16} />
                  )}
              </button>
            </>
          )}
        </div>
      </div>

        {isCurrentlyEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              maxLength={1000}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                backdropFilter: 'blur(10px)',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
              placeholder="Edit your comment..."
              disabled={isBeingUpdated}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: editContent.length > 900 ? '#ff6b6b' : 'rgba(255, 255, 255, 0.6)' }}>
                {editContent.length}/1000 characters
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={saveEdit}
                  disabled={!editContent.trim() || editContent.length < 3 || isBeingUpdated}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: (editContent.trim() && editContent.length >= 3 && !isBeingUpdated)
                      ? 'linear-gradient(135deg, #10B981, #059669)' 
                      : 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (editContent.trim() && editContent.length >= 3 && !isBeingUpdated) ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isBeingUpdated ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
                  {isBeingUpdated ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={isBeingUpdated}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #6B7280, #4B5563)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isBeingUpdated ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    opacity: isBeingUpdated ? 0.6 : 1
                  }}
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            lineHeight: '1.6', 
            fontSize: '14px', 
            wordBreak: 'break-word',
            marginBottom: '12px'
          }}>
            {comment.content}
          </div>
        )}
      </div>
  );
  };

  const renderCommentInput = () => (
    <div style={{ 
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      borderRadius: '16px',
      padding: '20px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: '20px'
    }}>
      <h4 style={{ color: 'white', marginBottom: '15px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageCircle size={18} />
        {user ? `Add a comment as ${user.username}` : 'Sign in to add a comment'}
      </h4>
      
      {user ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <textarea
              placeholder="What did you think about this movie? (minimum 3 characters)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={submitting}
              rows={3}
              maxLength={1000}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: `2px solid ${newComment.length > 0 && newComment.trim().length < 3 ? 'rgba(255, 107, 107, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                backdropFilter: 'blur(10px)',
                resize: 'vertical',
                minHeight: '80px',
                boxSizing: 'border-box',
                opacity: submitting ? 0.6 : 1
              }}
            />
            
            <button
              type="submit"
              disabled={!newComment.trim() || newComment.trim().length < 3 || submitting}
              style={{
                padding: '12px 20px',
                background: (newComment.trim() && newComment.trim().length >= 3 && !submitting)
                  ? 'linear-gradient(135deg, #BE2952, #E91E63)' 
                  : 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: (newComment.trim() && newComment.trim().length >= 3 && !submitting) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                height: '48px',
                minWidth: '100px'
              }}
            >
              {submitting ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: newComment.length > 900 ? '#ff6b6b' : 'rgba(255, 255, 255, 0.6)' }}>
            {newComment.length}/1000 characters
          </div>
        </form>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.7)' }}>
          <p style={{ marginBottom: '16px' }}>Please sign in to leave a comment</p>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #FF69B4, #E91E63)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              fontSize: '14px'
            }}
          >
            Sign In
          </button>
        </div>
      )}
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '20px 0' }}>
        {renderCommentInput()}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }}>
      {error && (
        <div style={{
          background: 'rgba(255, 0, 0, 0.1)',
          border: '1px solid rgba(255, 0, 0, 0.2)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '16px',
          color: '#ff6b6b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: '#ff6b6b',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {renderCommentInput()}

      <div style={{ marginTop: '20px' }}>
        <div style={{ color: 'white', marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>
          Comments ({totalComments})
      </div>

        {comments.length === 0 && !loading ? (
          <div style={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.6)', 
            padding: '40px 20px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <MessageCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map(comment => renderComment(comment))
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Loader size={24} className="animate-spin" style={{ color: 'white' }} />
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '8px' }}>
            Loading comments...
            </p>
          </div>
        )}

        {hasMore && !loading && comments.length > 0 && (
          <button
            onClick={loadMoreComments}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              marginTop: '16px',
              fontWeight: 'bold'
            }}
          >
            Load More Comments
          </button>
        )}
      </div>
    </div>
  );
};

export default CommentSection;