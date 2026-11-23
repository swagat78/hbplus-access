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

export type AuthEventKind = 'signed_in' | 'role_changed';

export type AuthEvent = {
  id: number;
  user_id: string;
  actor_id: string | null;
  kind: AuthEventKind;
  detail: { from?: AppRole; to?: AppRole };
  created_at: string;
};

export type TeamOverview = {
  members: number;
  admins: number;
  active_week: number;
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
      auth_events: {
        Row: AuthEvent;
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'auth_events_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'auth_events_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_member_role: {
        Args: { member_id: string; new_role: AppRole };
        Returns: undefined;
      };
      team_overview: {
        Args: Record<string, never>;
        Returns: TeamOverview;
      };
    };
    Enums: {
      app_role: AppRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
