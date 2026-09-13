import { Image, StyleSheet, Text, TouchableOpacity, View,} from "react-native";

type Props = {
  title: string;
  image: any;
  onPress?: () => void;
};

export function MenuButton({
  title,
  image,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
    >
      <Image source={image} style={styles.icon} />

      <Text style={styles.title}>{title}</Text>

      <View style={styles.arrow}>
        <Text style={{ color: "white" }}>{">"}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },

  icon: {
    width: 35,
    height: 35,
    resizeMode: "contain",
  },

  title: {
    color: "#FFF",
    fontSize: 20,
    marginLeft: 15,
    flex: 1,
  },

  arrow: {
    width: 35,
    height: 35,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
});