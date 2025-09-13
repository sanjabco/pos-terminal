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
import ir.ikccc.externalpayment.SwipeCardForRequestHashedPan;
import ir.ikccc.externalpayment.TashimAccount;
import ir.ikccc.externalpayment.TransactionRequest;
import ir.ikccc.externalpayment.TransactionType;
import net.netafarin.receipt_module.PrintableLine;
import net.netafarin.receipt_module.PrintableReceiptBuilder;

import static ir.ikccc.externalpayment.Library.ASAN_KHARID_REQUEST_CODE;
import static ir.ikccc.externalpayment.Library.BILL_REQUEST_CODE;
import static ir.ikccc.externalpayment.Library.CHECK_UPDATE_REQUEST_CODE;
import static ir.ikccc.externalpayment.Library.ICC_REQUEST_CODE;
import static ir.ikccc.externalpayment.Library.MEDICAL_ASAN_KHARID_REQUEST_CODE;
import static ir.ikccc.externalpayment.Library.PRINT_BIG_BITMAP_REQUEST_CODE;
import static ir.ikccc.externalpayment.Library.PRINT_REQUEST_CODE;
import static ir.ikccc.externalpayment.Library.PURCHASE_REQUEST_CODE;
import static ir.ikccc.externalpayment.Library.SEARCH_REQUEST_CODE;
import static ir.ikccc.externalpayment.Library.SWIPE_CARD_FORPAN_REQUEST_CODE;
import static ir.ikccc.externalpayment.Library.SWIPE_CARD_REQUEST_CODE;
import static ir.ikccc.externalpayment.Library.TASHIM_REQUEST_CODE;

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
        if (amount == null || amount.isEmpty() || id == null || id.isEmpty()) {
            promise.reject("INVALID_INPUT", "مبلغ و شناسه نباید خالی باشند");
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
        if (stan == null || stan.isEmpty()) {
            promise.reject("INVALID_INPUT", "شماره پیگیری نباید خالی باشد");
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
        if (rrn == null || rrn.isEmpty()) {
            promise.reject("INVALID_INPUT", "شماره مرجع نباید خالی باشد");
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
        if (paymentId == null || paymentId.isEmpty()) {
            promise.reject("INVALID_INPUT", "شناسه نباید خالی باشد");
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
        boolean sent = printerRequest.send(receiptBuilder.getReceipt(10,1));
        WritableMap result = Arguments.createMap();
        result.putBoolean("success", sent);
        result.putString("message", sent ? "ارسال موفق" : "خطا در ارسال");
        promise.resolve(result);
    }

    @ReactMethod
    public void printCustomReceipt(String[] leftTexts, String[] rightTexts, String[] centerTexts, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        ArrayList<PrintableLine> printableLines = new ArrayList<>();
        
        // Add left and right aligned lines
        if (leftTexts != null && rightTexts != null) {
            int maxLines = Math.max(leftTexts.length, rightTexts.length);
            for (int i = 0; i < maxLines; i++) {
                String leftText = i < leftTexts.length ? leftTexts[i] : "";
                String rightText = i < rightTexts.length ? rightTexts[i] : "";
                printableLines.add(new PrintableLine(rightText, leftText));
            }
        }
        
        // Add center aligned lines
        if (centerTexts != null) {
            for (String centerText : centerTexts) {
                printableLines.add(new PrintableLine(centerText, ""));
            }
        }
        
        PrintableReceiptBuilder receiptBuilder = new PrintableReceiptBuilder(activity,
                printableLines, PrintableReceiptBuilder.PrinterSize.TWO_INCH, 22, false,
                false, "header bitmap.bmp", "footer bitmap.bmp", "footer message");
        PrinterRequest printerRequest = new PrinterRequest(activity);
        boolean sent = printerRequest.send(receiptBuilder.getReceipt(10, 1));
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
        if (apdu == null || apdu.isEmpty()) {
            promise.reject("INVALID_INPUT", "کد APDU نباید خالی باشد");
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
        if (amount == null || amount.isEmpty() || installmentDate == null || installmentDate.isEmpty() || installmentDate.length() != 10) {
            promise.reject("INVALID_INPUT", "اطلاعات نادرست");
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

    @ReactMethod
    public void sendTashim(String amount, String id, boolean print, boolean showReceipt, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        if (amount == null || amount.isEmpty() || id == null || id.isEmpty()) {
            promise.reject("INVALID_INPUT", "مبلغ و شناسه نباید خالی باشند");
            return;
        }
        ArrayList<TashimAccount> tashimAccountArrayList = new ArrayList<>();
        tashimAccountArrayList.add(new TashimAccount("IR170180000000000306824171", 30));
        tashimAccountArrayList.add(new TashimAccount("IR740190000000100663926004", 70));
        TransactionRequest transactionRequest = new TransactionRequest(activity);
        transactionRequest.setRequestType(TransactionType.TASHIM.getTransactionType());
        transactionRequest.setAmount(amount);
        transactionRequest.setTashimAccounts(tashimAccountArrayList);
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
    public void buttonTashim(String amount, String id, int percent1, int percent2, String iban1, String iban2, boolean print, boolean showReceipt, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        if (amount == null || amount.isEmpty() || id == null || id.isEmpty()) {
            promise.reject("INVALID_INPUT", "مبلغ و شناسه نباید خالی باشند");
            return;
        }
        if (percent1 < 0 || percent2 < 0) {
            promise.reject("INVALID_INPUT", "درصد نادرست است");
            return;
        }
        TransactionRequest transactionRequest = new TransactionRequest(activity);
        transactionRequest.setRequestType(TransactionType.TASHIM.getTransactionType());
        ArrayList<TashimAccount> accounts = new ArrayList<>();
        
        // Only add tashim accounts if they have valid IBANs and percentages > 0
        if (percent1 > 0 && iban1 != null && !iban1.trim().isEmpty()) {
            TashimAccount tashim1 = new TashimAccount(iban1, percent1);
            accounts.add(tashim1);
        }
        
        if (percent2 > 0 && iban2 != null && !iban2.trim().isEmpty()) {
            TashimAccount tashim2 = new TashimAccount(iban2, percent2);
            accounts.add(tashim2);
        }
        
        // Check if we have at least one valid account
        if (accounts.isEmpty()) {
            promise.reject("INVALID_INPUT", "حداقل یک حساب شبا معتبر مورد نیاز است");
            return;
        }
        
        transactionRequest.setTashimAccounts(accounts);
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
    public void sendBill(String billId, String billPaymentId, boolean print, boolean showReceipt, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        if (billId == null || billId.isEmpty() || billPaymentId == null || billPaymentId.isEmpty()) {
            promise.reject("INVALID_INPUT", "شناسه قبض و شناسه پرداخت نباید خالی باشند");
            return;
        }
        TransactionRequest transactionRequest = new TransactionRequest(activity);
        transactionRequest.setRequestType(TransactionType.BILL_PAYMENT.getTransactionType());
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
    public void swipeCardForHash(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        SwipeCardForRequestHashedPan swipeCardForRequestHashedPan = new SwipeCardForRequestHashedPan(activity);
        boolean sent = swipeCardForRequestHashedPan.send();
        WritableMap result = Arguments.createMap();
        result.putBoolean("success", sent);
        result.putString("message", sent ? "ارسال موفق" : "خطا در ارسال");
        promise.resolve(result);
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        if (data == null) {
            WritableMap errorResult = Arguments.createMap();
            errorResult.putInt("requestCode", requestCode);
            errorResult.putInt("resultCode", resultCode);
            errorResult.putString("error", "Intent data is null");
            getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("PaymentResult", errorResult);
            return;
        }

        WritableMap result = Arguments.createMap();
        result.putInt("requestCode", requestCode);
        result.putInt("resultCode", resultCode);

        // Handle different request codes with specific response parsing
        if (requestCode == ICC_REQUEST_CODE) {
            String iccresponse = data.getStringExtra("iccresponse");
            if (iccresponse != null) {
                result.putString("iccresponse", iccresponse);
            } else {
                int iccerror = data.getIntExtra("errorcode", 2);
                String errorMessage;
                switch (iccerror) {
                    case 4:
                    case 2:
                        errorMessage = "خطای نامشخص";
                        break;
                    case 5:
                        errorMessage = "خطا در برقراری ارتباط با کارت";
                        break;
                    case 3:
                        errorMessage = "کد درخواست اشتباه است";
                        break;
                    default:
                        errorMessage = "خطای نامشخص";
                        break;
                }
                result.putInt("errorcode", iccerror);
                result.putString("errorMessage", errorMessage);
            }
        } else if (requestCode == PURCHASE_REQUEST_CODE || requestCode == TASHIM_REQUEST_CODE) {
            // Common fields for purchase and tashim transactions
            addCommonTransactionFields(result, data);
        } else if (requestCode == ASAN_KHARID_REQUEST_CODE) {
            addCommonTransactionFields(result, data);
            if (data.hasExtra("installmentCount")) result.putString("installmentCount", data.getStringExtra("installmentCount"));
            if (data.hasExtra("installmentDate")) result.putString("installmentDate", data.getStringExtra("installmentDate"));
        } else if (requestCode == MEDICAL_ASAN_KHARID_REQUEST_CODE) {
            addCommonTransactionFields(result, data);
        } else if (requestCode == BILL_REQUEST_CODE) {
            addCommonTransactionFields(result, data);
            if (data.hasExtra("billId")) result.putString("billId", data.getStringExtra("billId"));
            if (data.hasExtra("billPaymentId")) result.putString("billPaymentId", data.getStringExtra("billPaymentId"));
        } else if (requestCode == PRINT_REQUEST_CODE || requestCode == PRINT_BIG_BITMAP_REQUEST_CODE) {
            if (data.hasExtra("message")) result.putString("message", data.getStringExtra("message"));
        } else if (requestCode == SEARCH_REQUEST_CODE) {
            addCommonTransactionFields(result, data);
        } else if (requestCode == CHECK_UPDATE_REQUEST_CODE) {
            if (data.hasExtra("message")) result.putString("message", data.getStringExtra("message"));
            if (data.hasExtra("currentVersion")) result.putString("currentVersion", data.getStringExtra("currentVersion"));
            if (data.hasExtra("lastVersion")) result.putString("lastVersion", data.getStringExtra("lastVersion"));
            if (data.hasExtra("phoneNumber")) result.putString("phoneNumber", data.getStringExtra("phoneNumber"));
            if (data.hasExtra("serial")) result.putString("serial", data.getStringExtra("serial"));
            if (data.hasExtra("merchantName")) result.putString("merchantName", data.getStringExtra("merchantName"));
        } else if (requestCode == SWIPE_CARD_REQUEST_CODE) {
            if (data.hasExtra("message")) result.putString("message", data.getStringExtra("message"));
            if (data.hasExtra("cardNumber")) result.putString("cardNumber", data.getStringExtra("cardNumber"));
        } else if (requestCode == SWIPE_CARD_FORPAN_REQUEST_CODE) {
            if (data.hasExtra("message")) result.putString("message", data.getStringExtra("message"));
            if (data.hasExtra("cardNumber")) result.putString("cardNumber", data.getStringExtra("cardNumber"));
            if (data.hasExtra("merchantID")) result.putString("merchantID", data.getStringExtra("merchantID"));
            if (data.hasExtra("terminalID")) result.putString("terminalID", data.getStringExtra("terminalID"));
            if (data.hasExtra("merchantName")) result.putString("merchantName", data.getStringExtra("merchantName"));
            if (data.hasExtra("serial")) result.putString("serial", data.getStringExtra("serial"));
        }

        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit("PaymentResult", result);
    }

    private void addCommonTransactionFields(WritableMap result, Intent data) {
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
    }

    @Override
    public void onNewIntent(Intent intent) {
        // Not needed
    }
} 