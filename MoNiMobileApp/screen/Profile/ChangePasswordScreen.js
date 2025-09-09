import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, endpoints } from '../../configs/Apis';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ChangePasswordScreen({ navigation }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const onSave = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
      return;
    }
    try {
      const token = await AsyncStorage.getItem('access_token');
      await authApi(token).put(endpoints.change_password || '/user/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      Alert.alert("Thành công", "Đã đổi mật khẩu!");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Lỗi", "Không thể đổi mật khẩu.");
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.avoiding}
      >
        <View style={styles.formCard}>
          <Text style={styles.header}>Đổi mật khẩu</Text>
          <View style={styles.inputGroup}>
            <Icon name="lock-outline" size={20} color="#FFD600" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="Mật khẩu cũ"
              secureTextEntry
              placeholderTextColor="#bbb"
            />
          </View>
          <View style={styles.inputGroup}>
            <Icon name="lock-reset" size={20} color="#FFD600" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mật khẩu mới"
              secureTextEntry
              placeholderTextColor="#bbb"
            />
          </View>
          <View style={styles.inputGroup}>
            <Icon name="lock-check" size={20} color="#FFD600" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Xác nhận mật khẩu mới"
              secureTextEntry
              placeholderTextColor="#bbb"
            />
          </View>
          <TouchableOpacity style={styles.button} onPress={onSave}>
            <Text style={styles.buttonText}>Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181818',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avoiding: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
  },
  formCard: {
    width: '90%',
    backgroundColor: '#232323',
    borderRadius: 18,
    padding: 22,
    alignSelf: 'center',
    shadowColor: '#FFD600',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    borderWidth: 1.5,
    borderColor: "#FFD600",
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD600',
    marginBottom: 26,
    textAlign: 'center'
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#181818",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFD600",
    marginBottom: 16,
    paddingLeft: 10,
    paddingRight: 6,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "transparent",
    paddingVertical: 0,
  },
  button: {
    backgroundColor: '#FFD600',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
  },
  buttonText: { color: '#181818', fontWeight: 'bold', fontSize: 17 },
});