import { IDriveFile } from ".";

export interface IBulkUploadResponse {
  successfulUploads: IDriveFile[];
  failedUploads: {
    fileName: string;
    error: string;
  }[];
}
