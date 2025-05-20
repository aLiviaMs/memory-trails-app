import { HomeTabScreenProps } from "@/navigators/MainNavigator"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { FC, useCallback } from "react"
import { LayoutAnimation, View, ViewStyle } from "react-native"
import { Button, Header, Screen, Text } from "../components"
import { useStores } from "../models"
import { $styles } from "../theme"

export const SettingsScreen: FC<HomeTabScreenProps<"Settings">> = function SettingsScreen(_props) {
  const { setThemeContextOverride, themeContext, themed } = useAppTheme()
  const {
    authenticationStore: { logout },
  } = useStores()

  const toggleTheme = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setThemeContextOverride(themeContext === "dark" ? "light" : "dark")
  }, [themeContext, setThemeContextOverride])

  return (
    <>
      <Header titleTx="settingsScreen:title" />
      <Screen preset="scroll" contentContainerStyle={[$styles.container, themed($container)]}>
        <View style={themed($itemsContainer)}>
          <Text tx="common:theme" />
          <Button
            onPress={toggleTheme}
            text={themeContext ? themeContext.charAt(0).toUpperCase() + themeContext.slice(1) : ""}
            style={themed($themeButton)}
          />
        </View>

        <Button style={themed($button)} tx="common:logOut" onPress={logout} />
      </Screen>
    </>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "flex-start",
  paddingBottom: spacing.xxl,
})

const $itemsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: spacing.md,
})

const $themeButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  marginLeft: spacing.md,
})

const $button: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  marginTop: "auto",
  marginBottom: spacing.xs,
})
