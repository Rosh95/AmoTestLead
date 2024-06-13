import { Test, TestingModule } from '@nestjs/testing';
import { AmocrmService } from './amocrm.service';

describe('AmocrmService', () => {
  let service: AmocrmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AmocrmService],
    }).compile();

    service = module.get<AmocrmService>(AmocrmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
