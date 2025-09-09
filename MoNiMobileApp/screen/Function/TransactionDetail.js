import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { authApi, endpoints } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function TransactionDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { transactionId } = route.params;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={26} color="#FFD600" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactionDetail = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('access_token');
        // Đảm bảo endpoints.transactionDetail đúng (ví dụ: id => `/Transaction/${id}/`)
        const res = await authApi(token).get(endpoints.transactionDetail(transactionId));
        setTransaction(res.data);
      } catch (err) {
        setTransaction(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactionDetail();
  }, [transactionId]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#FFD600" /></View>
  }

  if (!transaction) {
    return <View style={styles.center}><Text style={{ color: "#FFD600" }}>Không tìm thấy giao dịch.</Text></View>
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.box}>
        <View style={styles.row}>
          <Icon name={transaction.type === "income" ? "arrow-up-bold" : "arrow-down-bold"} size={30} color={transaction.type === "income" ? "#43A047" : "#E91E63"} />
          <Text style={styles.typeText}>{transaction.type === "income" ? "Thu nhập" : "Chi tiêu"}</Text>
        </View>
        <Text style={styles.money}>
          {transaction.type === "income" ? "+" : "-"}{Number(transaction.amount).toLocaleString()}đ
        </Text>
        <View style={styles.infoRow}>
          <Icon name="calendar" size={22} color="#FFD600" />
          <Text style={styles.infoLabel}>Ngày giao dịch: </Text>
          <Text style={styles.infoText}>
            {transaction.transaction_date ? (
              new Date(transaction.transaction_date).toLocaleDateString()
            ) : "(không có)"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="folder" size={22} color="#FFD600" />
          <Text style={styles.infoLabel}>Danh mục: </Text>
          <Text style={styles.infoText}>{transaction.category_name || transaction.category || "(không có)"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="note-text" size={22} color="#FFD600" />
          <Text style={styles.infoLabel}>Ghi chú: </Text>
          <Text style={styles.infoText}>{transaction.note || "(không ghi chú)"}</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#181818", padding: 18 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#181818" },
  box: {
    backgroundColor: "#232323",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.2,
    borderColor: "#FFD600",
    shadowColor: "#FFD60044",
    shadowOpacity: 0.09,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  typeText: { color: "#FFD600", fontSize: 20, fontWeight: "bold", marginLeft: 12 },
  money: { fontSize: 26, fontWeight: "bold", color: "#FFD600", marginVertical: 10 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  infoLabel: { color: "#FFD600", fontWeight: "bold", marginLeft: 7 },
  infoText: { color: "#FFD600", marginLeft: 3, flex: 1, flexWrap: 'wrap' },
});