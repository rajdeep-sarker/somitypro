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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      account_heads: {
        Row: {
          active: boolean
          created_at: string
          id: string
          kind: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          kind: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          kind?: string
          name?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          attendance_date: string
          check_in: string | null
          check_out: string | null
          created_at: string
          id: string
          note: string | null
          staff_id: string
          status: string
        }
        Insert: {
          attendance_date?: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          id?: string
          note?: string | null
          staff_id: string
          status: string
        }
        Update: {
          attendance_date?: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          id?: string
          note?: string | null
          staff_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_batches: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string
          row_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id: string
          kind: string
          row_count: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          row_count?: number
        }
        Relationships: []
      }
      cash_entries: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          head_id: string | null
          id: string
          kind: string
          note: string | null
          txn_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          head_id?: string | null
          id?: string
          kind: string
          note?: string | null
          txn_date?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          head_id?: string | null
          id?: string
          kind?: string
          note?: string | null
          txn_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_entries_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "account_heads"
            referencedColumns: ["id"]
          },
        ]
      }
      centers: {
        Row: {
          address: string | null
          code: string | null
          created_at: string
          id: string
          meeting_day: string | null
          name: string
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string
          id?: string
          meeting_day?: string | null
          name: string
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string
          id?: string
          meeting_day?: string | null
          name?: string
        }
        Relationships: []
      }
      designations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      dps_accounts: {
        Row: {
          account_no: string
          created_at: string
          id: string
          installment_amount: number
          member_id: string
          scheme_id: string | null
          start_date: string
          status: string
        }
        Insert: {
          account_no: string
          created_at?: string
          id?: string
          installment_amount: number
          member_id: string
          scheme_id?: string | null
          start_date?: string
          status?: string
        }
        Update: {
          account_no?: string
          created_at?: string
          id?: string
          installment_amount?: number
          member_id?: string
          scheme_id?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "dps_accounts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dps_accounts_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "dps_schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      dps_schemes: {
        Row: {
          active: boolean
          created_at: string
          duration_months: number
          id: string
          installment_type: string
          name: string
          profit_rate: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          duration_months?: number
          id?: string
          installment_type?: string
          name: string
          profit_rate?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          duration_months?: number
          id?: string
          installment_type?: string
          name?: string
          profit_rate?: number
        }
        Relationships: []
      }
      dps_transactions: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          created_by: string | null
          id: string
          member_id: string
          note: string | null
          txn_date: string
          type: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          member_id: string
          note?: string | null
          txn_date?: string
          type: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          member_id?: string
          note?: string | null
          txn_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dps_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "dps_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dps_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      fdr_accounts: {
        Row: {
          account_no: string
          amount: number
          created_at: string
          id: string
          maturity_date: string | null
          member_id: string
          scheme_id: string | null
          start_date: string
          status: string
        }
        Insert: {
          account_no: string
          amount: number
          created_at?: string
          id?: string
          maturity_date?: string | null
          member_id: string
          scheme_id?: string | null
          start_date?: string
          status?: string
        }
        Update: {
          account_no?: string
          amount?: number
          created_at?: string
          id?: string
          maturity_date?: string | null
          member_id?: string
          scheme_id?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fdr_accounts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fdr_accounts_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "fdr_schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      fdr_schemes: {
        Row: {
          active: boolean
          created_at: string
          duration_months: number
          id: string
          name: string
          payout_type: string
          profit_rate: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          duration_months?: number
          id?: string
          name: string
          payout_type?: string
          profit_rate?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          duration_months?: number
          id?: string
          name?: string
          payout_type?: string
          profit_rate?: number
        }
        Relationships: []
      }
      fdr_transactions: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          created_by: string | null
          id: string
          member_id: string
          note: string | null
          txn_date: string
          type: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          member_id: string
          note?: string | null
          txn_date?: string
          type: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          member_id?: string
          note?: string | null
          txn_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fdr_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fdr_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fdr_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_accounts: {
        Row: {
          account_no: string | null
          bank_name: string | null
          branch: string | null
          budget: number
          created_at: string
          id: string
          member_id: string | null
          module: string
          name: string
          note: string | null
          opening_balance: number
          start_date: string
          status: string
          unit_price: number
        }
        Insert: {
          account_no?: string | null
          bank_name?: string | null
          branch?: string | null
          budget?: number
          created_at?: string
          id?: string
          member_id?: string | null
          module: string
          name: string
          note?: string | null
          opening_balance?: number
          start_date?: string
          status?: string
          unit_price?: number
        }
        Update: {
          account_no?: string | null
          bank_name?: string | null
          branch?: string | null
          budget?: number
          created_at?: string
          id?: string
          member_id?: string | null
          module?: string
          name?: string
          note?: string | null
          opening_balance?: number
          start_date?: string
          status?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_transactions: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          created_by: string | null
          id: string
          loan_id: string | null
          member_id: string | null
          note: string | null
          reference: string | null
          transfer_id: string | null
          txn_date: string
          type: string
          units: number
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          loan_id?: string | null
          member_id?: string | null
          note?: string | null
          reference?: string | null
          transfer_id?: string | null
          txn_date?: string
          type: string
          units?: number
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          loan_id?: string | null
          member_id?: string | null
          note?: string | null
          reference?: string | null
          transfer_id?: string | null
          txn_date?: string
          type?: string
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "ledger_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_transactions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_repayments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          late_fee: number
          loan_id: string
          member_id: string
          note: string | null
          txn_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          late_fee?: number
          loan_id: string
          member_id: string
          note?: string | null
          txn_date?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          late_fee?: number
          loan_id?: string
          member_id?: string
          note?: string | null
          txn_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_repayments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_repayments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          created_at: string
          disburse_date: string
          first_due_date: string
          guarantor: string | null
          id: string
          installment_amount: number
          installment_count: number
          installment_type: string
          interest_rate: number
          loan_no: string
          member_id: string
          principal: number
          purpose: string | null
          service_charge: number
          status: string
          total_payable: number
        }
        Insert: {
          created_at?: string
          disburse_date?: string
          first_due_date?: string
          guarantor?: string | null
          id?: string
          installment_amount: number
          installment_count?: number
          installment_type?: string
          interest_rate?: number
          loan_no: string
          member_id: string
          principal: number
          purpose?: string | null
          service_charge?: number
          status?: string
          total_payable: number
        }
        Update: {
          created_at?: string
          disburse_date?: string
          first_due_date?: string
          guarantor?: string | null
          id?: string
          installment_amount?: number
          installment_count?: number
          installment_type?: string
          interest_rate?: number
          loan_no?: string
          member_id?: string
          principal?: number
          purpose?: string | null
          service_charge?: number
          status?: string
          total_payable?: number
        }
        Relationships: [
          {
            foreignKeyName: "loans_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_fees: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          fee_type: string
          id: string
          member_id: string
          note: string | null
          txn_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          fee_type: string
          id?: string
          member_id: string
          note?: string | null
          txn_date?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          fee_type?: string
          id?: string
          member_id?: string
          note?: string | null
          txn_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_fees_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          admission_date: string
          center_id: string | null
          created_at: string
          dob: string | null
          father_name: string | null
          gender: string | null
          id: string
          member_no: string
          mother_name: string | null
          name: string
          nid: string | null
          nominee_name: string | null
          nominee_phone: string | null
          nominee_relation: string | null
          occupation: string | null
          phone: string | null
          spouse_name: string | null
          status: string
        }
        Insert: {
          address?: string | null
          admission_date?: string
          center_id?: string | null
          created_at?: string
          dob?: string | null
          father_name?: string | null
          gender?: string | null
          id?: string
          member_no: string
          mother_name?: string | null
          name: string
          nid?: string | null
          nominee_name?: string | null
          nominee_phone?: string | null
          nominee_relation?: string | null
          occupation?: string | null
          phone?: string | null
          spouse_name?: string | null
          status?: string
        }
        Update: {
          address?: string | null
          admission_date?: string
          center_id?: string | null
          created_at?: string
          dob?: string | null
          father_name?: string | null
          gender?: string | null
          id?: string
          member_no?: string
          mother_name?: string | null
          name?: string
          nid?: string | null
          nominee_name?: string | null
          nominee_phone?: string | null
          nominee_relation?: string | null
          occupation?: string | null
          phone?: string | null
          spouse_name?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_drafts: {
        Row: {
          channel: string
          created_at: string
          id: string
          message: string
          recipients: Json
          status: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          message: string
          recipients?: Json
          status?: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          message?: string
          recipients?: Json
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      salary_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          month: string
          note: string | null
          staff_id: string
          txn_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          month: string
          note?: string | null
          staff_id: string
          txn_date?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          month?: string
          note?: string | null
          staff_id?: string
          txn_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_payments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          member_id: string
          note: string | null
          txn_date: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          member_id: string
          note?: string | null
          txn_date?: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          member_id?: string
          note?: string | null
          txn_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      somiti_rules: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      somiti_settings: {
        Row: {
          address: string | null
          admission_fee: number
          email: string | null
          id: number
          monthly_fee: number
          name: string
          phone: string | null
          reg_no: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          admission_fee?: number
          email?: string | null
          id?: number
          monthly_fee?: number
          name?: string
          phone?: string | null
          reg_no?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          admission_fee?: number
          email?: string | null
          id?: number
          monthly_fee?: number
          name?: string
          phone?: string | null
          reg_no?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          address: string | null
          created_at: string
          designation_id: string | null
          id: string
          join_date: string
          name: string
          phone: string | null
          salary: number
          status: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          designation_id?: string | null
          id?: string
          join_date?: string
          name: string
          phone?: string | null
          salary?: number
          status?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          designation_id?: string | null
          id?: string
          join_date?: string
          name?: string
          phone?: string | null
          salary?: number
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_designation_id_fkey"
            columns: ["designation_id"]
            isOneToOne: false
            referencedRelation: "designations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_permissions: {
        Row: {
          can_write: boolean
          created_at: string
          id: string
          module: string
          user_id: string
        }
        Insert: {
          can_write?: boolean
          created_at?: string
          id?: string
          module: string
          user_id: string
        }
        Update: {
          can_write?: boolean
          created_at?: string
          id?: string
          module?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bulk_collect: {
        Args: { p_batch: string; p_date: string; p_rows: Json }
        Returns: number
      }
      has_access: { Args: { _user_id: string }; Returns: boolean }
      has_module_access: {
        Args: { p_module: string; p_write?: boolean }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      import_members: {
        Args: { p_batch: string; p_rows: Json }
        Returns: number
      }
      transfer_bank: {
        Args: {
          p_amount: number
          p_date: string
          p_from: string
          p_note?: string
          p_to: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "staff"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff"],
    },
  },
} as const
