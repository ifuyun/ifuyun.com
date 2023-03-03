import { NgFor, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { PaginatorEntity } from '../../core/paginator.interface';
import { UserAgentService } from '../../core/user-agent.service';

@Component({
  selector: 'app-page-bar',
  templateUrl: './page-bar.component.html',
  styleUrls: ['./page-bar.component.less'],
  standalone: true,
  imports: [NgFor, NgIf, RouterLink]
})
export class PageBarComponent {
  @Input() paginator: PaginatorEntity | null = null;
  @Input() url = '';
  @Input() isPath = true;
  @Input() showBackground = true;
  @Input() param: Params = {};

  isMobile = false;

  constructor(private userAgentService: UserAgentService) {
    this.isMobile = this.userAgentService.isMobile();
  }

  getRouterLink(page: number): string {
    return this.isPath ? this.url + page : this.url;
  }

  getQueryParams(page: number): Params {
    if (this.isPath || page === 1) {
      return this.param;
    }
    return { ...this.param, page };
  }

  counter(size: number) {
    return new Array(size);
  }
}
