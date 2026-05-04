export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Domain interfaces (usadas en todo el proyecto) ────────────────────────

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  default_locale: string;
  active_locales: string[];
  currency: string;
  timezone: string;
  logo_url: string | null;
  brand_color_primary: string;
  brand_color_bg: string;
  brand_color_text: string;
  brand_color_surface: string;
  brand_color_border: string;
  brand_color_dark_bg: string;
  brand_color_dark_surface: string;
  brand_color_dark_text: string;
  brand_color_dark_border: string;
  brand_font_heading: string;
  brand_font_body: string;
  brand_radius: string;
  hero_headline: Record<string, string>;
  hero_subtext: Record<string, string>;
  hero_cta: Record<string, string>;
  feature_store: boolean;
  feature_inventory: boolean;
  feature_loyalty: boolean;
  feature_referrals: boolean;
  feature_reviews: boolean;
  feature_solar: boolean;
  feature_sales_history: boolean;
  feature_whatsapp_bot: boolean;
  points_per_service: number;
  points_per_purchase: number;
  referral_bonus_pts: number;
  cancellation_penalty: number;
  /**
   * Plan de suscripción del tenant.
   * Nombres actuales: starter | premium | premium_plus
   * Nombres legacy mantenidos por compat: pro | white_label | free
   * feature_solar y feature_whatsapp_bot son add-ons independientes del plan.
   */
  plan: "starter" | "premium" | "premium_plus" | "pro" | "white_label" | "free";
  active: boolean;
  created_at: string;
}

/**
 * Roles del sistema:
 * - "admin"        → Dueña / propietaria: control total
 * - "trabajadora"  → Especialista del spa: solo lectura de su agenda
 * - "recepcionista"→ Recepcionista: gestiona citas, no configuración
 * - "cliente"      → Cliente final: agenda, puntos, perfil
 */
export type UserRole = "admin" | "trabajadora" | "recepcionista" | "cliente";

export type Profile = {
  id: string;
  tenant_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  referral_code: string;
  referred_by: string | null;
  loyalty_points: number;
  preferred_theme: "light" | "dark" | "system";
  preferred_locale: string;
  notifications_promo: boolean;
  notifications_tips: boolean;
  push_subscription: Json | null;
  /** Token único para el feed iCal privado (/api/calendar/[token].ics) */
  calendar_sync_token: string | null;
  created_at: string;
}

export type Specialist = {
  id: string;
  tenant_id: string;
  profile_id: string | null;
  name: string;
  bio: Record<string, string> | null;
  avatar_url: string | null;
  services: string[];
  active: boolean;
  created_at: string;
}

export type SpecialistSchedule = {
  id: string;
  specialist_id: string;
  tenant_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_working: boolean;
}

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type Appointment = {
  id: string;
  tenant_id: string;
  client_id: string;
  specialist_id: string | null;
  service_id: string;
  scheduled_at: string;
  ends_at: string;
  status: AppointmentStatus;
  notes: string | null;
  points_earned: number;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
}

export type AvailableSlot = {
  time: string;
  specialist_id: string;
  specialist_name: string;
  specialist_avatar: string | null;
}

