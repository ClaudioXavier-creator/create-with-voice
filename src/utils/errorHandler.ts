
import { toast } from "sonner";

/**
 * Utilitário centralizado para tratamento de erros e logs.
 */
export const errorHandler = {
  log: (error: unknown, context?: string) => {
    const err = error as any;
    const message = err?.message || err?.error_description || "Erro inesperado no sistema";
    console.error(`[${context || "App"}]`, error);
    return message;
  },

  handle: (error: unknown, context?: string) => {
    const message = errorHandler.log(error, context);
    toast.error(message, {
      description: "Se o problema persistir, entre em contato com o suporte.",
    });
    return message;
  },

  // Para uso em blocos try/catch ou promessas
  wrap: async <T>(promise: Promise<T>, context?: string): Promise<[T | null, any]> => {
    try {
      const data = await promise;
      return [data, null];
    } catch (error) {
      errorHandler.handle(error, context);
      return [null, error];
    }
  }
};
