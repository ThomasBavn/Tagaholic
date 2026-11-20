import { DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [loaded] = useFonts({
        SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    });

    if (!loaded) {
        // Async font loading only occurs in development.
        return null;
    }

    return (
        <ThemeProvider
            // value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            value={DefaultTheme}
        >
            <GestureHandlerRootView style={{ flex: 1 }}>
                {/* Every screen is upright portrait except the Tag page. Each screen must name
                    its orientation: one without lets the phone rotate freely. */}
                <Stack screenOptions={{ orientation: "portrait_up" }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    {/* Landscape from the moment it opens, whatever the sheet music is,
                        and while the Tag is loading or has failed to open. */}
                    <Stack.Screen
                        name="tag/[id]"
                        options={{ title: "Tag", orientation: "landscape" }}
                    />
                    <Stack.Screen name="folder/[id]" options={{ title: "Folder" }} />
                    <Stack.Screen name="+not-found" />
                </Stack>
            </GestureHandlerRootView>
            <StatusBar style="auto" />
        </ThemeProvider>
    );
}
