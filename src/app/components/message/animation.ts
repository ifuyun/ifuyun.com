import { animate, AnimationTriggerMetadata, style, transition, trigger } from '@angular/animations';

export class AnimationDuration {
  static SLOW = '0.3s';
  static BASE = '0.2s';
  static FAST = '0.1s';
}

export const moveUpMotion: AnimationTriggerMetadata = trigger('moveUpMotion', [
  transition('* => enter', [
    style({
      transformOrigin: '0 0',
      transform: 'translateY(-100%)',
      opacity: 0
    }),
    animate(
      `${AnimationDuration.BASE}`,
      style({
        transformOrigin: '0 0',
        transform: 'translateY(0%)',
        opacity: 1
      })
    )
  ]),
  transition('* => leave', [
    style({
      transformOrigin: '0 0',
      transform: 'translateY(0%)',
      opacity: 1
    }),
    animate(
      `${AnimationDuration.BASE}`,
      style({
        transformOrigin: '0 0',
        transform: 'translateY(-100%)',
        opacity: 0
      })
    )
  ])
]);
