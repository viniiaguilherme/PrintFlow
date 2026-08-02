import { StyleSheet, View } from "react-native";

import { Header } from "../src/components/header";
import { UserInfo } from "../src/components/usersInfo";
import { MenuButton } from "../src/components/button2";

export default function Dashboard() {
  return (
    <View style={styles.container}>

      <View style={styles.top}>
        <Header />
        <UserInfo />
      </View>

      <MenuButton
        title="Fila de impressão"
        image={require("../src/assets/3D.png")}
      />

      <MenuButton
        title="Histórico de impressões"
        image={require("../src/assets/Historico.png")}
      />

      <MenuButton
        title="Alertas"
        image={require("../src/assets/Alerta.png")}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 15,
  },

  top: {
    marginTop: 50,
    marginBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});