import { Component, Input, OnInit } from '@angular/core';
import { Params } from '@angular/router';
import { PaginatorEntity } from '../../interfaces/paginator';

@Component({
  selector: 'app-page-bar',
  templateUrl: './page-bar.component.html',
  styleUrls: ['./page-bar.component.less']
})
export class PageBarComponent implements OnInit {
  @Input() paginator: PaginatorEntity | null = null;
  @Input() url: string = '';
  @Input() param: Params = {};

  ngOnInit(): void {
  }

  counter(size: number) {
    return new Array(size);
  }
}
