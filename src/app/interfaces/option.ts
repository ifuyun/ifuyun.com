import { LinkTarget } from 'src/app/enums/link';
import { OptionScope, OptionStatus } from 'src/app/enums/option';

export interface OptionEntity {
  [key: string]: string;
}

export interface OptionModel {
  optionId: string;
  optionName: string;
  optionValue: string;
  optionDescription: string;
  optionScope: OptionScope;
  optionSecure: 0 | 1;
  optionOrder: number;
  optionStatus: OptionStatus;
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
  orderBy?: 'hottest' | 'newest' | 'oldest' | 'random';
  size?: number;
  resolution?: string;
}
