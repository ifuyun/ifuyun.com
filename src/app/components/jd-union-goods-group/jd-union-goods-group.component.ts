import { Component } from '@angular/core';
import { UserAgentService } from '../../core/user-agent.service';

@Component({
  selector: 'i-jd-union-goods-group',
  templateUrl: './jd-union-goods-group.component.html',
  styleUrls: ['./jd-union-goods-group.component.less']
})
export class JdUnionGoodsGroupComponent {
  readonly materialEliteIds = Object.freeze([2, 3, 4]);

  isMobile = false;
  eliteId = this.materialEliteIds[Math.floor(Math.random() * this.materialEliteIds.length)];
  pageSize = 0;

  constructor(private userAgentService: UserAgentService) {
    this.isMobile = this.userAgentService.isMobile();
    this.pageSize = this.isMobile ? 1 : 3;
  }
}
