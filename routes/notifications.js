const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const { formatResponse, generateUniqueId } = require('../utils/helpers');

router.post('/send', async (req, res) => {
  try {
    const { userId, title, message, type, data } = req.body;

    const notificationId = generateUniqueId();
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        notificationId,
        userId,
        title,
        message,
        type: type || 'general',
        data: data ? JSON.stringify(data) : null,
        read: false,
        createdAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending notification:', error);
      return res.status(500).json(formatResponse(false, 'Failed to send notification'));
    }

    res.status(201).json(formatResponse(true, 'Notification sent successfully', notification));

  } catch (error) {
    console.error('Notification send error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly === 'true') {
      query = query.eq('read', false);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json(formatResponse(false, 'Failed to fetch notifications'));
    }

    const processedNotifications = notifications.map(notification => ({
      ...notification,
      data: notification.data ? JSON.parse(notification.data) : null
    }));

    res.json(formatResponse(true, 'Notifications fetched successfully', {
      notifications: processedNotifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }));

  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.patch('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ read: true, readAt: new Date().toISOString() })
      .eq('notificationId', notificationId)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json(formatResponse(false, 'Failed to mark notification as read'));
    }

    res.json(formatResponse(true, 'Notification marked as read', notification));

  } catch (error) {
    console.error('Notification read error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.patch('/user/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true, readAt: new Date().toISOString() })
      .eq('userId', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json(formatResponse(false, 'Failed to mark all notifications as read'));
    }

    res.json(formatResponse(true, 'All notifications marked as read'));

  } catch (error) {
    console.error('Read all notifications error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('notificationId', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json(formatResponse(false, 'Failed to delete notification'));
    }

    res.json(formatResponse(true, 'Notification deleted successfully'));

  } catch (error) {
    console.error('Notification deletion error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.get('/user/:userId/unread-count', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('notificationId')
      .eq('userId', userId)
      .eq('read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return res.status(500).json(formatResponse(false, 'Failed to fetch unread count'));
    }

    res.json(formatResponse(true, 'Unread count fetched successfully', {
      unreadCount: notifications.length
    }));

  } catch (error) {
    console.error('Unread count fetch error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

module.exports = router;
