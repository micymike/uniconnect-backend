const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const { validateMeal } = require('../middleware/validation');
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

router.post('/create', upload.array('images', 5), validateMeal, async (req, res) => {
  try {
    const { title, description, price, location, restaurantName, deliveryOptions, category, tags, ingredients } = req.body;
    
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(
        req.files.map(file => uploadImage(file.buffer, file.originalname))
      );
    }

    const mealId = generateUniqueId();
    
    const { data: newMeal, error } = await supabase
      .from('meal_posts')
      .insert({
        mealId,
        title,
        description,
        price: parseFloat(price),
        images: JSON.stringify(imageUrls),
        location,
        restaurantName,
        deliveryOptions: deliveryOptions ? JSON.parse(deliveryOptions) : [],
        category: category || 'General',
        tags: tags ? JSON.parse(tags) : [],
        ingredients: ingredients ? JSON.parse(ingredients) : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating meal:', error);
      return res.status(500).json(formatResponse(false, 'Failed to create meal'));
    }

    res.status(201).json(formatResponse(true, 'Meal created successfully', newMeal));

  } catch (error) {
    console.error('Meal creation error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, location } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('meal_posts')
      .select('*', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    const { data: meals, error, count } = await query;

    if (error) {
      console.error('Error fetching meals:', error);
      return res.status(500).json(formatResponse(false, 'Failed to fetch meals'));
    }

    const processedMeals = meals.map(meal => ({
      ...meal,
      images: meal.images ? JSON.parse(meal.images) : [],
      deliveryOptions: meal.deliveryOptions ? JSON.parse(meal.deliveryOptions) : [],
      tags: meal.tags ? JSON.parse(meal.tags) : [],
      ingredients: meal.ingredients ? JSON.parse(meal.ingredients) : []
    }));

    res.json(formatResponse(true, 'Meals fetched successfully', {
      meals: processedMeals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }));

  } catch (error) {
    console.error('Meals fetch error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.get('/:mealId', async (req, res) => {
  try {
    const { mealId } = req.params;

    const { data: meal, error } = await supabase
      .from('meal_posts')
      .select('*')
      .eq('mealId', mealId)
      .single();

    if (error || !meal) {
      return res.status(404).json(formatResponse(false, 'Meal not found'));
    }

    const processedMeal = {
      ...meal,
      images: meal.images ? JSON.parse(meal.images) : [],
      deliveryOptions: meal.deliveryOptions ? JSON.parse(meal.deliveryOptions) : [],
      tags: meal.tags ? JSON.parse(meal.tags) : [],
      ingredients: meal.ingredients ? JSON.parse(meal.ingredients) : []
    };

    res.json(formatResponse(true, 'Meal fetched successfully', processedMeal));

  } catch (error) {
    console.error('Meal fetch error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.put('/:mealId', upload.array('images', 5), async (req, res) => {
  try {
    const { mealId } = req.params;
    const updates = req.body;

    if (req.files && req.files.length > 0) {
      const newImageUrls = await Promise.all(
        req.files.map(file => uploadImage(file.buffer, file.originalname))
      );
      
      const { data: existingMeal } = await supabase
        .from('meal_posts')
        .select('images')
        .eq('mealId', mealId)
        .single();
      
      const existingImages = existingMeal?.images ? JSON.parse(existingMeal.images) : [];
      updates.images = JSON.stringify([...existingImages, ...newImageUrls]);
    }

    updates.updatedAt = new Date().toISOString();

    const { data: updatedMeal, error } = await supabase
      .from('meal_posts')
      .update(updates)
      .eq('mealId', mealId)
      .select()
      .single();

    if (error) {
      console.error('Error updating meal:', error);
      return res.status(500).json(formatResponse(false, 'Failed to update meal'));
    }

    res.json(formatResponse(true, 'Meal updated successfully', updatedMeal));

  } catch (error) {
    console.error('Meal update error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.delete('/:mealId', async (req, res) => {
  try {
    const { mealId } = req.params;

    const { error } = await supabase
      .from('meal_posts')
      .delete()
      .eq('mealId', mealId);

    if (error) {
      console.error('Error deleting meal:', error);
      return res.status(500).json(formatResponse(false, 'Failed to delete meal'));
    }

    res.json(formatResponse(true, 'Meal deleted successfully'));

  } catch (error) {
    console.error('Meal deletion error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

module.exports = router;
