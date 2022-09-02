import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserAgentService } from '../../core/user-agent.service';
import { OptionEntity } from '../../interfaces/options';
import { OptionsService } from '../../services/options.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.less']
})
export class FooterComponent implements OnInit, OnDestroy {
  isMobile = false;
  options: OptionEntity = {};
  curYear = new Date().getFullYear();

  private optionsListener!: Subscription;

  constructor(private optionsService: OptionsService, private userAgentService: UserAgentService) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.optionsListener = this.optionsService.options$.subscribe((options) => (this.options = options));
  }

  ngOnDestroy(): void {
    this.optionsListener.unsubscribe();
  }
}
