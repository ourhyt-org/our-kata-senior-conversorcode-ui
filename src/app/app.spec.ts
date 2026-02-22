import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { CONVERSION_API } from './core/conversion-api/conversion-api.token';
import { MockConversionApiService } from './core/conversion-api/mock-conversion-api.service';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        MockConversionApiService,
        {
          provide: CONVERSION_API,
          useExisting: MockConversionApiService,
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render page heading', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Legacy2Modern');
  });
});
