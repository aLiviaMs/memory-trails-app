import { HttpBase } from "./httpBase"

interface UploadResponse {
  success: boolean
  fileId: string
  message: string
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  size?: string
}

interface ListFilesResponse {
  files: DriveFile[]
}

export class DriveApi extends HttpBase {
  constructor() {
    super("drive")
  }

  /**
   * Upload a file to Google Drive
   * @param file The file to upload
   */
  async uploadFile(file: FormData) {
    // Override content-type for multipart/form-data
    this.setHeader("Content-Type", "multipart/form-data")
    const response = await this.post<UploadResponse>("/upload", file)
    // Reset content-type to default after upload
    this.setHeader("Content-Type", "application/json")
    return response
  }

  /**
   * List all files from Google Drive
   */
  async listFiles() {
    return this.get<ListFilesResponse>("/files")
  }

  /**
   * Delete a file from Google Drive
   * @param fileId The ID of the file to delete
   */
  async deleteFile(fileId: string) {
    return this.delete<string>(`/delete/${fileId}`)
  }

  /**
   * Helper method to create FormData for file upload
   * @param file The file object to upload
   */
  createFileFormData(file: { uri: string; name: string; type: string }) {
    const formData = new FormData()
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any)
    return formData
  }
}
