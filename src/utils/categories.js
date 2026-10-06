import { UtensilsCrossed, Car, Bed, ShoppingBag, MoreHorizontal } from 'lucide-react';

export const CATEGORIES = [
  { value: 'food', label: 'Food', icon: UtensilsCrossed, color: '#f97316', bg: '#fff1e6' },
  { value: 'travel', label: 'Travel', icon: Car, color: '#0f766e', bg: '#e6f5f3' },
  { value: 'stay', label: 'Stay', icon: Bed, color: '#7c3aed', bg: '#f1ebfd' },
  { value: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#db2777', bg: '#fdebf3' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: '#64748b', bg: '#f1f5f9' },
];

export function getCategoryMeta(value) {
  return CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1];
}
