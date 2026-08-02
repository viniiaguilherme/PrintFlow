import { TextInput, StyleSheet, TextInputProps } from "react-native"
export function Input(props:TextInputProps){
    return (
    <TextInput style={styles.input} placeholder={props.placeholder}/>
    )
}
const   styles=StyleSheet.create({
    input:{
        width: "100%",
        height:48,
        borderWidth: 1,
        borderColor: "rgba(38, 17, 224, 0.53)",
        borderRadius:8,
        fontSize:16,
        paddingLeft: 12,
    },
})