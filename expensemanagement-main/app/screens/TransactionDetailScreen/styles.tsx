import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  headerBtn: {
    padding: 8,
    marginLeft: 4,
  },
  headerBackground: {
    height: 140,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 20,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  amountText: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  valueIcon: {
    marginRight: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  noteSection: {
    width: '100%',
    marginTop: 10,
  },
  noteLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  noteBubble: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
});

export default styles;