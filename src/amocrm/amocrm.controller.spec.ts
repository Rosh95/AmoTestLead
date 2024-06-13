import { Test, TestingModule } from '@nestjs/testing';
import { AmocrmController } from './amocrm.controller';

describe('AmocrmController', () => {
  let controller: AmocrmController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AmocrmController],
    }).compile();

    controller = module.get<AmocrmController>(AmocrmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
