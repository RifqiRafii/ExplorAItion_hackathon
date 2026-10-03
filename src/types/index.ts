export interface UserSession {
  id: string;
  email: string;
  store_name: string;
  owner_name: string;
  phone_number?: string;
  warung_name?: string;
}

export interface Product {
  id: string;
  umkm_id: string;
  name: string;
  price: number;
  stock: number;
  min_stock: number;
  unit: string;
  created_at?: string;
}

export interface Debt {
  id: string;
  umkm_id: string;
  customer_name: string;
  customer_phone?: string | null;
  amount: number;
  due_date: string;
  status: 'UNPAID' | 'PAID';
  created_at?: string;
  related_trx_id?: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'model';
  content: string;
}
