import { TextInput, StyleSheet, TextInputProps } from "react-native"

export function Input(props: TextInputProps) {
    return (
        <TextInput style={styles.input}  placeholderTextColor="#838181"{...props} />
    )
}

const styles = StyleSheet.create({
    input: {
        width: "100%",
        height: 48,
        borderWidth: 1,
        borderColor: "rgb(255, 255, 255)",
        borderRadius: 8,
        fontSize: 16,
        paddingLeft: 12,
        color: "#838181",
    },
})