import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { endpoints } from '../../configs/Apis';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Portal, Button } from "react-native-paper";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';

import { getAuth, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { app as firebaseApp } from '../../configs/firebaseConfig'; 

WebBrowser.maybeCompleteAuthSession();

function ModalAlert({ visible, onDismiss, title, message }) {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={modalStyle}>
        <Text style={modalTitleStyle}>{title}</Text>
        <Text style={modalMsgStyle}>{message}</Text>
        <Button mode="contained" buttonColor="#FFD600" onPress={onDismiss} textColor="#232323"
          style={modalBtnStyle}>
          OK
        </Button>
      </Modal>
    </Portal>
  );
}

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  const FIREBASE_WEB_CLIENT_ID = '256465007843-vimgd67cigu5aivtg3g05pffru67q138.apps.googleusercontent.com';


  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: FIREBASE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
    redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
  });

  const [modalAlert, setModalAlert] = useState({ visible: false, title: '', message: '' });
  const showAlert = (title, message) => setModalAlert({ visible: true, title, message });
  const hideAlert = () => setModalAlert({ visible: false, title: '', message: '' });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      const credential = GoogleAuthProvider.credential(authentication.idToken, authentication.accessToken);
      const auth = getAuth(firebaseApp);

      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          await AsyncStorage.setItem('google_access_token', authentication.accessToken);
          await AsyncStorage.setItem('firebase_uid', userCredential.user.uid);
          navigation.replace('MainApp');
        })
        .catch((error) => {
          showAlert('Lỗi đăng nhập Google', error.message);
        });
    } else if (response?.type === 'error') {
      showAlert('Lỗi đăng nhập Google', 'Không thể đăng nhập bằng Google');
    }
  }, [response, navigation]);

  const handleLogin = async () => {
    try {
      const res = await axios.post(endpoints.login, { username, password });
      const token = res.data.access;
      await AsyncStorage.setItem('access_token', token);
      await AsyncStorage.setItem('user_id', username.trim());
      navigation.replace('MainApp');
    } catch (err) {
      showAlert(
        'Lỗi đăng nhập',
        err.response?.data?.detail || 'Tên đăng nhập hoặc mật khẩu không đúng'
      );
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleGoogleLogin = () => {
    promptAsync();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MoNi Mobile App</Text>
      <Text style={styles.subtitle}>Chào mừng bạn! Đăng nhập để sử dụng dịch vụ</Text>
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={22} color="#2196F3" />
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholderTextColor="#aaa"
          />
        </View>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={22} color="#2196F3" />
          <TextInput
            style={[styles.input, { paddingRight: 36 }]}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity
            style={{ position: 'absolute', right: 15 }}
            onPress={() => setShowPassword(x => !x)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye' : 'eye-off'}
              size={22}
              color="#FFD600"
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Đăng nhập</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.link}>Quên mật khẩu?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.secondaryButtonText}>Đăng ký tài khoản mới</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16 }]}
          onPress={handleGoogleLogin}
          disabled={!request}
        >
          <Ionicons name="logo-google" size={22} color="#fff" />
          <Text style={styles.buttonText}>Đăng nhập với Google</Text>
        </TouchableOpacity>
      </View>
      <ModalAlert
        visible={modalAlert.visible}
        onDismiss={hideAlert}
        title={modalAlert.title}
        message={modalAlert.message}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    backgroundColor: '#181818',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD600',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 1,
  },
  subtitle: {
    color: '#fff',
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 36,
  },
  form: {
    backgroundColor: '#232323',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#FFD600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FFD600',
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#FFD600',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    shadowColor: '#FFD600',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#181818',
    fontSize: 17,
    fontWeight: '700',
  },
  link: {
    color: '#FFD600',
    textAlign: 'right',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  secondaryButton: {
    backgroundColor: '#181818',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD600',
  },
  secondaryButtonText: {
    color: '#FFD600',
    fontSize: 15,
    fontWeight: '600',
  },
});

const modalStyle = {
  backgroundColor: "#232323",
  padding: 26,
  margin: 22,
  borderRadius: 20,
  borderWidth: 1.5,
  borderColor: "#FFD600"
};
const modalTitleStyle = {
  color: "#FFD600",
  fontWeight: "bold",
  fontSize: 18,
  marginBottom: 10,
  textAlign: "center"
};
const modalMsgStyle = {
  color: "#fff",
  fontSize: 15,
  marginBottom: 18,
  textAlign: "center"
};
const modalBtnStyle = {
  borderRadius: 10,
  marginTop: 8,
  paddingVertical: 7,
  alignSelf: "center",
  minWidth: 90
};