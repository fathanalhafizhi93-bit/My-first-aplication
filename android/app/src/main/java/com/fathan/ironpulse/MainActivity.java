package com.fathan.ironpulse;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        if (FirebaseApp.getApps(this).isEmpty()) {
            FirebaseOptions options = new FirebaseOptions.Builder()
                .setProjectId("gen-lang-client-0024790154")
                .setApplicationId("1:665973010974:web:a2095016d50ca4dfe6b40f")
                .setApiKey("AIzaSyAb1wwO8PK4Gb5We4wE0EdJeRYcTOabEdE")
                .setStorageBucket("gen-lang-client-0024790154.firebasestorage.app")
                .setGcmSenderId("665973010974")
                .build();
            FirebaseApp.initializeApp(this, options);
        }
        super.onCreate(savedInstanceState);
    }
}
