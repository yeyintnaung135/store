import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductPhotoStorage {
  save(link: string): string {
    return link;
  }

  remove(_link: string): void {}
}
