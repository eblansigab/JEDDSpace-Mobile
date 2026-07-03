import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";

export default function Card({ children, style, ...props }: ViewProps & { children: React.ReactNode }) {
    return (
        <View style={[styles.card, style]} {...props}>
            <View style={styles.cardContent}>
                { children }
            </View>
        </View>
    )
}

const styles = StyleSheet.create ({
    card: {
        borderWidth: 1,
        borderRadius: 8,
        borderColor: "#757575",
        backgroundColor: '#fff'
    },
    cardContent: {
        margin: 16,
    }
});
