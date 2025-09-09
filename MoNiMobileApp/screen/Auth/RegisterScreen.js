import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios, { endpoints } from '../../configs/Apis';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Modal, Portal, Button, List } from "react-native-paper";

function ModalAlert({ visible, onDismiss, title, message }) {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{
        backgroundColor: "#232323", borderRadius: 20, padding: 22, margin: 36, borderWidth: 1.5, borderColor: "#FFD600"
      }}>
        <Text style={{ color: "#FFD600", fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>{title}</Text>
        <Text style={{ color: "#fff", fontSize: 15, marginBottom: 22, textAlign: "center" }}>{message}</Text>
        <Button mode="contained" buttonColor="#FFD600" onPress={onDismiss} textColor="#232323"
          style={{ borderRadius: 10, marginTop: 8, paddingVertical: 8 }}>
          OK
        </Button>
      </Modal>
    </Portal>
  );
}

function GenderSelect({ value, onSelect }) {
  const [visible, setVisible] = useState(false);
  const GENDERS = [
    { label: "Nam", value: "male", icon: "man-outline" },
    { label: "Nữ", value: "female", icon: "woman-outline" },
    { label: "Khác", value: "other", icon: "transgender-outline" },
  ];
  return (
    <>
      <TouchableOpacity
        style={styles.genderSelectBtn}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="transgender-outline" size={22} color="#FFD600" style={{ marginRight: 8 }} />
        <Text style={{
          color: value ? "#FFD600" : "#aaa",
          fontSize: 16,
          fontWeight: value ? "bold" : "normal"
        }}>
          {GENDERS.find(g => g.value === value)?.label || "Chọn giới tính"}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#FFD600" style={{ marginLeft: "auto" }} />
      </TouchableOpacity>
      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)}
          contentContainerStyle={{
            backgroundColor: "#232323",
            borderRadius: 18,
            borderWidth: 2,
            borderColor: "#FFD600",
            padding: 10,
            margin: 30,
          }}>
          {GENDERS.map(g =>
            <List.Item
              key={g.value}
              title={g.label}
              left={props => <Ionicons name={g.icon} size={22} color="#FFD600" style={{ marginRight: 8 }} />}
              titleStyle={{ color: "#FFD600", fontWeight: "bold", fontSize: 16 }}
              onPress={() => { onSelect(g.value); setVisible(false); }}
              style={{ backgroundColor: "#181818", borderRadius: 8 }}
            />
          )}
        </Modal>
      </Portal>
    </>
  );
}

