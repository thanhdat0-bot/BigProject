import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TextInput, ScrollView,TouchableOpacity } from 'react-native';
import { useRoute,useNavigation } from '@react-navigation/native';
import { authApi, endpoints } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function CategoryDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { categoryId } = route.params;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={26} color="#FFD600" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryDetail = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('access_token');
        const res = await authApi(token).get(endpoints.categoryDetail(categoryId));
        setCategory(res.data);
      } catch (err) {
        setCategory(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryDetail();
  }, [categoryId]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#FFD600" /></View>
  }

  if (!category) {
    return <View style={styles.center}><Text style={{ color: "#FFD600" }}>Không tìm thấy danh mục.</Text></View>
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.formBox}>
        <View style={styles.formRow}>
          <Icon name="folder" size={26} color="#FFD600" style={styles.icon} />
          <Text style={styles.label}>Tên danh mục</Text>
        </View>
        <TextInput
          style={styles.input}
          value={category.name}
          editable={false}
          placeholder="Tên danh mục"
        />
        <View style={styles.formRow}>
          <Icon name="text" size={24} color="#FFD600" style={styles.icon} />
          <Text style={styles.label}>Mô tả</Text>
        </View>
        <TextInput
          style={styles.input}
          value={category.description || ""}
          editable={false}
          placeholder="Mô tả"
        />
        <View style={styles.formRow}>
          <Icon name="alert-decagram" size={24} color="#FFD600" style={styles.icon} />
          <Text style={styles.label}>Hạn mức</Text>
        </View>
        <TextInput
          style={styles.input}
          value={category.limit ? Number(category.limit).toLocaleString() + 'đ' : "Chưa đặt"}
          editable={false}
          placeholder="Hạn mức"
        />
      </View>
      <Text style={styles.sectionTitle}>Giao dịch liên quan</Text>
      <FlatList
        data={category.transactions}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.txRow}>
            <Icon name={item.type === "income" ? "arrow-up-bold" : "arrow-down-bold"} size={18} color={item.type === "income" ? "#43A047" : "#E91E63"} style={{ marginRight: 6 }} />
            <Text style={{ flex: 1, color: "#FFD600" }}>{item.note || "(không ghi chú)"}</Text>
            <Text style={{ color: item.type === "income" ? "#43A047" : "#E91E63", fontWeight: "bold" }}>
              {item.type === "income" ? "+" : "-"}{Number(item.amount).toLocaleString()}đ
            </Text>
            <Text style={styles.txDate}>{item.date}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: "#FFD600", fontStyle: "italic", textAlign: "center" }}>Không có giao dịch nào.</Text>}
        style={{ marginTop: 8 }}
        scrollEnabled={false}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#181818", padding: 18 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#181818" },
  formBox: {
    backgroundColor: "#232323",
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1.2,
    borderColor: "#FFD600",
    shadowColor: "#FFD60044",
    shadowOpacity: 0.09,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    marginTop: 8
  },
  icon: { marginRight: 7 },
  label: { color: "#FFD600", fontSize: 16, fontWeight: "bold" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 9,
    padding: 10,
    marginBottom: 7,
    fontSize: 16,
    color: "#222",
    opacity: 0.92
  },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: "#FFD600", marginVertical: 12 },
  txRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 8, borderBottomWidth: .7, borderColor: "#FFD60022",
    paddingHorizontal: 2,
  },
  txDate: { color: "#FFD60077", fontSize: 13, marginLeft: 8 },
});