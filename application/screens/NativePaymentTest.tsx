import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Switch, ScrollView, StyleSheet } from 'react-native';
import { NativeModules, NativeEventEmitter } from 'react-native';
import { useSnackbarContext } from '../providers/SnackbarProvider';

const { PaymentModule, PaymentSepehrModule } = NativeModules;
const paymentEvents = new NativeEventEmitter(PaymentModule);
const paymentSepehrEvents = new NativeEventEmitter(PaymentSepehrModule);

export default function NativePaymentTest() {
    const { showInfo } = useSnackbarContext();
    // State for each input
    const [amount, setAmount] = useState('10000');
    const [id, setId] = useState('12345');
    const [print, setPrint] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [billId, setBillId] = useState('');
    const [billPaymentId, setBillPaymentId] = useState('');
    const [stan, setStan] = useState('');
    const [rrn, setRrn] = useState('');
    const [paymentId, setPaymentId] = useState('');
    const [persianDate, setPersianDate] = useState('');
    const [imagePath, setImagePath] = useState('drawable/factor.jpg');
    const [installmentCount, setInstallmentCount] = useState('2');
    const [installmentDate, setInstallmentDate] = useState('1401-04-15');
    const [apdu, setApdu] = useState('');
    const [result, setResult] = useState('');
    const [eventResult, setEventResult] = useState('');
    const [sepehrResult, setSepehrResult] = useState('');
    const [sepehrEventResult, setSepehrEventResult] = useState('');

    useEffect(() => {
        const sub = paymentEvents.addListener('PaymentResult', (res) => {
            setEventResult(JSON.stringify(res, null, 2));
            showInfo('PaymentResult Event: ' + JSON.stringify(res, null, 2));
        });
        return () => sub.remove();
    }, []);

    useEffect(() => {
        const sub = paymentSepehrEvents.addListener('SepehrPaymentResult', (res) => {
            setSepehrEventResult(JSON.stringify(res, null, 2));
            showInfo('SepehrPaymentResult Event: ' + JSON.stringify(res, null, 2));
        });
        return () => sub.remove();
    }, []);

    const call = async (fn: string, ...args: any[]) => {
        try {
            const res = await PaymentModule[fn](...args);
            setResult(JSON.stringify(res, null, 2));
        } catch (e: any) {
            setResult(e.message || JSON.stringify(e));
        }
    };

    const callSepehr = async (fn: string, ...args: any[]) => {
        try {
            const res = await PaymentSepehrModule[fn](...args);
            setSepehrResult(JSON.stringify(res, null, 2));
        } catch (e: any) {
            setSepehrResult(e.message || JSON.stringify(e));
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Native Payment Test</Text>
            <Text style={styles.text}>Result: {result}</Text>
            <Text style={styles.text}>Event Result: {eventResult}</Text>

            <Text style={styles.section}>Purchase With ID</Text>
            <TextInput style={styles.input} placeholder="Amount" value={amount} onChangeText={setAmount} />
            <TextInput style={styles.input} placeholder="ID" value={id} onChangeText={setId} />
            <View style={styles.row}><Text style={styles.text}>Print</Text><Switch value={print} onValueChange={setPrint} /></View>
            <View style={styles.row}><Text style={styles.text}>Show Receipt</Text><Switch value={showReceipt} onValueChange={setShowReceipt} /></View>
            <Button title="Purchase" onPress={() => call('purchaseWithId', amount, id, print, showReceipt)} />

            <Text style={styles.section}>Bill Inquiry</Text>
            <TextInput style={styles.input} placeholder="Bill ID" value={billId} onChangeText={setBillId} />
            <TextInput style={styles.input} placeholder="Bill Payment ID" value={billPaymentId} onChangeText={setBillPaymentId} />
            <Button title="Bill Inquiry" onPress={() => call('billInquiry', billId, billPaymentId, print, showReceipt)} />

            <Text style={styles.section}>Search By STAN</Text>
            <TextInput style={styles.input} placeholder="STAN" value={stan} onChangeText={setStan} />
            <Button title="Search By STAN" onPress={() => call('searchByStan', stan)} />

            <Text style={styles.section}>Search By RRN</Text>
            <TextInput style={styles.input} placeholder="RRN" value={rrn} onChangeText={setRrn} />
            <Button title="Search By RRN" onPress={() => call('searchByRrn', rrn)} />

            <Text style={styles.section}>Search By Payment ID</Text>
            <TextInput style={styles.input} placeholder="Payment ID" value={paymentId} onChangeText={setPaymentId} />
            <TextInput style={styles.input} placeholder="Persian Date" value={persianDate} onChangeText={setPersianDate} />
            <Button title="Search By Payment ID" onPress={() => call('searchByPaymentId', paymentId, persianDate)} />

            <Text style={styles.section}>Print Actions</Text>
            <Button title="Print Receipt" onPress={() => call('printReceipt')} />
            <Button title="Print Big Bitmap" onPress={() => call('printBigBitmap')} />
            <TextInput style={styles.input} placeholder="Image Path" value={imagePath} onChangeText={setImagePath} />
            <Button title="Print Image Path" onPress={() => call('printImagePath', imagePath)} />

            <Text style={styles.section}>Check Update</Text>
            <Button title="Check Update" onPress={() => call('checkUpdate')} />

            <Text style={styles.section}>Swipe Card</Text>
            <Button title="Swipe Card" onPress={() => call('swipeCard')} />

            <Text style={styles.section}>Send APDU</Text>
            <TextInput style={styles.input} placeholder="APDU" value={apdu} onChangeText={setApdu} />
            <Button title="Send APDU" onPress={() => call('sendApdu', apdu)} />

            <Text style={styles.section}>Asan Kharid</Text>
            <TextInput style={styles.input} placeholder="Installment Count" value={installmentCount} onChangeText={setInstallmentCount} />
            <TextInput style={styles.input} placeholder="Installment Date" value={installmentDate} onChangeText={setInstallmentDate} />
            <Button title="Asan Kharid" onPress={() => call('asanKharidSend', amount, parseInt(installmentCount), installmentDate, print, showReceipt)} />

            <Text style={styles.section}>Test Medical Asan Kharid</Text>
            <Button title="Test Medical Asan Kharid" onPress={() => call('sendTestAsankharid')} />

            <Text style={styles.section}>Sepehr Payment</Text>
            <Button title="Sepehr Payment" onPress={() => callSepehr('purchase', amount, "1")} />
            <Button title="Sepehr Payment" onPress={() => callSepehr('purchase', amount, "2")} />
            <Text style={styles.text}>Sepehr Result: {sepehrResult}</Text>
            <Text style={styles.text}>Sepehr Event Result: {sepehrEventResult}</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: '#fff' },
    header: {
        fontSize: 22,
        fontFamily: 'IRANSansWebFaNum-Bold',
        marginBottom: 12,
        color: '#333'
    },
    section: {
        marginTop: 18,
        fontFamily: 'IRANSansWebFaNum-Bold',
        fontSize: 16,
        color: '#333'
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        marginVertical: 4,
        fontFamily: 'IRANSansWebFaNum',
        fontSize: 14
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4
    },
    text: {
        fontFamily: 'IRANSansWebFaNum',
        fontSize: 14,
        color: '#333'
    }
}); 