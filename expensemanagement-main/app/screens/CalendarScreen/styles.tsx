import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1 },

  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  calendar: {
    borderBottomWidth: 1,
  },

  detailsContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {
      width: 0,
      height: -2,
    },
  },
  detailsCollapsed: {
    flex: 1,
    marginTop: -10,
    paddingTop: 5,
  },
  detailsExpanded: {
    flex: 1,
    marginTop: 0,
    paddingTop: 5,
  },
  expandButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 5,
  },
  detailsHeader: {
    flexDirection: 'column',
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dailyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyStatText: {
    fontSize: 13,
    fontWeight: '500',
  },

  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemNote: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default styles;