import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import {
  Image,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './styles';

const WeeklyReportScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { startDate, endDate, totalSpend, maxDay, maxDaySpend } =
    route.params as any;

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
          <Icon
            name="home-outline"
            size={24}
            color="#333"
            style={{ marginLeft: 10 }}
          />
        </View>
      </View>

      <View style={styles.progressRow}>
        {[1, 2, 3, 4, 5].map(i => (
          <View
            key={i}
            style={i === 1 ? styles.progressActive : styles.progressInactive}
          />
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
        Bạn đã chi tiêu{' '}
        <Text style={styles.blue}>{totalSpend.toLocaleString()}đ</Text>. Ngày
        chi mạnh tay nhất là {maxDay} với{' '}
        <Text style={styles.red}>{maxDaySpend.toLocaleString()}đ</Text>
      </Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {days.map(d => (
            <Text key={d.label} style={styles.cardHeaderText}>
              {d.label}
            </Text>
          ))}
        </View>

        <View style={styles.cardDates}>
          {days.map(d => (
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
        <Text style={styles.switchText}>
          Nhận báo cáo tổng quan chi tiêu hàng tuần
        </Text>
        <Switch
          value={true}
          onValueChange={() => {}}
          thumbColor="#fff"
          trackColor={{ true: '#30D158' }}
        />
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


export default WeeklyReportScreen;