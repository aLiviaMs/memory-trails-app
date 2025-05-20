import { HomeTabScreenProps } from "@/navigators/MainNavigator"
import { FC } from "react"
import { Header, Screen } from "../components"
import { $styles } from "../theme"

export const PhotosScreen: FC<HomeTabScreenProps<"Photos">> = function PhotosScreen(_props) {
  // const { themed } = useAppTheme()

  const handleAddPress = () => {
    console.log("Adicionar item pressionado")
    // Implementar lógica para adicionar item
  }

  return (
    <>
      <Header titleTx="photos:title" rightText="+" onRightPress={handleAddPress} />
      <Screen preset="scroll" contentContainerStyle={$styles.container}></Screen>
    </>
  )
}
