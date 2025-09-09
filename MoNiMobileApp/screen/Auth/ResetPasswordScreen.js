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

export default function ResetPasswordScreen({ navigation, route }) {
  const { email } = route.params || {};
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalAlert, setModalAlert] = useState({ visible: false, title: '', message: '' });

  const showAlert = (title, message) => setModalAlert({ visible: true, title, message });
  const hideAlert = () => setModalAlert({ visible: false, title: '', message: '' });

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      showAlert('Lỗi', 'Vui lòng nhập đủ mật khẩu');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Lỗi', 'Mật khẩu nhập lại không khớp');
      return;
    }
    setLoading(true);
    try {
      await axios.post(endpoints.resetPassword, { email, password, confirm_password: confirmPassword });
      showAlert('Thành công', 'Đổi mật khẩu thành công! Đăng nhập lại.');
      setTimeout(() => {
        navigation.replace('Login');
      }, 1500);
    } catch (err) {
      let msg = 'Không đổi được mật khẩu';
      if (err.response?.data?.detail) msg = err.response.data.detail;
      showAlert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đặt lại mật khẩu</Text>
      <Text style={styles.subtitle}>Nhập mật khẩu mới cho email: <Text style={{ color: '#FFD600' }}>{email}</Text></Text>
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu mới"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="Nhập lại mật khẩu"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholderTextColor="#aaa"
      />
      <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}</Text>
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