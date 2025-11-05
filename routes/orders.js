const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const { formatResponse, generateUniqueId } = require('../utils/helpers');

router.post('/create', async (req, res) => {
  try {
    const { 
      userId, 
      type, 
      itemId, 
      itemDetails, 
      quantity = 1, 
      totalAmount, 
      deliveryAddress, 
      contactInfo,
      specialInstructions 
    } = req.body;

    const orderId = generateUniqueId();
    
    const { data: newOrder, error } = await supabase
      .from('orders')
      .insert({
        orderId,
        userId,
        type,
        itemId,
        itemDetails: itemDetails ? JSON.stringify(itemDetails) : null,
        quantity,
        totalAmount: parseFloat(totalAmount),
        deliveryAddress,
        contactInfo: contactInfo ? JSON.stringify(contactInfo) : null,
        specialInstructions,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return res.status(500).json(formatResponse(false, 'Failed to create order'));
    }

    res.status(201).json(formatResponse(true, 'Order created successfully', newOrder));

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, status, type } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json(formatResponse(false, 'Failed to fetch orders'));
    }

    const processedOrders = orders.map(order => ({
      ...order,
      itemDetails: order.itemDetails ? JSON.parse(order.itemDetails) : null,
      contactInfo: order.contactInfo ? JSON.parse(order.contactInfo) : null
    }));

    res.json(formatResponse(true, 'Orders fetched successfully', {
      orders: processedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }));

  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('orderId', orderId)
      .single();

    if (error || !order) {
      return res.status(404).json(formatResponse(false, 'Order not found'));
    }

    const processedOrder = {
      ...order,
      itemDetails: order.itemDetails ? JSON.parse(order.itemDetails) : null,
      contactInfo: order.contactInfo ? JSON.parse(order.contactInfo) : null
    };

    res.json(formatResponse(true, 'Order fetched successfully', processedOrder));

  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.patch('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, paymentStatus } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'];
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

    const updates = { updatedAt: new Date().toISOString() };

    if (status && validStatuses.includes(status)) {
      updates.status = status;
    }

    if (paymentStatus && validPaymentStatuses.includes(paymentStatus)) {
      updates.paymentStatus = paymentStatus;
    }

    if (Object.keys(updates).length === 1) {
      return res.status(400).json(formatResponse(false, 'No valid updates provided'));
    }

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('orderId', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order status:', error);
      return res.status(500).json(formatResponse(false, 'Failed to update order status'));
    }

    res.json(formatResponse(true, 'Order status updated successfully', updatedOrder));

  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: order } = await supabase
      .from('orders')
      .select('status')
      .eq('orderId', orderId)
      .single();

    if (!order) {
      return res.status(404).json(formatResponse(false, 'Order not found'));
    }

    if (order.status !== 'pending' && order.status !== 'cancelled') {
      return res.status(400).json(formatResponse(false, 'Cannot delete order in current status'));
    }

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('orderId', orderId);

    if (error) {
      console.error('Error deleting order:', error);
      return res.status(500).json(formatResponse(false, 'Failed to delete order'));
    }

    res.json(formatResponse(true, 'Order deleted successfully'));

  } catch (error) {
    console.error('Order deletion error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.get('/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: orders, error } = await supabase
      .from('orders')
      .select('status, totalAmount, type, createdAt')
      .eq('userId', userId);

    if (error) {
      console.error('Error fetching order stats:', error);
      return res.status(500).json(formatResponse(false, 'Failed to fetch order stats'));
    }

    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      completedOrders: orders.filter(o => o.status === 'delivered').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      totalSpent: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      mealOrders: orders.filter(o => o.type === 'meal').length,
      marketOrders: orders.filter(o => o.type === 'market').length
    };

    res.json(formatResponse(true, 'Order stats fetched successfully', stats));

  } catch (error) {
    console.error('Order stats fetch error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

module.exports = router;
