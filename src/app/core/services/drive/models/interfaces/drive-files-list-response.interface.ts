import { IDriveFile } from "./drive-file.interface";

export interface IDriveFilesListResponse {
  files: IDriveFile[];
  nextPageToken?: string;
  incompleteSearch?: boolean;
}
