import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isEmpty, uniq } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { BehaviorSubject, combineLatest, debounceTime, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from 'src/app/components/breadcrumb/breadcrumb.component';
import { MakeMoneyComponent } from 'src/app/components/make-money/make-money.component';
import { MAX_IP_VALUE, REGEXP_IP } from 'src/app/config/common.constant';
import { IPInfo } from 'src/app/interfaces/ip';
import { HTMLMetaData } from 'src/app/interfaces/meta';
import { OptionEntity } from 'src/app/interfaces/option';
import { TenantAppModel } from 'src/app/interfaces/tenant-app';
import { IP_PAGE_DESCRIPTION, IP_PAGE_KEYWORDS } from 'src/app/pages/tool/tool.constant';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { CommonService } from 'src/app/services/common.service';
import { DestroyService } from 'src/app/services/destroy.service';
import { IpService } from 'src/app/services/ip.service';
import { MessageService } from 'src/app/services/message.service';
import { MetaService } from 'src/app/services/meta.service';
import { OptionService } from 'src/app/services/option.service';
import { TenantAppService } from 'src/app/services/tenant-app.service';
import { UserAgentService } from 'src/app/services/user-agent.service';

@Component({
  selector: 'app-ip',
  imports: [
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzEmptyModule,
    BreadcrumbComponent,
    MakeMoneyComponent
  ],
  providers: [DestroyService],
  templateUrl: './ip.component.html',
  styleUrls: ['../tool.less', './ip.component.less']
})
export class IpComponent implements OnInit {
  isMobile = false;
  ip = '';
  ipResult: IPInfo | null = null;
  ipVersion = '';

  protected pageIndex = 'tool-ip';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private contentChange$ = new BehaviorSubject('');

  constructor(
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly message: MessageService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly ipService: IpService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    this.updatePageIndex();
    this.updateBreadcrumbs();
    this.initInput();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo = appInfo;
        this.options = options;

        this.updatePageInfo();
      });
  }

  query() {
    if (!this.ip.trim()) {
      return;
    }
    if (!REGEXP_IP.test(this.ip) && !/^\d+$/i.test(this.ip)) {
      this.message.error('输入内容有误，请输入有效的 IPv4 地址');
      return;
    }
    if (/^\d+$/i.test(this.ip) && Number(this.ip) > MAX_IP_VALUE) {
      this.message.error('IP 地址超出最大范围');
      return;
    }
    this.ipService
      .searchIP(this.ip)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.list) {
          this.ipResult = res.list[Object.keys(res.list)[0]];
          this.ipVersion = res.version;
        }
      });
  }

  reset() {
    this.ip = '';
    this.ipResult = null;
  }

  onContentChange(content: string) {
    this.contentChange$.next(content);
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private initInput() {
    this.contentChange$
      .asObservable()
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe(() => {
        this.ipResult = null;
      });
  }

  private updatePageInfo() {
    const titles = ['IP 地址查询', '工具', this.appInfo.appName];
    const description = `${this.appInfo.appName} ${IP_PAGE_DESCRIPTION}`;
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description,
      keywords: uniq(IP_PAGE_KEYWORDS)
        .filter((item) => !!item)
        .join(','),
      author: this.options['site_author']
    };
    this.metaService.updateHTMLMeta(metaData);
  }

  private updateBreadcrumbs(): void {
    const breadcrumbs = [
      {
        label: '工具',
        tooltip: '工具',
        url: '/tool',
        isHeader: false
      },
      {
        label: 'IP 地址查询',
        tooltip: 'IP 地址查询',
        url: '/tool/ip',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
