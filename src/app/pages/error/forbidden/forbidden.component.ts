import { HttpStatusCode } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzResultModule } from 'ng-zorro-antd/result';
import { Message } from 'src/app/config/message.enum';
import { ErrorState } from 'src/app/interfaces/common';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink, NzResultModule, NzButtonModule],
  templateUrl: './forbidden.component.html',
  styleUrl: '../error.component.less'
})
export class ForbiddenComponent implements OnInit {
  @Input() errorState!: ErrorState;

  protected pageIndex = 'error-403';

  constructor(private readonly commonService: CommonService) {}

  ngOnInit(): void {
    this.updatePageIndex();

    if (!this.errorState) {
      this.errorState = {
        visible: true,
        code: HttpStatusCode.Forbidden,
        message: Message.ERROR_403
      };
    }
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }
}
