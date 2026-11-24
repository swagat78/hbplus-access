// Hand-written to match supabase/migrations. Regenerate with
// `npx supabase gen types typescript` once the schema grows.
export type AppRole = 'admin' | 'user';
export type MemberStatus = 'active' | 'suspended';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  // Optional so the app still works before the admin-panel migration runs.
  status?: MemberStatus;
  created_at: string;
  last_sign_in_at: string | null;
};

export type AuthEventKind =
  | 'signed_in'
  | 'role_changed'
  | 'status_changed'
  | 'domain_added'
  | 'domain_removed';

export type AuthEvent = {
  id: number;
  user_id: string | null;
  actor_id: string | null;
  kind: AuthEventKind;
  detail: { from?: string; to?: string; domain?: string };
  created_at: string;
};

export type TeamMemberPreview = {
  id: string;
  name: string;
  avatar_url: string | null;
  last_sign_in_at: string | null;
};

export type TeamOverview = {
  members: number;
  admins: number;
  active_week: number;
  suspended?: number;
  domains?: number;
  recent?: TeamMemberPreview[];
};

export type DailySignIns = {
  bucket: string;
  sign_ins: number;
  people: number;
};

export type DomainRow = {
  domain: string;
  created_at: string;
  members: number;
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
      set_member_status: {
        Args: { member_id: string; new_status: MemberStatus };
        Returns: undefined;
      };
      team_overview: {
        Args: Record<string, never>;
        Returns: TeamOverview;
      };
      allowed_domain_list: {
        Args: Record<string, never>;
        Returns: string[];
      };
      admin_domains: {
        Args: Record<string, never>;
        Returns: DomainRow[];
      };
      add_allowed_domain: {
        Args: { new_domain: string };
        Returns: undefined;
      };
      remove_allowed_domain: {
        Args: { old_domain: string };
        Returns: undefined;
      };
      sign_ins_by_day: {
        Args: { days?: number; tz?: string };
        Returns: DailySignIns[];
      };
    };
    Enums: {
      app_role: AppRole;
      member_status: MemberStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
