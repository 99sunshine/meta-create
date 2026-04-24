export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          properties: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          properties?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          properties?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          user_id: string
          joined_at: string
          last_read_at: string | null
        }
        Insert: {
          conversation_id: string
          user_id: string
          joined_at?: string
          last_read_at?: string | null
        }
        Update: {
          conversation_id?: string
          user_id?: string
          joined_at?: string
          last_read_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          created_from_request_id: string | null
          created_at: string
          last_message_at: string | null
          last_message_content: string | null
          last_message_sender_id: string | null
        }
        Insert: {
          id?: string
          created_from_request_id?: string | null
          created_at?: string
          last_message_at?: string | null
          last_message_content?: string | null
          last_message_sender_id?: string | null
        }
        Update: {
          id?: string
          created_from_request_id?: string | null
          created_at?: string
          last_message_at?: string | null
          last_message_content?: string | null
          last_message_sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_last_message_sender_id_fkey"
            columns: ["last_message_sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string | null
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          id: string
          team_id: string
          inviter_id: string
          invitee_id: string
          status: string
          created_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          team_id: string
          inviter_id: string
          invitee_id: string
          status?: string
          created_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          inviter_id?: string
          invitee_id?: string
          status?: string
          created_at?: string
          responded_at?: string | null
        }
        Relationships: []
      }
      collab_requests: {
        Row: {
          ai_match_blurb: string | null
          created_at: string
          ice_breaker: string | null
          id: string
          match_score: number | null
          message: string | null
          receiver_id: string
          responded_at: string | null
          sender_id: string
          status: string
          team_id: string | null
          type: string
        }
        Insert: {
          ai_match_blurb?: string | null
          created_at?: string
          ice_breaker?: string | null
          id?: string
          match_score?: number | null
          message?: string | null
          receiver_id: string
          responded_at?: string | null
          sender_id: string
          status?: string
          team_id?: string | null
          type?: string
        }
        Update: {
          ai_match_blurb?: string | null
          created_at?: string
          ice_breaker?: string | null
          id?: string
          match_score?: number | null
          message?: string | null
          receiver_id?: string
          responded_at?: string | null
          sender_id?: string
          status?: string
          team_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams_with_members"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability: string | null
          avatar_url: string | null
          bio_raw: Json | null
          city: string | null
          collab_style: string | null
          created_at: string
          education_level: string | null
          email: string
          hackathon_track: string | null
          id: string
          interests: string[] | null
          languages: string[] | null
          locale: string
          major: string | null
          manifesto: string | null
          name: string
          onboarding_complete: boolean
          role: string
          school: string | null
          skills: string[] | null
          subscription_tier: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          bio_raw?: Json | null
          city?: string | null
          collab_style?: string | null
          created_at?: string
          education_level?: string | null
          email: string
          hackathon_track?: string | null
          id: string
          interests?: string[] | null
          languages?: string[] | null
          locale?: string
          major?: string | null
          manifesto?: string | null
          name: string
          onboarding_complete?: boolean
          role: string
          school?: string | null
          skills?: string[] | null
          subscription_tier?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          bio_raw?: Json | null
          city?: string | null
          collab_style?: string | null
          created_at?: string
          education_level?: string | null
          email?: string
          hackathon_track?: string | null
          id?: string
          interests?: string[] | null
          languages?: string[] | null
          locale?: string
          major?: string | null
          manifesto?: string | null
          name?: string
          onboarding_complete?: boolean
          role?: string
          school?: string | null
          skills?: string[] | null
          subscription_tier?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          is_admin: boolean
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_admin?: boolean
          joined_at?: string
          role: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_admin?: boolean
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams_with_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          category: string
          created_at: string
          description: string | null
          event_id: string | null
          event_track: string | null
          external_chat_link: string | null
          id: string
          is_open: boolean
          looking_for_roles: string[] | null
          max_members: number
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          event_id?: string | null
          event_track?: string | null
          external_chat_link?: string | null
          id?: string
          is_open?: boolean
          looking_for_roles?: string[] | null
          max_members?: number
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          event_id?: string | null
          event_track?: string | null
          external_chat_link?: string | null
          id?: string
          is_open?: boolean
          looking_for_roles?: string[] | null
          max_members?: number
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      works: {
        Row: {
          category: string
          collaborator_ids: string[] | null
          created_at: string
          description: string
          id: string
          images: string[] | null
          links: string[] | null
          save_count: number
          tags: string[] | null
          team_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          collaborator_ids?: string[] | null
          created_at?: string
          description: string
          id?: string
          images?: string[] | null
          links?: string[] | null
          save_count?: number
          tags?: string[] | null
          team_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          collaborator_ids?: string[] | null
          created_at?: string
          description?: string
          id?: string
          images?: string[] | null
          links?: string[] | null
          save_count?: number
          tags?: string[] | null
          team_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "works_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "works_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams_with_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "works_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      teams_with_members: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          event_id: string | null
          event_track: string | null
          external_chat_link: string | null
          id: string | null
          is_open: boolean | null
          looking_for_roles: string[] | null
          max_members: number | null
          member_count: number | null
          members: Json | null
          name: string | null
          owner_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      works_with_creator: {
        Row: {
          category: string | null
          collaborator_ids: string[] | null
          created_at: string | null
          creator: Json | null
          description: string | null
          id: string | null
          images: string[] | null
          links: string[] | null
          save_count: number | null
          tags: string[] | null
          team: Json | null
          team_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "works_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "works_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams_with_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "works_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
