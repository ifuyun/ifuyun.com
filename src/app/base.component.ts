import { FormGroup } from '@angular/forms';

export abstract class BaseComponent {
  protected resetFormStatus(form: FormGroup): void {
    if (!form) {
      return;
    }
    form.markAsPristine();
    form.markAsUntouched();
    form.updateValueAndValidity();
  }

  protected validateForm(form: FormGroup): { value: any; rawValue: any; valid: boolean } {
    Object.keys(form.controls).forEach((key) => {
      form.controls[key].markAsDirty();
      form.controls[key].updateValueAndValidity();
    });
    return {
      value: form.value,
      rawValue: form.getRawValue(),
      valid: form.valid
    };
  }
}
