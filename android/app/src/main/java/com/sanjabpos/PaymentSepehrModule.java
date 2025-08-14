package com.sanjabpos;

import androidx.annotation.NonNull;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import java.util.ArrayList;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class PaymentSepehrModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static final int PAYMENT_REQUEST_CODE = 123;
    
    public PaymentSepehrModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(this);
    }

    @NonNull
    @Override
    public String getName() {
        return "PaymentSepehrModule";
    }

    @ReactMethod
    public void purchase(String amount,String type, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        
        try {
            if(type.equals("1")){
            Intent intent = new Intent("com.dml.sima7.sepehr.activity.Intent_SwipeCardActivity");
            intent.putExtra("amount", amount);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            
            activity.startActivityForResult(intent, PAYMENT_REQUEST_CODE); 
            }
            else if(type.equals("2")){
                try{
                Intent intent = new Intent("tashim");
                ArrayList tashim = new ArrayList<String>();
                tashim.add("IR840780101310838000084046:10000");
                tashim.add("IR540560611828005136987401:10000");
                intent.putExtra("amount", "20000");
                intent.putStringArrayListExtra("tashim", tashim);
                intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                activity.startActivityForResult(intent, 123);
                }
                catch(Exception e){
                    WritableMap result = Arguments.createMap();
                    result.putBoolean("success", false);
                    result.putString("message", "Error launching Sepehr payment: " + e.getMessage());
                    promise.resolve(result);
                }
            }
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            result.putString("message", "ارسال موفق");
            promise.resolve(result);

        } catch (ActivityNotFoundException ex) {
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", false);
            result.putString("message", "Sepehr payment app not found: " + ex.getMessage());
            promise.resolve(result);
        } catch (Exception e) {
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", false);
            result.putString("message", "Error launching Sepehr payment: " + e.getMessage());
            promise.resolve(result);
        }
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        //if (data == null) return;
        
        WritableMap result = Arguments.createMap();
        result.putInt("requestCode", requestCode);
        result.putInt("resultCode", resultCode);
        
        // Handle Sepehr-specific data fields
        if(resultCode == -1){
        if (data.hasExtra("amount")) result.putString("amount", data.getStringExtra("amount"));
        if (data.hasExtra("refrenceCode")) result.putString("referenceCode", data.getStringExtra("refrenceCode"));
        if (data.hasExtra("resultCode")) result.putString("resultCode2", data.getStringExtra("resultCode"));
        if (data.hasExtra("resultDescription")) result.putString("resultDescription", data.getStringExtra("resultDescription"));
        if (data.hasExtra("terminalNo")) result.putString("terminalNo", data.getStringExtra("terminalNo"));
        if (data.hasExtra("acceptorCode")) result.putString("acceptorCode", data.getStringExtra("acceptorCode"));
        if (data.hasExtra("traceNo")) result.putString("traceNo", data.getStringExtra("traceNo"));
        if (data.hasExtra("maskedPan")) result.putString("maskedPan", data.getStringExtra("maskedPan"));
        if (data.hasExtra("DateTime")) result.putString("DateTime", data.getStringExtra("DateTime"));
        }
        /* if (data.hasExtra("cardNumber")) result.putString("cardNumber", data.getStringExtra("cardNumber"));
        if (data.hasExtra("cardBank")) result.putString("cardBank", data.getStringExtra("cardBank"));
        if (data.hasExtra("dateTime")) result.putString("dateTime", data.getStringExtra("dateTime"));
        if (data.hasExtra("merchantID")) result.putString("merchantID", data.getStringExtra("merchantID"));
        if (data.hasExtra("terminalID")) result.putString("terminalID", data.getStringExtra("terminalID"));
        if (data.hasExtra("stan")) result.putString("stan", data.getStringExtra("stan"));
        if (data.hasExtra("txResponseCode")) result.putString("txResponseCode", data.getStringExtra("txResponseCode"));
        if (data.hasExtra("txResponseTitle")) result.putString("txResponseTitle", data.getStringExtra("txResponseTitle"));
        if (data.hasExtra("phoneNumber")) result.putString("phoneNumber", data.getStringExtra("phoneNumber"));
        if (data.hasExtra("serial")) result.putString("serial", data.getStringExtra("serial"));
        if (data.hasExtra("merchantName")) result.putString("merchantName", data.getStringExtra("merchantName"));
        if (data.hasExtra("message")) result.putString("message", data.getStringExtra("message")); */
        
        // Add success flag based on result code
        //boolean success = (resultCode == 00); // Assuming 0 means success for Sepehr
        //result.putBoolean("success", success);
        
        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit("SepehrPaymentResult", result);
    }

    @Override
    public void onNewIntent(Intent intent) {
        // Not needed for Sepehr payment
    }
} 