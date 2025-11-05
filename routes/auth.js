const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const { validateSignup, validateLogin } = require('../middleware/validation');
const { generateReferralCode, hashPassword, comparePassword, generateToken, formatResponse } = require('../utils/helpers');
const { v4: uuidv4 } = require('uuid');

router.post('/signup', validateSignup, async (req, res) => {
  try {
    const { email, password, username, googlePhotoUrl, referredByCode, emailpasswordBoolean, pushToken } = req.body;

    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser && !checkError) {
      return res.status(400).json(formatResponse(false, 'Email is already taken'));
    }

    const hashedPassword = await hashPassword(password);
    
    let referralCode;
    let isUnique = false;

    while (!isUnique) {
      referralCode = generateReferralCode(username);
      
      const { data: codeCheck } = await supabase
        .from('users')
        .select('referralCode')
        .eq('referralCode', referralCode)
        .single();

      if (!codeCheck) {
        isUnique = true;
      }
    }

    let referredBy = null;
    if (referredByCode) {
      const { data: referrer } = await supabase
        .from('users')
        .select('referralCode')
        .eq('referralCode', referredByCode)
        .single();

      if (referrer) {
        referredBy = referredByCode;
      }
    }

    const userId = uuidv4();
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        userId,
        username,
        email,
        accountType: 'offer',
        acceptedTerms: true,
        googlePhotoUrl: googlePhotoUrl || null,
        referralCode,
        referredBy,
        emailpassword: emailpasswordBoolean || true,
        pushToken: pushToken || null,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return res.status(500).json(formatResponse(false, 'Failed to create user'));
    }

    const token = generateToken({ 
      userId: newUser.userId, 
      email: newUser.email 
    });

    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json(formatResponse(true, 'User created successfully', {
      user: userWithoutPassword,
      token
    }));

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json(formatResponse(false, 'Invalid credentials'));
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json(formatResponse(false, 'Invalid credentials'));
    }

    const token = generateToken({ 
      userId: user.userId, 
      email: user.email 
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json(formatResponse(true, 'Login successful', {
      user: userWithoutPassword,
      token
    }));

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.post('/google', async (req, res) => {
  try {
    const { email, username, googlePhotoUrl, pushToken } = req.body;

    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser && !checkError) {
      const token = generateToken({ 
        userId: existingUser.userId, 
        email: existingUser.email 
      });

      const { password: _, ...userWithoutPassword } = existingUser;

      return res.json(formatResponse(true, 'Login successful', {
        user: userWithoutPassword,
        token
      }));
    }

    let referralCode;
    let isUnique = false;

    while (!isUnique) {
      referralCode = generateReferralCode(username);
      
      const { data: codeCheck } = await supabase
        .from('users')
        .select('referralCode')
        .eq('referralCode', referralCode)
        .single();

      if (!codeCheck) {
        isUnique = true;
      }
    }

    const userId = uuidv4();
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        userId,
        username,
        email,
        accountType: 'offer',
        acceptedTerms: true,
        googlePhotoUrl,
        referralCode,
        emailpassword: false,
        pushToken,
        password: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating Google user:', createError);
      return res.status(500).json(formatResponse(false, 'Failed to create user'));
    }

    const token = generateToken({ 
      userId: newUser.userId, 
      email: newUser.email 
    });

    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json(formatResponse(true, 'User created successfully', {
      user: userWithoutPassword,
      token
    }));

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.get('/verify-token', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json(formatResponse(false, 'No token provided'));
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('userId', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json(formatResponse(false, 'Invalid token'));
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json(formatResponse(true, 'Token is valid', { user: userWithoutPassword }));

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json(formatResponse(false, 'Invalid token'));
  }
});

module.exports = router;
