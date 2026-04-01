package com.titanartstudio.pdftool;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // 🔥 Hardware acceleration ON
    getWindow().setFlags(
      WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
      WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
    );

    // 🔥 Touch fix (important)
    getWindow().getDecorView().setOnTouchListener((v, event) -> false);
  }
}