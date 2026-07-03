import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

type Props = {
  icon: any;
  color?: string;
  focused?: string;
};

export default function IconButton({ icon,color }: Props) {
    return (
        <View style={styles.buttonContainer}>
            <Pressable onPress={() => alert('You pressed a button.')}>
                <Ionicons name={icon} color={color} size={24} />
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create ({
    buttonContainer: {
        width: '10%',
        marginHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
