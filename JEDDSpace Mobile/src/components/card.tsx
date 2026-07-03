import React from "react";
import { StyleSheet, View } from "react-native";

export default function Card(props) {
    return (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                { props.children }
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