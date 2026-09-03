import { View, Image, StyleSheet } from "react-native";

export function Header() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/Logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    marginLeft: 15,
  },

  logo: {
    width: 120,
    height: 45,
  },
});