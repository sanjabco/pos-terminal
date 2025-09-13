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

    // New state variables for additional functions
    const [tashimPercent1, setTashimPercent1] = useState('30');
    const [tashimPercent2, setTashimPercent2] = useState('70');
    const [iban1, setIban1] = useState('IR440600500772409768428001');
    const [iban2, setIban2] = useState('IR540560611828005136987401');
    const [leftTexts, setLeftTexts] = useState(['متن چپ 1', 'متن چپ 2']);
    const [rightTexts, setRightTexts] = useState(['متن راست 1', 'متن راست 2']);
    const [centerTexts, setCenterTexts] = useState(['متن وسط']);

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

    // Helper function to handle array input parsing
    const parseArrayInput = (input: string): string[] => {
        return input.split(',').map(item => item.trim()).filter(item => item.length > 0);
    };

    // Helper function to validate required fields
    const validateRequired = (fields: { [key: string]: string }, fieldNames: string[]): string | null => {
        for (const fieldName of fieldNames) {
            if (!fields[fieldName] || fields[fieldName].trim() === '') {
                return `${fieldName} is required`;
            }
        }
        return null;
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Native Payment Test</Text>
            <Text style={styles.text}>Result: {result}</Text>
            <Text style={styles.text}>Event Result: {eventResult}</Text>

            <Text style={styles.section}>Purchase With ID</Text>
            <TextInput style={styles.input} placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
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
            <TextInput style={styles.input} placeholder="Installment Count" value={installmentCount} onChangeText={setInstallmentCount} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Installment Date" value={installmentDate} onChangeText={setInstallmentDate} />
            <Button title="Asan Kharid" onPress={() => call('asanKharidSend', amount, parseInt(installmentCount), installmentDate, print, showReceipt)} />

            <Text style={styles.section}>Test Medical Asan Kharid</Text>
            <Button title="Test Medical Asan Kharid" onPress={() => call('sendTestAsankharid')} />

            <Text style={styles.section}>Tashim Payment (Predefined)</Text>
            <Button title="Send Tashim" onPress={() => call('sendTashim', amount, id, print, showReceipt)} />

            <Text style={styles.section}>Tashim Payment (Custom)</Text>
            <TextInput style={styles.input} placeholder="Percent 1" value={tashimPercent1} onChangeText={setTashimPercent1} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Percent 2" value={tashimPercent2} onChangeText={setTashimPercent2} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="IBAN 1" value={iban1} onChangeText={setIban1} />
            <TextInput style={styles.input} placeholder="IBAN 2" value={iban2} onChangeText={setIban2} />
            <Button title="Button Tashim" onPress={() => {
                const validation = validateRequired({ amount, id, tashimPercent1, tashimPercent2, iban1, iban2 }, ['amount', 'id', 'tashimPercent1', 'tashimPercent2', 'iban1', 'iban2']);
                if (validation) {
                    setResult(`Error: ${validation}`);
                    return;
                }
                call('buttonTashim', amount, id, parseInt(tashimPercent1), parseInt(tashimPercent2), iban1, iban2, print, showReceipt);
            }} />

            <Text style={styles.section}>Bill Payment</Text>
            <Button title="Send Bill" onPress={() => {
                const validation = validateRequired({ billId, billPaymentId }, ['billId', 'billPaymentId']);
                if (validation) {
                    setResult(`Error: ${validation}`);
                    return;
                }
                call('sendBill', billId, billPaymentId, print, showReceipt);
            }} />

            <Text style={styles.section}>Swipe Card For Hash</Text>
            <Button title="Swipe Card For Hash" onPress={() => call('swipeCardForHash')} />

            <Text style={styles.section}>Custom Receipt Print</Text>
            <TextInput style={styles.input} placeholder="Left Texts (comma separated)" value={leftTexts.join(',')} onChangeText={(text) => setLeftTexts(parseArrayInput(text))} />
            <TextInput style={styles.input} placeholder="Right Texts (comma separated)" value={rightTexts.join(',')} onChangeText={(text) => setRightTexts(parseArrayInput(text))} />
            <TextInput style={styles.input} placeholder="Center Texts (comma separated)" value={centerTexts.join(',')} onChangeText={(text) => setCenterTexts(parseArrayInput(text))} />
            <Button title="Print Custom Receipt" onPress={() => call('printCustomReceipt', leftTexts, rightTexts, centerTexts)} />

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
        color: '#333',
        textAlign: 'center'
    },
    section: {
        marginTop: 20,
        marginBottom: 8,
        fontFamily: 'IRANSansWebFaNum-Bold',
        fontSize: 16,
        color: '#333',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 4
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        marginVertical: 4,
        fontFamily: 'IRANSansWebFaNum',
        fontSize: 14,
        backgroundColor: '#f9f9f9'
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
        justifyContent: 'space-between'
    },
    text: {
        fontFamily: 'IRANSansWebFaNum',
        fontSize: 14,
        color: '#333',
        marginVertical: 2
    }
}); 