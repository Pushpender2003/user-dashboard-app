import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  Inject
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '../models/user';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit, OnDestroy {

  @Output() userAdded = new EventEmitter<User>();

  form!: FormGroup;
  cols = 2;
  roles: Array<'Admin' | 'Editor' | 'Viewer'> = ['Admin', 'Editor', 'Viewer'];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private breakpointObserver: BreakpointObserver,
    private dialogRef: MatDialogRef<UserFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: User
  ) { }

  ngOnInit(): void {

    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required]
    });

    console.log(this.data, 'this.data')

    if (this.data) {
      this.form.patchValue({
        name: this.data.name,
        email: this.data.email,
        role: this.data.role
      });
    }

    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.cols = result.matches ? 1 : 2;
      });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.userAdded.emit(this.form.value as User);
    this.dialogRef.close();
  }

  close(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
