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
    if (!response.ok) throw new Error("Falha ao buscar instâncias");
    return response.json();
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
        token: "", // Optional custom token
        qrcode: true,
        number: "" // Optional
      })
    });
    if (!response.ok) throw new Error("Falha ao criar instância");
    return response.json();
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
    if (!response.ok) throw new Error("Falha ao buscar QR Code");
    return response.json();
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
