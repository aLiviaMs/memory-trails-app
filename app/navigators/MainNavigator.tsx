import { translate } from "@/i18n"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { BottomTabScreenProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { CompositeScreenProps } from "@react-navigation/native"
import { TextStyle, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Icon } from "../components"
import { DemoCommunityScreen, DemoDebugScreen } from "../screens"
import { DemoPodcastListScreen } from "../screens/DemoPodcastListScreen"
import { AppStackParamList, AppStackScreenProps } from "./AppNavigator"

export type DemoTabParamList = {
  Photos: undefined
  DemoCommunity: undefined
  // DemoShowroomScreen: { queryIndex?: string; itemIndex?: string }
  DemoDebug: undefined
  DemoPodcastList: undefined
}

export type DemoTabScreenProps<T extends keyof DemoTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<DemoTabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>

const Tab = createBottomTabNavigator<DemoTabParamList>()

/**
 * This is the main navigator for the demo screens with a bottom tab bar.
 * Each tab is a stack navigator with its own set of screens.
 *
 * More info: https://reactnavigation.org/docs/bottom-tab-navigator/
 * @returns {JSX.Element} The rendered `MainNavigator`.
 */
export function MainNavigator() {
  const { bottom } = useSafeAreaInsets()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: themed([$tabBar, { height: bottom + 70 }]),
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.text,
        tabBarLabelStyle: themed($tabBarLabel),
        tabBarItemStyle: themed($tabBarItem),
      }}
    >
      <Tab.Screen
        name="DemoCommunity"
        component={DemoCommunityScreen}
        options={{
          tabBarLabel: translate("demoNavigator:communityTab"),
          tabBarIcon: ({ focused }) => (
            <Icon icon="heart" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />

      <Tab.Screen
        name="DemoPodcastList"
        component={DemoPodcastListScreen}
        options={{
          tabBarAccessibilityLabel: translate("demoNavigator:podcastListTab"),
          tabBarLabel: translate("demoNavigator:podcastListTab"),
          tabBarIcon: ({ focused }) => (
            <Icon icon="lock" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />

      <Tab.Screen
        name="DemoDebug"
        component={DemoDebugScreen}
        options={{
          tabBarLabel: translate("demoNavigator:debugTab"),
          tabBarIcon: ({ focused }) => (
            <Icon icon="settings" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

const $tabBar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderTopColor: colors.transparent,
})

const $tabBarItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.md,
})

const $tabBarLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 12,
  fontFamily: typography.primary.medium,
  lineHeight: 16,
  color: colors.text,
})
