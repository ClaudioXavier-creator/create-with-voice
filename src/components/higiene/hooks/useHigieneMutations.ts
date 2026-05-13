
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { errorHandler } from "@/utils/errorHandler";
import { toast } from "sonner";

export const useHigieneMutations = () => {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const qc = useQueryClient();

  const addCronograma = useMutation({
    mutationFn: async (form: any) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("cronogramas_higiene").insert({
        ...form,
        user_id: user.id,
        empresa_id: empresaAtiva?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cronogramas_higiene"] });
      toast.success("Cronograma cadastrado com sucesso!");
    },
    onError: (error) => errorHandler.handle(error, "Higiene: addCronograma"),
  });

  const deleteCronograma = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cronogramas_higiene").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cronogramas_higiene"] });
      toast.success("Cronograma removido");
    },
    onError: (error) => errorHandler.handle(error, "Higiene: deleteCronograma"),
  });

  const addRegistro = useMutation({
    mutationFn: async (regForm: any) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("registros_limpeza").insert({
        ...regForm,
        user_id: user.id,
        empresa_id: empresaAtiva?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["registros_limpeza"] });
      toast.success("Registro de limpeza salvo!");
    },
    onError: (error) => errorHandler.handle(error, "Higiene: addRegistro"),
  });

  return {
    addCronograma,
    deleteCronograma,
    addRegistro,
  };
};
