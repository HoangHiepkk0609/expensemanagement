import React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import { useTheme } from '../../theme/themeContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { useOverviewLogic } from './hooks/useOverviewLogic';
import styles from './styles';

import CategoryList from './components/CategoryList';
import FamilyToggle from './components/FamilyToggle';
import MonthSelector from './components/MonthSelector';
import OverviewChart from './components/OverviewChart';
import ProfileRight from './components/ProfileRight';
import SummaryHeader from './components/SummaryHeader';

const OverviewScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const logic = useOverviewLogic({ navigation, route });

  if (logic.loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color="#FF69B4" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Quản lý chi tiêu" rightComponent={<ProfileRight />} />

      <MonthSelector
        currentMonth={logic.currentMonth}
        changeMonth={logic.changeMonth}
      />

      <FamilyToggle />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <SummaryHeader
            viewMode={logic.viewMode}
            setViewMode={logic.setViewMode}
            totalExpense={logic.totalExpense}
            totalIncome={logic.totalIncome}
          />

          <OverviewChart
            data={logic.pieChartData}
            chartScale={logic.chartScale}
            selectedIndex={logic.selectedIndex}
            onPressItem={logic.handlePressItem}
            formatCurrency={formatCurrency}
          />
        </View>

        <CategoryList
          groupedTransactions={logic.groupedTransactions}
          categoryListOpacity={logic.categoryListOpacity}
          viewMode={logic.viewMode}
          selectedIndex={logic.selectedIndex}
          pieChartData={logic.pieChartData}
          navigation={navigation}
          formatCurrency={formatCurrency}
          getCategoryStyle={logic.getCategoryStyle}
        />
      </ScrollView>
    </View>
  );
};

export default OverviewScreen;