// Hand-written to match supabase/migrations. Regenerate with
// `npx supabase gen types typescript` once the schema grows.
export type AppRole = 'admin' | 'user';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  created_at: string;
  last_sign_in_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_member_role: {
        Args: { member_id: string; new_role: AppRole };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: AppRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
