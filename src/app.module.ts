import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AmocrmService } from './amocrm/amocrm.service';
import { AmocrmController } from './amocrm/amocrm.controller';

@Module({
  imports: [],
  controllers: [AppController, AmocrmController],
  providers: [AppService, AmocrmService],
})
export class AppModule {}
