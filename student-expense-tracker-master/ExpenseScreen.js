import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Button,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

export default function ExpenseScreen() {
  const db = useSQLiteContext();

  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState('all');
  const [totalAmount, setTotalAmount] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState({});
  const [editingId, setEditingId] = useState(null);

  function getTodayDateString() {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  }

  function getStartOfWeekString() {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    return start.toISOString().slice(0, 10);
  }

  function getStartOfMonthString() {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return start.toISOString().slice(0, 10);
  }

  function calculateTotals(rows) {
    let overall = 0;
    const byCategory = {};
    rows.forEach((exp) => {
      const amt = Number(exp.amount) || 0;
      overall += amt;
      if (!byCategory[exp.category]) {
        byCategory[exp.category] = 0;
      }
      byCategory[exp.category] += amt;
    });
    setTotalAmount(overall);
    setCategoryTotals(byCategory);
  }

  const loadExpenses = async (selectedFilter = filter) => {
    let query = 'SELECT * FROM expenses ORDER BY id DESC;';
    let params = [];

    if (selectedFilter === 'week') {
      const startOfWeek = getStartOfWeekString();
      query = 'SELECT * FROM expenses WHERE date >= ? ORDER BY id DESC;';
      params = [startOfWeek];
    } else if (selectedFilter === 'month') {
      const startOfMonth = getStartOfMonthString();
      query = 'SELECT * FROM expenses WHERE date >= ? ORDER BY id DESC;';
      params = [startOfMonth];
    }

    const rows = await db.getAllAsync(query, params);
    setExpenses(rows);
    calculateTotals(rows);
  };

  const addExpense = async () => {
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) return;

    const trimmedCategory = category.trim();
    const trimmedNote = note.trim();
    if (!trimmedCategory) return;

    const today = getTodayDateString();

    if (editingId !== null) {
      await db.runAsync(
        'UPDATE expenses SET amount = ?, category = ?, note = ?, date = ? WHERE id = ?;',
        [amountNumber, trimmedCategory, trimmedNote || null, today, editingId]
      );
    } else {
      await db.runAsync(
        'INSERT INTO expenses (amount, category, note, date) VALUES (?, ?, ?, ?);',
        [amountNumber, trimmedCategory, trimmedNote || null, today]
      );
    }

    setAmount('');
    setCategory('');
    setNote('');
    setEditingId(null);
    loadExpenses();
  };

  const deleteExpense = async (id) => {
    await db.runAsync('DELETE FROM expenses WHERE id = ?;', [id]);
    loadExpenses();
  };

  const startEditExpense = (expense) => {
    setEditingId(expense.id);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setNote(expense.note || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setCategory('');
    setNote('');
  };

  const renderExpense = ({ item }) => (
    <View style={styles.expenseRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.expenseAmount}>${Number(item.amount).toFixed(2)}</Text>
        <Text style={styles.expenseCategory}>{item.category}</Text>
        {item.note ? <Text style={styles.expenseNote}>{item.note}</Text> : null}
        {item.date ? <Text style={styles.expenseDate}>{item.date}</Text> : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => startEditExpense(item)}>
          <Text style={styles.edit}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => deleteExpense(item.id)}>
          <Text style={styles.delete}>X</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  useEffect(() => {
    async function setup() {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          note TEXT,
          date TEXT NOT NULL
        );
      `);

      await loadExpenses('all');
    }

    setup();
  }, [db]);

  function getFilterLabel() {
    if (filter === 'week') return 'This Week';
    if (filter === 'month') return 'This Month';
    return 'All';
  }

  const handleFilterChange = (nextFilter) => {
    setFilter(nextFilter);
    loadExpenses(nextFilter);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Student Expense Tracker</Text>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={styles.filterButtonText}>All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'week' && styles.filterButtonActive]}
          onPress={() => handleFilterChange('week')}
        >
          <Text style={styles.filterButtonText}>This Week</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'month' && styles.filterButtonActive]}
          onPress={() => handleFilterChange('month')}
        >
          <Text style={styles.filterButtonText}>This Month</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Amount (e.g. 12.50)"
          placeholderTextColor="#9ca3af"
          value={amount}
          onChangeText={setAmount}
        />

        <TextInput
          style={styles.input}
          placeholder="Category (Food, Books, Rent...)"
          placeholderTextColor="#9ca3af"
          value={category}
          onChangeText={setCategory}
        />

        <TextInput
          style={styles.input}
          placeholder="Note (optional)"
          placeholderTextColor="#9ca3af"
          value={note}
          onChangeText={setNote}
        />

        <Button
          title={editingId !== null ? 'Save Changes' : 'Add Expense'}
          onPress={addExpense}
        />

        {editingId !== null && (
          <View style={{ marginTop: 8 }}>
            <Button title="Cancel Edit" onPress={cancelEdit} />
          </View>
        )}
      </View>

      <View style={styles.totalsSection}>
        <Text style={styles.totalsHeading}>Totals ({getFilterLabel()})</Text>
        <Text style={styles.totalAmountText}>
          Total Spending: ${totalAmount.toFixed(2)}
        </Text>

        {Object.keys(categoryTotals).length > 0 && (
          <View style={{ marginTop: 4 }}>
            {Object.keys(categoryTotals).map((key) => (
              <Text key={key} style={styles.categoryTotalText}>
                {key}: ${categoryTotals[key].toFixed(2)}
              </Text>
            ))}
          </View>
        )}
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderExpense}
        ListEmptyComponent={
          <Text style={styles.empty}>No expenses yet.</Text>
        }
      />

      <Text style={styles.footer}>
        Enter your expenses and they'll be saved locally with SQLite.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#111827' },
  heading: { fontSize: 24, fontWeight: '700', color: '#ffffff', marginBottom: 16 },
  form: { marginBottom: 16, gap: 8 },
  input: {
    padding: 10,
    backgroundColor: '#1f2937',
    color: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 8,
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    alignItems: 'center',
  },
  filterButtonText: { color: '#ffffff', fontSize: 14 },
  filterButtonActive: { backgroundColor: '#fbbf24' },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  expenseAmount: { fontSize: 18, fontWeight: '700', color: '#fbbf24' },
  expenseCategory: { fontSize: 14, color: '#e5e7eb' },
  expenseNote: { fontSize: 12, color: '#9ca3af' },
  expenseDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  edit: { color: '#60a5fa', fontSize: 14, marginRight: 12 },
  delete: { color: '#f87171', fontSize: 20, marginLeft: 12 },
  empty: { color: '#9ca3af', marginTop: 24, textAlign: 'center' },
  footer: { marginTop: 24, color: '#9ca3af', fontSize: 12, textAlign: 'center' },
  totalsSection: {
    backgroundColor: '#111827',
    paddingVertical: 4,
    marginBottom: 8,
  },
  totalsHeading: { color: '#e5e7eb', fontSize: 14, fontWeight: '700' },
  totalAmountText: { color: '#fbbf24', fontSize: 16 },
  categoryTotalText: { color: '#e5e7eb', fontSize: 13 },
});