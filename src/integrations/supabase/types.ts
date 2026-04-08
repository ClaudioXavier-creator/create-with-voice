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
      analises_laboratorio: {
        Row: {
          conforme: boolean | null
          created_at: string
          data_analise: string | null
          data_resultado: string | null
          empresa_id: string | null
          id: string
          laboratorio: string | null
          laudo_numero: string | null
          laudo_url: string | null
          limite_referencia: string | null
          lote: string | null
          metodo: string | null
          observacoes: string | null
          parametro: string | null
          produto: string
          resultado: string | null
          status: string | null
          tipo_analise: string
          unidade: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conforme?: boolean | null
          created_at?: string
          data_analise?: string | null
          data_resultado?: string | null
          empresa_id?: string | null
          id?: string
          laboratorio?: string | null
          laudo_numero?: string | null
          laudo_url?: string | null
          limite_referencia?: string | null
          lote?: string | null
          metodo?: string | null
          observacoes?: string | null
          parametro?: string | null
          produto: string
          resultado?: string | null
          status?: string | null
          tipo_analise?: string
          unidade?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conforme?: boolean | null
          created_at?: string
          data_analise?: string | null
          data_resultado?: string | null
          empresa_id?: string | null
          id?: string
          laboratorio?: string | null
          laudo_numero?: string | null
          laudo_url?: string | null
          limite_referencia?: string | null
          lote?: string | null
          metodo?: string | null
          observacoes?: string | null
          parametro?: string | null
          produto?: string
          resultado?: string | null
          status?: string | null
          tipo_analise?: string
          unidade?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analises_laboratorio_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      arquivos_bpf: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          categoria: string
          created_at: string
          descricao: string | null
          documento_ref_id: string | null
          empresa_id: string | null
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
          empresa_id?: string | null
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
          empresa_id?: string | null
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
          {
            foreignKeyName: "arquivos_bpf_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      batidas_producao: {
        Row: {
          created_at: string
          empresa_id: string | null
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
          empresa_id?: string | null
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
          empresa_id?: string | null
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
            foreignKeyName: "batidas_producao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batidas_producao_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      calibracoes: {
        Row: {
          certificado_numero: string | null
          codigo: string | null
          created_at: string
          data_calibracao: string | null
          data_verificacao_intermediaria: string | null
          empresa_id: string | null
          equipamento: string
          id: string
          localizacao: string | null
          observacoes: string | null
          proxima_calibracao: string | null
          proxima_verificacao_intermediaria: string | null
          responsavel: string | null
          resultado_verificacao: string | null
          status: string | null
          tipo: string | null
          updated_at: string
          user_id: string
          verificacao_conforme: boolean | null
        }
        Insert: {
          certificado_numero?: string | null
          codigo?: string | null
          created_at?: string
          data_calibracao?: string | null
          data_verificacao_intermediaria?: string | null
          empresa_id?: string | null
          equipamento: string
          id?: string
          localizacao?: string | null
          observacoes?: string | null
          proxima_calibracao?: string | null
          proxima_verificacao_intermediaria?: string | null
          responsavel?: string | null
          resultado_verificacao?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string
          user_id: string
          verificacao_conforme?: boolean | null
        }
        Update: {
          certificado_numero?: string | null
          codigo?: string | null
          created_at?: string
          data_calibracao?: string | null
          data_verificacao_intermediaria?: string | null
          empresa_id?: string | null
          equipamento?: string
          id?: string
          localizacao?: string | null
          observacoes?: string | null
          proxima_calibracao?: string | null
          proxima_verificacao_intermediaria?: string | null
          responsavel?: string | null
          resultado_verificacao?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string
          user_id?: string
          verificacao_conforme?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "calibracoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
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
          empresa_id: string | null
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
          empresa_id?: string | null
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
          empresa_id?: string | null
          id?: string
          item?: string
          observacao?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      controle_pragas: {
        Row: {
          acao: string | null
          created_at: string
          data: string
          empresa_id: string | null
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
          empresa_id?: string | null
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
          empresa_id?: string | null
          id?: string
          local?: string
          responsavel?: string | null
          tipo_praga?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "controle_pragas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      controle_residuos: {
        Row: {
          classificacao: string | null
          created_at: string
          data_coleta: string | null
          destino_final: string | null
          empresa_coletora: string | null
          empresa_id: string | null
          frequencia_coleta: string | null
          id: string
          licenca_ambiental: string | null
          lote_produto: string | null
          manifesto_numero: string | null
          motivo_descarte: string | null
          observacoes: string | null
          origem: string | null
          produto_nome: string | null
          quantidade: string | null
          responsavel: string | null
          status: string | null
          tipo_residuo: string
          unidade: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          classificacao?: string | null
          created_at?: string
          data_coleta?: string | null
          destino_final?: string | null
          empresa_coletora?: string | null
          empresa_id?: string | null
          frequencia_coleta?: string | null
          id?: string
          licenca_ambiental?: string | null
          lote_produto?: string | null
          manifesto_numero?: string | null
          motivo_descarte?: string | null
          observacoes?: string | null
          origem?: string | null
          produto_nome?: string | null
          quantidade?: string | null
          responsavel?: string | null
          status?: string | null
          tipo_residuo: string
          unidade?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          classificacao?: string | null
          created_at?: string
          data_coleta?: string | null
          destino_final?: string | null
          empresa_coletora?: string | null
          empresa_id?: string | null
          frequencia_coleta?: string | null
          id?: string
          licenca_ambiental?: string | null
          lote_produto?: string | null
          manifesto_numero?: string | null
          motivo_descarte?: string | null
          observacoes?: string | null
          origem?: string | null
          produto_nome?: string | null
          quantidade?: string | null
          responsavel?: string | null
          status?: string | null
          tipo_residuo?: string
          unidade?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "controle_residuos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      controle_substancias: {
        Row: {
          conforme: boolean | null
          created_at: string
          data_analise: string | null
          empresa_id: string | null
          fornecedor: string | null
          id: string
          limite_maximo: string | null
          lote: string | null
          materia_prima: string
          metodo_analise: string | null
          observacoes: string | null
          referencia_normativa: string | null
          resultado: string | null
          status: string | null
          substancia: string
          tipo: string
          unidade: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conforme?: boolean | null
          created_at?: string
          data_analise?: string | null
          empresa_id?: string | null
          fornecedor?: string | null
          id?: string
          limite_maximo?: string | null
          lote?: string | null
          materia_prima: string
          metodo_analise?: string | null
          observacoes?: string | null
          referencia_normativa?: string | null
          resultado?: string | null
          status?: string | null
          substancia: string
          tipo?: string
          unidade?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conforme?: boolean | null
          created_at?: string
          data_analise?: string | null
          empresa_id?: string | null
          fornecedor?: string | null
          id?: string
          limite_maximo?: string | null
          lote?: string | null
          materia_prima?: string
          metodo_analise?: string | null
          observacoes?: string | null
          referencia_normativa?: string | null
          resultado?: string | null
          status?: string | null
          substancia?: string
          tipo?: string
          unidade?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "controle_substancias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      controle_visitantes: {
        Row: {
          acompanhante: string | null
          areas_visitadas: string | null
          created_at: string
          data_visita: string
          documento: string | null
          empresa: string | null
          empresa_id: string | null
          epi_fornecido: boolean | null
          hora_entrada: string | null
          hora_saida: string | null
          id: string
          motivo: string | null
          nome_visitante: string
          observacoes: string | null
          orientacao_biosseguridade: boolean | null
          user_id: string
        }
        Insert: {
          acompanhante?: string | null
          areas_visitadas?: string | null
          created_at?: string
          data_visita?: string
          documento?: string | null
          empresa?: string | null
          empresa_id?: string | null
          epi_fornecido?: boolean | null
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          motivo?: string | null
          nome_visitante: string
          observacoes?: string | null
          orientacao_biosseguridade?: boolean | null
          user_id: string
        }
        Update: {
          acompanhante?: string | null
          areas_visitadas?: string | null
          created_at?: string
          data_visita?: string
          documento?: string | null
          empresa?: string | null
          empresa_id?: string | null
          epi_fornecido?: boolean | null
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          motivo?: string | null
          nome_visitante?: string
          observacoes?: string | null
          orientacao_biosseguridade?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "controle_visitantes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      cronogramas_higiene: {
        Row: {
          area: string
          concentracao: string | null
          created_at: string
          empresa_id: string | null
          equipamento: string | null
          frequencia: string
          horario_previsto: string | null
          id: string
          observacoes: string | null
          procedimento: string
          produto_utilizado: string | null
          responsavel: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area: string
          concentracao?: string | null
          created_at?: string
          empresa_id?: string | null
          equipamento?: string | null
          frequencia?: string
          horario_previsto?: string | null
          id?: string
          observacoes?: string | null
          procedimento: string
          produto_utilizado?: string | null
          responsavel?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string
          concentracao?: string | null
          created_at?: string
          empresa_id?: string | null
          equipamento?: string | null
          frequencia?: string
          horario_previsto?: string | null
          id?: string
          observacoes?: string | null
          procedimento?: string
          produto_utilizado?: string | null
          responsavel?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cronogramas_higiene_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          codigo: string
          created_at: string
          data_revisao: string | null
          empresa_id: string | null
          id: string
          nome: string
          proxima_revisao: string | null
          responsavel: string | null
          status: string | null
          updated_at: string
          user_id: string
          validade_revisao: string | null
          versao: string | null
        }
        Insert: {
          codigo: string
          created_at?: string
          data_revisao?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          proxima_revisao?: string | null
          responsavel?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          validade_revisao?: string | null
          versao?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string
          data_revisao?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          proxima_revisao?: string | null
          responsavel?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          validade_revisao?: string | null
          versao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_bpf: {
        Row: {
          arquivo_nome: string
          arquivo_path: string
          created_at: string
          data_documento: string | null
          descricao: string | null
          empresa_id: string
          id: string
          pop_codigo: string | null
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arquivo_nome: string
          arquivo_path: string
          created_at?: string
          data_documento?: string | null
          descricao?: string | null
          empresa_id: string
          id?: string
          pop_codigo?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arquivo_nome?: string
          arquivo_path?: string
          created_at?: string
          data_documento?: string | null
          descricao?: string | null
          empresa_id?: string
          id?: string
          pop_codigo?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_bpf_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
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
          empresa_id: string | null
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
          empresa_id?: string | null
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
          empresa_id?: string | null
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
          {
            foreignKeyName: "execucao_pops_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      formula_itens: {
        Row: {
          created_at: string
          empresa_id: string | null
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
          empresa_id?: string | null
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
          empresa_id?: string | null
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
            foreignKeyName: "formula_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formula_itens_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          contato: string | null
          contato_comercial: string | null
          contato_comercial_tel_email: string | null
          contato_qualidade: string | null
          contato_qualidade_tel_email: string | null
          created_at: string
          doc_alvara_funcionamento: boolean | null
          doc_certificado_analise: boolean | null
          doc_certificado_registro_mapa: boolean | null
          doc_certificado_registro_produto: boolean | null
          doc_ficha_tecnica: boolean | null
          email: string | null
          empresa_id: string | null
          endereco: string | null
          estado: string | null
          id: string
          inscricao_estadual: string | null
          nome: string
          nota_avaliacao: number | null
          observacoes: string | null
          produtos_fornecidos: string | null
          proxima_avaliacao: string | null
          registro_mapa: string | null
          registro_sipeagro: string | null
          resultado_qualificacao: string | null
          sipeagro_data_verificacao: string | null
          sipeagro_verificado: boolean | null
          status_qualificacao: string | null
          tipo_produto: string | null
          ultima_avaliacao: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato?: string | null
          contato_comercial?: string | null
          contato_comercial_tel_email?: string | null
          contato_qualidade?: string | null
          contato_qualidade_tel_email?: string | null
          created_at?: string
          doc_alvara_funcionamento?: boolean | null
          doc_certificado_analise?: boolean | null
          doc_certificado_registro_mapa?: boolean | null
          doc_certificado_registro_produto?: boolean | null
          doc_ficha_tecnica?: boolean | null
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          nome: string
          nota_avaliacao?: number | null
          observacoes?: string | null
          produtos_fornecidos?: string | null
          proxima_avaliacao?: string | null
          registro_mapa?: string | null
          registro_sipeagro?: string | null
          resultado_qualificacao?: string | null
          sipeagro_data_verificacao?: string | null
          sipeagro_verificado?: boolean | null
          status_qualificacao?: string | null
          tipo_produto?: string | null
          ultima_avaliacao?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato?: string | null
          contato_comercial?: string | null
          contato_comercial_tel_email?: string | null
          contato_qualidade?: string | null
          contato_qualidade_tel_email?: string | null
          created_at?: string
          doc_alvara_funcionamento?: boolean | null
          doc_certificado_analise?: boolean | null
          doc_certificado_registro_mapa?: boolean | null
          doc_certificado_registro_produto?: boolean | null
          doc_ficha_tecnica?: boolean | null
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          nome?: string
          nota_avaliacao?: number | null
          observacoes?: string | null
          produtos_fornecidos?: string | null
          proxima_avaliacao?: string | null
          registro_mapa?: string | null
          registro_sipeagro?: string | null
          resultado_qualificacao?: string | null
          sipeagro_data_verificacao?: string | null
          sipeagro_verificado?: boolean | null
          status_qualificacao?: string | null
          tipo_produto?: string | null
          ultima_avaliacao?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      legislacao_alertas: {
        Row: {
          created_at: string
          data_publicacao: string | null
          empresa_id: string | null
          fonte: string | null
          id: string
          lido: boolean | null
          relevancia: string | null
          resumo: string
          tipo: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_publicacao?: string | null
          empresa_id?: string | null
          fonte?: string | null
          id?: string
          lido?: boolean | null
          relevancia?: string | null
          resumo: string
          tipo?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_publicacao?: string | null
          empresa_id?: string | null
          fonte?: string | null
          id?: string
          lido?: boolean | null
          relevancia?: string | null
          resumo?: string
          tipo?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legislacao_alertas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      licencas: {
        Row: {
          chave_licenca: string
          created_at: string
          data_expiracao: string
          data_inicio: string
          id: string
          plano: string
          status: string
          stripe_checkout_id: string | null
          stripe_customer_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          chave_licenca: string
          created_at?: string
          data_expiracao: string
          data_inicio?: string
          id?: string
          plano?: string
          status?: string
          stripe_checkout_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          chave_licenca?: string
          created_at?: string
          data_expiracao?: string
          data_inicio?: string
          id?: string
          plano?: string
          status?: string
          stripe_checkout_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      manutencoes: {
        Row: {
          codigo_equipamento: string | null
          created_at: string
          custo: string | null
          data_execucao: string | null
          data_programada: string | null
          descricao: string
          empresa_id: string | null
          equipamento: string
          id: string
          observacoes: string | null
          pecas_trocadas: string | null
          proxima_manutencao: string | null
          responsavel: string | null
          status: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          codigo_equipamento?: string | null
          created_at?: string
          custo?: string | null
          data_execucao?: string | null
          data_programada?: string | null
          descricao: string
          empresa_id?: string | null
          equipamento: string
          id?: string
          observacoes?: string | null
          pecas_trocadas?: string | null
          proxima_manutencao?: string | null
          responsavel?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          codigo_equipamento?: string | null
          created_at?: string
          custo?: string | null
          data_execucao?: string | null
          data_programada?: string | null
          descricao?: string
          empresa_id?: string | null
          equipamento?: string
          id?: string
          observacoes?: string | null
          pecas_trocadas?: string | null
          proxima_manutencao?: string | null
          responsavel?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      matriz_risco: {
        Row: {
          created_at: string
          empresa_id: string | null
          etapa_processo: string
          id: string
          medidas_controle: string | null
          nivel_risco: string
          perigo_identificado: string
          probabilidade: string
          severidade: string
          tipo_perigo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          etapa_processo: string
          id?: string
          medidas_controle?: string | null
          nivel_risco?: string
          perigo_identificado: string
          probabilidade?: string
          severidade?: string
          tipo_perigo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          etapa_processo?: string
          id?: string
          medidas_controle?: string | null
          nivel_risco?: string
          perigo_identificado?: string
          probabilidade?: string
          severidade?: string
          tipo_perigo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriz_risco_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      matriz_sensibilidade: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: string
          produto_anterior: string
          produto_seguinte: string
          requer_flushing: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          produto_anterior: string
          produto_seguinte: string
          requer_flushing?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          produto_anterior?: string
          produto_seguinte?: string
          requer_flushing?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriz_sensibilidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos_acesso: {
        Row: {
          ativa: boolean | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          senha_hash: string
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          senha_hash: string
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          senha_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      nao_conformidades: {
        Row: {
          acao_corretiva: string | null
          causa: string | null
          created_at: string
          data: string
          descricao: string
          empresa_id: string | null
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
          empresa_id?: string | null
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
          empresa_id?: string | null
          id?: string
          prazo?: string | null
          responsavel?: string | null
          setor?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nao_conformidades_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      normas_legislacao: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          codigo: string | null
          created_at: string
          data_publicacao: string | null
          empresa_id: string | null
          id: string
          orgao: string | null
          resumo: string | null
          tags: string[] | null
          tipo: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          codigo?: string | null
          created_at?: string
          data_publicacao?: string | null
          empresa_id?: string | null
          id?: string
          orgao?: string | null
          resumo?: string | null
          tags?: string[] | null
          tipo?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          codigo?: string | null
          created_at?: string
          data_publicacao?: string | null
          empresa_id?: string | null
          id?: string
          orgao?: string | null
          resumo?: string | null
          tags?: string[] | null
          tipo?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "normas_legislacao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_producao: {
        Row: {
          created_at: string
          data_programada: string
          destino_sobra: string | null
          empresa_id: string | null
          formula_nome: string
          id: string
          lote_produto: string | null
          motivo_retrabalho: string | null
          numero_batidas: number | null
          numero_ordem: string
          observacoes: string | null
          ordem_origem_id: string | null
          peso_por_batida: string | null
          prioridade: string | null
          produto: string
          quantidade_programada: string | null
          quantidade_sobra: string | null
          sequencia_producao: number | null
          status: string | null
          tipo_ordem: string
          unidade: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_programada?: string
          destino_sobra?: string | null
          empresa_id?: string | null
          formula_nome?: string
          id?: string
          lote_produto?: string | null
          motivo_retrabalho?: string | null
          numero_batidas?: number | null
          numero_ordem: string
          observacoes?: string | null
          ordem_origem_id?: string | null
          peso_por_batida?: string | null
          prioridade?: string | null
          produto: string
          quantidade_programada?: string | null
          quantidade_sobra?: string | null
          sequencia_producao?: number | null
          status?: string | null
          tipo_ordem?: string
          unidade?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_programada?: string
          destino_sobra?: string | null
          empresa_id?: string | null
          formula_nome?: string
          id?: string
          lote_produto?: string | null
          motivo_retrabalho?: string | null
          numero_batidas?: number | null
          numero_ordem?: string
          observacoes?: string | null
          ordem_origem_id?: string | null
          peso_por_batida?: string | null
          prioridade?: string | null
          produto?: string
          quantidade_programada?: string | null
          quantidade_sobra?: string | null
          sequencia_producao?: number | null
          status?: string | null
          tipo_ordem?: string
          unidade?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_producao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_ordem_origem_id_fkey"
            columns: ["ordem_origem_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      planejamento_anual: {
        Row: {
          atividade: string
          categoria: string
          created_at: string
          descricao: string | null
          empresa_id: string | null
          frequencia: string
          id: string
          mes_inicio: number | null
          observacoes: string | null
          proxima_execucao: string | null
          quantidade_prevista: number | null
          responsavel: string | null
          status: string | null
          ultima_execucao: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          atividade: string
          categoria?: string
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          frequencia?: string
          id?: string
          mes_inicio?: number | null
          observacoes?: string | null
          proxima_execucao?: string | null
          quantidade_prevista?: number | null
          responsavel?: string | null
          status?: string | null
          ultima_execucao?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          atividade?: string
          categoria?: string
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          frequencia?: string
          id?: string
          mes_inicio?: number | null
          observacoes?: string | null
          proxima_execucao?: string | null
          quantidade_prevista?: number | null
          responsavel?: string | null
          status?: string | null
          ultima_execucao?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planejamento_anual_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      pop_planilha_itens: {
        Row: {
          area: string
          conforme: boolean | null
          created_at: string
          data_registro: string | null
          empresa_id: string | null
          funcao: string | null
          id: string
          observacoes: string | null
          periodo_label: string
          planilha_id: string
          responsavel: string | null
          user_id: string
        }
        Insert: {
          area: string
          conforme?: boolean | null
          created_at?: string
          data_registro?: string | null
          empresa_id?: string | null
          funcao?: string | null
          id?: string
          observacoes?: string | null
          periodo_label: string
          planilha_id: string
          responsavel?: string | null
          user_id: string
        }
        Update: {
          area?: string
          conforme?: boolean | null
          created_at?: string
          data_registro?: string | null
          empresa_id?: string | null
          funcao?: string | null
          id?: string
          observacoes?: string | null
          periodo_label?: string
          planilha_id?: string
          responsavel?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pop_planilha_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pop_planilha_itens_planilha_id_fkey"
            columns: ["planilha_id"]
            isOneToOne: false
            referencedRelation: "pop_planilhas"
            referencedColumns: ["id"]
          },
        ]
      }
      pop_planilhas: {
        Row: {
          ano: number
          assinatura_executor: string | null
          assinatura_executor_data: string | null
          assinatura_rt: string | null
          assinatura_rt_crmv: string | null
          assinatura_rt_data: string | null
          assinatura_supervisor: string | null
          assinatura_supervisor_data: string | null
          created_at: string
          data_verificacao: string | null
          empresa_id: string | null
          id: string
          mes: number
          observacoes: string | null
          periodicidade: string
          pop_codigo: string
          pop_nome: string
          status: string | null
          updated_at: string
          user_id: string
          verificado_por: string | null
        }
        Insert: {
          ano: number
          assinatura_executor?: string | null
          assinatura_executor_data?: string | null
          assinatura_rt?: string | null
          assinatura_rt_crmv?: string | null
          assinatura_rt_data?: string | null
          assinatura_supervisor?: string | null
          assinatura_supervisor_data?: string | null
          created_at?: string
          data_verificacao?: string | null
          empresa_id?: string | null
          id?: string
          mes: number
          observacoes?: string | null
          periodicidade?: string
          pop_codigo: string
          pop_nome: string
          status?: string | null
          updated_at?: string
          user_id: string
          verificado_por?: string | null
        }
        Update: {
          ano?: number
          assinatura_executor?: string | null
          assinatura_executor_data?: string | null
          assinatura_rt?: string | null
          assinatura_rt_crmv?: string | null
          assinatura_rt_data?: string | null
          assinatura_supervisor?: string | null
          assinatura_supervisor_data?: string | null
          created_at?: string
          data_verificacao?: string | null
          empresa_id?: string | null
          id?: string
          mes?: number
          observacoes?: string | null
          periodicidade?: string
          pop_codigo?: string
          pop_nome?: string
          status?: string | null
          updated_at?: string
          user_id?: string
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pop_planilhas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      producao: {
        Row: {
          contraprova_local: string | null
          contraprova_quantidade: string | null
          contraprova_retida: boolean | null
          contraprova_validade: string | null
          created_at: string
          data: string
          empresa_id: string | null
          id: string
          lote: string | null
          operador: string | null
          produto: string
          quantidade: string | null
          tempo_mistura: string | null
          user_id: string
        }
        Insert: {
          contraprova_local?: string | null
          contraprova_quantidade?: string | null
          contraprova_retida?: boolean | null
          contraprova_validade?: string | null
          created_at?: string
          data?: string
          empresa_id?: string | null
          id?: string
          lote?: string | null
          operador?: string | null
          produto: string
          quantidade?: string | null
          tempo_mistura?: string | null
          user_id: string
        }
        Update: {
          contraprova_local?: string | null
          contraprova_quantidade?: string | null
          contraprova_retida?: boolean | null
          contraprova_validade?: string | null
          created_at?: string
          data?: string
          empresa_id?: string | null
          id?: string
          lote?: string | null
          operador?: string | null
          produto?: string
          quantidade?: string | null
          tempo_mistura?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "producao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          armazenamento: string | null
          categoria_animal: string | null
          classificacao: string
          composicao: string | null
          created_at: string
          diferenciais: string | null
          embalagem: string | null
          empresa_id: string | null
          especie_alvo: string | null
          forma_fisica: string | null
          foto_url: string | null
          id: string
          indicacoes: string | null
          marca: string | null
          modo_preparo: string | null
          modo_uso: string | null
          niveis_garantia: Json | null
          nome: string
          observacoes: string | null
          peso_liquido: string | null
          precaucoes: string | null
          registro_mapa: string | null
          status: string | null
          unidade_peso: string | null
          updated_at: string
          user_id: string
          validade_meses: number | null
        }
        Insert: {
          armazenamento?: string | null
          categoria_animal?: string | null
          classificacao?: string
          composicao?: string | null
          created_at?: string
          diferenciais?: string | null
          embalagem?: string | null
          empresa_id?: string | null
          especie_alvo?: string | null
          forma_fisica?: string | null
          foto_url?: string | null
          id?: string
          indicacoes?: string | null
          marca?: string | null
          modo_preparo?: string | null
          modo_uso?: string | null
          niveis_garantia?: Json | null
          nome: string
          observacoes?: string | null
          peso_liquido?: string | null
          precaucoes?: string | null
          registro_mapa?: string | null
          status?: string | null
          unidade_peso?: string | null
          updated_at?: string
          user_id: string
          validade_meses?: number | null
        }
        Update: {
          armazenamento?: string | null
          categoria_animal?: string | null
          classificacao?: string
          composicao?: string | null
          created_at?: string
          diferenciais?: string | null
          embalagem?: string | null
          empresa_id?: string | null
          especie_alvo?: string | null
          forma_fisica?: string | null
          foto_url?: string | null
          id?: string
          indicacoes?: string | null
          marca?: string | null
          modo_preparo?: string | null
          modo_uso?: string | null
          niveis_garantia?: Json | null
          nome?: string
          observacoes?: string | null
          peso_liquido?: string | null
          precaucoes?: string | null
          registro_mapa?: string | null
          status?: string | null
          unidade_peso?: string | null
          updated_at?: string
          user_id?: string
          validade_meses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
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
          contem_origem_animal: boolean | null
          created_at: string
          data_venda: string | null
          empresa_id: string | null
          especie_destino: string | null
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
          sif_dipoa: string | null
          tipo_origem_animal: string | null
          user_id: string
        }
        Insert: {
          cliente_destino?: string | null
          contem_origem_animal?: boolean | null
          created_at?: string
          data_venda?: string | null
          empresa_id?: string | null
          especie_destino?: string | null
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
          sif_dipoa?: string | null
          tipo_origem_animal?: string | null
          user_id: string
        }
        Update: {
          cliente_destino?: string | null
          contem_origem_animal?: boolean | null
          created_at?: string
          data_venda?: string | null
          empresa_id?: string | null
          especie_destino?: string | null
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
          sif_dipoa?: string | null
          tipo_origem_animal?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rastreabilidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      recebimento_mp: {
        Row: {
          aprovado: boolean | null
          certificado_analise_numero: string | null
          certificado_analise_url: string | null
          certificado_analise_valido: boolean | null
          contraprova_local: string | null
          contraprova_quantidade: string | null
          contraprova_retida: boolean | null
          contraprova_validade: string | null
          created_at: string
          data: string
          empresa_id: string | null
          fornecedor: string
          id: string
          insetos: string | null
          lote: string | null
          materia_prima: string
          observacoes: string | null
          odor: string | null
          quantidade: string | null
          temperatura: string | null
          umidade: string | null
          unidade: string | null
          user_id: string
          validade: string | null
        }
        Insert: {
          aprovado?: boolean | null
          certificado_analise_numero?: string | null
          certificado_analise_url?: string | null
          certificado_analise_valido?: boolean | null
          contraprova_local?: string | null
          contraprova_quantidade?: string | null
          contraprova_retida?: boolean | null
          contraprova_validade?: string | null
          created_at?: string
          data?: string
          empresa_id?: string | null
          fornecedor: string
          id?: string
          insetos?: string | null
          lote?: string | null
          materia_prima: string
          observacoes?: string | null
          odor?: string | null
          quantidade?: string | null
          temperatura?: string | null
          umidade?: string | null
          unidade?: string | null
          user_id: string
          validade?: string | null
        }
        Update: {
          aprovado?: boolean | null
          certificado_analise_numero?: string | null
          certificado_analise_url?: string | null
          certificado_analise_valido?: boolean | null
          contraprova_local?: string | null
          contraprova_quantidade?: string | null
          contraprova_retida?: boolean | null
          contraprova_validade?: string | null
          created_at?: string
          data?: string
          empresa_id?: string | null
          fornecedor?: string
          id?: string
          insetos?: string | null
          lote?: string | null
          materia_prima?: string
          observacoes?: string | null
          odor?: string | null
          quantidade?: string | null
          temperatura?: string | null
          umidade?: string | null
          unidade?: string | null
          user_id?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recebimento_mp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      reclamacoes_qualidade: {
        Row: {
          acao_corretiva: string | null
          acao_imediata: string | null
          acao_preventiva: string | null
          analise_tecnica: string | null
          causa_raiz: string | null
          cliente: string
          cliente_notificado: boolean | null
          conclusao: string | null
          contato_cliente: string | null
          created_at: string
          data_analise: string | null
          data_compra: string | null
          data_fim_recolhimento: string | null
          data_inicio_recolhimento: string | null
          data_reclamacao: string
          data_resposta_cliente: string | null
          descricao_problema: string
          destino_produto_recolhido: string | null
          empresa_id: string | null
          evidencias: string | null
          id: string
          lote: string | null
          lotes_afetados: string | null
          motivo_recolhimento: string | null
          nota_fiscal: string | null
          numero_reclamacao: string
          observacoes: string | null
          pop_referencia: string | null
          prazo_resolucao: string | null
          produto: string
          quantidade_reclamada: string | null
          quantidade_recolhida: string | null
          requer_recolhimento: boolean | null
          responsavel_analise: string | null
          responsavel_resolucao: string | null
          satisfacao_cliente: string | null
          status: string
          status_recolhimento: string | null
          tipo_reclamacao: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acao_corretiva?: string | null
          acao_imediata?: string | null
          acao_preventiva?: string | null
          analise_tecnica?: string | null
          causa_raiz?: string | null
          cliente: string
          cliente_notificado?: boolean | null
          conclusao?: string | null
          contato_cliente?: string | null
          created_at?: string
          data_analise?: string | null
          data_compra?: string | null
          data_fim_recolhimento?: string | null
          data_inicio_recolhimento?: string | null
          data_reclamacao?: string
          data_resposta_cliente?: string | null
          descricao_problema: string
          destino_produto_recolhido?: string | null
          empresa_id?: string | null
          evidencias?: string | null
          id?: string
          lote?: string | null
          lotes_afetados?: string | null
          motivo_recolhimento?: string | null
          nota_fiscal?: string | null
          numero_reclamacao: string
          observacoes?: string | null
          pop_referencia?: string | null
          prazo_resolucao?: string | null
          produto: string
          quantidade_reclamada?: string | null
          quantidade_recolhida?: string | null
          requer_recolhimento?: boolean | null
          responsavel_analise?: string | null
          responsavel_resolucao?: string | null
          satisfacao_cliente?: string | null
          status?: string
          status_recolhimento?: string | null
          tipo_reclamacao?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acao_corretiva?: string | null
          acao_imediata?: string | null
          acao_preventiva?: string | null
          analise_tecnica?: string | null
          causa_raiz?: string | null
          cliente?: string
          cliente_notificado?: boolean | null
          conclusao?: string | null
          contato_cliente?: string | null
          created_at?: string
          data_analise?: string | null
          data_compra?: string | null
          data_fim_recolhimento?: string | null
          data_inicio_recolhimento?: string | null
          data_reclamacao?: string
          data_resposta_cliente?: string | null
          descricao_problema?: string
          destino_produto_recolhido?: string | null
          empresa_id?: string | null
          evidencias?: string | null
          id?: string
          lote?: string | null
          lotes_afetados?: string | null
          motivo_recolhimento?: string | null
          nota_fiscal?: string | null
          numero_reclamacao?: string
          observacoes?: string | null
          pop_referencia?: string | null
          prazo_resolucao?: string | null
          produto?: string
          quantidade_reclamada?: string | null
          quantidade_recolhida?: string | null
          requer_recolhimento?: boolean | null
          responsavel_analise?: string | null
          responsavel_resolucao?: string | null
          satisfacao_cliente?: string | null
          status?: string
          status_recolhimento?: string | null
          tipo_reclamacao?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reclamacoes_qualidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_limpeza: {
        Row: {
          conforme: boolean | null
          created_at: string
          cronograma_id: string | null
          data_execucao: string
          empresa_id: string | null
          executor: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          observacoes: string | null
          tipo_limpeza: string | null
          user_id: string
        }
        Insert: {
          conforme?: boolean | null
          created_at?: string
          cronograma_id?: string | null
          data_execucao?: string
          empresa_id?: string | null
          executor: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          observacoes?: string | null
          tipo_limpeza?: string | null
          user_id: string
        }
        Update: {
          conforme?: boolean | null
          created_at?: string
          cronograma_id?: string | null
          data_execucao?: string
          empresa_id?: string | null
          executor?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          observacoes?: string | null
          tipo_limpeza?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_limpeza_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "cronogramas_higiene"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_limpeza_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          created_at: string
          data_geracao: string | null
          descricao: string | null
          empresa_id: string | null
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
          empresa_id?: string | null
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
          empresa_id?: string | null
          id?: string
          modulo?: string
          status?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      rotulos: {
        Row: {
          altura_mm: number | null
          armazenamento: string | null
          classificacao_label: string | null
          cnpj: string | null
          composicao_ingredientes: string | null
          created_at: string
          empresa_id: string | null
          endereco: string | null
          especie_categoria: string | null
          eventuais_substitutivos: string | null
          fabricacao_placeholder: string | null
          id: string
          indicacoes_uso: string | null
          largura_mm: number | null
          lote_placeholder: string | null
          modo_usar: string | null
          niveis_garantia_texto: string | null
          nome_comercial: string | null
          peso_liquido: string | null
          prazo_validade: string | null
          precaucoes_restricoes: string | null
          produto_id: string
          razao_social: string | null
          registro_mapa: string | null
          rt_crmv: string | null
          rt_nome: string | null
          sac_contato: string | null
          status: string | null
          tipo_rotulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          altura_mm?: number | null
          armazenamento?: string | null
          classificacao_label?: string | null
          cnpj?: string | null
          composicao_ingredientes?: string | null
          created_at?: string
          empresa_id?: string | null
          endereco?: string | null
          especie_categoria?: string | null
          eventuais_substitutivos?: string | null
          fabricacao_placeholder?: string | null
          id?: string
          indicacoes_uso?: string | null
          largura_mm?: number | null
          lote_placeholder?: string | null
          modo_usar?: string | null
          niveis_garantia_texto?: string | null
          nome_comercial?: string | null
          peso_liquido?: string | null
          prazo_validade?: string | null
          precaucoes_restricoes?: string | null
          produto_id: string
          razao_social?: string | null
          registro_mapa?: string | null
          rt_crmv?: string | null
          rt_nome?: string | null
          sac_contato?: string | null
          status?: string | null
          tipo_rotulo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          altura_mm?: number | null
          armazenamento?: string | null
          classificacao_label?: string | null
          cnpj?: string | null
          composicao_ingredientes?: string | null
          created_at?: string
          empresa_id?: string | null
          endereco?: string | null
          especie_categoria?: string | null
          eventuais_substitutivos?: string | null
          fabricacao_placeholder?: string | null
          id?: string
          indicacoes_uso?: string | null
          largura_mm?: number | null
          lote_placeholder?: string | null
          modo_usar?: string | null
          niveis_garantia_texto?: string | null
          nome_comercial?: string | null
          peso_liquido?: string | null
          prazo_validade?: string | null
          precaucoes_restricoes?: string | null
          produto_id?: string
          razao_social?: string | null
          registro_mapa?: string | null
          rt_crmv?: string | null
          rt_nome?: string | null
          sac_contato?: string | null
          status?: string | null
          tipo_rotulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rotulos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotulos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      saude_manipuladores: {
        Row: {
          apto: boolean | null
          created_at: string
          crm: string | null
          data_exame: string
          data_validade: string | null
          empresa_id: string | null
          funcionario: string
          id: string
          medico: string | null
          observacoes: string | null
          restricoes: string | null
          status: string | null
          tipo_exame: string
          updated_at: string
          user_id: string
        }
        Insert: {
          apto?: boolean | null
          created_at?: string
          crm?: string | null
          data_exame?: string
          data_validade?: string | null
          empresa_id?: string | null
          funcionario: string
          id?: string
          medico?: string | null
          observacoes?: string | null
          restricoes?: string | null
          status?: string | null
          tipo_exame?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          apto?: boolean | null
          created_at?: string
          crm?: string | null
          data_exame?: string
          data_validade?: string | null
          empresa_id?: string | null
          funcionario?: string
          id?: string
          medico?: string | null
          observacoes?: string | null
          restricoes?: string | null
          status?: string | null
          tipo_exame?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saude_manipuladores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      testes_rastreabilidade: {
        Row: {
          created_at: string
          data_teste: string | null
          destinos_rastreados: number | null
          detalhes_json: Json | null
          direcao: string
          empresa_id: string | null
          id: string
          jusante_encontrado: boolean | null
          lote_testado: string
          materias_primas_rastreadas: number | null
          montante_encontrado: boolean | null
          observacoes: string | null
          produto: string
          resultado: string | null
          tempo_segundos: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data_teste?: string | null
          destinos_rastreados?: number | null
          detalhes_json?: Json | null
          direcao?: string
          empresa_id?: string | null
          id?: string
          jusante_encontrado?: boolean | null
          lote_testado: string
          materias_primas_rastreadas?: number | null
          montante_encontrado?: boolean | null
          observacoes?: string | null
          produto: string
          resultado?: string | null
          tempo_segundos?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          data_teste?: string | null
          destinos_rastreados?: number | null
          detalhes_json?: Json | null
          direcao?: string
          empresa_id?: string | null
          id?: string
          jusante_encontrado?: boolean | null
          lote_testado?: string
          materias_primas_rastreadas?: number | null
          montante_encontrado?: boolean | null
          observacoes?: string | null
          produto?: string
          resultado?: string | null
          tempo_segundos?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "testes_rastreabilidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      treinamentos: {
        Row: {
          created_at: string
          data: string
          empresa_id: string | null
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
          empresa_id?: string | null
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
          empresa_id?: string | null
          funcionario?: string
          id?: string
          instrutor?: string | null
          treinamento?: string
          user_id?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treinamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      validacao_limpeza_linha: {
        Row: {
          contem_medicamento: boolean | null
          created_at: string
          data_validacao: string | null
          empresa_id: string | null
          hora_validacao: string | null
          id: string
          limite_aceitavel: string | null
          linha_producao: string
          metodo_analise: string | null
          observacoes: string | null
          produto_anterior: string
          produto_seguinte: string
          residuo_detectado: string | null
          responsavel: string | null
          resultado: string | null
          tipo_validacao: string | null
          user_id: string
        }
        Insert: {
          contem_medicamento?: boolean | null
          created_at?: string
          data_validacao?: string | null
          empresa_id?: string | null
          hora_validacao?: string | null
          id?: string
          limite_aceitavel?: string | null
          linha_producao: string
          metodo_analise?: string | null
          observacoes?: string | null
          produto_anterior: string
          produto_seguinte: string
          residuo_detectado?: string | null
          responsavel?: string | null
          resultado?: string | null
          tipo_validacao?: string | null
          user_id: string
        }
        Update: {
          contem_medicamento?: boolean | null
          created_at?: string
          data_validacao?: string | null
          empresa_id?: string | null
          hora_validacao?: string | null
          id?: string
          limite_aceitavel?: string | null
          linha_producao?: string
          metodo_analise?: string | null
          observacoes?: string | null
          produto_anterior?: string
          produto_seguinte?: string
          residuo_detectado?: string | null
          responsavel?: string | null
          resultado?: string | null
          tipo_validacao?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "validacao_limpeza_linha_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
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
