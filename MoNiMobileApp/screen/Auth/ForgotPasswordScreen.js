import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import axios, { endpoints } from '../../configs/Apis';
import { Button, Modal, Portal } from 'react-native-paper';

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

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalAlert, setModalAlert] = useState({ visible: false, title: '', message: '' });

  const showAlert = (title, message) => setModalAlert({ visible: true, title, message });
  const hideAlert = () => setModalAlert({ visible: false, title: '', message: '' });

  const handleSendOtp = async () => {
    if (!email) {
      showAlert('Lỗi', 'Vui lòng nhập email');
      return;
    }
    setLoading(true);
    try {
      await axios.post(endpoints.sendForgotPasswordOtp, { email });
      navigation.navigate('EmailOtp', { email, flow: 'forgot' });
    } catch (err) {
      let msg = 'Không gửi được OTP';
      if (err.response?.data?.detail) msg = err.response.data.detail;
      showAlert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quên mật khẩu?</Text>
      <Text style={styles.subtitle}>Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#aaa"
      />
      <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Đang gửi...' : 'Gửi OTP về email'}</Text>
      </TouchableOpacity>
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
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#181818' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFD600', marginBottom: 10, textAlign: 'center' },
  subtitle: { color: '#fff', fontSize: 15, textAlign: 'center', marginBottom: 28 },
  input: { backgroundColor: '#232323', borderRadius: 10, color: '#fff', fontSize: 16, marginBottom: 18, padding: 12, borderWidth: 1, borderColor: '#FFD600' },
  button: { backgroundColor: '#FFD600', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#181818', fontSize: 16, fontWeight: 'bold' },
});
const modalStyle = {
  backgroundColor: "#232323", padding: 26, margin: 22, borderRadius: 20, borderWidth: 1.5, borderColor: "#FFD600"
};
const modalTitleStyle = {
  color: "#FFD600", fontWeight: "bold", fontSize: 18, marginBottom: 10, textAlign: "center"
};
const modalMsgStyle = {
  color: "#fff", fontSize: 15, marginBottom: 18, textAlign: "center"
};
const modalBtnStyle = {
  borderRadius: 10, marginTop: 8, paddingVertical: 7, alignSelf: "center", minWidth: 90
};