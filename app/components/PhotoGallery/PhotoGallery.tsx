/* eslint-disable react-native/no-color-literals */
import { DriveFile } from "@/services/api/drive.api"
import * as FileSystem from "expo-file-system"
import { useState } from "react"
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ImageStyle,
  Modal,
  RefreshControl,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"
import { AutoImage } from "../AutoImage"
import { Button } from "../Button"
import { Icon } from "../Icon"
import { Text } from "../Text"

const numColumns = 3
const screenWidth = Dimensions.get("window").width
const gap = 6
const containerPadding = 16
const itemWidth = (screenWidth - 2 * containerPadding - gap * (numColumns - 1)) / numColumns

interface PhotoGalleryProps {
  photos: DriveFile[]
  isLoading?: boolean
  onPhotoPress?: (photo: DriveFile) => void
  refreshing?: boolean
  onRefresh?: () => void
  onDeletePhoto?: (photo: DriveFile) => void
}

// Track loading state per image
const useImageLoadingState = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [errorStates, setErrorStates] = useState<Record<string, boolean>>({})

  const setLoading = (id: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [id]: loading }))
  }

  const setError = (id: string, error: boolean) => {
    setErrorStates((prev) => ({ ...prev, [id]: error }))
  }

  return {
    loadingStates,
    errorStates,
    setLoading,
    setError,
  }
}

export function PhotoGallery({
  photos,
  isLoading = false,
  onPhotoPress,
  refreshing = false,
  onRefresh,
  onDeletePhoto,
}: Readonly<PhotoGalleryProps>) {
  const { loadingStates, errorStates, setLoading, setError } = useImageLoadingState()
  const [selectedPhoto, setSelectedPhoto] = useState<DriveFile | null>(null)

  const handlePhotoPress = (photo: DriveFile) => {
    setSelectedPhoto(photo)
    onPhotoPress?.(photo)
  }

  const renderItem = ({ item }: { item: DriveFile }) => {
    const isLoading = loadingStates[item.id]
    const hasError = errorStates[item.id]

    return (
      <View style={styles.photoContainer}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => handlePhotoPress(item)}
          activeOpacity={0.7}
          testID="photo-item"
        >
          <View style={styles.photoWrapper}>
            {isLoading && <ActivityIndicator style={styles.loadingIndicator} />}
            {hasError ? (
              <Text style={styles.errorText} size="xxs">
                Erro ao carregar imagem
              </Text>
            ) : (
              <AutoImage
                source={{
                  uri: `https://drive.google.com/uc?export=view&id=${item.id}`,
                  headers: {
                    "Cache-Control": "max-age=3600",
                  },
                }}
                style={styles.photo as ImageStyle}
                resizeMode="cover"
                maxWidth={itemWidth}
                maxHeight={itemWidth}
                onLoadStart={() => {
                  console.log("Iniciando carregamento:", item.id)
                  setLoading(item.id, true)
                }}
                onLoadEnd={() => {
                  console.log("Carregamento finalizado:", item.id)
                  setLoading(item.id, false)
                }}
                onError={(error) => {
                  console.error("Erro ao carregar imagem:", item.id, error)
                  setError(item.id, true)
                  setLoading(item.id, false)
                  if (onDeletePhoto) {
                    onDeletePhoto(item)
                  }
                }}
              />
            )}
          </View>
        </TouchableOpacity>
        {!hasError && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDeletePhoto?.(item)}
            activeOpacity={0.7}
          >
            <Icon icon="x" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text text="Nenhuma foto encontrada" />
      </View>
    )
  }

  return (
    <>
      <FlatList
        data={photos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
        }
      />
      <ImageViewer
        photo={selectedPhoto}
        visible={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
    </>
  )
}

interface ImageViewerProps {
  photo: DriveFile | null
  visible: boolean
  onClose: () => void
}

const ImageViewer = ({ photo, visible, onClose }: ImageViewerProps) => {
  const [downloading, setDownloading] = useState(false)

  const handleBackdropPress = () => {
    onClose()
  }

  const handleDownload = async () => {
    if (!photo) return

    try {
      setDownloading(true)
      const fileUri = `${FileSystem.documentDirectory}${photo.name}`
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${photo.id}`

      const { uri } = await FileSystem.downloadAsync(downloadUrl, fileUri)

      await Share.share({
        url: uri,
        message: "Imagem salva com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao baixar imagem:", error)
    } finally {
      setDownloading(false)
    }
  }

  if (!photo) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
              testID="close-button"
            >
              <Icon icon="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <AutoImage
              source={{
                uri: `https://drive.google.com/uc?export=view&id=${photo.id}`,
                headers: {
                  "Cache-Control": "max-age=3600",
                },
              }}
              style={styles.fullScreenImage as ImageStyle}
              resizeMode="contain"
            />
          </View>
          <View style={styles.modalFooter}>
            <Button
              text={downloading ? "Baixando..." : "Baixar imagem"}
              onPress={handleDownload}
              disabled={downloading}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  container: {
    padding: containerPadding,
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    bottom: 8,
    height: 24,
    justifyContent: "center",
    position: "absolute",
    right: 8,
    width: 24,
    zIndex: 2,
  },
  emptyContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    color: "#ff0000",
    textAlign: "center",
  },
  fullScreenImage: {
    flex: 1,
    height: "100%",
    width: "100%",
  },
  imageButton: {
    height: "100%",
    width: "100%",
  },
  loadingContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  loadingIndicator: {
    position: "absolute",
    zIndex: 1,
  },
  modalBackdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    justifyContent: "center",
  },
  modalFooter: {
    alignItems: "center",
    padding: 16,
  },
  modalHeader: {
    alignItems: "flex-end",
    padding: 8,
  },
  photo: {
    aspectRatio: 1,
    height: "100%",
    width: "100%",
  },
  photoContainer: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    height: itemWidth,
    marginHorizontal: gap / 2,
    marginVertical: gap / 2,
    overflow: "hidden",
    position: "relative",
    width: itemWidth,
  },
  photoWrapper: {
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    flex: 1,
    justifyContent: "center",
  },
})
