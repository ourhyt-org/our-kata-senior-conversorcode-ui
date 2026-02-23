import { HttpErrorResponse } from '@angular/common/http';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { CONVERSION_API } from '../../../core/conversion-api/conversion-api.token';
import { ConverterState } from '../state/converter.state';
import { CodePreviewPanelComponent } from './code-preview-panel.component';

describe('CodePreviewPanelComponent', () => {
  let fixture: ComponentFixture<CodePreviewPanelComponent>;

  const apiMock = {
    createConversion: jest.fn(),
    getConversionStatus: jest.fn(),
    getConversionFiles: jest.fn(),
  };

  const stateMock = {
    refreshJobStatus: jest.fn(async () => 'RUNNING'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodePreviewPanelComponent],
      providers: [
        { provide: CONVERSION_API, useValue: apiMock },
        { provide: ConverterState, useValue: stateMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CodePreviewPanelComponent);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('selects default file from manifest on open', async () => {
    apiMock.getConversionFiles
      .mockResolvedValueOnce({
        defaultFile: 'src/A.java',
        manifest: ['src/A.java', 'src/B.java'],
        skipped: [],
      })
      .mockResolvedValueOnce({
        defaultFile: 'src/A.java',
        manifest: ['src/A.java', 'src/B.java'],
        skipped: [],
        files: [{ path: 'src/A.java', content: 'class A {}' }],
      });

    fixture.componentRef.setInput('jobId', 'job-1');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();

    expect(fixture.componentInstance.selectedPath()).toBe('src/A.java');
    expect(fixture.componentInstance.selectedContent()).toContain('class A {}');
  });

  it('filters manifest by substring case-insensitive', () => {
    fixture.componentInstance.manifest.set(['src/A.java', 'src/services/B.ts']);
    fixture.componentInstance.updateFilter('SERVICES');

    expect(fixture.componentInstance.filteredManifest()).toEqual(['src/services/B.ts']);
  });

  it('uses cache and avoids calling api twice for same file', async () => {
    apiMock.getConversionFiles.mockResolvedValue({
      defaultFile: 'src/A.java',
      manifest: ['src/A.java'],
      skipped: [],
      files: [{ path: 'src/A.java', content: 'cached content' }],
    });

    fixture.componentRef.setInput('jobId', 'job-1');

    await fixture.componentInstance.selectFile('src/A.java');
    await fixture.componentInstance.selectFile('src/A.java');

    expect(apiMock.getConversionFiles).toHaveBeenCalledTimes(1);
  });

  it('shows not-ready message for 409 errors', async () => {
    apiMock.getConversionFiles.mockRejectedValue(
      new HttpErrorResponse({ status: 409, statusText: 'NOT_READY' }),
    );

    fixture.componentRef.setInput('jobId', 'job-1');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await Promise.resolve();

    expect(fixture.componentInstance.notReadyMessage()).toContain('Still processing');
  });
});
