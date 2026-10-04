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
  cost_price?: number;
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

export interface TransactionItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  costPrice?: number;
  unit?: string;
  subtotal?: number;
}

export interface Transaction {
  id: string;
  umkm_id?: string;
  created_at: string;
  transaction_date?: string;
  type: 'IN' | 'OUT';
  category?: string;
  payment_method: 'CASH' | 'CREDIT';
  total_amount: number;
  items: TransactionItem[];
  debt_id?: string | null;
}
