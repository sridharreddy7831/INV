import { z } from 'zod';

export const sendOtpSchema = z.object({
    phone: z.string().min(10, 'Valid phone number required'),
});

export const verifyOtpSchema = z.object({
    phone: z.string().min(10),
    otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const signupSchema = z.object({
    phone: z.string().min(10),
    name: z.string().min(1, 'Name is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginPasswordSchema = z.object({
    phone: z.string().min(10),
    password: z.string().min(1),
});

export const setPasswordSchema = z.object({
    password: z.string().min(6),
});

export const addressSchema = z.object({
    label: z.string().optional().default('Home'),
    name: z.string().min(1),
    phone: z.string().min(10),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(5),
    isDefault: z.boolean().optional().default(false),
});

export const wishlistSchema = z.object({
    productId: z.string().min(1),
});
