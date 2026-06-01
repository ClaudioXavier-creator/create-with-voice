import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Simulando processamento por IA/OCR
    // Em um cenário real, aqui chamaríamos uma API como Google Vision, AWS Textract ou OpenAI Vision
    // Para este protótipo, vamos retornar uma estrutura de exemplo que demonstra a capacidade
    
    console.log("Processando arquivo:", (file as File).name)

    const mockData = {
      numero_nf: Math.floor(Math.random() * 100000).toString(),
      cliente_nome: "Cliente Identificado por Foto",
      data_emissao: new Date().toISOString().slice(0, 10),
      observacoes: "Documento processado via Captura de Imagem (OCR)",
      itens: [
        { produto: "Produto Detectado na Imagem", lote_produto: "LOTE-FOTO-001", quantidade: 1000, unidade: "kg" }
      ]
    }

    return new Response(JSON.stringify(mockData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
