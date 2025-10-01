import axios, { AxiosRequestConfig } from 'axios';

interface ServiceConfig {
  baseUrl: string;
  timeout?: number;
}

export class ServiceProxy {
  private services: Map<string, ServiceConfig>;

  constructor() {
    this.services = new Map([
      ['main', {
        baseUrl: process.env.MAIN_API_URL || 'http://localhost:3000',
        timeout: 30000
      }],
      ['scraping', {
        baseUrl: process.env.SCRAPING_SERVICE_URL || 'http://localhost:3001',
        timeout: 60000 // Scraping puede tomar más tiempo
      }]
    ]);
  }

  async proxyRequest(
    serviceName: string,
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    data?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    const service = this.services.get(serviceName);

    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const config: AxiosRequestConfig = {
      method,
      url: `${service.baseUrl}${path}`,
      timeout: service.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      config.data = data;
    } else if (data && method === 'GET') {
      config.params = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          status: error.response?.status || 500,
          message: error.response?.data?.message || error.message,
          service: serviceName
        };
      }
      throw error;
    }
  }

  async checkServiceHealth(serviceName: string): Promise<boolean> {
    try {
      const service = this.services.get(serviceName);
      if (!service) return false;

      await axios.get(`${service.baseUrl}/health`, { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  getServiceUrl(serviceName: string): string | undefined {
    return this.services.get(serviceName)?.baseUrl;
  }
}
