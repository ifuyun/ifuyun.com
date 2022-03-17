import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { PlatformService } from '../../core/platform.service';
import { moveUpMotion } from './animation';
import { MessageBaseComponent } from './base';
import { MessageData } from './message.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  selector: 'message',
  preserveWhitespaces: false,
  animations: [moveUpMotion],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.less']
})
export class MessageComponent extends MessageBaseComponent implements OnInit, OnDestroy {
  @Input() override message!: Required<MessageData>;
  @Output() override readonly destroyed = new EventEmitter<{ id: string; userAction: boolean }>();

  constructor(
    protected override cdr: ChangeDetectorRef,
    protected override platform: PlatformService
  ) {
    super(cdr, platform);
  }
}
