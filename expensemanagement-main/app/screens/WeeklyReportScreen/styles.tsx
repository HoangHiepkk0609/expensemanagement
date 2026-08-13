import { StyleSheet } from "react-native";

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
    fontWeight: 'bold',
  },
  red: {
    color: '#FF613A',
    fontWeight: 'bold',
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
    alignItems: 'center',
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
    fontWeight: '700',
  },
  highlightAmount: {
    color: '#FF7A00',
    fontSize: 12,
    marginTop: 2,
  },

  normalDate: {
    fontSize: 16,
    color: '#555',
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
    flex: 1,
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


export default styles;