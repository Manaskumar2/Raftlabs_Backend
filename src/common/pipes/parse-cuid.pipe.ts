import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== 'string' || !/^c[a-z0-9]{20,30}$/i.test(value)) {
      throw new BadRequestException('Validation failed (valid CUID expected)');
    }
    return value;
  }
}
