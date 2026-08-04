import { GscQueryResponse, GscCredentials } from '@/types/gsc';

export class GscClient {
  private accessToken: string;
  private siteUrl: string;
  private readonly baseUrl = 'https://www.googleapis.com/webmasters/v3';

  constructor(siteUrl: string, credentials: GscCredentials) {
    this.siteUrl = encodeURIComponent(siteUrl);
    this.accessToken = credentials.access_token;
  }

  updateToken(newToken: string) {
    this.accessToken = newToken;
  }

  async searchAnalytics(
    startDate: string,
    endDate: string,
    dimensions: string[] = ['query', 'page']
  ): Promise<GscQueryResponse> {
    const body = {
      startDate,
      endDate,
      dimensions,
      rowLimit: 25000,
    };

    const response = await fetch(
      `${this.baseUrl}/sites/${this.siteUrl}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('GSC_AUTH_EXPIRED');
      }
      throw new Error(`GSC API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getIndexingStatus(url: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/urlInspection/index?url=${encodeURIComponent(url)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GSC API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getSiteList(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/sites`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`GSC API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.siteEntry || [];
  }

  async getCoreWebVitals(pageExperience: string = 'all'): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/sites/${this.siteUrl}/coreWebVitals?pageExperience=${pageExperience}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GSC API error: ${response.statusText}`);
    }

    return response.json();
  }

  async validateConnection(): Promise<boolean> {
    try {
      await this.getSiteList();
      return true;
    } catch (error) {
      return false;
    }
  }
}
