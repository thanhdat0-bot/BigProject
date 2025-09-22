import React, { useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { authApi, endpoints } from '../../configs/Apis';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const fetchProfile = async () => {
        setLoading(true);
        try {
          const token = await AsyncStorage.getItem('access_token');
          if (token) {
            const res = await authApi(token).get(endpoints.profile);
            if (isActive) setProfile(res.data);
          }
        } catch (err) {
          if (isActive) setProfile(null);
        } finally {
          if (isActive) setLoading(false);
        }
      };
      fetchProfile();
      return () => {
        isActive = false;
      };
    }, [])
  );

  const onLogout = async () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('access_token');
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ]
    );
  };

  const onChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const onEditProfile = () => {
    navigation.navigate('EditProfile', { profile });
  };

  if (loading)
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#FFD600" />;
  if (!profile)
    return <Text style={{ color: 'red', marginTop: 30, textAlign: 'center' }}>Không thể tải thông tin người dùng</Text>;

  return (
    <ScrollView style={styles.bg}>
      <View style={styles.profileCard}>
        <View style={styles.avatarBox}>
          <Image
            source={profile.avatar ? { uri: profile.avatar } : require('../../assets/images/avatar_default.png')}
            style={styles.avatar}
          />
          <Text style={styles.name}>{profile.first_name || ''} {profile.last_name || ''}</Text>
          <Text style={styles.username}>@{profile.username}</Text>

          {/* 
            ĐOẠN CHÚ THÍCH THÊM VÀO ĐỂ HIỂN THỊ ĐIỂM TÍN DỤNG
            Sử dụng trường profile.credit_score do API trả về, có thể style lại cho nổi bật.
          */}
          <View style={{ alignItems: "center", marginTop: 10 }}>
            <Icon name="star-circle-outline" size={35} color="#FFD600" />
            <Text style={{ color: "#FFD600", fontSize: 21, fontWeight: 'bold', marginTop: 7 }}>
              Điểm tín dụng: {profile.credit_score}
            </Text>
          </View>
          {/* Kết thúc đoạn chú thích hiển thị điểm tín dụng */}
        </View>
        <View style={styles.infoCard}>
          <InfoRow icon="email-outline" label="Email" value={profile.email} />
          {profile.phone && <InfoRow icon="phone-outline" label="Số điện thoại" value={profile.phone} />}
          {profile.date_of_birth && <InfoRow icon="cake-variant-outline" label="Ngày sinh" value={profile.date_of_birth} />}
          {profile.gender && (
            <InfoRow
              icon="gender-male-female"
              label="Giới tính"
              value={
                profile.gender === 'male'
                  ? 'Nam'
                  : profile.gender === 'female'
                  ? 'Nữ'
                  : 'Khác'
              }
            />
          )}
          {profile.address && <InfoRow icon="map-marker-outline" label="Địa chỉ" value={profile.address} />}
        </View>
        {profile.bio ? (
          <View style={styles.bioBox}>
            <Icon name="information-outline" size={18} color="#FFD600" style={{ marginRight: 6 }} />
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        ) : null}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={onEditProfile}>
            <Icon name="account-edit-outline" size={18} color="#181818" style={{ marginRight: 9 }} />
            <Text style={styles.actionBtnTxt}>Chỉnh sửa hồ sơ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onChangePassword}>
            <Icon name="lock-reset" size={18} color="#181818" style={{ marginRight: 9 }} />
            <Text style={styles.actionBtnTxt}>Đổi mật khẩu</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Icon name="logout" size={19} color="#FFD600" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={18} color="#FFD600" style={{ marginRight: 8, width: 22 }} />
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    backgroundColor: '#181818',
    flex: 1
  },
  profileCard: {
    margin: 20,
    backgroundColor: '#232323',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#FFD600',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
    borderWidth: 1.2,
    borderColor: "#FFD600",
  },
  avatarBox: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFD600',
    backgroundColor: '#262626',
    marginBottom: 12,
  },
  name: { fontSize: 22, fontWeight: 'bold', color: '#FFD600', marginBottom: 2 },
  username: { color: '#fff', fontSize: 14, fontStyle: 'italic', marginBottom: 12 },
  infoCard: {
    width: '100%',
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#FFD600",
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    color: '#FFD600',
    fontSize: 15,
    minWidth: 85,
    fontWeight: '600',
  },
  infoValue: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    flexWrap: 'wrap',
  },
  bioBox: {
    width: '100%',
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    backgroundColor: '#262626',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#FFD600",
  },
  bioText: {
    color: "#FFD600",
    fontSize: 15,
    fontStyle: 'italic',
    flex: 1,
    flexWrap: 'wrap',
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 18,
    width: '100%',
    gap: 12
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD600",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: "center",
    marginHorizontal: 2,
    elevation: 1,
  },
  actionBtnTxt: {
    color: "#181818",
    fontWeight: "bold",
    fontSize: 15,
    letterSpacing: 0.1,
  },
  logoutBtn: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 34,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: "#FFD600",
    backgroundColor: "#181818",
  },
  logoutText: {
    color: "#FFD600",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 7,
  },
});