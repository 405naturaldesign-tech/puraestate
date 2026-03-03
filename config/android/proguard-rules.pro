# ProGuard configuration for PuraEstate

# Keep React Native classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep interface com.facebook.react.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Firebase classes
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-keep interface com.google.firebase.** { *; }
-keep interface com.google.android.gms.** { *; }

# Keep Stripe classes
-keep class com.stripe.** { *; }
-keep interface com.stripe.** { *; }

# Keep custom application classes
-keep class com.pura.estate.** { *; }
-keep interface com.pura.estate.** { *; }

# Keep BuildConfig
-keep class **.BuildConfig { *; }

# Keep R resources
-keepclassmembers class **.R$* {
    public static <fields>;
}

# Keep exposed methods
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider
-keep public class * extends android.app.backup.BackupAgentHelper

# Keep AndroidX classes
-keep class androidx.** { *; }
-keep interface androidx.** { *; }

# Keep JsonSerializer/JsonDeserializer
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep line numbers for crash reporting
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep annotations
-keepattributes *Annotation*
-keepattributes InnerClasses

# Keep Kotlin metadata
-keepattributes RuntimeVisibleAnnotations
-keepattributes RuntimeVisibleParameterAnnotations
-keepattributes RuntimeVisibleTypeAnnotations

# Keep viewmodel lifecycle
-keep class * extends androidx.lifecycle.ViewModel { *; }

# Suppress warnings
-dontwarn com.google.**
-dontwarn com.facebook.**
-dontwarn com.stripe.**
-dontwarn okhttp3.**
-dontwarn retrofit2.**

# Optimization
-optimizationpasses 5
-dontusemixedcaseclassnames

# Remove logging
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
