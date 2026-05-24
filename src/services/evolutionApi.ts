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
  }
};
