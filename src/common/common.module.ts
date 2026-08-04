import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from '../config/app.config';
import { envValidationSchema } from '../config/env.validation';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: envValidationSchema,
    }),
  ],
  exports: [ConfigModule],
})
export class CommonModule {}
