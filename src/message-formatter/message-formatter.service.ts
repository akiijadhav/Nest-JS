import { Injectable } from '@nestjs/common';

@Injectable()
export class MessageFormatterService {
  public format(message: string): string {
    const timeStamp = new Date().toISOString();
    message = `[${timeStamp}] ${message}`;
    return message;
  }
}
