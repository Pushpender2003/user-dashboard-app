import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Compiler,
  Injector
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { User } from '../models/user';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['name', 'email', 'role'];
  dataSource = new MatTableDataSource<User>([]);
  users$!: Observable<User[]>;
  chart: any = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('roleChart') roleChart!: ElementRef<HTMLCanvasElement>;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private compiler: Compiler,
    private injector: Injector
  ) {}

  ngOnInit(): void {
    this.dataSource.filterPredicate = (data: User, filter: string) => {
      const v = filter.trim().toLowerCase();
      return (
        data.name.toLowerCase().includes(v) ||
        data.email.toLowerCase().includes(v) ||
        data.role.toLowerCase().includes(v)
      );
    };

    this.users$ = this.userService.users$.pipe(
      tap(users => {
        this.dataSource.data = users;
        this.renderChart(users);
      }),
      shareReplay(1)
    );

    this.users$.subscribe();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  async openUserForm(user?: User) {
    const { UserFormModule } = await import('../user-form/user-form.module');
    const moduleFactory = await this.compiler.compileModuleAsync(UserFormModule);
    const moduleRef = moduleFactory.create(this.injector);
    const UserFormComponent = moduleRef.instance.getComponent();

    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '400px',
      data: user
    });

    dialogRef.componentInstance.userAdded.subscribe((userData: User) => {
      if (user) {
        this.userService.updateUser(user.id, userData);
      } else {
        this.userService.addUser(userData);
      }
      dialogRef.close();
    });
  }

  onRowClick(user: User): void {
    this.openUserForm(user);
  }

  private async renderChart(users: User[]): Promise<void> {
    if (!users.length) return;

    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    setTimeout(() => {
      if (!this.roleChart) return;

      const rolesCount: Record<'Admin' | 'Editor' | 'Viewer', number> = {
        Admin: 0,
        Editor: 0,
        Viewer: 0
      };

      users.forEach(u => rolesCount[u.role]++);

      const chartData: number[] = [
        rolesCount.Admin,
        rolesCount.Editor,
        rolesCount.Viewer
      ];

      if (this.chart) {
        this.chart.data.datasets[0].data = chartData;
        this.chart.update('none');
      } else {
        this.chart = new Chart(this.roleChart.nativeElement, {
          type: 'pie',
          data: {
            labels: ['Admin', 'Editor', 'Viewer'],
            datasets: [{
              data: chartData,
              backgroundColor: ['#f093fb', '#4facfe', '#43e97b'],
              borderColor: '#ffffff',
              borderWidth: 3
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 0,
            animation: {
              duration: 1200,
              easing: 'easeOutQuart'
            },
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 15,
                  font: { size: 13 },
                  usePointStyle: true,
                  pointStyle: 'circle'
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: { size: 14 },
                bodyFont: { size: 13 },
                callbacks: {
                  label: (context) => {
                    const label = context.label || '';
                    const value = context.parsed || 0;
                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
    });
  }
}
