package com.sanjabpos

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.otaupdater.OTARestartHelper
import com.otaupdater.OTAUpdaterStorage

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> =
        PackageList(this).packages.apply {
          add(PaymentPackage())
          add(PaymentSepehrPackage())
        }

      override fun getJSMainModuleName(): String = "index"

      override fun getJSBundleFile(): String? {
        if (BuildConfig.DEBUG) return null
        return OTAUpdaterStorage.getBundlePath(applicationContext)
      }

      override fun getUseDeveloperSupport(): Boolean =
        BuildConfig.DEBUG &&
          OTAUpdaterStorage.getBundlePath(applicationContext) == null

      override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()

    // Required for OTA process restart — do not remove
    if (OTARestartHelper.isRestartProcess(this)) {
      return
    }

    SoLoader.init(this, false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }
  }
}
