import { LinkTarget } from '../config/common.enum';

export interface OptionEntity {
  [key: string]: string;
}

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
  orderBy?: 'newest' | 'oldest' | 'random';
  size?: number;
  resolution?: string;
}
