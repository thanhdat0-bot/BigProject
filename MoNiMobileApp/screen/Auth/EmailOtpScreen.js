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

export default function EmailOtpScreen({ navigation, route }) {
  const { email, flow, userInfo } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalAlert, setModalAlert] = useState({ visible: false, title: '', message: '' });

  const showAlert = (title, message) => setModalAlert({ visible: true, title, message });
  const hideAlert = () => setModalAlert({ visible: false, title: '', message: '' });

  const handleVerify = async () => {
    if (!otp) {
      showAlert('Lỗi', 'Vui lòng nhập mã OTP');
      return;
    }
    setLoading(true);
    try {
      await axios.post(endpoints.verifyOtp, {
        email,
        otp,
        otp_type: flow === 'register' ? 'register' : 'forgot_password'
      });
      if (flow === 'register') {
        navigation.replace('Register', { email, otpVerified: true, userInfo });
      } else {
        navigation.replace('ResetPassword', { email });
      }
    } catch (err) {
      let msg = 'Mã OTP không hợp lệ hoặc đã hết hạn';
      if (err.response?.data?.detail) msg = err.response.data.detail;
      showAlert('Lỗi xác thực', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await axios.post(
        flow === 'register' ? endpoints.sendRegisterOtp : endpoints.sendForgotPasswordOtp,
        { email }
      );
      showAlert('Thành công', 'OTP mới đã được gửi lại email');
    } catch {
      showAlert('Lỗi', 'Không gửi lại được OTP');
    } finally {
      setLoading(false);
    }
  };

  // Nút quay lại: flow register -> quay lại Register, flow forgot -> quay lại Login
  const handleBack = () => {
    if (flow === 'register') {
      navigation.replace('Register');
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nhập mã OTP</Text>
      <Text style={styles.subtitle}>Mã OTP đã gửi về email: <Text style={{ color: '#FFD600' }}>{email}</Text></Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập mã OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
        maxLength={6}
        placeholderTextColor="#aaa"
      />
      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Đang kiểm tra...' : 'Xác thực OTP'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={handleResend} disabled={loading}>
        <Text style={{ color: '#FFD600' }}>Gửi lại mã OTP</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
        <Text style={styles.secondaryButtonText}>
          {flow === 'register' ? 'Quay lại đăng ký' : 'Quay lại đăng nhập'}
        </Text>
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
  input: { backgroundColor: '#232323', borderRadius: 10, color: '#FFD600', fontSize: 20, textAlign: 'center', marginBottom: 18, padding: 12, borderWidth: 1, borderColor: '#FFD600' },
  button: { backgroundColor: '#FFD600', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#181818', fontSize: 16, fontWeight: 'bold' },
  link: { alignSelf: 'center', marginTop: 8 },
  secondaryButton: {
    backgroundColor: '#181818',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD600',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#FFD600',
    fontSize: 15,
    fontWeight: '600',
  },
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