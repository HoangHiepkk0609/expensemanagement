import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subHeader: { fontSize: 16, color: '#666', marginBottom: 30 },
  card: {
    flexDirection: 'row',
    padding: 20,
    marginBottom: 15,
    backgroundColor: '#f0f4f8',
    borderRadius: 12,
    alignItems: 'center',
  },
  icon: { fontSize: 30, marginRight: 15 },
  label: { fontSize: 18, fontWeight: '500' },
  skipText: { textAlign: 'center', color: '#999', marginTop: 20, fontSize: 16 },
});


export default styles;