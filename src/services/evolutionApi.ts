/**
 * Service to interact with Evolution API
 * Documentation: https://doc.evolution-api.com/
 */

export interface EvolutionInstance {
  instanceName: string;
  owner?: string;
  profileName?: string;
  profilePictureUrl?: string;
  status: 'open' | 'connecting' | 'close';
  serverUrl?: string;
  apikey?: string;
}

export interface EvolutionQrCode {
  base64?: string;
  code?: string;
  pairingCode?: string;
}

const normalizeInstance = (item: any): EvolutionInstance => {
  const source = item?.instance ?? item;
  return {
    instanceName: source?.instanceName ?? source?.name ?? item?.instanceName ?? "Instância sem nome",
    owner: source?.owner ?? item?.owner,
    profileName: source?.profileName ?? item?.profileName,
    profilePictureUrl: source?.profilePictureUrl ?? item?.profilePictureUrl,
    status: (source?.status ?? source?.connectionStatus ?? item?.status ?? item?.connectionStatus ?? "close") as EvolutionInstance["status"],
    serverUrl: source?.serverUrl ?? item?.serverUrl,
    apikey: source?.apikey ?? item?.apikey,
  };
};

const readEvolutionError = async (response: Response, fallback: string) => {
  const errorData = await response.json().catch(() => null);
  const message = Array.isArray(errorData?.message)
    ? errorData.message.join(" ")
    : errorData?.message || errorData?.error || fallback;
  return `${message} (${response.status})`;
};

const normalizeBase64Image = (value?: string) => {
  if (!value) return undefined;
  if (value.startsWith("data:image") || value.startsWith("http")) return value;
  return `data:image/png;base64,${value}`;
};

const collectObjects = (value: any): any[] => {
  if (!value || typeof value !== "object") return [];
  const nested = Object.values(value).flatMap((item) => collectObjects(item));
  return [value, ...nested];
};

const firstString = (objects: any[], keys: string[]) => {
  for (const object of objects) {
    for (const key of keys) {
      const value = object?.[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return undefined;
};

const looksLikeImage = (value: string) => (
  value.startsWith("data:image") ||
  value.startsWith("http") ||
  value.startsWith("iVBOR") ||
  value.startsWith("/9j/") ||
  (value.length > 500 && /^[A-Za-z0-9+/=\r\n]+$/.test(value))
);

const normalizeQrCode = (data: any): EvolutionQrCode => {
  if (typeof data === "string") {
    const value = data.trim();
    return looksLikeImage(value) ? { base64: normalizeBase64Image(value) } : { code: value };
  }

  const source = data?.qrcode ?? data?.qrCode ?? data?.qr ?? data?.data?.qrcode ?? data?.data?.qrCode ?? data?.instance?.qrcode ?? data;
  if (typeof source === "string") {
    const value = source.trim();
    return looksLikeImage(value) ? { base64: normalizeBase64Image(value) } : { code: value };
  }

  const objects = collectObjects(source);
  const base64 = firstString(objects, ["base64", "base64Image", "qrCodeBase64", "qrBase64", "qrcodeBase64", "base64Qr", "base64QRCode"]);
  return {
    base64: normalizeBase64Image(base64),
    code: firstString(objects, ["code", "qrCode", "qrcode", "qr", "qrCodeString", "qr_code"]),
    pairingCode: firstString(objects, ["pairingCode", "pairing_code"]),
  };
};

export const evolutionService = {
  /**
   * Fetch all instances
   */
  async fetchInstances(apiUrl: string, apiKey: string): Promise<EvolutionInstance[]> {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/instance/fetchInstances`, {
      headers: {
        "apikey": apiKey
      }
    });
    if (!response.ok) throw new Error(await readEvolutionError(response, "Falha ao buscar instâncias"));
    const data = await response.json();
    return Array.isArray(data) ? data.map(normalizeInstance) : [];
  },

  /**
   * Create a new instance
   */
  async createInstance(apiUrl: string, apiKey: string, instanceName: string) {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/instance/create`, {
      method: "POST",
      headers: {
        "apikey": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      })
    });
    if (!response.ok) {
      // 403/409 = já existe → tratar como sucesso silencioso
      if (response.status === 403 || response.status === 409) {
        return { alreadyExists: true, instanceName };
      }
      throw new Error(await readEvolutionError(response, "Falha ao criar instância"));
    }
    const data = await response.json();
    return { ...data, normalizedQrCode: normalizeQrCode(data) };
  },

  /**
   * Get QR Code for an instance
   */
  async getQrCode(apiUrl: string, apiKey: string, instanceName: string) {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/instance/connect/${instanceName}`, {
      headers: {
        "apikey": apiKey
      }
    });
    if (!response.ok) throw new Error(await readEvolutionError(response, "Falha ao buscar QR Code"));
    return normalizeQrCode(await response.json());
  },

  /**
   * Logout an instance
   */
  async logoutInstance(apiUrl: string, apiKey: string, instanceName: string) {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/instance/logout/${instanceName}`, {
      method: "DELETE",
      headers: {
        "apikey": apiKey
      }
    });
    if (!response.ok) throw new Error("Falha ao desconectar");
    return response.json();
  },

  /**
   * Delete an instance
   */
  async deleteInstance(apiUrl: string, apiKey: string, instanceName: string) {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: {
        "apikey": apiKey
      }
    });
    if (!response.ok) throw new Error("Falha ao deletar instância");
    return response.json();
  },

  /**
   * Send a text message
   */
  async sendMessage(apiUrl: string, apiKey: string, instanceName: string, number: string, text: string) {
    // Clean number: remove all non-digits
    const cleanNumber = number.replace(/\D/g, "");
    
    // Check if it's a Brazilian number and fix common formatting issues
    let formattedNumber = cleanNumber;
    if (cleanNumber.startsWith("55") && cleanNumber.length === 13) {
      // Often Brazilian mobile numbers are sent with 9 digits but Evolution/WhatsApp API 
      // sometimes expects the 8-digit format (without the extra 9) for older accounts.
      // However, most modern APIs handle the 13-digit format fine. 
      // We keep as is but ensure no '+' prefix.
    }

    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: {
        "apikey": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        number: formattedNumber,
        options: {
          delay: 1200,
          presence: "composing",
          linkPreview: false
        },
        textMessage: {
          text
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Evolution API Error:", errorData);
      throw new Error(errorData.message || `Erro ${response.status}: Falha ao enviar mensagem`);
    }
    return response.json();
  }
};
