import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 15,
  },

  headerContainer: {
    paddingTop: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  bigIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  budgetCard: {
    flexDirection: 'row',
  },
  budgetText: {
    fontSize: 15,
  },
  budgetLink: {
    fontWeight: '600',
  },

  trendCard: {},
  analysisCard: {},

  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  weekNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  navBtn: { padding: 4 },
  dateRangeText: {
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 8,
  },

  analysisText: {
    fontSize: 15,
    lineHeight: 22,
  },
  chartContainer: {
    marginTop: 12,
  },
  chartTabs: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderRadius: 20,
    padding: 4,
  },
  chartTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chartTabActive: {},
  chartTabText: {
    fontSize: 13,
  },
  chartTabTextActive: {
    fontSize: 13,
    fontWeight: '600',
  },
  chartTitleSmall: {
    alignSelf: 'flex-start',
    fontSize: 14,
    marginBottom: 15,
    fontWeight: '600',
  },
  chartPlaceholder: {
    flexDirection: 'row',
    height: 120,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  chartBarWrapper: {
    alignItems: 'center',
  },
  barContainer: {
    height: 100,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: 30,
    height: 100,
    borderRadius: 4,
  },
  chartLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  chartAmountLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  chartSubText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },

  transactionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterActive: {},
  filterText: {
    fontSize: 14,
  },
  filterTextActive: {
    fontSize: 14,
    fontWeight: '600',
  },

  dateHeader: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 8,
    fontWeight: '600',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  iconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'column',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  categoryTag: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
  },
});

export default styles;