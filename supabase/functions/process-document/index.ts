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
    const file = formData.get('file') as File

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      console.warn("OPENAI_API_KEY não configurada, retornando mock.")
      return new Response(JSON.stringify({
        numero_nf: "MOCK-" + Math.floor(Math.random() * 1000).toString(),
        cliente_nome: "Simulação: Configure a OPENAI_API_KEY",
        data_emissao: new Date().toISOString().slice(0, 10),
        observacoes: "Mock: Chave API OpenAI ausente.",
        itens: [{ produto: "Item de Teste", lote_produto: "LOTE-MOCK", quantidade: 1, unidade: "kg" }]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    console.log(`Enviando imagem (${file.name}) para OpenAI Vision...`)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Você é um assistente especializado em extrair dados de documentos de expedição, romaneios e notas fiscais (inclusive manuscritos). Retorne apenas um JSON puro, sem markdown, contendo: numero_nf (string), cliente_nome (string), data_emissao (string YYYY-MM-DD), observacoes (string) e itens (array de objetos com: produto, lote_produto, quantidade, unidade)."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extraia os dados deste documento de expedição. Se houver campos escritos à mão, tente decifrá-los cuidadosamente, especialmente o lote e a quantidade. Se não encontrar um campo, deixe-o vazio ou null."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.type};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      }),
    })

    const result = await response.json()
    console.log("Resposta da OpenAI recebida.")

    if (result.error) {
      throw new Error(result.error.message)
    }

    const extraction = JSON.parse(result.choices[0].message.content)

    return new Response(JSON.stringify(extraction), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Erro no process-document:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
