import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  suggestionBox: {
    padding: 25,
    backgroundColor: '#e6f7ff',
    borderRadius: 16,
    marginBottom: 30,
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#0050b3',
  },
  description: { fontSize: 16, color: '#333', lineHeight: 24 },
  primaryButton: {
    backgroundColor: '#1890ff',
    paddingVertical: 15,
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  secondaryText: { color: '#1890ff', fontSize: 16 },
});

export default styles;