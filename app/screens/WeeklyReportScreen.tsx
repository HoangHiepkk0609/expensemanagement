import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation } from '@react-navigation/native';

const WeeklyReportScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { startDate, endDate, totalSpend, maxDay, maxDaySpend } = route.params as any;

  const days = [
    { label: 'T2', date: '17', amount: 90000, highlight: true },
    { label: 'T3', date: '18' },
    { label: 'T4', date: '19' },
    { label: 'T5', date: '20' },
    { label: 'T6', date: '21' },
    { label: 'T7', date: '22' },
    { label: 'CN', date: '23' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={26} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Báo cáo tuần {startDate} - {endDate}
        </Text>

        <View style={styles.headerRight}>
          <Icon name="chat-processing-outline" size={22} color="#333" />
          <Icon name="home-outline" size={24} color="#333" style={{ marginLeft: 10 }} />
        </View>
      </View>

      <View style={styles.progressRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={i === 1 ? styles.progressActive : styles.progressInactive} />
        ))}
      </View>

      <View style={{ alignItems: 'center', marginTop: 18 }}>
        <Image
          source={{
            uri: 'https://cdn-icons-png.flaticon.com/512/3194/3194581.png',
          }}
          style={{ width: 80, height: 80 }}
        />
      </View>

      <Text style={styles.summaryText}>
        Bạn đã chi tiêu <Text style={styles.blue}>{totalSpend.toLocaleString()}đ</Text>. Ngày chi mạnh tay nhất
        là {maxDay} với <Text style={styles.red}>{maxDaySpend.toLocaleString()}đ</Text>
      </Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {days.map((d) => (
            <Text key={d.label} style={styles.cardHeaderText}>{d.label}</Text>
          ))}
        </View>

        <View style={styles.cardDates}>
          {days.map((d) => (
            <View key={d.date} style={styles.dateItem}>
              {d.highlight ? (
                <View style={styles.highlightBox}>
                  <Text style={styles.highlightDay}>{d.date}</Text>
                  <Text style={styles.highlightAmount}>90K</Text>
                </View>
              ) : (
                <Text style={styles.normalDate}>{d.date}</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Nhận báo cáo tổng quan chi tiêu hàng tuần</Text>
        <Switch value={true} onValueChange={() => {}} thumbColor="#fff" trackColor={{ true: "#30D158" }} />
      </View>

      <Image
        source={{
          uri: 'https://cdn-icons-png.flaticon.com/512/9111/9111962.png',
        }}
        style={styles.bottomImage}
      />
    </View>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFEFF5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
    backgroundColor: '#FFD9E8',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: { flexDirection: 'row' },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  progressActive: {
    flex: 1,
    height: 4,
    backgroundColor: '#E91E63',
    marginHorizontal: 4,
    borderRadius: 10,
  },
  progressInactive: {
    flex: 1,
    height: 4,
    backgroundColor: '#F6AFC3',
    marginHorizontal: 4,
    borderRadius: 10,
  },
  summaryText: {
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  blue: { 
    color: '#0099FF', 
    fontWeight: 'bold' 
  },
  red: { 
    color: '#FF613A', 
    fontWeight: 'bold' 
  },

  card: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 14,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardHeaderText: {
    fontWeight: '600',
    color: '#666',
  },

  cardDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  dateItem: { 
    width: 40, 
    alignItems: 'center'
   },

  highlightBox: {
    backgroundColor: '#FFF4E8',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  highlightDay: { 
    color: '#FF7A00', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  highlightAmount: { 
    color: '#FF7A00', 
    fontSize: 12, 
    marginTop: 2 
  },

  normalDate: { 
    fontSize: 16, 
    color: '#555' 
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 14,
    alignItems: 'center',
  },
  switchText: { 
    fontSize: 14,
    color: '#666', 
    flex: 1 
  },

  bottomImage: {
    width: '90%',
    height: 180,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: 20,
    opacity: 0.9,
  },
});

export default WeeklyReportScreen;