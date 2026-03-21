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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      arquivos_bpf: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          categoria: string
          created_at: string
          descricao: string | null
          documento_ref_id: string | null
          id: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          categoria: string
          created_at?: string
          descricao?: string | null
          documento_ref_id?: string | null
          id?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          categoria?: string
          created_at?: string
          descricao?: string | null
          documento_ref_id?: string | null
          id?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arquivos_bpf_documento_ref_id_fkey"
            columns: ["documento_ref_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      batidas_producao: {
        Row: {
          created_at: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          numero_batida: number
          observacoes: string | null
          operador: string | null
          ordem_id: string
          status: string | null
          temperatura: string | null
          tempo_mistura_minutos: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          numero_batida?: number
          observacoes?: string | null
          operador?: string | null
          ordem_id: string
          status?: string | null
          temperatura?: string | null
          tempo_mistura_minutos?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          numero_batida?: number
          observacoes?: string | null
          operador?: string | null
          ordem_id?: string
          status?: string | null
          temperatura?: string | null
          tempo_mistura_minutos?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batidas_producao_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          area: string
          auditoria_data: string | null
          conforme: boolean | null
          created_at: string
          id: string
          item: string
          observacao: string | null
          user_id: string
        }
        Insert: {
          area: string
          auditoria_data?: string | null
          conforme?: boolean | null
          created_at?: string
          id?: string
          item: string
          observacao?: string | null
          user_id: string
        }
        Update: {
          area?: string
          auditoria_data?: string | null
          conforme?: boolean | null
          created_at?: string
          id?: string
          item?: string
          observacao?: string | null
          user_id?: string
        }
        Relationships: []
      }
      controle_pragas: {
        Row: {
          acao: string | null
          created_at: string
          data: string
          id: string
          local: string
          responsavel: string | null
          tipo_praga: string
          user_id: string
        }
        Insert: {
          acao?: string | null
          created_at?: string
          data?: string
          id?: string
          local: string
          responsavel?: string | null
          tipo_praga: string
          user_id: string
        }
        Update: {
          acao?: string | null
          created_at?: string
          data?: string
          id?: string
          local?: string
          responsavel?: string | null
          tipo_praga?: string
          user_id?: string
        }
        Relationships: []
      }
      documentos: {
        Row: {
          codigo: string
          created_at: string
          data_revisao: string | null
          id: string
          nome: string
          responsavel: string | null
          status: string | null
          updated_at: string
          user_id: string
          versao: string | null
        }
        Insert: {
          codigo: string
          created_at?: string
          data_revisao?: string | null
          id?: string
          nome: string
          responsavel?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          versao?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string
          data_revisao?: string | null
          id?: string
          nome?: string
          responsavel?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          versao?: string | null
        }
        Relationships: []
      }
      empresas: {
        Row: {
          capacidade: string | null
          cnpj: string | null
          created_at: string
          crmv: string | null
          endereco: string | null
          id: string
          nome: string
          responsavel_tecnico: string | null
          tipo_producao: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          capacidade?: string | null
          cnpj?: string | null
          created_at?: string
          crmv?: string | null
          endereco?: string | null
          id?: string
          nome: string
          responsavel_tecnico?: string | null
          tipo_producao?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          capacidade?: string | null
          cnpj?: string | null
          created_at?: string
          crmv?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          responsavel_tecnico?: string | null
          tipo_producao?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      execucao_pops: {
        Row: {
          checklist_auditoria_ref: string | null
          codigo_pop: string
          created_at: string
          data_execucao: string
          documento_id: string | null
          executor: string
          id: string
          nome_pop: string
          observacoes: string | null
          setor: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          checklist_auditoria_ref?: string | null
          codigo_pop: string
          created_at?: string
          data_execucao?: string
          documento_id?: string | null
          executor: string
          id?: string
          nome_pop: string
          observacoes?: string | null
          setor?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          checklist_auditoria_ref?: string | null
          codigo_pop?: string
          created_at?: string
          data_execucao?: string
          documento_id?: string | null
          executor?: string
          id?: string
          nome_pop?: string
          observacoes?: string | null
          setor?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execucao_pops_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      formula_itens: {
        Row: {
          created_at: string
          fornecedor: string | null
          id: string
          lote_mp: string | null
          materia_prima: string
          ordem_id: string
          percentual: string | null
          quantidade_formula: string | null
          unidade: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          fornecedor?: string | null
          id?: string
          lote_mp?: string | null
          materia_prima: string
          ordem_id: string
          percentual?: string | null
          quantidade_formula?: string | null
          unidade?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          fornecedor?: string | null
          id?: string
          lote_mp?: string | null
          materia_prima?: string
          ordem_id?: string
          percentual?: string | null
          quantidade_formula?: string | null
          unidade?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "formula_itens_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      nao_conformidades: {
        Row: {
          acao_corretiva: string | null
          causa: string | null
          created_at: string
          data: string
          descricao: string
          id: string
          prazo: string | null
          responsavel: string | null
          setor: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acao_corretiva?: string | null
          causa?: string | null
          created_at?: string
          data?: string
          descricao: string
          id?: string
          prazo?: string | null
          responsavel?: string | null
          setor: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acao_corretiva?: string | null
          causa?: string | null
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          prazo?: string | null
          responsavel?: string | null
          setor?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ordens_producao: {
        Row: {
          created_at: string
          data_programada: string
          formula_nome: string
          id: string
          lote_produto: string | null
          numero_batidas: number | null
          numero_ordem: string
          observacoes: string | null
          peso_por_batida: string | null
          prioridade: string | null
          produto: string
          quantidade_programada: string | null
          status: string | null
          unidade: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_programada?: string
          formula_nome?: string
          id?: string
          lote_produto?: string | null
          numero_batidas?: number | null
          numero_ordem: string
          observacoes?: string | null
          peso_por_batida?: string | null
          prioridade?: string | null
          produto: string
          quantidade_programada?: string | null
          status?: string | null
          unidade?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_programada?: string
          formula_nome?: string
          id?: string
          lote_produto?: string | null
          numero_batidas?: number | null
          numero_ordem?: string
          observacoes?: string | null
          peso_por_batida?: string | null
          prioridade?: string | null
          produto?: string
          quantidade_programada?: string | null
          status?: string | null
          unidade?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      producao: {
        Row: {
          created_at: string
          data: string
          id: string
          lote: string | null
          operador: string | null
          produto: string
          quantidade: string | null
          tempo_mistura: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          lote?: string | null
          operador?: string | null
          produto: string
          quantidade?: string | null
          tempo_mistura?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          lote?: string | null
          operador?: string | null
          produto?: string
          quantidade?: string | null
          tempo_mistura?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string
          id: string
          nome: string
          telefone: string | null
          tipo_usuario: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          id?: string
          nome?: string
          telefone?: string | null
          tipo_usuario?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          id?: string
          nome?: string
          telefone?: string | null
          tipo_usuario?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rastreabilidade: {
        Row: {
          cliente_destino: string | null
          created_at: string
          data_venda: string | null
          fornecedor: string | null
          id: string
          local_entrega: string | null
          lote_mp: string | null
          lote_produto: string | null
          materia_prima: string
          nota_fiscal: string | null
          produto: string
          quantidade_vendida: string | null
          recall_ativo: boolean | null
          recall_data: string | null
          recall_motivo: string | null
          recall_status: string | null
          user_id: string
        }
        Insert: {
          cliente_destino?: string | null
          created_at?: string
          data_venda?: string | null
          fornecedor?: string | null
          id?: string
          local_entrega?: string | null
          lote_mp?: string | null
          lote_produto?: string | null
          materia_prima: string
          nota_fiscal?: string | null
          produto: string
          quantidade_vendida?: string | null
          recall_ativo?: boolean | null
          recall_data?: string | null
          recall_motivo?: string | null
          recall_status?: string | null
          user_id: string
        }
        Update: {
          cliente_destino?: string | null
          created_at?: string
          data_venda?: string | null
          fornecedor?: string | null
          id?: string
          local_entrega?: string | null
          lote_mp?: string | null
          lote_produto?: string | null
          materia_prima?: string
          nota_fiscal?: string | null
          produto?: string
          quantidade_vendida?: string | null
          recall_ativo?: boolean | null
          recall_data?: string | null
          recall_motivo?: string | null
          recall_status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recebimento_mp: {
        Row: {
          aprovado: boolean | null
          created_at: string
          data: string
          fornecedor: string
          id: string
          insetos: string | null
          lote: string | null
          materia_prima: string
          odor: string | null
          umidade: string | null
          user_id: string
        }
        Insert: {
          aprovado?: boolean | null
          created_at?: string
          data?: string
          fornecedor: string
          id?: string
          insetos?: string | null
          lote?: string | null
          materia_prima: string
          odor?: string | null
          umidade?: string | null
          user_id: string
        }
        Update: {
          aprovado?: boolean | null
          created_at?: string
          data?: string
          fornecedor?: string
          id?: string
          insetos?: string | null
          lote?: string | null
          materia_prima?: string
          odor?: string | null
          umidade?: string | null
          user_id?: string
        }
        Relationships: []
      }
      relatorios: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          created_at: string
          data_geracao: string | null
          descricao: string | null
          id: string
          modulo: string
          status: string | null
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          created_at?: string
          data_geracao?: string | null
          descricao?: string | null
          id?: string
          modulo: string
          status?: string | null
          tipo: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          created_at?: string
          data_geracao?: string | null
          descricao?: string | null
          id?: string
          modulo?: string
          status?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      treinamentos: {
        Row: {
          created_at: string
          data: string
          funcionario: string
          id: string
          instrutor: string | null
          treinamento: string
          user_id: string
          validade: string | null
        }
        Insert: {
          created_at?: string
          data?: string
          funcionario: string
          id?: string
          instrutor?: string | null
          treinamento: string
          user_id: string
          validade?: string | null
        }
        Update: {
          created_at?: string
          data?: string
          funcionario?: string
          id?: string
          instrutor?: string | null
          treinamento?: string
          user_id?: string
          validade?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
