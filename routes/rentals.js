const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
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

router.post('/property/create', upload.array('images', 10), async (req, res) => {
  try {
    const {
      title,
      description,
      address,
      price,
      type,
      bedrooms,
      bathrooms,
      area,
      amenities,
      landlordId,
      contactInfo,
      availability
    } = req.body;

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(
        req.files.map(file => uploadImage(file.buffer, file.originalname))
      );
    }

    const propertyId = generateUniqueId();
    
    const { data: newProperty, error } = await supabase
      .from('rental_properties')
      .insert({
        propertyId,
        title,
        description,
        address,
        price: parseFloat(price),
        type,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        area: parseFloat(area),
        images: JSON.stringify(imageUrls),
        amenities: amenities ? JSON.parse(amenities) : [],
        landlordId,
        contactInfo: contactInfo ? JSON.parse(contactInfo) : null,
        availability: availability || 'available',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      return res.status(500).json(formatResponse(false, 'Failed to create property'));
    }

    res.status(201).json(formatResponse(true, 'Property created successfully', {
      ...newProperty,
      images: JSON.parse(newProperty.images),
      amenities: JSON.parse(newProperty.amenities)
    }));

  } catch (error) {
    console.error('Property creation error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.get('/properties', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, minPrice, maxPrice, bedrooms, location } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('rental_properties')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .eq('availability', 'available')
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('type', type);
    }

    if (bedrooms) {
      query = query.gte('bedrooms', parseInt(bedrooms));
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    if (location) {
      query = query.or(`address.ilike.%${location}%,title.ilike.%${location}%`);
    }

    const { data: properties, error, count } = await query;

    if (error) {
      console.error('Error fetching properties:', error);
      return res.status(500).json(formatResponse(false, 'Failed to fetch properties'));
    }

    const processedProperties = properties.map(property => ({
      ...property,
      images: property.images ? JSON.parse(property.images) : [],
      amenities: property.amenities ? JSON.parse(property.amenities) : [],
      contactInfo: property.contactInfo ? JSON.parse(property.contactInfo) : null
    }));

    res.json(formatResponse(true, 'Properties fetched successfully', {
      properties: processedProperties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }));

  } catch (error) {
    console.error('Properties fetch error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.get('/property/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;

    const { data: property, error } = await supabase
      .from('rental_properties')
      .select('*')
      .eq('propertyId', propertyId)
      .single();

    if (error || !property) {
      return res.status(404).json(formatResponse(false, 'Property not found'));
    }

    const processedProperty = {
      ...property,
      images: property.images ? JSON.parse(property.images) : [],
      amenities: property.amenities ? JSON.parse(property.amenities) : [],
      contactInfo: property.contactInfo ? JSON.parse(property.contactInfo) : null
    };

    res.json(formatResponse(true, 'Property fetched successfully', processedProperty));

  } catch (error) {
    console.error('Property fetch error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.post('/inquiry', async (req, res) => {
  try {
    const { propertyId, tenantId, message, contactInfo, moveInDate } = req.body;

    const inquiryId = generateUniqueId();
    
    const { data: newInquiry, error } = await supabase
      .from('rental_inquiries')
      .insert({
        inquiryId,
        propertyId,
        tenantId,
        message,
        contactInfo: contactInfo ? JSON.parse(contactInfo) : null,
        moveInDate,
        status: 'pending',
        createdAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating inquiry:', error);
      return res.status(500).json(formatResponse(false, 'Failed to create inquiry'));
    }

    res.status(201).json(formatResponse(true, 'Inquiry created successfully', newInquiry));

  } catch (error) {
    console.error('Inquiry creation error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.get('/landlord/:landlordId/properties', async (req, res) => {
  try {
    const { landlordId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { data: properties, error, count } = await supabase
      .from('rental_properties')
      .select('*', { count: 'exact' })
      .eq('landlordId', landlordId)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching landlord properties:', error);
      return res.status(500).json(formatResponse(false, 'Failed to fetch properties'));
    }

    const processedProperties = properties.map(property => ({
      ...property,
      images: property.images ? JSON.parse(property.images) : [],
      amenities: property.amenities ? JSON.parse(property.amenities) : []
    }));

    res.json(formatResponse(true, 'Properties fetched successfully', {
      properties: processedProperties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }));

  } catch (error) {
    console.error('Landlord properties fetch error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.patch('/property/:propertyId/status', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { status, availability } = req.body;

    const updates = { updatedAt: new Date().toISOString() };

    if (status && ['active', 'inactive', 'rented'].includes(status)) {
      updates.status = status;
    }

    if (availability && ['available', 'rented', 'maintenance'].includes(availability)) {
      updates.availability = availability;
    }

    const { data: updatedProperty, error } = await supabase
      .from('rental_properties')
      .update(updates)
      .eq('propertyId', propertyId)
      .select()
      .single();

    if (error) {
      console.error('Error updating property status:', error);
      return res.status(500).json(formatResponse(false, 'Failed to update property status'));
    }

    res.json(formatResponse(true, 'Property status updated successfully', updatedProperty));

  } catch (error) {
    console.error('Property status update error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

module.exports = router;
