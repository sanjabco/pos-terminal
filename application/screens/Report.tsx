/**
 * Sales Report Screen
 * Exact replica of the sales report interface
 */

import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import TransactionIcon from '../components/TransactionIcon';
import ArrowRight from '../components/ArrowRight';
import SaleIcon from '../components/SaleIcon';
import CashbackIcon from '../components/CashbackIcon';
import CreditIcon from '../components/CreditIcon';

const { width, height } = Dimensions.get('window');

function Report(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#F76B1C" />

      {/* Header Section with curved bottom */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>گزارش فروش امروز</Text>
          <TouchableOpacity style={styles.backButton}>
            <ArrowRight height={35} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Card 1: Number of Transactions */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>تعداد تراکنش</Text>
              <Text style={styles.cardValue}>۱۴۸</Text>
            </View>
            <View style={styles.cardIcon}>
              <TransactionIcon height={40} />
            </View>
          </View>
        </View>

        {/* Card 2: Total Sales */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>مجموع فروش</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.cardValue}>۱۹.۰۰۰.۰۰۰</Text>
                <Text style={styles.currency}> تومان</Text>
              </View>
            </View>
            <View style={styles.cardIcon}>
              <SaleIcon height={40} />
            </View>
          </View>
        </View>

        {/* Card 3: Total Cashback */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>کش بک کل</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.cardValue}>۹۶.۵۰۰</Text>
                <Text style={styles.currency}> تومان</Text>
              </View>
            </View>
            <View style={styles.cardIcon}>
              <CashbackIcon height={40} />
            </View>
          </View>
        </View>

        {/* Card 4: Credit Used */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>اعتبار استفاده شده</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.cardValue}>۱۰۷۱۸۰۵۰۰</Text>
                <Text style={styles.currency}> تومان</Text>
              </View>
            </View>
            <View style={styles.cardIcon}>
              <CreditIcon height={40} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#F76B1C',
    height: 100,
    position: 'relative',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',


    flex: 1,
  },
  backButton: {
    marginTop: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: 'white',
    fontSize: 24,
    fontFamily: 'IRANSansWebFaNum-Bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    marginTop: -20,
    fontFamily: 'IRANSansWebFaNum-Bold',
    textAlign: 'center',

  },
  curveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    overflow: 'hidden',
  },
  curve: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    right: -20,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#EFF2F3',
    marginTop: -30,
    marginHorizontal: 0,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 40,
    paddingHorizontal: 25,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 15,

  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  cardText: {
    flex: 1,
    alignItems: 'flex-end', // RTL alignment
  },
  cardTitle: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'IRANSansWebFaNum',
    marginBottom: 8,
    textAlign: 'right',
  },
  cardValue: {
    fontSize: 24,
    color: '#000',
    fontFamily: 'IRANSansWebFaNum-Bold',
    textAlign: 'right',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  currency: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'IRANSansWebFaNum',
    marginLeft: 8,
  },
  cardIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
  },
  iconText: {
    fontSize: 24,
  },
});

export default Report;
