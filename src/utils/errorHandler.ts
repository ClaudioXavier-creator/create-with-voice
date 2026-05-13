
import { toast } from "sonner";

/**
 * Utilitário centralizado para tratamento de erros e logs.
 */
export const errorHandler = {
  log: (error: any, context?: string) => {
    const message = error?.message || "Erro desconhecido";
    console.error(`[${context || "App"}]`, error);
    return message;
  },

  handle: (error: any, context?: string) => {
    const message = errorHandler.log(error, context);
    toast.error(message);
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
