import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { Text, FAB, Portal, Modal, TextInput, Button, IconButton, ActivityIndicator, Menu } from 'react-native-paper';
import { authApi, endpoints } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
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

export default function TransactionScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  // Custom delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [txToDelete, setTxToDelete] = useState(null);

  // Custom Alert Modal State
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '' });
  const showCustomAlert = (title, message) => setCustomAlert({ visible: true, title, message });
  const hideCustomAlert = () => setCustomAlert({ visible: false, title: '', message: '' });

  // Fields
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [note, setNote] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // Menu state for category picker
  const [menuVisible, setMenuVisible] = useState(false);

  // Banner warning
  const [bannerMsg, setBannerMsg] = useState('');
  const [bannerVisible, setBannerVisible] = useState(false);

  // FILTER STATE
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);
  const [filterShowDatePicker, setFilterShowDatePicker] = useState({ type: '', visible: false });
  const [showFilter, setShowFilter] = useState(false);

  function formatMoneyInput(value) {
    if (!value) return '';
    let digits = value.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  const reload = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const resCat = await authApi(token).get(endpoints.categories);
      setCategories(resCat.data.results || []);
      const res = await authApi(token).get(endpoints.transactions);
      setTransactions(res.data.results);
    } catch (err) {
      setTransactions([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  // FILTER HANDLER
  const handleFilter = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      let params = [];
      if (filterCategory) params.push(`category=${filterCategory}`);
      if (filterMinAmount) params.push(`min_amount=${filterMinAmount}`);
      if (filterMaxAmount) params.push(`max_amount=${filterMaxAmount}`);
      if (filterStartDate) params.push(`start_date=${filterStartDate}`);
      if (filterEndDate) params.push(`end_date=${filterEndDate}`);

      const url = endpoints.transactionsFilter + (params.length ? `?${params.join('&')}` : '');
      const res = await authApi(token).get(url);
      setTransactions(res.data);
    } catch (err) {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setIsEdit(false); setEditId(null); setAmount(''); setType('expense'); setNote('');
    setTransactionDate(new Date());
    setCategory(categories.length > 0 ? categories[0].id : '');
    setModalVisible(true);
  };

  const openEdit = (tx) => {
    setIsEdit(true);
    setEditId(tx.id);
    setAmount(tx.amount.toString());
    setType(tx.type);
    setNote(tx.note || '');
    setTransactionDate(tx.transaction_date ? new Date(tx.transaction_date) : new Date());
    setCategory(tx.category);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      return showCustomAlert("Lỗi", "Số tiền phải là số dương.");
    if (!category)
      return showCustomAlert("Lỗi", "Chọn danh mục giao dịch.");

    const y = transactionDate.getFullYear();
    const m = (transactionDate.getMonth() + 1).toString().padStart(2, '0');
    const d = transactionDate.getDate().toString().padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    try {
      const token = await AsyncStorage.getItem('access_token');
      const data = {
        amount: Number(amount),
        type,
        note,
        transaction_date: dateStr,
        category,
      };
      if (isEdit) {
        const res = await authApi(token).put(endpoints.transactionDetail(editId), data);
        if (res?.data?.budget_warning) {
          setBannerMsg(`⚠️ ${res.data.budget_warning}`);
          setBannerVisible(true);
        } else {
          setBannerVisible(false);
          setBannerMsg('');
        }
      } else {
        const res = await authApi(token).post(endpoints.transactions, data);
        if (res?.data?.budget_warning) {
          setBannerMsg(`⚠️ ${res.data.budget_warning}`);
          setBannerVisible(true);
        }
      }
      setModalVisible(false);
      reload();
    } catch (err) {
      showCustomAlert("Lỗi", "Không thêm/cập nhật được giao dịch.");
    }
  };

  const handleDelete = (tx) => {
    setTxToDelete(tx);
    setDeleteModalVisible(true);
  };
  const confirmDelete = async () => {
    if (!txToDelete) return;
    try {
      const token = await AsyncStorage.getItem("access_token");
      await authApi(token).delete(endpoints.transactionDetail(txToDelete.id));
      setDeleteModalVisible(false);
      setTxToDelete(null);
      reload();
    } catch (err) {
      setDeleteModalVisible(false);
      setTxToDelete(null);
      showCustomAlert("Lỗi", "Không xoá được giao dịch.");
    }
  };

  // Tách tên danh mục và số % để làm nổi bật
  function parseBudgetWarning(msg) {
    const regex = /chi tiêu danh mục (.+) đã đạt ([\d\.]+%) hạn mức!/i;
    const match = msg.match(regex);
    if (match) {
      return {
        category: match[1],
        percent: match[2],
      };
    }
    return { category: null, percent: null };
  }

  // Bọc mỗi item bằng TouchableOpacity để vào màn chi tiết
  const renderTxItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}>
      <View style={modernCard}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <Icon name={item.type === "income" ? "arrow-up-bold-circle" : "arrow-down-bold-circle"} size={25}
            color={item.type === "income" ? "#43A047" : "#E91E63"} style={{ marginRight: 7 }} />
          <Text style={{
            color: "#FFD600",
            fontWeight: "bold",
            fontSize: 17,
            flex: 1
          }}>
            {item.note || "(không ghi chú)"}
          </Text>
          <IconButton icon="square-edit-outline" iconColor="#FFD600" size={23} onPress={() => openEdit(item)} />
          <IconButton icon="delete-outline" iconColor="#E91E63" size={23} onPress={() => handleDelete(item)} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 1 }}>
          <Icon name="calendar" color="#FFD60099" size={17} style={{ marginRight: 4 }} />
          <Text style={infoLabel}>{item.transaction_date ? item.transaction_date : ""}</Text>
          <Icon name="folder" color="#43A047" size={17} style={{ marginRight: 4, marginLeft: 14 }} />
          <Text style={infoLabel}>{categories.find(c => c.id === item.category)?.name || "?"}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
          <Icon name="cash" size={21} color={item.type === "income" ? "#43A047" : "#E91E63"} style={{ marginRight: 4 }} />
          <Text style={{
            color: item.type === "income" ? "#43A047" : "#E91E63",
            fontWeight: "bold",
            fontSize: 17,
          }}>
            {item.type === "income" ? "+" : "-"}{Number(item.amount).toLocaleString()}đ
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDeleteModal = () => (
    <Modal
      visible={deleteModalVisible}
      onDismiss={() => setDeleteModalVisible(false)}
      contentContainerStyle={deleteModalStyle}
    >
      <Text style={deleteModalTitleStyle}>Xác nhận xoá</Text>
      <Text style={deleteModalTextStyle}>
        Bạn chắc chắn muốn xoá giao dịch trị giá{" "}
        <Text style={deleteModalCatStyle}>{txToDelete ? Number(txToDelete.amount).toLocaleString() + "đ" : ""}</Text>?
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

  // Chỉ chọn ngày tháng năm
  const handleShowDatePicker = () => setShowDatePicker(true);
  const handleDatePickerChange = (e, date) => {
    setShowDatePicker(false);
    if (date) setTransactionDate(date);
  };

  // FILTER DATE PICKER HANDLER
  const handleFilterDateChange = (e, date) => {
    setFilterShowDatePicker({ type: '', visible: false });
    if (date) {
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const d = date.getDate().toString().padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      if (filterShowDatePicker.type === 'start') setFilterStartDate(dateStr);
      else setFilterEndDate(dateStr);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#181818" }}>
      {/* FILTER TOGGLE BUTTON */}
      <Button
        mode="outlined"
        icon={showFilter ? "chevron-up" : "chevron-down"}
        onPress={() => setShowFilter(x => !x)}
        style={{
          borderColor: "#FFD600",
          borderWidth: 1.5,
          margin: 12,
          borderRadius: 10,
          alignSelf: "center",
          backgroundColor: "#232323"
        }}
        labelStyle={{ color: "#FFD600", fontWeight: "bold" }}
      >
        {showFilter ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
      </Button>

      {/* FILTER UI */}
      {showFilter && (
        <View style={{ padding: 10, backgroundColor: '#232323', borderRadius: 10, margin: 12, marginBottom: 0 }}>
          {/* Danh mục */}
          <Text style={{ color: '#FFD600', fontWeight: 'bold', marginBottom: 3 }}>Danh mục</Text>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="contained"
                icon="menu-down"
                onPress={() => setMenuVisible(true)}
                buttonColor="#232323"
                textColor="#FFD600"
                style={{ borderRadius: 10, borderWidth: 1.2, borderColor: "#FFD600" }}
                labelStyle={{ color: "#FFD600", fontWeight: "bold" }}
              >
                {categories.find(c => c.id === filterCategory)?.name || "Tất cả"}
              </Button>
            }
            contentStyle={{ backgroundColor: "#232323", borderRadius: 14, minWidth: 180, borderColor: "#FFD600", borderWidth: 1 }}
          >
            <Menu.Item
              key="all"
              onPress={() => { setFilterCategory(''); setMenuVisible(false); }}
              title="Tất cả"
              titleStyle={{ color: "#FFD600", fontWeight: "bold" }}
            />
            {categories.map(c => (
              <Menu.Item
                key={c.id}
                onPress={() => { setFilterCategory(c.id); setMenuVisible(false); }}
                title={c.name}
                titleStyle={{ color: "#FFD600", fontWeight: "bold" }}
              />
            ))}
          </Menu>

          {/* Số tiền */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <TextInput
              label="Từ"
              value={filterMinAmount}
              onChangeText={setFilterMinAmount}
              mode="outlined"
              keyboardType="numeric"
              style={{ flex: 1, backgroundColor: "#fff", borderRadius: 10 }}
              theme={{ roundness: 10 }}
            />
            <TextInput
              label="Đến"
              value={filterMaxAmount}
              onChangeText={setFilterMaxAmount}
              mode="outlined"
              keyboardType="numeric"
              style={{ flex: 1, backgroundColor: "#fff", borderRadius: 10 }}
              theme={{ roundness: 10 }}
            />
          </View>

          {/* Ngày */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <Button
              mode="outlined"
              textColor="#FFD600"
              style={{ flex: 1, borderColor: "#FFD600", borderWidth: 1.2, borderRadius: 10 }}
              onPress={() => setFilterShowDatePicker({ type: 'start', visible: true })}
            >
              {filterStartDate || "Từ ngày"}
            </Button>
            <Button
              mode="outlined"
              textColor="#FFD600"
              style={{ flex: 1, borderColor: "#FFD600", borderWidth: 1.2, borderRadius: 10 }}
              onPress={() => setFilterShowDatePicker({ type: 'end', visible: true })}
            >
              {filterEndDate || "Đến ngày"}
            </Button>
          </View>

          {/* Nút lọc */}
          <Button
            mode="contained"
            buttonColor="#FFD600"
            textColor="#232323"
            style={{ borderRadius: 10, marginTop: 10 }}
            onPress={handleFilter}
          >
            Lọc
          </Button>
        </View>
      )}

      {bannerVisible && (
        <View style={{
          backgroundColor: '#FFD600',
          borderRadius: 12,
          marginHorizontal: 16,
          marginTop: 10,
          marginBottom: 6,
          paddingVertical: 10,
          paddingHorizontal: 14,
          flexDirection: "row",
          alignItems: "center",
          elevation: 3,
          shadowColor: "#FFD600",
          shadowOpacity: 0.17,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 }
        }}>
          <Icon name="alert-circle" size={22} color="#E91E63" style={{ marginRight: 8 }} />
          {(() => {
            const parsed = parseBudgetWarning(bannerMsg.replace(/^⚠️\s*/, ''));
            if (parsed.category && parsed.percent) {
              const [prefix, suffix] = bannerMsg.replace(/^⚠️\s*/, '').split(parsed.category);
              const [mid, end] = suffix.split(parsed.percent);
              return (
                <Text style={{ color: "#E91E63", fontWeight: "bold", fontSize: 16, flexWrap: "wrap", flex: 1 }}>
                  {prefix}
                  <Text style={{ color: "#232323", backgroundColor: "#FFD600", fontWeight: "bold", fontSize: 16 }}>
                    {parsed.category}
                  </Text>
                  {mid}
                  <Text style={{ color: "#E91E63", backgroundColor: "#fff", fontWeight: "bold", fontSize: 16 }}>
                    {parsed.percent}
                  </Text>
                  {end}
                </Text>
              );
            } else {
              return (
                <Text style={{ color: "#E91E63", fontWeight: "bold", fontSize: 16, flex: 1 }}>
                  {bannerMsg}
                </Text>
              );
            }
          })()}
          <IconButton
            icon="close"
            iconColor="#E91E63"
            size={20}
            onPress={() => setBannerVisible(false)}
            style={{ margin: -8, marginLeft: 10 }}
          />
        </View>
      )}

      {loading ?
        <ActivityIndicator animating color="#FFD600" style={{ margin: 32 }} /> :
        <FlatList
          data={transactions}
          keyExtractor={item => item.id.toString()}
          renderItem={renderTxItem}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 36 }}
          ListEmptyComponent={
            <Text style={{ color: "#FFD60099", fontStyle: "italic", textAlign: "center", marginTop: 20 }}>
              Không có giao dịch nào.
            </Text>
          }
        />}
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={formModalStyle}>
          <Text style={formModalTitleStyle}>
            {isEdit ? "Sửa giao dịch" : "Thêm giao dịch"}
          </Text>
          <View style={formGroupStyle}>
            <Text style={formLabelStyle}>Số tiền</Text>
            <TextInput
              label=""
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
          <View style={formGroupStyle}>
            <Text style={formLabelStyle}>Ghi chú</Text>
            <TextInput
              label=""
              value={note}
              onChangeText={setNote}
              mode="flat"
              style={formInputStyle}
              underlineColor="#FFD600"
              activeUnderlineColor="#FFD600"
              theme={{ roundness: 10 }}
              placeholder="Nhập ghi chú"
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={formGroupStyle}>
            <Text style={formLabelStyle}>Loại</Text>
            <Button
              mode="contained"
              icon={type === "expense" ? "arrow-down-bold" : "arrow-up-bold"}
              onPress={() => setType(type === "expense" ? "income" : "expense")}
              buttonColor={type === "expense" ? "#E91E63" : "#43A047"}
              textColor="#fff"
              style={formDropdownStyle}
              labelStyle={{ fontWeight: "bold", fontSize: 15 }}>
              {type === "expense" ? "Chi tiêu" : "Thu nhập"}
            </Button>
          </View>
          <View style={formGroupStyle}>
            <Text style={formLabelStyle}>Danh mục</Text>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
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
              }
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
          <View style={formGroupStyle}>
            <Text style={formLabelStyle}>Ngày giao dịch</Text>
            <Button
              mode="outlined"
              textColor="#FFD600"
              style={formDateBtnStyle}
              labelStyle={{ fontWeight: "bold" }}
              onPress={handleShowDatePicker}
            >
              {transactionDate.toLocaleDateString()}
            </Button>
          </View>
          <Button mode="contained" buttonColor="#FFD600" onPress={handleSave} textColor="#232323" style={formSaveBtnStyle}>
            {isEdit ? "Lưu" : "Thêm"}
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
          visible={!modalVisible && !deleteModalVisible && !customAlert.visible}
        />
      </Portal>
      {showDatePicker && (
        <DateTimePicker
          value={transactionDate}
          mode="date"
          display="default"
          onChange={handleDatePickerChange}
        />
      )}
      {filterShowDatePicker.visible && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleFilterDateChange}
        />
      )}
    </View>
  );
}