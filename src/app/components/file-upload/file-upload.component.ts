// Angular
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

// PrimeNG
import { MessageService } from 'primeng/api';
import { FileUploadErrorEvent, FileUploadModule, UploadEvent } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';

// Services
import { DriveService } from '../../core/services/drive/drive.service';

/**
 * Component responsible for handling file uploads to Google Drive
 *
 * Provides a user interface for uploading multiple files with drag-and-drop functionality
 * and automatic upload capabilities. Uses PrimeNG FileUpload component for enhanced UX.
 *
 * @example
 * ```html
 * <app-file-upload (filesUploaded)="onFilesUploaded()">
 * </app-file-upload>
 * ```
 *
 * @since 1.0.0
 * @author [Developer Name]
 */
@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [FileUploadModule, ToastModule, CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
  providers: [MessageService, DriveService],
})
export class FileUploadComponent {

  /**
   * Event emitted when files are successfully uploaded
   *
   * @event filesUploaded
   * @description Notifies parent components that the upload process has completed successfully
   */
  @Output() filesUploaded = new EventEmitter<void>();

  /**
   * Creates an instance of FileUploadComponent
   *
   * @param messageService - Service for displaying toast notifications to users
   * @param _driveService - Service for handling Google Drive operations and API endpoints
   */
  constructor(
    private readonly messageService: MessageService,
    private readonly _driveService: DriveService
  ) {}

  /**
   * Gets the API endpoint URL for bulk file uploads
   *
   * @readonly
   * @returns The complete URL endpoint for uploading multiple files to Google Drive
   *
   * @example
   * ```typescript
   * const uploadUrl = this.endpoint; // Returns: "https://api.example.com/drive/files/bulk"
   * ```
   */
  public get endpoint(): string {
    return this._driveService.uploadBulkFilesEndpoint;
  }

  /**
   * Handles successful file upload events
   *
   * Processes the upload response, displays success notification to the user,
   * and emits an event to notify parent components of the successful upload.
   *
   * @param event - Upload event containing response data and file information
   *
   * @example
   * ```typescript
   * // Called automatically by PrimeNG FileUpload component
   * this.onUpload(uploadEvent);
   * ```
   *
   * @fires FileUploadComponent#filesUploaded
   */
  public onUpload(event: UploadEvent): void {
    console.log({ event });

    this.messageService.add({
      severity: 'info',
      summary: 'File Uploaded',
      detail: '',
    });

    this.filesUploaded.emit();
  }

  /**
   * Handles file upload error events
   *
   * Processes upload failures, displays appropriate error messages to the user,
   * and logs error details for debugging purposes.
   *
   * @param event - Error event containing failure information and error details
   *
   * @example
   * ```typescript
   * // Called automatically by PrimeNG FileUpload component when upload fails
   * this.onError(errorEvent);
   * ```
   */
  public onError(event: FileUploadErrorEvent): void {
    if (event?.error) {
      this.messageService.add({
        severity: 'danger',
        summary: 'Upload failed',
      });

      return;
    }
  }
}
