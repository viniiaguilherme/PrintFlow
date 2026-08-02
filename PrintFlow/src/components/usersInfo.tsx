import { View, Text, StyleSheet, Image } from "react-native";

export function UserInfo() {
  return (
    <View style={styles.container}>
      <View>
        <Image
            source={require("../assets/Usuario.png")}
            style={styles.user}
            />
        <Text style={styles.small}>Sessão ativa</Text>
        <Text style={styles.name}>s.santos</Text>
        <Text style={styles.online}>ONLINE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  small: {
    color: "#999",
    fontSize: 11,
  },

  name: {
    color: "#FFF",
  },

  online: {
    color: "#21E35A",
    fontSize: 11,
  },

    user: {
      flexDirection: "row",
        alignItems: "center",
        marginTop: 50,     // distância do topo
        marginRight: 20,    // distância da direita
    },
});