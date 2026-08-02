import { Image, StyleSheet, View, Text, Alert } from 'react-native'; 
import { useState } from "react"; 

import { Input } from "@/components/input"; 
import { Button } from "@/components/button"; 

export default function Index() {
  // 1. Criando os estados para armazenar o que o usuário digita
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [carregando, setCarregando] = useState<boolean>(false);

  // 2. Função que envia os dados para o servidor PHP
  const handleLogin = async (): Promise<void> => {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    setCarregando(true);

    try {
      const URL_API = 'http://192.168.2.110/usuario_login.php'; 

      const resposta = await fetch(URL_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      if (!resposta.ok) {
        throw new Error('Não foi possível conectar ao servidor.');
      }

      const dados: { sucesso: boolean; mensagem?: string } = await resposta.json();

      if (dados.sucesso) {
        Alert.alert('Sucesso', 'Login efetuado com sucesso!');
        // Aqui você pode redirecionar o usuário usando o Expo Router, ex: router.replace('/home')
      } else {
        Alert.alert('Erro', dados.mensagem || 'E-mail ou senha incorretos.');
      }

    } catch (erro: any) {
      Alert.alert('Erro', erro.message || 'Falha ao conectar.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}> 
      <Image source={require("@/assets/Logo.png")} style={styles.ilustration} /> 
      
      <Text style={styles.title}>Entrar</Text> 
      <Text style={styles.subtitle}>Acesse seu console PrintFlow</Text> 
      
      <View style={styles.form}> 
        {/* 3. Passando o estado e a função de atualizar o texto para o seu componente de Input */}
        <Input 
          placeholder='voce@oficina.com'
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!carregando}
        /> 
        
        <Input 
          placeholder='••••••••'
          value={senha}
          onChangeText={setSenha}
          secureTextEntry={true} // Esconde os caracteres da senha
          autoCapitalize="none"
          editable={!carregando}
        /> 
        
        {/* 4. Chamando a função de login ao pressionar o botão */}
        <Button 
          label={carregando ? 'Entrando...' : 'Entrar'} 
          onPress={handleLogin}
          disabled={carregando}
        /> 
      </View> 
    </View> 
  );
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
  subtitle:{ 
    fontSize: 16, 
    color: "#8f8f8f", // Adicionado uma cor para o subtítulo aparecer no fundo escuro
  }, 
  form:{ 
    marginTop: 24, 
    gap: 12, 
  }, 
});
