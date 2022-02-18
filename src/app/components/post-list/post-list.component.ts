import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../../core/base.component';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.less']
})
export class PostListComponent extends BaseComponent implements OnInit {
  pageIndex: string = 'index';

  constructor() {
    super();
  }

  ngOnInit(): void {
  }
}
