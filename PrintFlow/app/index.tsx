import {Image, StyleSheet, View, Text} from 'react-native';
export default function Index() {
    return(
        <View style={styles.container}>
            <Image
            source={require("@/assets/Logo.png")}
            style={styles.ilustration}
            />

            <Text style={styles.title}>Seja Bem-vindo!</Text>
            <Text style={styles.title}>O melhor sistema de gerenciamento de </Text>
            <Text style={styles.impressora}>impressoras 3D.</Text>
        </View>
    ) 
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: "#0f0f0f",
        padding: 32,

    },

    ilustration:{
        width: "100%",
        height: 330,
        resizeMode: "contain",
        marginTop: 62,
    },

    title:{
        fontSize: 32,
        color: "#ffffff",
        fontWeight: "bold",
        marginTop: 48,
    },

    impressora:{
        fontSize:32,
        color:"#15b40f",
        fontWeight: "bold",
        marginTop: 48,
        
    },
})

