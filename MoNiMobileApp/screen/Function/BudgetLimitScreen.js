import React, { useEffect, useState } from "react";
import { View, FlatList } from "react-native";
import { Text, Button, FAB, Modal, Portal, TextInput, ActivityIndicator, Menu, IconButton } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi, endpoints } from "../../configs/Apis";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  modernCard,
  fabStyle,
  formModalStyle,
  formModalTitleStyle,
  formGroupStyle,
  formLabelStyle,
  formInputStyle,
  formDropdownStyle,
  formDateBtnStyle,
  formSaveBtnStyle,
  deleteModalStyle,
  deleteModalTitleStyle,
  deleteModalTextStyle,
  deleteModalCatStyle,
  deleteModalButtonRow,
  deleteCancelStyle,
  deleteConfirmStyle,
  modalStyle,
  infoLabel
} from "../styles/Style";

export default function BudgetLimitScreen() {
  const [limits, setLimits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [visible, setVisible] = useState(false);
  const [editLimit, setEditLimit] = useState(null);

  // Custom delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Fields
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(new Date());
  const [warning, setWarning] = useState('100');
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Menu state for category picker
  const [menuVisible, setMenuVisible] = useState(false);

  function formatMoneyInput(value) {
    if (!value) return '';
    let digits = value.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  const reload = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      const resCat = await authApi(token).get(endpoints.categories);
      setCategories(resCat.data.results || []);
      const res = await authApi(token).get(endpoints.budgetLimits);
      setLimits(res.data.results || res.data);
    } catch {
      setLimits([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  const openAdd = () => {
    setEditLimit(null);
    setCategory(categories.length > 0 ? categories[0].id : '');
    setAmount('');
    setMonth(new Date());
    setWarning('100');
    setVisible(true);
  };
  const openEdit = (limit) => {
    setEditLimit(limit);
    setCategory(limit.category);
    setAmount(limit.amount_limit.toString());
    setMonth(limit.month ? new Date(limit.month) : new Date());
    setWarning(limit.warning_threshold?.toString() || '100');
    setVisible(true);
  };

  // Only pick month/year, save as YYYY-MM-01
  const handleMonthPickerChange = (e, date) => {
    setShowMonthPicker(false);
    if (date) setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const handleSave = async () => {
    if (!category || !amount || isNaN(Number(amount)) || Number(amount) <= 0)
      return showCustomAlert("Lỗi", "Chọn danh mục và nhập số tiền dương.");

    const y = month.getFullYear();
    const m = (month.getMonth() + 1).toString().padStart(2, "0");
    const selectedMonth = `${y}-${m}-01`;

    if (!editLimit) {
      const isDuplicate = limits.some(
        lim =>
          lim.category === category &&
          (lim.month || "").slice(0, 7) === selectedMonth.slice(0, 7)
      );
      if (isDuplicate) {
        return showCustomAlert(
          "Lỗi",
          "Danh mục này đã có hạn mức trong tháng này. Vui lòng sửa hạn mức cũ."
        );
      }
    }

    try {
      const token = await AsyncStorage.getItem("access_token");
      const data = {
        category,
        amount_limit: Number(amount),
        month: selectedMonth,
        warning_threshold: Number(warning),
      };
      if (editLimit) {
        await authApi(token).put(endpoints.budgetLimits + `${editLimit.id}/`, data);
      } else {
        await authApi(token).post(endpoints.budgetLimits, data);
      }
      setVisible(false);
      reload();
    } catch (e) {
      showCustomAlert("Lỗi", "Không lưu được hạn mức.");
    }
  };

  // Custom Alert Modal State
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '' });
  const showCustomAlert = (title, message) => setCustomAlert({ visible: true, title, message });
  const hideCustomAlert = () => setCustomAlert({ visible: false, title: '', message: '' });

  // Custom delete modal
  const handleDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const token = await AsyncStorage.getItem("access_token");
      await authApi(token).delete(endpoints.budgetLimits + `${itemToDelete.id}/`);
      setDeleteModalVisible(false);
      setItemToDelete(null);
      reload();
    } catch (err) {
      setDeleteModalVisible(false);
      setItemToDelete(null);
      showCustomAlert("Lỗi", "Không xoá được hạn mức.");
    }
  };

  // Style riêng cho infoRow, infoValue, infoNumber
  const infoRow = {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    marginTop: 2,
  };
  const infoValue = {
    color: "#FFD600",
    marginLeft: 6,
    fontWeight: "500",
    fontSize: 15
  };
  const infoNumber = {
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 6,
    letterSpacing: 0.2
  };

  const renderLimit = ({ item }) => {
    const categoryObj = categories.find(c => c.id === item.category);
    const color = "#FFD600";
    return (
      <View style={modernCard}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Icon name="finance" size={27} color={color} style={{ marginRight: 7 }} />
          <Text style={{
            color: color,
            fontWeight: "bold",
            fontSize: 18,
            flex: 1,
            textShadowColor: "#000",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3
          }}>
            {categoryObj?.name || "?"}
          </Text>
          <IconButton
            icon="pencil-circle"
            iconColor="#43A047"
            size={26}
            onPress={() => openEdit(item)}
            style={{ margin: 0, marginLeft: 2 }}
          />
          <IconButton
            icon="trash-can"
            iconColor="#E91E63"
            size={26}
            onPress={() => handleDelete(item)}
            style={{ margin: 0, marginLeft: -8 }}
          />
        </View>
        <View style={infoRow}>
          <Icon name="calendar-month" size={18} color="#FFD600AA" style={{ marginRight: 4 }} />
          <Text style={infoLabel}>Tháng:</Text>
          <Text style={infoValue}>{(item.month || "").slice(0, 7)}</Text>
        </View>
        <View style={infoRow}>
          <Icon name="cash-multiple" size={18} color="#FFD600AA" style={{ marginRight: 4 }} />
          <Text style={infoLabel}>Hạn mức:</Text>
          <Text style={[infoNumber, { color: "#FFD600" }]}>{Number(item.amount_limit).toLocaleString()}đ</Text>
        </View>
        <View style={infoRow}>
          <Icon name="alert-circle" size={18} color="#FFD600AA" style={{ marginRight: 4 }} />
          <Text style={infoLabel}>Cảnh báo:</Text>
          <Text style={[infoNumber, { color: "#E91E63" }]}>{item.warning_threshold}%</Text>
        </View>
      </View>
    );
  };

  const renderDeleteModal = () => {
    const catName = categories.find(c => c.id === itemToDelete?.category)?.name || "";
    return (
      <Modal
        visible={deleteModalVisible}
        onDismiss={() => setDeleteModalVisible(false)}
        contentContainerStyle={deleteModalStyle}
      >
        <Text style={deleteModalTitleStyle}>Xác nhận xoá</Text>
        <Text style={deleteModalTextStyle}>
          Bạn chắc chắn muốn xoá hạn mức cho danh mục{" "}
          <Text style={deleteModalCatStyle}>{catName}</Text>?
        </Text>
        <View style={deleteModalButtonRow}>
          <Button
            mode="outlined"
            onPress={() => setDeleteModalVisible(false)}
            style={deleteCancelStyle}
            labelStyle={{ color: "#FFD600", fontWeight: "bold", fontSize: 16 }}
            contentStyle={{ height: 44 }}
          >Huỷ</Button>
          <Button
            mode="contained"
            onPress={confirmDelete}
            buttonColor="#E91E63"
            style={deleteConfirmStyle}
            labelStyle={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
            contentStyle={{ height: 44 }}
          >Xoá</Button>
        </View>
      </Modal>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#181818" }}>
      {loading ? (
        <ActivityIndicator animating color="#FFD600" style={{ margin: 32 }} />
      ) : (
        <FlatList
          data={limits}
          keyExtractor={item => item.id.toString()}
          renderItem={renderLimit}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 36 }}
          ListEmptyComponent={
            <Text style={{ color: "#FFD60099", textAlign: "center", margin: 24 }}>
              Chưa có hạn mức nào!
            </Text>
          }
        />
      )}
      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={formModalStyle}>
          <Text style={formModalTitleStyle}>{editLimit ? "Sửa" : "Thêm"} hạn mức</Text>
          {/* Danh mục */}
          <View style={formGroupStyle}>
            <Text style={formLabelStyle}>Danh mục</Text>
            <Button
              mode="contained"
              icon="menu-down"
              onPress={() => setMenuVisible(true)}
              buttonColor="#232323"
              textColor="#FFD600"
              style={formDropdownStyle}
              labelStyle={{ color: "#FFD600", fontWeight: "bold" }}
            >
              {categories.find(c => c.id === category)?.name || "Chọn danh mục"}
            </Button>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={{ x: 120, y: 250 }}
              contentStyle={{ backgroundColor: "#232323", borderRadius: 14, minWidth: 180, borderColor: "#FFD600", borderWidth: 1 }}
            >
              {categories.map(c => (
                <Menu.Item
                  key={c.id}
                  onPress={() => { setCategory(c.id); setMenuVisible(false); }}
                  title={c.name}
                  titleStyle={{ color: "#FFD600", fontWeight: "bold" }}
                />
              ))}
            </Menu>
          </View>
          {/* Số tiền hạn mức */}
          <View style={formGroupStyle}>
            <Text style={formLabelStyle}>Số tiền hạn mức</Text>
            <TextInput
              value={formatMoneyInput(amount)}
              onChangeText={text => setAmount(text.replace(/\D/g, ''))}
              mode="flat"
              keyboardType="numeric"
              style={formInputStyle}
              underlineColor="#FFD600"
              activeUnderlineColor="#FFD600"
              theme={{ roundness: 10 }}
              placeholder="Nhập số tiền"
              placeholderTextColor="#aaa"
            />
          </View>
          {/* Tháng */}
          <View style={formGroupStyle}>
            <Text style={formLabelStyle}>Tháng</Text>
            <Button mode="outlined" textColor="#FFD600" style={formDateBtnStyle}
              labelStyle={{ fontWeight: "bold" }}
              onPress={() => setShowMonthPicker(true)}>
              {month.getFullYear()}-{(month.getMonth() + 1).toString().padStart(2, "0")}
            </Button>
          </View>
          {/* Cảnh báo */}
          <View style={formGroupStyle}>
            <Text style={formLabelStyle}>Cảnh báo (%)</Text>
            <TextInput
              value={warning}
              onChangeText={setWarning}
              mode="flat"
              keyboardType="numeric"
              style={formInputStyle}
              underlineColor="#FFD600"
              activeUnderlineColor="#FFD600"
              theme={{ roundness: 10 }}
              placeholder="Nhập % cảnh báo"
              placeholderTextColor="#aaa"
            />
          </View>
          <Button mode="contained" buttonColor="#FFD600" onPress={handleSave} textColor="#232323" style={formSaveBtnStyle}>
            {editLimit ? "Lưu" : "Thêm"}
          </Button>
        </Modal>
        {renderDeleteModal()}
        <Modal visible={customAlert.visible} onDismiss={hideCustomAlert} contentContainerStyle={modalStyle}>
          <Text style={{ color: "#FFD600", fontWeight: "bold", fontSize: 18, marginBottom: 12 }}>
            {customAlert.title}
          </Text>
          <Text style={{ color: "#fff", fontSize: 15, marginBottom: 26, textAlign: "center" }}>
            {customAlert.message}
          </Text>
          <Button mode="contained" buttonColor="#FFD600" onPress={hideCustomAlert} textColor="#232323" style={formSaveBtnStyle}>OK</Button>
        </Modal>
        <FAB
          icon="plus"
          style={fabStyle}
          color="#232323"
          customSize={60}
          onPress={openAdd}
          visible={!visible && !deleteModalVisible && !customAlert.visible}
        />
      </Portal>
      {showMonthPicker && (
        <DateTimePicker
          value={month}
          mode="date"
          display="default"
          onChange={handleMonthPickerChange}
        />
      )}
    </View>
  );
}