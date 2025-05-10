import { HttpStatusCode } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzResultModule } from 'ng-zorro-antd/result';
import { Message } from 'src/app/config/message.enum';
import { ErrorState } from 'src/app/interfaces/common';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, NzResultModule, NzButtonModule],
  templateUrl: './not-found.component.html',
  styleUrl: '../error.component.less'
})
export class NotFoundComponent implements OnInit {
  @Input() errorState!: ErrorState;

  protected pageIndex = 'error-404';

  constructor(private readonly commonService: CommonService) {}

  ngOnInit(): void {
    this.updatePageIndex();

    if (!this.errorState) {
      this.errorState = {
        visible: true,
        code: HttpStatusCode.NotFound,
        message: Message.ERROR_404
      };
    }
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }
}