export default function RegisterScreen({ navigation, route }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [date_of_birth, setDateOfBirth] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal alert
  const [modalAlert, setModalAlert] = useState({ visible: false, title: '', message: '' });
  const showAlert = (title, message) => setModalAlert({ visible: true, title, message });
  const hideAlert = () => setModalAlert({ visible: false, title: '', message: '' });

  // Nếu đã xác thực OTP, tự động đăng ký luôn
  useEffect(() => {
    if (route?.params?.otpVerified && route?.params?.userInfo) {
      handleRegister(route.params.userInfo);
    }
    if (route?.params?.email && !email) setEmail(route.params.email);
  }, [route?.params?.otpVerified]);

  // Chọn ảnh đại diện
  const pickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  // Gửi OTP về email trước khi đăng ký
  const goToEmailOtp = async () => {
    if (!username || !email || !password || !confirmPassword || !first_name || !last_name) {
      showAlert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Lỗi', 'Mật khẩu nhập lại không khớp');
      return;
    }
    setLoading(true);
    try {
      await axios.post(endpoints.sendRegisterOtp, { email });
      navigation.navigate('EmailOtp', {
        email,
        flow: 'register',
        userInfo: {
          username, email, password, confirmPassword, first_name, last_name, avatar,
          date_of_birth, gender, phone, address, bio
        }
      });
    } catch (err) {
      let message = 'Không gửi được OTP';
      if (err.response?.data?.detail) message = err.response.data.detail;
      showAlert('Lỗi', message);
    } finally {
      setLoading(false);
    }
  };

  // Đăng ký tài khoản (chỉ gọi sau khi xác thực OTP thành công)
  const handleRegister = async (userData) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', userData.username);
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      formData.append('first_name', userData.first_name);
      formData.append('last_name', userData.last_name);
      formData.append('confirm_password', userData.confirmPassword);
      if (userData.date_of_birth) formData.append('date_of_birth', userData.date_of_birth);
      if (userData.gender) formData.append('gender', userData.gender);
      if (userData.phone) formData.append('phone', userData.phone);
      if (userData.address) formData.append('address', userData.address);
      if (userData.bio) formData.append('bio', userData.bio);

      if (userData.avatar) {
        const fileName = userData.avatar.split('/').pop();
        const match = /\.(\w+)$/.exec(fileName);
        const ext = match ? match[1] : 'jpg';
        formData.append('avatar', {
          uri: userData.avatar,
          name: fileName,
          type: `image/${ext}`,
        });
      }

      await axios.post(endpoints.register, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showAlert('Đăng ký thành công!', 'Bạn có thể đăng nhập tài khoản vừa tạo.');
      navigation.replace('Login');
    } catch (err) {
      let message = 'Lỗi không xác định';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') message = err.response.data;
        else if (err.response.data.detail) message = err.response.data.detail;
        else {
          message = Object.values(err.response.data).join('\n');
        }
      }
      showAlert('Lỗi đăng ký', message);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi quay lại từ màn OTP với userInfo để đăng ký
  useEffect(() => {
    if (route?.params?.userInfo && route?.params?.otpVerified) {
      // Đã xác thực OTP, tự động đăng ký
      handleRegister(route.params.userInfo);
    }
  }, [route?.params?.otpVerified]);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.title}>MoNi Mobile App</Text>
        <Text style={styles.subtitle}>Đăng ký tài khoản mới để sử dụng dịch vụ</Text>
        <View style={styles.form}>
          <TouchableOpacity style={styles.avatarPicker} onPress={pickAvatar}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <Ionicons name="camera" size={48} color="#FFD600" />
            )}
            <Text style={styles.avatarText}>Chọn ảnh đại diện</Text>
          </TouchableOpacity>
          <View style={styles.inputContainer}>
            <Ionicons name="person-circle-outline" size={22} color="#FFD600" />
            <TextInput
              style={styles.input}
              placeholder="Họ"
              value={first_name}
              onChangeText={setFirstName}
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="person-circle" size={22} color="#FFD600" />
            <TextInput
              style={styles.input}
              placeholder="Tên"
              value={last_name}
              onChangeText={setLastName}
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color="#FFD600" />
            <TextInput
              style={styles.input}
              placeholder="Tên đăng nhập"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={22} color="#FFD600" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={22} color="#FFD600" />
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowDatePicker(true)}>
              <Text style={[styles.input, { color: date_of_birth ? "#fff" : "#aaa", paddingTop: 12 }]}>
                {date_of_birth || "Ngày sinh (YYYY-MM-DD)"}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date_of_birth ? new Date(date_of_birth) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    const d = selectedDate;
                    const f = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    setDateOfBirth(f);
                  }
                }}
                maximumDate={new Date()}
              />
            )}
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={22} color="#FFD600" />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={22} color="#FFD600" />
            <TextInput
              style={styles.input}
              placeholder="Địa chỉ"
              value={address}
              onChangeText={setAddress}
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="text-outline" size={22} color="#FFD600" />
            <TextInput
              style={styles.input}
              placeholder="Giới thiệu ngắn về bản thân"
              value={bio}
              onChangeText={setBio}
              placeholderTextColor="#aaa"
            />
          </View>
          <GenderSelect value={gender} onSelect={setGender} />
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#FFD600" />
            <TextInput
              style={[styles.input, { paddingRight: 36 }]}
              placeholder="Mật khẩu"
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
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#FFD600" />
            <TextInput
              style={[styles.input, { paddingRight: 36 }]}
              placeholder="Xác nhận mật khẩu"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity
              style={{ position: 'absolute', right: 15 }}
              onPress={() => setShowConfirmPassword(x => !x)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye' : 'eye-off'}
                size={22}
                color="#FFD600"
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.button} onPress={goToEmailOtp} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Đang gửi OTP...' : 'Gửi OTP & Đăng ký'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.secondaryButtonText}>Quay lại đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ModalAlert
        visible={modalAlert.visible}
        onDismiss={hideAlert}
        title={modalAlert.title}
        message={modalAlert.message}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: '#181818',
    justifyContent: 'center',
  },
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
  avatarPicker: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#FFD600',
    backgroundColor: '#262626',
  },
  avatarText: {
    color: '#FFD600',
    fontStyle: 'italic',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
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
    position: 'relative',
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
  genderSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FFD600',
    minHeight: 44,
  },
});