import { LinkTarget } from 'common/enums';

export interface Carousel {
  id: string;
  title: string;
  caption: string;
  url: string;
  link?: string;
  target: LinkTarget;
  order: number;
}

export interface CarouselVo extends Carousel {
  fullUrl: string;
}

export interface CarouselOptions {
  type: 'album' | 'wallpaper';
  orderBy?: 'hottest' | 'newest' | 'oldest' | 'random';
  size?: number;
}
