import { ThemeProvider } from "expo-router/react-navigation";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { navigationTheme } from "@/constants/Colors";
import { useResolvedColorScheme } from "@/hooks/usePalette";

export default function RootLayout() {
    const colorScheme = useResolvedColorScheme();
    const [loaded] = useFonts({
        SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    });

    if (!loaded) {
        // Async font loading only occurs in development.
        return null;
    }

    return (
        <ThemeProvider value={navigationTheme(colorScheme)}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="tag/[id]" options={{ title: "Tag" }} />
                    <Stack.Screen name="folder/[id]" options={{ title: "Folder" }} />
                    <Stack.Screen name="+not-found" />
                </Stack>
            </GestureHandlerRootView>
            {/* Dark icons on the light background, light icons on the dark one. */}
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        </ThemeProvider>
    );
}
