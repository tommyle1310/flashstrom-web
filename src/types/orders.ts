export interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string;
  driver_id: string;
  distance: string;
  driver_wage: number | null;
  status: string;
  total_amount: string;
  delivery_fee: string;
  service_fee: string;
  payment_status: string;
  payment_method: string;
  customer_location: string;
  restaurant_location: string;
  order_items: {
    item: { avatar: { url: string; key: string } };
    name: string;
    item_id: string;
    quantity: number;
    variant_id: string;
    price_at_time_of_order: number;
  }[];
  customer_note: string;
  restaurant_note: string;
  order_time: string;
  delivery_time: string;
  tracking_info: string;
  driver_tips: string;
  created_at: number;
  updated_at: number;
  cancelled_by: string | null;
  cancelled_by_id: string | null;
  cancellation_reason: string | null;
  cancellation_title: string | null;
  cancellation_description: string | null;
  cancelled_at: number | null;
  customer?: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    avatar: { key: string; url: string };
    favorite_items: any | null;
    support_tickets: any | null;
    app_preferences: any | null;
    restaurant_history: any | null;
    created_at: number;
    updated_at: number;
  };
  restaurant?: {
    id: string;
    owner_id: string;
    owner_name: string;
    address_id: string;
    restaurant_name: string;
    description: string | null;
    contact_email: { email: string; title: string; is_default: boolean }[];
    contact_phone: { title: string; number: string; is_default: boolean }[];
    avatar: { key: string; url: string };
    images_gallery: any | null;
    status: {
      is_open: boolean;
      is_active: boolean;
      is_accepted_orders: boolean;
    };
    ratings: any | null;
    opening_hours: {
      [key: string]: { to: number; from: number };
    };
    created_at: number;
    updated_at: number;
    total_orders: number;
  };
  driver?: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    avatar: { key: string; url: string };
    contact_email: { email: string; title: string; is_default: boolean }[];
    contact_phone: { title: string; is_default: boolean }[];
    vehicle: {
      year: number;
      brand: string;
      color: string;
      model: string;
      owner: string;
      images: { key: string; url: string }[];
      license_plate: string;
    };
    current_location: { lat: number; lng: number };
    rating: { review_count: number; average_rating: number };
    available_for_work: boolean;
    is_on_delivery: boolean;
    active_points: number;
    created_at: number;
    updated_at: number;
    last_login: number | null;
  };
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  contact_email: {
    email: string;
    title: string;
    is_default: boolean;
  }[];
  contact_phone: {
    number: string;
    title: string;
    is_default: boolean;
  }[];
  avatar: {
    key: string;
    url: string;
  } | null;
  total_orders: number;
  total_spent: number;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}
