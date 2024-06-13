import { Controller, Get, Query } from '@nestjs/common';
import { AmocrmService } from './amocrm.service';

@Controller('api/leads')
export class AmocrmController {
  constructor(private readonly amocrmService: AmocrmService) {}

  @Get()
  async getLeads(@Query('query') query: string) {
    if (query && query.length < 3) {
      return { message: 'Query parameter must be at least 3 characters long' };
    }
    return this.amocrmService.getLeads(query);
  }
}
