import { animate, AnimationTriggerMetadata, style, transition, trigger } from '@angular/animations';
import { AnimationDuration } from '../message/animation';

export const fadeMotion: AnimationTriggerMetadata = trigger('fadeMotion', [
  transition(':enter', [style({ opacity: 0 }), animate(`${AnimationDuration.BASE}`, style({ opacity: 1 }))]),
  transition(':leave', [style({ opacity: 1 }), animate(`${AnimationDuration.BASE}`, style({ opacity: 0 }))])
]);
