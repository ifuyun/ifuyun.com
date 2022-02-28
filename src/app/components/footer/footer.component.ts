import { Component, Input, OnInit } from '@angular/core';
import { OptionEntity } from '../../interfaces/options';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.less']
})
export class FooterComponent implements OnInit {
  @Input() options: OptionEntity = {};

  curYear = new Date().getFullYear();

  ngOnInit(): void {
  }
}
