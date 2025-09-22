import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, endpoints } from '../../configs/Apis';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { Modal, Portal, Button } from "react-native-paper";

// ModalAlert component để thông báo thành công/thất bại (có thể tái sử dụng)
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

export default function EditProfileScreen({ route, navigation }) {
  const { profile } = route.params || {};
  const [first_name, setFirstName] = useState(profile?.first_name || '');
  const [last_name, setLastName] = useState(profile?.last_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatar, setAvatar] = useState(profile?.avatar || null);
  const [localAvatar, setLocalAvatar] = useState(null); // ảnh chọn mới

  // Custom modal alert
  const [modalAlert, setModalAlert] = useState({ visible: false, title: '', message: '' });
  const showAlert = (title, message) => setModalAlert({ visible: true, title, message });
  const hideAlert = () => setModalAlert({ visible: false, title: '', message: '' });

  // Chọn avatar mới
  const pickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled) {
      setLocalAvatar(result.assets[0].uri);
    }
  };

  const onSave = async () => {
    // Kiểm tra số điện thoại: chỉ được nhập số (hoặc để trống)
    if (phone && phone.trim() && !/^\d+$/.test(phone.trim())) {
      showAlert("Lỗi", "Số điện thoại chỉ được nhập số.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('access_token');
      let formData = new FormData();

      // Nếu trường nào KHÔNG rỗng, mới gửi lên server để cập nhật
      if (first_name.trim()) formData.append('first_name', first_name.trim());
      if (last_name.trim()) formData.append('last_name', last_name.trim());
      if (phone.trim()) formData.append('phone', phone.trim());
      if (address.trim()) formData.append('address', address.trim());
      if (bio.trim()) formData.append('bio', bio.trim());

      if (localAvatar) {
        const fileName = localAvatar.split('/').pop();
        const match = /\.(\w+)$/.exec(fileName);
        const ext = match ? match[1] : 'jpg';
        formData.append('avatar', {
          uri: localAvatar,
          name: fileName,
          type: `image/${ext}`,
        });
      }

      await authApi(token).patch(endpoints.profile, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showAlert("Thành công", "Đã cập nhật thông tin!");
      navigation.goBack();
    } catch (err) {
      console.log(err.response?.data || err.message);
      showAlert("Lỗi", "Không thể cập nhật thông tin.");
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.avoiding}
      >
        <View style={styles.formCard}>
          <Text style={styles.header}>Chỉnh sửa hồ sơ</Text>
          {/* Chọn/hiển thị avatar */}
          <TouchableOpacity style={styles.avatarPicker} onPress={pickAvatar}>
            <Image
              source={
                localAvatar
                  ? { uri: localAvatar }
                  : avatar
                  ? { uri: avatar }
                  : require('../../assets/images/avatar_default.png')
              }
              style={styles.avatar}
            />
            <Text style={styles.avatarText}>Đổi ảnh đại diện</Text>
          </TouchableOpacity>
          {/* Form info */}
          <View style={styles.inputGroup}>
            <Icon name="account-outline" size={20} color="#FFD600" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={first_name}
              onChangeText={setFirstName}
              placeholder="Họ"
              placeholderTextColor="#bbb"
            />
          </View>
          <View style={styles.inputGroup}>
            <Icon name="account-outline" size={20} color="#FFD600" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={last_name}
              onChangeText={setLastName}
              placeholder="Tên"
              placeholderTextColor="#bbb"
            />
          </View>
          <View style={styles.inputGroup}>
            <Icon name="phone-outline" size={20} color="#FFD600" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Số điện thoại"
              keyboardType="phone-pad"
              placeholderTextColor="#bbb"
            />
          </View>
          <View style={styles.inputGroup}>
            <Icon name="map-marker-outline" size={20} color="#FFD600" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Địa chỉ"
              placeholderTextColor="#bbb"
            />
          </View>
          <View style={styles.inputGroup}>
            <Icon name="information-outline" size={20} color="#FFD600" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={bio}
              onChangeText={setBio}
              placeholder="Giới thiệu"
              placeholderTextColor="#bbb"
            />
          </View>
          <TouchableOpacity style={styles.button} onPress={onSave}>
            <Text style={styles.buttonText}>Lưu thay đổi</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    marginBottom: 20,
    textAlign: 'center'
  },
  avatarPicker: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
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