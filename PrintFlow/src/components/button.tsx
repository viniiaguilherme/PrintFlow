import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from "react-native"

export function Button({ label, ...rest }: TouchableOpacityProps) {
    return (
        <TouchableOpacity style={styles.button} {...rest}>
            <Text style={styles.buttonText}>{label}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        marginTop: 40,
        backgroundColor: "#2FE37A",
        height: 52,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },

    buttonText: {
        color: "#FFF",
        fontWeight: "700",
        fontSize: 17,
    },
})