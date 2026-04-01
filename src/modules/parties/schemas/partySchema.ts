import { z } from 'zod';

const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const partyFormSchema = z.object({
  name: z.string().trim().min(1, 'Party name is required').max(150),
  partyType: z.enum(['vendor', 'customer', 'both'], { required_error: 'Party type is required' }),
  contactPerson: z.string().trim().max(100).optional().or(z.literal('')),
  phone: z.string().trim().max(15).optional().or(z.literal(''))
    .refine((v) => !v || /^[0-9]{10,15}$/.test(v), 'Phone must be 10-15 digits'),
  altPhone: z.string().trim().max(15).optional().or(z.literal(''))
    .refine((v) => !v || /^[0-9]{10,15}$/.test(v), 'Phone must be 10-15 digits'),
  email: z.string().trim().max(255).optional().or(z.literal(''))
    .refine((v) => !v || z.string().email().safeParse(v).success, 'Invalid email format'),
  address1: z.string().trim().max(250).optional().or(z.literal('')),
  address2: z.string().trim().max(250).optional().or(z.literal('')),
  city: z.string().trim().max(100).optional().or(z.literal('')),
  state: z.string().trim().max(100).optional().or(z.literal('')),
  pincode: z.string().trim().max(10).optional().or(z.literal('')),
  gstNumber: z.string().trim().optional().or(z.literal(''))
    .refine((v) => !v || gstRegex.test(v), 'Invalid GST format (e.g. 27AABCU9603R1ZM)'),
  panNumber: z.string().trim().max(10).optional().or(z.literal(''))
    .refine((v) => !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v), 'Invalid PAN format'),
  openingBalance: z.coerce.number().min(0).optional().or(z.literal(0)),
  creditLimit: z.coerce.number().min(0).optional().or(z.literal(0)),
  remarks: z.string().trim().max(500).optional().or(z.literal('')),
  isActive: z.boolean(),
});

export type PartyFormValues = z.infer<typeof partyFormSchema>;

export const defaultPartyValues: PartyFormValues = {
  name: '',
  partyType: 'vendor',
  contactPerson: '',
  phone: '',
  altPhone: '',
  email: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  pincode: '',
  gstNumber: '',
  panNumber: '',
  openingBalance: 0,
  creditLimit: 0,
  remarks: '',
  isActive: true,
};
