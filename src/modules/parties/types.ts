export type PartyType = 'vendor' | 'customer' | 'both';

export interface PartyRecord {
  id: string;
  name: string;
  partyType: PartyType;
  contactPerson: string;
  phone: string;
  altPhone: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string;
  panNumber: string;
  openingBalance: number;
  creditLimit: number;
  remarks: string;
  isActive: boolean;
  createdAt: string;
}

export type PartyFilters = {
  search: string;
  status: 'all' | 'active' | 'inactive';
  partyType: 'all' | PartyType;
};
