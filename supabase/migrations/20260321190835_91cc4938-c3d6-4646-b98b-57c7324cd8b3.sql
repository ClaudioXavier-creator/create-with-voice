
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tipo_usuario text NOT NULL DEFAULT 'cliente';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome, tipo_usuario)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'cliente')
  );
  RETURN NEW;
END;
$function$;
