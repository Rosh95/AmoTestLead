import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class AmocrmService {
  private readonly amocrmDomain = process.env.AMOCRM_DOMAIN;
  private readonly clientId = process.env.AMOCRM_CLIENT_ID;
  private readonly clientSecret = process.env.AMOCRM_CLIENT_SECRET;
  private readonly redirectUri = process.env.AMOCRM_REDIRECT_URI;
  private accessToken = process.env.AMOCRM_ACCESS_TOKEN;
  private refreshToken = process.env.AMOCRM_REFRESH_TOKEN;

  private async refreshAccessToken() {
    const url = `https://${this.amocrmDomain}/oauth2/access_token`;
    try {
      const response = await axios.post(url, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        redirect_uri: this.redirectUri,
      });
      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;

      process.env.AMOCRM_ACCESS_TOKEN = this.accessToken;
      process.env.AMOCRM_REFRESH_TOKEN = this.refreshToken;
    } catch (error) {
      console.error(
        'Error refreshing access token:',
        error.response ? error.response.data : error.message,
      );
      throw new HttpException(
        'Failed to refresh access token',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async getHeaders() {
    if (!this.accessToken) {
      await this.refreshAccessToken();
    }

    return {
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  async getLeads(query?: string) {
    const url = `https://${this.amocrmDomain}/api/v4/leads`;
    const headers = await this.getHeaders();

    let leadsResponse;
    try {
      leadsResponse = await axios.get(url, { headers, params: { query } });
      console.log(
        'Leads response data:',
        JSON.stringify(leadsResponse.data, null, 2),
      );
    } catch (error) {
      console.error(
        'Error fetching leads:',
        error.response ? error.response.data : error.message,
      );
      if (error.response && error.response.status === 401) {
        await this.refreshAccessToken();
        const headers = await this.getHeaders();
        leadsResponse = await axios.get(url, { headers, params: { query } });
        console.log(
          'Leads response after refreshing token:',
          JSON.stringify(leadsResponse.data, null, 2),
        );
      } else {
        throw new HttpException(
          'Failed to fetch leads',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (!leadsResponse || !leadsResponse.data) {
      console.error('Leads response is invalid:', leadsResponse);
      throw new HttpException(
        'Invalid response from leads API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const embedded = leadsResponse.data._embedded;
    if (!embedded || !embedded.leads) {
      console.error(
        'Leads response embedded data is invalid:',
        leadsResponse.data,
      );
      throw new HttpException(
        'No leads found in the response',
        HttpStatus.NOT_FOUND,
      );
    }

    const leads = embedded.leads;
    console.log('Parsed leads:', JSON.stringify(leads, null, 2));

    // Собираем идентификаторы контактов, проверяя наличие контактов в каждом lead
    const contactIds = leads
      .filter((lead) => lead._embedded && lead._embedded.contacts)
      .map((lead) => lead._embedded.contacts.map((contact) => contact.id))
      .flat();
    const uniqueContactIds: number[] = Array.from(new Set(contactIds));

    const contacts = await this.getContacts(uniqueContactIds);

    return leads.map((lead) => ({
      ...lead,
      contacts:
        lead._embedded && lead._embedded.contacts
          ? lead._embedded.contacts.map((contact) =>
              contacts.find((c) => c.id === contact.id),
            )
          : [],
    }));
  }

  async getContacts(contactIds: number[]) {
    if (contactIds.length === 0) {
      return [];
    }
    const url = `https://${this.amocrmDomain}/api/v4/contacts`;
    const headers = await this.getHeaders();

    let contactsResponse;
    try {
      contactsResponse = await axios.get(url, {
        headers,
        params: { id: contactIds.join(',') },
      });
      console.log(
        'Contacts response data:',
        JSON.stringify(contactsResponse.data, null, 2),
      );
    } catch (error) {
      console.error(
        'Error fetching contacts:',
        error.response ? error.response.data : error.message,
      );
      if (error.response && error.response.status === 401) {
        await this.refreshAccessToken();
        const headers = await this.getHeaders();
        contactsResponse = await axios.get(url, {
          headers,
          params: { id: contactIds.join(',') },
        });
        console.log(
          'Contacts response after refreshing token:',
          JSON.stringify(contactsResponse.data, null, 2),
        );
      } else {
        throw new HttpException(
          'Failed to fetch contacts',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (!contactsResponse || !contactsResponse.data) {
      console.error('Contacts response is invalid:', contactsResponse);
      throw new HttpException(
        'Invalid response from contacts API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const embedded = contactsResponse.data._embedded;
    if (!embedded || !embedded.contacts) {
      console.error(
        'Contacts response embedded data is invalid:',
        contactsResponse.data,
      );
      throw new HttpException(
        'No contacts found in the response',
        HttpStatus.NOT_FOUND,
      );
    }

    return embedded.contacts;
  }
}
