apply plugin: "com.android.application"
apply plugin: "com.google.gms.google-services"
apply plugin: "com.google.firebase.crashlytics"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "expo"

def appPackageName = "com.pura.estate"

android {
    namespace = appPackageName
    compileSdk = 34

    defaultConfig {
        applicationId = appPackageName
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        manifestPlaceholders = [
            "PACKAGE_NAME": appPackageName
        ]

        vectorDrawables.useSupportLibrary = true
    }

    buildFeatures {
        buildConfig = true
        viewBinding = true
        dataBinding = true
    }

    buildTypes {
        debug {
            debuggable = true
            minifyEnabled = false
            proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
        }

        release {
            debuggable = false
            minifyEnabled = true
            shrinkResources = true
            proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"

            signingConfig = signingConfigs.getByName("release")

            ndk {
                debugSymbolLevel "full"
            }
        }
    }

    flavorDimensions = ["environment"]

    productFlavors {
        production {
            dimension = "environment"
            applicationIdSuffix = ""
        }

        staging {
            dimension = "environment"
            applicationIdSuffix = ".staging"
            versionNameSuffix = "-staging"
        }

        development {
            dimension = "environment"
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
            debuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = "11"
        freeCompilerArgs += [
            "-Xopt-in=kotlin.RequiresOptIn",
        ]
    }

    packagingOptions {
        resources {
            excludes += [
                "META-INF/DEPENDENCIES",
                "META-INF/LICENSE",
                "META-INF/LICENSE.txt",
                "META-INF/license.txt",
                "META-INF/NOTICE",
                "META-INF/notice.txt",
                "META-INF/ASL2.0",
                "META-INF/proguard/androidx-*.pro"
            ]
        }
    }

    lintOptions {
        checkReleaseBuilds = false
        abortOnError = false
        disable "MissingTranslation"
        disable "ExtraTranslation"
    }
}

dependencies {
    // AndroidX
    implementation "androidx.appcompat:appcompat:1.7.0"
    implementation "androidx.constraintlayout:constraintlayout:2.1.4"
    implementation "androidx.lifecycle:lifecycle-runtime:2.7.0"
    implementation "androidx.lifecycle:lifecycle-runtime-ktx:2.7.0"
    implementation "androidx.core:core:1.13.0"

    // Firebase
    implementation "com.google.firebase:firebase-core:21.1.1"
    implementation "com.google.firebase:firebase-auth:22.3.1"
    implementation "com.google.firebase:firebase-firestore:24.10.3"
    implementation "com.google.firebase:firebase-storage:20.2.1"
    implementation "com.google.firebase:firebase-messaging:23.4.1"
    implementation "com.google.firebase:firebase-analytics:21.6.1"
    implementation "com.google.firebase:firebase-crashlytics:18.6.4"

    // React Native
    implementation "com.facebook.react:react-native:0.74.0"
    implementation "com.facebook.react:hermes-engine:0.74.0"

    // Kotlin
    implementation "org.jetbrains.kotlin:kotlin-stdlib:1.9.22"
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3"

    // Google Play Services
    implementation "com.google.android.gms:play-services-location:21.1.0"
    implementation "com.google.android.gms:play-services-maps:18.2.0"

    // Material Design
    implementation "com.google.android.material:material:1.12.0"

    // Stripe
    implementation "com.stripe:stripe-android:20.39.0"

    // Testing
    testImplementation "junit:junit:4.13.2"
    androidTestImplementation "androidx.test.ext:junit:1.1.5"
    androidTestImplementation "androidx.test.espresso:espresso-core:3.5.1"
}

// Apply Firebase plugin
apply plugin: 'com.google.gms.google-services'
