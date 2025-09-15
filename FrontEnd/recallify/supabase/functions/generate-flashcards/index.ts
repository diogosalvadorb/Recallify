import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    
    if (!content) {
      throw new Error('Content is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado em criar flashcards de estudo. Crie flashcards no formato de perguntas e respostas baseados no conteúdo fornecido. Retorne um array JSON válido com objetos contendo "question" e "answer". Crie entre 5 a 10 flashcards relevantes.'
          },
          {
            role: 'user',
            content: `Crie flashcards de estudo (perguntas e respostas) baseados no seguinte conteúdo:\n\n${content}\n\nRetorne apenas um array JSON válido no formato: [{"question": "pergunta", "answer": "resposta"}]`
          }
        ],
        max_completion_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate flashcards');
    }

    const data = await response.json();
    let flashcardsText = data.choices[0].message.content;
    
    // Clean up the response to extract JSON
    flashcardsText = flashcardsText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const flashcards = JSON.parse(flashcardsText);
      return new Response(JSON.stringify({ flashcards }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing flashcards JSON:', parseError);
      throw new Error('Failed to parse generated flashcards');
    }
  } catch (error) {
    console.error('Error in generate-flashcards function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});