import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.split(" ")[1]
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { action, empresa_id, backup } = body;
    
    if (!empresa_id) {
      return new Response(JSON.stringify({ error: "empresa_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ação: Exportar Dados
    if (action === "export" || !action) {
      const tables = ["documentos_bpf", "modelos_empresa", "registros_customizados"];
      const backupData: any = {};

      for (const table of tables) {
        const { data, error } = await supabaseClient
          .from(table)
          .select("*")
          .eq("empresa_id", empresa_id);
        
        if (error) {
          console.error(`Error fetching table ${table}:`, error);
          backupData[table] = [];
        } else {
          backupData[table] = data;
        }
      }

      return new Response(JSON.stringify({ 
        ok: true, 
        generated_at: new Date().toISOString(),
        backup: backupData 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ação: Restaurar Dados
    if (action === "restore") {
      if (!backup) {
        throw new Error("Backup data is required for restore action");
      }

      // Log manual de auditoria para ação de sistema (restauração)
      // Necessário pois service_role faria o trigger gravar user_id=NULL
      await supabaseClient.from('audit_log').insert({
        tabela: 'system_backup',
        registro_id: empresa_id,
        operacao: 'restore_backup',
        usuario_id: user.id,
        dados_novos: { 
          tables: Object.keys(backup), 
          empresa_id,
          timestamp: new Date().toISOString()
        }
      });

      const results: any = {};

      const tables = Object.keys(backup);

      for (const table of tables) {
        const data = backup[table];
        if (!Array.isArray(data) || data.length === 0) continue;

        // Filtrar para garantir que todos os registros pertencem à empresa alvo
        const sanitizedData = data.map((item: any) => ({
          ...item,
          empresa_id: empresa_id // Forçar o empresa_id correto por segurança
        }));

        const { error } = await supabaseClient
          .from(table)
          .upsert(sanitizedData, { onConflict: 'id' });

        if (error) {
          console.error(`Error restoring table ${table}:`, error);
          results[table] = { success: false, error: error.message };
        } else {
          results[table] = { success: true, count: data.length };
        }
      }

      return new Response(JSON.stringify({ 
        ok: true, 
        message: "Restauração concluída",
        results 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Backup Edge Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});