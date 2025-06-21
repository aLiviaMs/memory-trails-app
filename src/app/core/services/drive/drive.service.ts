import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiResponse, IRequestOptions } from '../../../core/models/interfaces';
import { BaseService } from '../../../core/services/base.service';
import {
  IBulkUploadResponse,
  ICreateFolderDto,
  IDriveFile,
  IDriveFilesListResponse,
  IDriveFilesPaginationParams,
  IDriveFilesSearchFilters,
  IDriveFolder,
  IFileUploadOptions,
} from './models/interfaces';

/**
 * Google Drive service providing file and folder management operations.
 * Extends BaseService with IDriveFile as the generic type for automatic typing.
 *
 * @example
 * ```typescript
 * // File operations
 * this.driveService.listFiles({ folderId: 'root', pageSize: '10', orderBy: 'name' })
 * this.driveService.getFileMetadata('file-id')
 * this.driveService.uploadFile(file, { parentId: 'folder-id' })
 * this.driveService.deleteFile('file-id')
 *
 * // Folder operations
 * this.driveService.createFolder({ folderName: 'New Folder', parentId: 'root' })
 * this.driveService.getFolderContents('folder-id')
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class DriveService extends BaseService<IDriveFile> {
  protected override endpoint = 'drive';

  // ========== FILE OPERATIONS ==========

  /**
   * Lists files in Google Drive with pagination and filtering.
   *
   * @param params - Drive files pagination parameters
   * @param options - Optional request configuration
   * @returns Observable of files list response
   *
   * @example
   * ```typescript
   * this.listFiles({
   *   folderId: 'root',
   *   pageSize: '10',
   *   orderBy: 'name'
   * })
   * ```
   */
  listFiles(
    params: IDriveFilesPaginationParams,
    options?: IRequestOptions
  ): Observable<IApiResponse<IDriveFilesListResponse>> {
    const requestOptions = {
      ...options,
      params: { ...options?.params, ...params },
    };

    return this.get<IDriveFilesListResponse>('files', requestOptions);
  }

  /**
   * Gets metadata for a specific file.
   *
   * @param fileId - The Google Drive file ID
   * @param options - Optional request configuration
   * @returns Observable of file metadata
   *
   * @example
   * ```typescript
   * this.getFileMetadata('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')
   * ```
   */
  getFileMetadata(
    fileId: string,
    options?: IRequestOptions
  ): Observable<IApiResponse<IDriveFile>> {
    return this.get<IDriveFile>(`files/${fileId}`, options);
  }

  /**
   * Uploads a file to Google Drive.
   *
   * @param file - The file to upload
   * @param uploadOptions - Upload configuration options
   * @param options - Optional request configuration
   * @returns Observable of uploaded file metadata
   *
   * @example
   * ```typescript
   * this.uploadFile(file, {
   *   parentId: 'folder-id',
   *   name: 'custom-name.pdf',
   *   description: 'Uploaded via Angular app'
   * })
   * ```
   */
  uploadDriveFile(
    file: File,
    uploadOptions?: IFileUploadOptions
    // options?: IRequestOptions
  ): Observable<IApiResponse<IDriveFile>> {
    const additionalData: Record<string, string> = {};

    if (uploadOptions?.parentId)
      additionalData['parentId'] = uploadOptions.parentId;
    if (uploadOptions?.name) additionalData['name'] = uploadOptions.name;
    if (uploadOptions?.description)
      additionalData['description'] = uploadOptions.description;

    return this.uploadFile<IDriveFile>(file, additionalData, 'files');
  }

  /**
   * Deletes a file from Google Drive.
   *
   * @param fileId - The Google Drive file ID
   * @param options - Optional request configuration
   * @returns Observable of deletion result
   *
   * @example
   * ```typescript
   * this.deleteFile('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')
   * ```
   */
  deleteFile(
    fileId: string,
    options?: IRequestOptions
  ): Observable<IApiResponse<void>> {
    return this.delete<void>(`files/${fileId}`, options);
  }

  // ========== FOLDER OPERATIONS ==========

  /**
   * Creates a new folder in Google Drive.
   *
   * @param folderData - Folder creation data
   * @param options - Optional request configuration
   * @returns Observable of created folder metadata
   *
   * @example
   * ```typescript
   * this.createFolder({
   *   folderName: 'My New Folder',
   *   parentId: 'root'
   * })
   * ```
   */
  createFolder(
    folderData: ICreateFolderDto,
    options?: IRequestOptions
  ): Observable<IApiResponse<IDriveFolder>> {
    return this.post<IDriveFolder>(folderData, 'folders', options);
  }

  /**
   * Gets contents of a specific folder.
   *
   * @param folderId - The Google Drive folder ID
   * @param pagination - Optional pagination parameters
   * @param options - Optional request configuration
   * @returns Observable of folder contents
   *
   * @example
   * ```typescript
   * this.getFolderContents('folder-id', {
   *   pageSize: '20',
   *   orderBy: 'modifiedTime desc'
   * })
   * ```
   */
  getFolderContents(
    folderId: string,
    pagination?: Partial<IDriveFilesPaginationParams>,
    options?: IRequestOptions
  ): Observable<IApiResponse<IDriveFilesListResponse>> {
    const params: IDriveFilesPaginationParams = {
      folderId,
      pageSize: pagination?.pageSize ?? '10',
      ...(pagination?.orderBy && { orderBy: pagination?.orderBy }),
      ...pagination,
    };

    return this.listFiles(params, options);
  }

  // ========== SEARCH AND FILTER OPERATIONS ==========

  /**
   * Searches files in Google Drive with custom filters.
   *
   * @param filters - Search filters
   * @param pagination - Optional pagination parameters
   * @param options - Optional request configuration
   * @returns Observable of search results
   *
   * @example
   * ```typescript
   * this.searchFiles({
   *   name: 'report',
   *   mimeType: 'application/pdf',
   *   folderId: 'specific-folder-id'
   * }, {
   *   pageSize: '20',
   *   orderBy: 'modifiedTime desc'
   * })
   * ```
   */
  searchFiles(
    filters: IDriveFilesSearchFilters,
    pagination?: Partial<IDriveFilesPaginationParams>,
    options?: IRequestOptions
  ): Observable<IApiResponse<IDriveFilesListResponse>> {
    const params = {
      ...filters,
      folderId: filters.folderId ?? 'root',
      pageSize: pagination?.pageSize ?? '10',
      orderBy: pagination?.orderBy ?? 'name',
      ...pagination,
    };

    const requestOptions = {
      ...options,
      params: { ...options?.params, ...params },
    };

    return this.get<IDriveFilesListResponse>('files/search', requestOptions);
  }

  /**
   * Gets files by MIME type.
   *
   * @param mimeType - The MIME type to filter by
   * @param pagination - Optional pagination parameters
   * @param options - Optional request configuration
   * @returns Observable of filtered files
   *
   * @example
   * ```typescript
   * // Get all PDF files
   * this.getFilesByMimeType('application/pdf')
   *
   * // Get all images
   * this.getFilesByMimeType('image/*')
   * ```
   */
  getFilesByMimeType(
    mimeType: string,
    pagination?: Partial<IDriveFilesPaginationParams>,
    options?: IRequestOptions
  ): Observable<IApiResponse<IDriveFilesListResponse>> {
    return this.searchFiles({ mimeType }, pagination, options);
  }

  /**
   * Gets recently modified files.
   *
   * @param days - Number of days to look back (default: 7)
   * @param pagination - Optional pagination parameters
   * @param options - Optional request configuration
   * @returns Observable of recently modified files
   *
   * @example
   * ```typescript
   * // Get files modified in the last 7 days
   * this.getRecentlyModifiedFiles()
   *
   * // Get files modified in the last 30 days
   * this.getRecentlyModifiedFiles(30)
   * ```
   */
  getRecentlyModifiedFiles(
    days: number = 7,
    pagination?: Partial<IDriveFilesPaginationParams>,
    options?: IRequestOptions
  ): Observable<IApiResponse<IDriveFilesListResponse>> {
    const modifiedAfter = new Date();
    modifiedAfter.setDate(modifiedAfter.getDate() - days);

    return this.searchFiles(
      { modifiedAfter: modifiedAfter.toISOString() },
      { orderBy: 'modifiedTime desc', ...pagination },
      options
    );
  }

  // ========== BATCH OPERATIONS ==========

  /**
   * Uploads multiple files to Google Drive in a single batch operation.
   *
   * @param files - Array of File objects to upload
   * @param uploadOptions - Upload configuration options
   * @returns Observable of bulk upload results
   *
   * @example
   * ```typescript
   * this.uploadBulkFiles([file1, file2, file3], { parentId: 'folder-id' })
   *   .subscribe(response => {
   *     console.log('Successful uploads:', response.data.successfulUploads);
   *     console.log('Failed uploads:', response.data.failedUploads);
   *   });
   * ```
   */
  uploadBulkFiles(
    files: File[],
    uploadOptions?: Pick<IFileUploadOptions, 'parentId'>
  ): Observable<IApiResponse<IBulkUploadResponse>> {
    const formData = new FormData();

    files.forEach((file: File) => {
      formData.append('files', file, file.name);
    });

    if (uploadOptions?.parentId) {
      formData.append('folderId', uploadOptions.parentId);
    }

    return this.post<IBulkUploadResponse>(formData, 'files/bulk');
  }


  /**
   * Bulk deletes multiple files.
   *
   * @param fileIds - Array of file IDs to delete
   * @param options - Optional request configuration
   * @returns Observable of deletion results
   *
   * @example
   * ```typescript
   * this.bulkDeleteFiles(['file-id-1', 'file-id-2', 'file-id-3'])
   * ```
   */
  bulkDeleteFiles(
    fileIds: string[],
    options?: IRequestOptions
  ): Observable<IApiResponse<{ deletedFiles: string[]; errors?: string[] }>> {
    return this.post<{ deletedFiles: string[]; errors?: string[] }>(
      { fileIds },
      'files/bulk-delete',
      options
    );
  }

  /**
   * Moves multiple files to a new folder.
   *
   * @param fileIds - Array of file IDs to move
   * @param targetFolderId - Target folder ID
   * @param options - Optional request configuration
   * @returns Observable of move results
   *
   * @example
   * ```typescript
   * this.bulkMoveFiles(['file-id-1', 'file-id-2'], 'target-folder-id')
   * ```
   */
  bulkMoveFiles(
    fileIds: string[],
    targetFolderId: string,
    options?: IRequestOptions
  ): Observable<IApiResponse<{ movedFiles: string[]; errors?: string[] }>> {
    return this.post<{ movedFiles: string[]; errors?: string[] }>(
      { fileIds, targetFolderId },
      'files/bulk-move',
      options
    );
  }

  // ========== UTILITY METHODS ==========

  /**
   * Downloads a file from Google Drive.
   *
   * @param fileId - The Google Drive file ID
   * @param filename - The filename for download
   * @param options - Optional request configuration
   * @returns Observable of the downloaded blob
   *
   * @example
   * ```typescript
   * this.downloadFile('file-id', 'document.pdf')
   * ```
   */
  downloadDriveFile(
    fileId: string,
    filename: string,
    options?: IRequestOptions
  ): Observable<Blob> {
    return this.downloadFile(filename, `files/${fileId}/download`, options);
  }

  /**
   * Gets a shareable link for a file.
   *
   * @param fileId - The Google Drive file ID
   * @param options - Optional request configuration
   * @returns Observable with shareable link
   *
   * @example
   * ```typescript
   * this.getShareableLink('file-id').subscribe(response => {
   *   console.log('Shareable link:', response.data.link);
   * });
   * ```
   */
  getShareableLink(
    fileId: string,
    options?: IRequestOptions
  ): Observable<IApiResponse<{ link: string }>> {
    return this.post<{ link: string }>({}, `files/${fileId}/share`, options);
  }
}
