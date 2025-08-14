package com.sanjabpos;

import androidx.annotation.NonNull;
import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.content.Intent;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.ArrayList;

import ir.ikccc.externalpayment.CheckUpdateReqest;
import ir.ikccc.externalpayment.Installment;
import ir.ikccc.externalpayment.PrinterRequest;
import ir.ikccc.externalpayment.SearchRequest;
import ir.ikccc.externalpayment.SwipeCardRequest;
import ir.ikccc.externalpayment.TransactionRequest;
import ir.ikccc.externalpayment.TransactionType;
import net.netafarin.receipt_module.PrintableLine;
import net.netafarin.receipt_module.PrintableReceiptBuilder;

public class PaymentModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    public PaymentModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(this);
    }

    @NonNull
    @Override
    public String getName() {
        return "PaymentModule";
    }

    @ReactMethod
    public void purchaseWithId(String amount, String id, boolean print, boolean showReceipt, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        TransactionRequest transactionRequest = new TransactionRequest(activity);
        transactionRequest.setRequestType(TransactionType.PURCHASE_WITH_ID.getTransactionType());
        transactionRequest.setAmount(amount);
        transactionRequest.setPrint(print);
        transactionRequest.setShowReceipt(showReceipt);
        transactionRequest.setId(id);
        boolean sent = transactionRequest.send();
        WritableMap result = Arguments.createMap();
        result.putBoolean("success", sent);
        result.putString("message", sent ? "ارسال موفق" : "خطا در ارسال");
        promise.resolve(result);
    }

    @ReactMethod
    public void billInquiry(String billId, String billPaymentId, boolean print, boolean showReceipt, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        TransactionRequest transactionRequest = new TransactionRequest(activity);
        transactionRequest.setRequestType(TransactionType.BILL_INQUIRY.getTransactionType());
        transactionRequest.setBillId(billId);
        transactionRequest.setBillPaymentId(billPaymentId);
        transactionRequest.setPrint(print);
        transactionRequest.setShowReceipt(showReceipt);
        boolean sent = transactionRequest.send();
        WritableMap result = Arguments.createMap();
        result.putBoolean("success", sent);
        result.putString("message", sent ? "ارسال موفق" : "خطا در ارسال");
        promise.resolve(result);
    }

    @ReactMethod
    public void searchByStan(String stan, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        SearchRequest searchRequest = new SearchRequest(activity, SearchRequest.SearchType.SEARCH_BY_STAN);
        searchRequest.setStan(stan);
        boolean sent = searchRequest.send();
        WritableMap result = Arguments.createMap();
        result.putBoolean("success", sent);
        result.putString("message", sent ? "ارسال موفق" : "خطا در ارسال");
        promise.resolve(result);
    }

    @ReactMethod
    public void searchByRrn(String rrn, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        SearchRequest searchRequest = new SearchRequest(activity, SearchRequest.SearchType.SEARCH_BY_RRN);
        searchRequest.setRrn(rrn);
        boolean sent = searchRequest.send();
        WritableMap result = Arguments.createMap();
        result.putBoolean("success", sent);
        result.putString("message", sent ? "ارسال موفق" : "خطا در ارسال");
        promise.resolve(result);
    }

    @ReactMethod
    public void searchByPaymentId(String paymentId, String persianDate, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        SearchRequest searchRequest = new SearchRequest(activity, SearchRequest.SearchType.SEARCH_BY_PAYMENT_ID);
        searchRequest.setPaymentId(paymentId);
        searchRequest.setPersianDate(persianDate);
        boolean sent = searchRequest.send();
        WritableMap result = Arguments.createMap();
        result.putBoolean("success", sent);
        result.putString("message", sent ? "ارسال موفق" : "خطا در ارسال");
        promise.resolve(result);
    }

    @ReactMethod
    public void printReceipt(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        ArrayList<PrintableLine> printableLines = new ArrayList<>();
        printableLines.add(new PrintableLine("right", "1-left"));
        printableLines.add(new PrintableLine("right", "2-left"));
        printableLines.add(new PrintableLine("right", "3-left"));
        printableLines.add(new PrintableLine("right", "4-left"));
        printableLines.add(new PrintableLine("5-center", ""));
        printableLines.add(new PrintableLine("", "6-center"));
        printableLines.add(new PrintableLine("right", "7-left"));
        PrintableReceiptBuilder receiptBuilder = new PrintableReceiptBuilder(activity,
                printableLines, PrintableReceiptBuilder.PrinterSize.TWO_INCH, 22, false,
                false, "header bitmap.bmp", "footer bitmap.bmp", "footer message");
        PrinterRequest printerRequest = new PrinterRequest(activity);
        boolean sent = printerRequest.send(receiptBuilder.getReceipt(10,0));
        WritableMap result = Arguments.createMap();
        result.putBoolean("success", sent);
        result.putString("message", sent ? "ارسال موفق" : "خطا در ارسال");
        promise.resolve(result);
    }

    @ReactMethod
    public void printBigBitmap(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        // NOTE: This assumes R.drawable.factor exists. You may need to adjust resource access.
        Bitmap largeIcon = BitmapFactory.decodeResource(activity.getResources(), activity.getResources().getIdentifier("factor", "drawable", activity.getPackageName()));
        PrinterRequest printerRequest = new PrinterRequest(activity);
        boolean sent = printerRequest.sendBigBitmap(largeIcon);
        WritableMap result = Arguments.createMap();
        result.putBoolean("success", sent);
        result.putString("message", sent ? "ذخیره و ارسال موفق" : "خطا در ذخیره یا ارسال");
        promise.resolve(result);
    }

    @ReactMethod
    public void printImagePath(String imagePath, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        PrinterRequest printerRequest = new PrinterRequest(activity);
        boolean sent = printerRequest.sendImagePath(imagePath);
        WritableMap result = Arguments.createMap();
        result.putBoolean("success", sent);
        result.putString("message", sent ? "ارسال موفق" : "خطا در ارسال");
        promise.resolve(result);
    }

    @ReactMethod
    public void checkUpdate(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        CheckUpdateReqest checkUpdateReqest = new CheckUpdateReqest(activity);
        boolean sent = checkUpdateReqest.send();
        WritableMap result = Arguments.createMap();
        result.putBoolean("success", sent);
        result.putString("message", sent ? "ارسال موفق" : "خطا در ارسال");
        promise.resolve(result);
    }

    @ReactMethod
    public void swipeCard(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        SwipeCardRequest swipeCardReqest = new SwipeCardRequest(activity);
        boolean sent = swipeCardReqest.send();
        WritableMap result = Arguments.createMap();
        result.putBoolean("success", sent);
        result.putString("message", sent ? "ارسال موفق" : "خطا در ارسال");
        promise.resolve(result);
    }

    @ReactMethod
    public void sendApdu(String apdu, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        TransactionRequest transactionRequest = new TransactionRequest(activity);
        transactionRequest.setRequestType(TransactionType.ICCRead.getTransactionType());
        transactionRequest.setSendRequestCommand(apdu);
        boolean sent = transactionRequest.send();
        WritableMap result = Arguments.createMap();
        result.putBoolean("success", sent);
        result.putString("message", sent ? "ارسال موفق" : "خطا در ارسال");
        promise.resolve(result);
    }

    @ReactMethod
    public void asanKharidSend(String amount, int installmentCount, String installmentDate, boolean print, boolean showReceipt, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        TransactionRequest transactionRequest = new TransactionRequest(activity);
        transactionRequest.setRequestType(TransactionType.EASY_PURCHASE.getTransactionType());
        transactionRequest.setAmount(amount);
        transactionRequest.setPrint(print);
        transactionRequest.setShowReceipt(showReceipt);
        transactionRequest.setInstallmentCount(installmentCount);
        transactionRequest.setInstallmentDate(installmentDate);
        boolean sent = transactionRequest.send();
        WritableMap result = Arguments.createMap();
        result.putBoolean("success", sent);
        result.putString("message", sent ? "ارسال موفق" : "خطا در ارسال");
        promise.resolve(result);
    }

    @ReactMethod
    public void sendTestAsankharid(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        ArrayList<Installment> installments = new ArrayList<>();
        Installment e = new Installment();
        e.setAmount("5000");
        e.setDate("14010415");
        installments.add(e);
        TransactionRequest transactionRequest = new TransactionRequest(activity);
        transactionRequest.setRequestType(TransactionType.MEDICAL_EASY_PURCHASE.getTransactionType());
        transactionRequest.setPrint(false);
        transactionRequest.setShowReceipt(false);
        transactionRequest.setId("20000");
        transactionRequest.setInstallments(installments);
        boolean sent = transactionRequest.send();
        WritableMap result = Arguments.createMap();
        result.putBoolean("success", sent);
        result.putString("message", sent ? "ارسال موفق" : "خطا در ارسال");
        promise.resolve(result);
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        if (data == null) return;
        WritableMap result = Arguments.createMap();
        result.putInt("requestCode", requestCode);
        result.putInt("resultCode", resultCode);
        // Example: parse some common fields (expand as needed)
        if (data.hasExtra("paymentAmount")) result.putString("paymentAmount", data.getStringExtra("paymentAmount"));
        if (data.hasExtra("paymentId")) result.putString("paymentId", data.getStringExtra("paymentId"));
        if (data.hasExtra("message")) result.putString("message", data.getStringExtra("message"));
        if (data.hasExtra("cardNumber")) result.putString("cardNumber", data.getStringExtra("cardNumber"));
        if (data.hasExtra("cardBank")) result.putString("cardBank", data.getStringExtra("cardBank"));
        if (data.hasExtra("referenceCode")) result.putString("referenceCode", data.getStringExtra("referenceCode"));
        if (data.hasExtra("dateTime")) result.putString("dateTime", data.getStringExtra("dateTime"));
        if (data.hasExtra("merchantID")) result.putString("merchantID", data.getStringExtra("merchantID"));
        if (data.hasExtra("terminalID")) result.putString("terminalID", data.getStringExtra("terminalID"));
        if (data.hasExtra("stan")) result.putString("stan", data.getStringExtra("stan"));
        if (data.hasExtra("txResponseCode")) result.putString("txResponseCode", data.getStringExtra("txResponseCode"));
        if (data.hasExtra("txResponseTitle")) result.putString("txResponseTitle", data.getStringExtra("txResponseTitle"));
        if (data.hasExtra("phoneNumber")) result.putString("phoneNumber", data.getStringExtra("phoneNumber"));
        if (data.hasExtra("serial")) result.putString("serial", data.getStringExtra("serial"));
        if (data.hasExtra("merchantName")) result.putString("merchantName", data.getStringExtra("merchantName"));
        // Add more fields as needed
        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit("PaymentResult", result);
    }

    @Override
    public void onNewIntent(Intent intent) {
        // Not needed
    }
} 