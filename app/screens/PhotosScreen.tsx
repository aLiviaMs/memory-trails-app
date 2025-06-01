import { HomeTabScreenProps } from "@/navigators/MainNavigator"
import { DriveApi, DriveFile } from "@/services/api/drive.api"
import * as ImagePicker from "expo-image-picker"
import { FC, useCallback, useEffect, useMemo, useState } from "react"
import { Header, PhotoGallery, Screen } from "../components"

export const PhotosScreen: FC<HomeTabScreenProps<"Photos">> = function PhotosScreen(_props) {
  const driveApi = useMemo(() => new DriveApi(), [])
  const [photos, setPhotos] = useState<DriveFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadPhotos = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await driveApi.listFiles()
      if (response.kind === "ok") {
        setPhotos(response.data.files)
        console.log("response", response.data.files)
      } else {
        console.error("Erro ao carregar fotos:", response)
      }
    } catch (error) {
      console.error("Erro ao carregar fotos:", error)
    } finally {
      setIsLoading(false)
    }
  }, [driveApi])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadPhotos()
    setRefreshing(false)
  }, [loadPhotos])

  const handlePhotoPress = useCallback((photo: DriveFile) => {
    console.log("Foto selecionada:", photo)
    // Implemente aqui a ação ao clicar na foto
  }, [])

  const handleDeletePhoto = useCallback(
    async (photo: DriveFile) => {
      try {
        const response = await driveApi.deleteFile(photo.id)
        if (response.kind === "ok") {
          console.log("Foto deletada com sucesso:", photo.id)
          // Recarrega a lista de fotos após deletar
          await loadPhotos()
        } else {
          console.error("Erro ao deletar foto:", response)
        }
      } catch (error) {
        console.error("Erro ao deletar foto:", error)
      }
    },
    [driveApi, loadPhotos],
  )

  const handleAddPress = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissionResult.granted) {
      alert("Permissão para acessar a galeria foi negada.")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      allowsMultipleSelection: true,
    })

    if (result.canceled) return

    const uploadedFiles = await uploadAssets(result.assets)
    console.log("Todos os arquivos enviados:", uploadedFiles)
  }

  const uploadAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    const uploadedFiles: string[] = []
    for (const asset of assets) {
      await processAsset(asset, uploadedFiles)
    }
    return uploadedFiles
  }

  const processAsset = async (asset: ImagePicker.ImagePickerAsset, uploadedFiles: string[]) => {
    if (asset.fileName && asset.uri) {
      console.log(asset)
      const fileData = {
        name: asset.fileName,
        type: asset.type ?? "application/octet-stream",
        uri: asset.uri,
      }
      try {
        const formData = driveApi.createFileFormData(fileData)
        const response = await driveApi.uploadFile(formData)
        if (response.kind === "ok") {
          uploadedFiles.push(response.data.fileId)
          console.log(`Arquivo enviado com sucesso: ${response.data.fileId}`)
          await loadPhotos() // Reload photos after successful upload
        } else {
          console.error("Erro ao enviar arquivo:", response)
        }
      } catch (error) {
        console.error("Erro ao fazer upload:", error)
      }
    } else {
      console.error("Arquivo sem nome ou URI.")
    }
  }

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  return (
    <>
      <Header titleTx="photos:title" rightText="+" onRightPress={handleAddPress} />
      <Screen preset="fixed">
        <PhotoGallery
          photos={photos}
          isLoading={isLoading}
          onPhotoPress={handlePhotoPress}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onDeletePhoto={handleDeletePhoto}
        />
      </Screen>
    </>
  )
}
