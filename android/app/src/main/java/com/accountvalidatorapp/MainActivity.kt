package com.accountvalidatorapp

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.zoontek.rnbootsplash.RNBootSplash

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    RNBootSplash.init(this, R.style.BootsplashTheme) // ✅ FIXED: Added themeResId
    super.onCreate(savedInstanceState)
  }

  override fun getMainComponentName(): String = "AccountValidatorApp"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
