import { Component, Input, OnInit } from '@angular/core';
import { PaginatorEntity } from '../../interfaces/paginator';

@Component({
  selector: 'app-page-bar',
  templateUrl: './page-bar.component.html',
  styleUrls: ['./page-bar.component.less']
})
export class PageBarComponent implements OnInit {
  @Input() paginator: PaginatorEntity | null = null;
  @Input() url: string = '';
  @Input() param: string = '';

  ngOnInit(): void {
  }

  counter(number: number) {
    return new Array(number);
  }
}
