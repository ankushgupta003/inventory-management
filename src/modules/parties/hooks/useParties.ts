import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { PartyRecord, PartyFilters } from '../types';

const SEED_DATA: PartyRecord[] = [
  { id: '1', name: 'ABC Steel Suppliers', partyType: 'vendor', contactPerson: 'Rajesh Kumar', phone: '9876543210', altPhone: '', email: 'rajesh@abcsteel.com', address1: 'Plot 45, MIDC', address2: 'Andheri East', city: 'Mumbai', state: 'Maharashtra', pincode: '400093', gstNumber: '27AABCU9603R1ZM', panNumber: 'AABCU9603R', openingBalance: 50000, creditLimit: 200000, remarks: 'Primary steel vendor', isActive: true, createdAt: '2024-01-10' },
  { id: '2', name: 'XYZ Industries Pvt Ltd', partyType: 'customer', contactPerson: 'Suresh Reddy', phone: '9123456789', altPhone: '9123456700', email: 'suresh@xyzindustries.com', address1: '12, Industrial Area', address2: '', city: 'Bangalore', state: 'Karnataka', pincode: '560058', gstNumber: '29AADCX0489R1ZN', panNumber: 'AADCX0489R', openingBalance: 0, creditLimit: 500000, remarks: '', isActive: true, createdAt: '2024-01-12' },
  { id: '3', name: 'PQR Trading Co.', partyType: 'both', contactPerson: 'Amit Shah', phone: '9988776655', altPhone: '', email: 'amit@pqrtrade.com', address1: 'Shop 9, Market Road', address2: '', city: 'Ahmedabad', state: 'Gujarat', pincode: '380015', gstNumber: '24AAECR1234M1ZP', panNumber: '', openingBalance: 15000, creditLimit: 100000, remarks: 'Both vendor and customer', isActive: true, createdAt: '2024-02-05' },
  { id: '4', name: 'Metro Hardware', partyType: 'vendor', contactPerson: 'Deepak Joshi', phone: '9871234567', altPhone: '', email: '', address1: 'Main Bazaar', address2: '', city: 'Pune', state: 'Maharashtra', pincode: '411001', gstNumber: '', panNumber: '', openingBalance: 0, creditLimit: 50000, remarks: 'Local hardware vendor, no GST', isActive: true, createdAt: '2024-03-01' },
  { id: '5', name: 'Sharma Enterprises', partyType: 'customer', contactPerson: 'Vikram Sharma', phone: '9900112233', altPhone: '', email: 'vikram@sharma.com', address1: '56 Ring Road', address2: 'Near Bus Stand', city: 'Jaipur', state: 'Rajasthan', pincode: '302001', gstNumber: '08AABCS1234M1ZP', panNumber: 'AABCS1234M', openingBalance: 25000, creditLimit: 300000, remarks: '', isActive: false, createdAt: '2024-03-15' },
];

export function useParties() {
  const [parties, setParties] = useState<PartyRecord[]>(SEED_DATA);
  const [filters, setFilters] = useState<PartyFilters>({ search: '', status: 'all', partyType: 'all' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(timerRef.current);
  }, [filters.search]);

  const filtered = useMemo(() => {
    return parties.filter((p) => {
      const q = debouncedSearch.toLowerCase();
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.gstNumber.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.contactPerson.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q);
      const matchStatus = filters.status === 'all' ||
        (filters.status === 'active' ? p.isActive : !p.isActive);
      const matchType = filters.partyType === 'all' || p.partyType === filters.partyType;
      return matchSearch && matchStatus && matchType;
    });
  }, [parties, debouncedSearch, filters.status, filters.partyType]);

  const addParty = useCallback((data: Omit<PartyRecord, 'id' | 'createdAt'>) => {
    const newParty: PartyRecord = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString().split('T')[0] };
    setParties((prev) => [newParty, ...prev]);
    return newParty;
  }, []);

  const updateParty = useCallback((id: string, data: Partial<PartyRecord>) => {
    setParties((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  }, []);

  const toggleStatus = useCallback((id: string) => {
    setParties((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)));
  }, []);

  return { parties: filtered, allParties: parties, filters, setFilters, addParty, updateParty, toggleStatus };
}
