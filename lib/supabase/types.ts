export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Tenant ──────────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  slug: string;
  name: string;

  // Localización
  default_locale: string;
  active_locales: string[];
  currency: string;
  timezone: string;

  // Branding
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

  // Textos del home (JSONB por locale)
  hero_headline: Record<string, string>;
  hero_subtext: Record<string, string>;
  hero_cta: Record<string, string>;

  // Feature flags
  feature_store: boolean;
  feature_inventory: boolean;
  feature_loyalty: boolean;
  feature_referrals: boolean;
  feature_reviews: boolean;
  feature_solar: boolean;
  feature_sales_history: boolean;
  feature_whatsapp_bot: boolean;

  // Configuración de fidelización
  points_per_service: number;
  points_per_purchase: number;
  referral_bonus_pts: number;
  cancellation_penalty: number;

  // Plan
  plan: "starter" | "pro" | "premium";
  active: boolean;
  created_at: string;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  tenant_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "cliente" | "recepcionista" | "admin";
  referral_code: string;
  referred_by: string | null;
  loyalty_points: number;
  preferred_theme: "light" | "dark" | "system";
  preferred_locale: string;
  notifications_promo: boolean;
  notifications_tips: boolean;
  created_at: string;
}

// ─── Specialist ──────────────────────────────────────────────────────────────

export interface Specialist {
  id: string;
  tenant_id: string;
  profile_id: string | null;
  name: string;
  bio: Record<string, string> | null;
  avatar_url: string | null;
  services: string[]; // service IDs
  active: boolean;
  created_at: string;
}

// ─── SpecialistSchedule ───────────────────────────────────────────────────────

export interface SpecialistSchedule {
  id: string;
  specialist_id: string;
  tenant_id: string;
  day_of_week: number; // 0=domingo … 6=sábado
  start_time: string;  // "HH:MM:SS"
  end_time: string;    // "HH:MM:SS"
  is_working: boolean;
}

// ─── Appointment ─────────────────────────────────────────────────────────────

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  tenant_id: string;
  client_id: string;
  specialist_id: string | null;
  service_id: string;
  scheduled_at: string; // ISO
  ends_at: string;      // ISO
  status: AppointmentStatus;
  notes: string | null;
  points_earned: number;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
}

// ─── Slot disponible (calculado, no en DB) ────────────────────────────────────

export interface AvailableSlot {
  time: string;          // "HH:MM" — hora local del tenant
  specialist_id: string;
  specialist_name: string;
  specialist_avatar: string | null;
}

// ─── Feature flags helpers ────────────────────────────────────────────────────

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

// ─── Database ─────────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: Partial<Tenant> & { slug: string; name: string };
        Update: Partial<Tenant>;
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; tenant_id: string };
        Update: Partial<Profile>;
      };
      specialists: {
        Row: Specialist;
        Insert: Partial<Specialist> & { tenant_id: string; name: string };
        Update: Partial<Specialist>;
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
      };
      appointments: {
        Row: Appointment;
        Insert: Partial<Appointment> & {
          tenant_id: string;
          client_id: string;
          service_id: string;
          scheduled_at: string;
          ends_at: string;
        };
        Update: Partial<Appointment>;
      };
    };
  };
}
