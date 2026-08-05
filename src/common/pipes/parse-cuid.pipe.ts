import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const isCuid = /^c[a-z0-9]{20,30}$/i.test(value);
    const isPremiumId = /^RL-[A-Z0-9]{6}$/i.test(value);
    
    if (typeof value !== 'string' || (!isCuid && !isPremiumId)) {
      throw new BadRequestException('Validation failed (valid CUID or Premium ID expected)');
    }
    return value;
  }
}