export type Product = {
  id: string;
  tenant_id: string;
  name: Record<string, string>;
  description: Record<string, string> | null;
  price: number;
  stock: number;
  /** En la DB puede ser low_stock_threshold; alias para compatibilidad local */
  stock_alert_threshold: number;
  category: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export type Service = {
  id: string;
  tenant_id: string;
  name: Record<string, string>;
  description: Record<string, string> | null;
  duration_min: number;
  price: number;
  category: string | null;
  image_url: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export type SystemNotification = {
  id: string;
  tenant_id: string;
  user_id: string;
  type: "appointment" | "inventory" | "marketing" | "system";
  title: Record<string, string>;
  content: Record<string, string>;
  read: boolean;
  created_at: string;
}

export type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";

export type Order = {
  id: string;
  tenant_id: string;
  client_id: string;
  total: number;
  points_used: number;
  status: OrderStatus;
  created_at: string;
}

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}

export type InventoryMovement = {
  id: string;
  tenant_id: string;
  product_id: string;
  type: "entrada" | "salida" | "ajuste";
  quantity: number;
  reason: string | null;
  created_at: string;
}

export type LoyaltyTransaction = {
  id: string;
  tenant_id: string;
  client_id: string;
  type: "ganados" | "canjeados";
  amount: number;
  reason: Record<string, string>;
  reference_id: string | null;
  created_at: string;
}

export type Coupon = {
  id: string;
  tenant_id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  amount: number;
  min_purchase: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

export type Review = {
  id: string;
  tenant_id: string;
  client_id: string;
  appointment_id: string | null;
  rating: number;
  comment: string | null;
  status: "pending" | "approved" | "rejected";
  admin_reply: string | null;
  points_awarded: boolean;
  created_at: string;
}

/**
 * Plan de tratamiento multi-sesión.
 * Ej: "Lifting de pestañas – 6 sesiones".
 */
export type TreatmentPlan = {
  id: string;
  tenant_id: string;
  client_id: string;
  service_id: string;
  /** Nombre del plan (legado free-text para mostrar en UI) */
  name: Record<string, string>;
  total_sessions: number;
  completed_sessions: number;
  notes: string | null;
  started_at: string;
  /** Fecha límite para completar el plan (null = sin vencimiento) */
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

export type TreatmentSessionStatus = "scheduled" | "completed" | "skipped" | "missed";

export type TreatmentSession = {
  id: string;
  plan_id: string;
  tenant_id: string;
  appointment_id: string | null;
  session_number: number;
  status: TreatmentSessionStatus;
  notes: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export type FeatureFlag = keyof Pick<
  Tenant,
  | "feature_store"
  | "feature_inventory"
  | "feature_loyalty"
  | "feature_referrals"
  | "feature_reviews"
  | "feature_solar"
  | "feature_sales_history"
  | "feature_whatsapp_bot"
>;

// ─── Database (formato requerido por Supabase JS v2) ──────────────────────
//
// IMPORTANTE: usar `type` (no `interface`) y Functions vacío.
// Supabase JS v2 evalúa `Database["public"] extends GenericSchema` en un
// conditional type genérico. Si la evaluación falla (p.ej. Returns: void),
// el Schema cae a Record<string, unknown> y TODO vuelve `never`.
// Los RPCs se llaman con cast explícito `as any` donde sea necesario.

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: Partial<Tenant> & { slug: string; name: string };
        Update: Partial<Tenant>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; tenant_id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      specialists: {
        Row: Specialist;
        Insert: Partial<Specialist> & { tenant_id: string; name: string };
        Update: Partial<Specialist>;
        Relationships: [];
      };
      specialist_schedules: {
        Row: SpecialistSchedule;
        Insert: Partial<SpecialistSchedule> & {
          specialist_id: string;
          tenant_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
        };
        Update: Partial<SpecialistSchedule>;
        Relationships: [];
      };
      appointments: {
        Row: Appointment;
        Insert: Omit<Appointment, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Appointment>;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: Partial<Product> & { tenant_id: string; name: Record<string, string>; price: number };
        Update: Partial<Product>;
        Relationships: [];
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Order>;
        Relationships: [];
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, "id"> & { id?: string };
        Update: Partial<OrderItem>;
        Relationships: [];
      };
      inventory_movements: {
        Row: InventoryMovement;
        Insert: Omit<InventoryMovement, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<InventoryMovement>;
        Relationships: [];
      };
      loyalty_transactions: {
        Row: LoyaltyTransaction;
        Insert: Omit<LoyaltyTransaction, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<LoyaltyTransaction>;
        Relationships: [];
      };
      // alias usado en legacy code (point_movements)
      point_movements: {
        Row: LoyaltyTransaction;
        Insert: Omit<LoyaltyTransaction, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<LoyaltyTransaction>;
        Relationships: [];
      };
      coupons: {
        Row: Coupon;
        Insert: Partial<Coupon> & { tenant_id: string; code: string; amount: number };
        Update: Partial<Coupon>;
        Relationships: [];
      };
      reviews: {
        Row: Review;
        Insert: Partial<Review> & { tenant_id: string; client_id: string; rating: number };
        Update: Partial<Review>;
        Relationships: [];
      };
      services: {
        Row: Service;
        Insert: Partial<Service> & { tenant_id: string; name: Record<string, string>; price: number; duration_min: number };
        Update: Partial<Service>;
        Relationships: [];
      };
      notifications: {
        Row: SystemNotification;
        Insert: Partial<SystemNotification> & { tenant_id: string; user_id: string; type: SystemNotification["type"]; title: Record<string, string>; content: Record<string, string> };
        Update: Partial<SystemNotification>;
        Relationships: [];
      };
      treatment_plans: {
        Row: TreatmentPlan;
        Insert: Partial<TreatmentPlan> & { tenant_id: string; client_id: string; service_id: string; name: Record<string, string>; total_sessions: number };
        Update: Partial<TreatmentPlan>;
        Relationships: [];
      };
      treatment_sessions: {
        Row: TreatmentSession;
        Insert: Partial<TreatmentSession> & { plan_id: string; tenant_id: string; session_number: number };
        Update: Partial<TreatmentSession>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    // Funciones/RPCs: mantener vacío para que Database["public"] satisfaga
    // GenericSchema. Los RPCs se invocan con supabase.rpc("fn", args as any).
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
