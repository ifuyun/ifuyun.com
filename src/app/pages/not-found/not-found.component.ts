import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { OptionEntity } from '../../interfaces/options';
import { OptionsService } from '../../services/options.service';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.less']
})
export class NotFoundComponent implements OnInit, OnDestroy {
  options: OptionEntity = {};
  curYear = new Date().getFullYear();

  private optionsListener!: Subscription;

  constructor(private optionsService: OptionsService) {
  }

  ngOnInit(): void {
    this.optionsListener = this.optionsService.options$.subscribe((options) => this.options = options);
  }

  ngOnDestroy(): void {
    this.optionsListener.unsubscribe();
  }
}
