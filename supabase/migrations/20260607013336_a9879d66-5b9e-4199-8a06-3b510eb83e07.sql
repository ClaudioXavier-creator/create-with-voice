CREATE TABLE public.ai_chat_feedback (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_query TEXT,
    assistant_response TEXT NOT NULL,
    rating INTEGER NOT NULL, -- 1 para positivo, -1 para negativo
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.ai_chat_feedback ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Qualquer pessoa pode inserir feedback" ON public.ai_chat_feedback
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Apenas administradores podem ver feedback" ON public.ai_chat_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Grant privileges
GRANT INSERT ON public.ai_chat_feedback TO anon, authenticated;
GRANT SELECT ON public.ai_chat_feedback TO authenticated;
GRANT ALL ON public.ai_chat_feedback TO service_role;
