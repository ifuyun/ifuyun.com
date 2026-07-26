import { HttpStatusCode } from '@angular/common/http';
import { Component, inject, model, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorState, Message } from 'common/core';
import { CommonService } from 'common/services';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzResultModule } from 'ng-zorro-antd/result';

@Component({
  selector: 'lib-not-found',
  imports: [RouterLink, NzResultModule, NzButtonModule],
  templateUrl: './not-found.component.html',
  styleUrl: '../error.component.less'
})
export class NotFoundComponent implements OnInit {
  private readonly commonService = inject(CommonService);

  readonly errorState = model<ErrorState | null>(null);

  protected readonly pageIndex = 'error-404';

  ngOnInit(): void {
    this.updatePageIndex();

    if (!this.errorState()) {
      this.errorState.set({
        visible: true,
        code: HttpStatusCode.NotFound,
        message: Message.ERROR_404
      });
    }
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }
}
