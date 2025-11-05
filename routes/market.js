const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const { validateMarketProduct } = require('../middleware/validation');
const { formatResponse, generateUniqueId } = require('../utils/helpers');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const uploadImage = async (imageBuffer, filename) => {
  try {
    const uploadsDir = path.join(__dirname, '../public/uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const uniqueFilename = `${generateUniqueId()}-${filename}`;
    const filepath = path.join(uploadsDir, uniqueFilename);
    
    await sharp(imageBuffer)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(filepath);
    
    return `/uploads/${uniqueFilename}`;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

router.post('/create', upload.array('images', 5), validateMarketProduct, async (req, res) => {
  try {
    const { title, description, price, category, subcategory, condition, location, negotiable } = req.body;
    
    let frontImage = null;
    let backImage = null;
    
    if (req.files && req.files.length > 0) {
      const uploadedUrls = await Promise.all(
        req.files.map(file => uploadImage(file.buffer, file.originalname))
      );
      
      frontImage = uploadedUrls[0] || null;
      if (uploadedUrls.length > 1) {
        backImage = uploadedUrls[1];
      }
    }

    const productId = generateUniqueId();
    
    const { data: newProduct, error } = await supabase
      .from('marketplace')
      .insert({
        productId,
        title,
        description,
        price: parseFloat(price),
        frontImage,
        backImage,
        category: category || 'Others',
        subcategory: subcategory || null,
        condition: condition || 'Used',
        location,
        negotiable: negotiable || false,
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return res.status(500).json(formatResponse(false, 'Failed to create product'));
    }

    res.status(201).json(formatResponse(true, 'Product created successfully', newProduct));

  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, subcategory, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('marketplace')
      .select('*', { count: 'exact' })
      .eq('status', 'available')
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (subcategory) {
      query = query.eq('subcategory', subcategory);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json(formatResponse(false, 'Failed to fetch products'));
    }

    const processedProducts = products.map(product => ({
      id: product.productId,
      title: product.title,
      price: `Ksh ${product.price}`,
      image: product.frontImage || product.backImage || null,
      category: product.category || 'Others',
      subcategory: product.subcategory,
      description: product.description,
      condition: product.condition,
      location: product.location,
      negotiable: product.negotiable,
      status: product.status,
      createdAt: product.createdAt
    }));

    const grouped = processedProducts.reduce((acc, item) => {
      const cat = item.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

    const groupedArray = Object.entries(grouped).map(([category, products]) => ({
      category,
      products,
    }));

    res.json(formatResponse(true, 'Products fetched successfully', {
      products: groupedArray,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }));

  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.get('/all', async (req, res) => {
  try {
    const { page = 1, limit = 50, category, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('marketplace')
      .select('*', { count: 'exact' })
      .eq('status', 'available')
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error fetching all products:', error);
      return res.status(500).json(formatResponse(false, 'Failed to fetch products'));
    }

    res.json(formatResponse(true, 'All products fetched successfully', {
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }));

  } catch (error) {
    console.error('All products fetch error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const { data: product, error } = await supabase
      .from('marketplace')
      .select('*')
      .eq('productId', productId)
      .single();

    if (error || !product) {
      return res.status(404).json(formatResponse(false, 'Product not found'));
    }

    res.json(formatResponse(true, 'Product fetched successfully', product));

  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.put('/:productId', upload.array('images', 5), async (req, res) => {
  try {
    const { productId } = req.params;
    const updates = req.body;

    if (req.files && req.files.length > 0) {
      const uploadedUrls = await Promise.all(
        req.files.map(file => uploadImage(file.buffer, file.originalname))
      );
      
      if (!updates.frontImage && uploadedUrls.length > 0) {
        updates.frontImage = uploadedUrls[0];
      }
      if (!updates.backImage && uploadedUrls.length > 1) {
        updates.backImage = uploadedUrls[1];
      }
    }

    if (updates.price) {
      updates.price = parseFloat(updates.price);
    }

    updates.updatedAt = new Date().toISOString();

    const { data: updatedProduct, error } = await supabase
      .from('marketplace')
      .update(updates)
      .eq('productId', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return res.status(500).json(formatResponse(false, 'Failed to update product'));
    }

    res.json(formatResponse(true, 'Product updated successfully', updatedProduct));

  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const { error } = await supabase
      .from('marketplace')
      .delete()
      .eq('productId', productId);

    if (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json(formatResponse(false, 'Failed to delete product'));
    }

    res.json(formatResponse(true, 'Product deleted successfully'));

  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.patch('/:productId/status', async (req, res) => {
  try {
    const { productId } = req.params;
    const { status } = req.body;

    if (!['available', 'sold', 'reserved'].includes(status)) {
      return res.status(400).json(formatResponse(false, 'Invalid status'));
    }

    const { data: updatedProduct, error } = await supabase
      .from('marketplace')
      .update({ status, updatedAt: new Date().toISOString() })
      .eq('productId', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating product status:', error);
      return res.status(500).json(formatResponse(false, 'Failed to update product status'));
    }

    res.json(formatResponse(true, 'Product status updated successfully', updatedProduct));

  } catch (error) {
    console.error('Product status update error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

module.exports = router;
