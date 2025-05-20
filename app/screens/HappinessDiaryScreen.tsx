import {
  Button,
  ButtonAccessoryProps,
  Card,
  EmptyState,
  Header,
  Icon,
  ListView,
  Screen,
  Switch,
  Text,
} from "@/components"
import { isRTL, translate } from "@/i18n"
import { HomeTabScreenProps } from "@/navigators/MainNavigator"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { type ContentStyle } from "@shopify/flash-list"
import { observer } from "mobx-react-lite"
import { ComponentType, FC, useCallback, useEffect, useMemo, useState } from "react"
import { ActivityIndicator, ImageStyle, StyleSheet, TextStyle, View, ViewStyle } from "react-native"
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { useStores } from "../models"
import { Episode } from "../models/Episode"
import { $styles } from "../theme"
import { delay } from "../utils/delay"
import { openLinkInBrowser } from "../utils/openLinkInBrowser"

const ICON_SIZE = 14

export const HappinessDiaryScreen: FC<HomeTabScreenProps<"HappinessDiary">> = observer(
  function HappinessDiaryScreen(_props) {
    const { episodeStore } = useStores()
    const { themed } = useAppTheme()

    const [refreshing, setRefreshing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
      ;(async function load() {
        setIsLoading(true)
        await episodeStore.fetchEpisodes()
        setIsLoading(false)
      })()
    }, [episodeStore])

    async function manualRefresh() {
      setRefreshing(true)
      await Promise.all([episodeStore.fetchEpisodes(), delay(750)])
      setRefreshing(false)
    }

    return (
      <>
        <Header titleTx="diaryScreen:title" />
        <View style={themed([$heading])}>
          {(episodeStore.favoritesOnly || episodeStore.episodesForList.length > 0) && (
            <View style={themed($toggle)}>
              <Switch
                value={episodeStore.favoritesOnly}
                onValueChange={() =>
                  episodeStore.setProp("favoritesOnly", !episodeStore.favoritesOnly)
                }
                labelTx="diaryScreen:onlyFavorites"
                labelPosition="left"
                labelStyle={$labelStyle}
              />
            </View>
          )}
        </View>
        <Screen preset="fixed" contentContainerStyle={$styles.flex1}>
          <ListView<Episode>
            contentContainerStyle={themed([$styles.container, $listContentContainer])}
            data={episodeStore.episodesForList.slice()}
            extraData={episodeStore.favorites.length + episodeStore.episodes.length}
            refreshing={refreshing}
            estimatedItemSize={177}
            onRefresh={manualRefresh}
            ListEmptyComponent={
              isLoading ? (
                <ActivityIndicator />
              ) : (
                <EmptyState
                  preset="generic"
                  style={themed($emptyState)}
                  headingTx={
                    episodeStore.favoritesOnly
                      ? "diaryScreen:noFavoritesEmptyState.heading"
                      : undefined
                  }
                  contentTx={
                    episodeStore.favoritesOnly
                      ? "diaryScreen:noFavoritesEmptyState.content"
                      : undefined
                  }
                  button={episodeStore.favoritesOnly ? "" : undefined}
                  buttonOnPress={manualRefresh}
                  imageStyle={$emptyStateImage}
                  ImageProps={{ resizeMode: "contain" }}
                />
              )
            }
            renderItem={({ item }) => (
              <EpisodeCard
                episode={item}
                isFavorite={episodeStore.hasFavorite(item)}
                onPressFavorite={() => episodeStore.toggleFavorite(item)}
              />
            )}
          />
        </Screen>
      </>
    )
  },
)

const EpisodeCard = observer(function EpisodeCard({
  episode,
  isFavorite,
  onPressFavorite,
}: {
  episode: Episode
  onPressFavorite: () => void
  isFavorite: boolean
}) {
  const {
    theme: { colors },
    themed,
  } = useAppTheme()

  const liked = useSharedValue(isFavorite ? 1 : 0)

  const animatedLikeButtonStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(liked.value, [0, 1], [1, 0], Extrapolation.EXTEND),
        },
      ],
      opacity: interpolate(liked.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    }
  })

  const animatedUnlikeButtonStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: liked.value,
        },
      ],
      opacity: liked.value,
    }
  })

  const handlePressFavorite = useCallback(() => {
    onPressFavorite()
    liked.value = withSpring(liked.value ? 0 : 1)
  }, [liked, onPressFavorite])

  const handlePressCard = () => {
    openLinkInBrowser(episode.enclosure.link)
  }

  const ButtonLeftAccessory: ComponentType<ButtonAccessoryProps> = useMemo(
    () =>
      function ButtonLeftAccessory() {
        return (
          <View>
            <Animated.View
              style={[
                $styles.row,
                themed($iconContainer),
                StyleSheet.absoluteFill,
                animatedLikeButtonStyles,
              ]}
            >
              <Icon icon="heart" size={ICON_SIZE} color={colors.palette.neutral800} />
            </Animated.View>
            <Animated.View
              style={[$styles.row, themed($iconContainer), animatedUnlikeButtonStyles]}
            >
              <Icon icon="heart" size={ICON_SIZE} color={colors.palette.primary400} />
            </Animated.View>
          </View>
        )
      },
    [animatedLikeButtonStyles, animatedUnlikeButtonStyles, colors, themed],
  )

  return (
    <Card
      style={themed($item)}
      verticalAlignment="force-footer-bottom"
      onPress={handlePressCard}
      onLongPress={handlePressFavorite}
      HeadingComponent={
        <View style={[$styles.row, themed($metadata)]}>
          <Text style={themed($metadataText)} size="xxs">
            {episode.datePublished.textLabel}
          </Text>
          <Text style={themed($metadataText)} size="xxs">
            {episode.duration.textLabel}
          </Text>
        </View>
      }
      content={`${episode.parsedTitleAndSubtitle.title} - ${episode.parsedTitleAndSubtitle.subtitle}`}
      FooterComponent={
        <Button
          onPress={handlePressFavorite}
          onLongPress={handlePressFavorite}
          style={themed([$favoriteButton, isFavorite && $unFavoriteButton])}
          LeftAccessory={ButtonLeftAccessory}
        >
          <Text
            size="xxs"
            weight="medium"
            text={
              isFavorite
                ? translate("diaryScreen:unfavoriteButton")
                : translate("diaryScreen:favoriteButton")
            }
          />
        </Button>
      }
    />
  )
})

// #region Styles
const $listContentContainer: ThemedStyle<ContentStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingTop: 0,
  paddingBottom: spacing.lg,
})

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  paddingHorizontal: spacing.xl,
})

const $item: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.md,
  marginTop: spacing.md,
  minHeight: 120,
  backgroundColor: colors.palette.neutral100,
})

const $toggle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})

const $labelStyle: TextStyle = {
  textAlign: "left",
}

const $iconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  height: ICON_SIZE,
  width: ICON_SIZE,
  marginEnd: spacing.sm,
})

const $metadata: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.xs,
})

const $metadataText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginEnd: spacing.md,
  marginBottom: spacing.xs,
})

const $favoriteButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 17,
  marginTop: spacing.md,
  justifyContent: "flex-start",
  backgroundColor: colors.palette.neutral300,
  borderColor: colors.palette.neutral300,
  paddingHorizontal: spacing.md,
  paddingTop: spacing.xxxs,
  paddingBottom: 0,
  minHeight: 32,
  alignSelf: "flex-start",
})

const $unFavoriteButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary100,
  backgroundColor: colors.palette.primary100,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xxl,
})

const $emptyStateImage: ImageStyle = {
  transform: [{ scaleX: isRTL ? -1 : 1 }],
}
