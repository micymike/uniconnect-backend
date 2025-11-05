const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const { formatResponse } = require('../utils/helpers');
const auth = require('../middleware/auth');

router.get('/me', auth, async (req, res) => {
  try {
    const { userId } = req.user;

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('userId', userId)
      .single();

    if (error || !profile) {
      return res.status(404).json(formatResponse(false, 'Profile not found'));
    }

    const { password, ...profileWithoutPassword } = profile;

    res.json(formatResponse(true, 'Profile fetched successfully', profileWithoutPassword));

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.put('/me', auth, async (req, res) => {
  try {
    const { userId } = req.user;
    const updates = req.body;

    delete updates.userId;
    delete updates.password;
    delete updates.email;

    updates.updatedAt = new Date().toISOString();

    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update(updates)
      .eq('userId', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json(formatResponse(false, 'Failed to update profile'));
    }

    const { password, ...profileWithoutPassword } = updatedProfile;

    res.json(formatResponse(true, 'Profile updated successfully', profileWithoutPassword));

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.post('/change-password', auth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json(formatResponse(false, 'Current password and new password are required'));
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('password')
      .eq('userId', userId)
      .single();

    if (error || !user) {
      return res.status(404).json(formatResponse(false, 'User not found'));
    }

    const { comparePassword, hashPassword } = require('../utils/helpers');
    const isValidPassword = await comparePassword(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(400).json(formatResponse(false, 'Current password is incorrect'));
    }

    const hashedNewPassword = await hashPassword(newPassword);

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: hashedNewPassword, 
        updatedAt: new Date().toISOString() 
      })
      .eq('userId', userId);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return res.status(500).json(formatResponse(false, 'Failed to update password'));
    }

    res.json(formatResponse(true, 'Password updated successfully'));

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.get('/referrals', auth, async (req, res) => {
  try {
    const { userId } = req.user;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('referralCode')
      .eq('userId', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json(formatResponse(false, 'User not found'));
    }

    const { data: referrals, error: referralError } = await supabase
      .from('users')
      .select('userId, username, email, createdAt')
      .eq('referredBy', user.referralCode)
      .order('createdAt', { ascending: false });

    if (referralError) {
      console.error('Error fetching referrals:', referralError);
      return res.status(500).json(formatResponse(false, 'Failed to fetch referrals'));
    }

    res.json(formatResponse(true, 'Referrals fetched successfully', {
      referralCode: user.referralCode,
      referrals: referrals || [],
      totalReferrals: referrals.length
    }));

  } catch (error) {
    console.error('Referrals fetch error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.post('/upload-avatar', auth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json(formatResponse(false, 'Avatar URL is required'));
    }

    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update({ 
        googlePhotoUrl: avatarUrl,
        updatedAt: new Date().toISOString()
      })
      .eq('userId', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating avatar:', error);
      return res.status(500).json(formatResponse(false, 'Failed to update avatar'));
    }

    const { password, ...profileWithoutPassword } = updatedProfile;

    res.json(formatResponse(true, 'Avatar updated successfully', profileWithoutPassword));

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

router.delete('/me', auth, async (req, res) => {
  try {
    const { userId } = req.user;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('userId', userId);

    if (error) {
      console.error('Error deleting account:', error);
      return res.status(500).json(formatResponse(false, 'Failed to delete account'));
    }

    res.json(formatResponse(true, 'Account deleted successfully'));

  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json(formatResponse(false, 'Internal server error'));
  }
});

module.exports = router;
