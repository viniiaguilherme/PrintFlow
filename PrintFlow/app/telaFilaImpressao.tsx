import { StyleSheet, View, Text } from 'react-native';

export default function TelaFilaImpressao() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fila de Impressão</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
