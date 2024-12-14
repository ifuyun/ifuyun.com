import { HttpStatusCode } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzResultModule } from 'ng-zorro-antd/result';
import { Message } from '../../../config/message.enum';
import { ErrorState } from '../../../interfaces/common';
import { CommonService } from '../../../services/common.service';

@Component({
  selector: 'app-server-error',
  imports: [RouterLink, NzResultModule, NzButtonModule],
  templateUrl: './server-error.component.html',
  styleUrl: '../error.component.less'
})
export class ServerErrorComponent implements OnInit {
  @Input() errorState!: ErrorState;

  protected activePage = 'error-500';

  constructor(private commonService: CommonService) {}

  ngOnInit(): void {
    this.updateActivePage();

    if (!this.errorState) {
      this.errorState = {
        visible: true,
        code: HttpStatusCode.InternalServerError,
        message: Message.ERROR_500
      };
    }
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.activePage);
  }
}
