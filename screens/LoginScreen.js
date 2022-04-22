import React, {Component} from 'react';
import {Text, View, Button, Image, TouchableOpacity} from 'react-native';
import * as Google from "expo-google-app-auth";
import firebase from "firebase";

export default class LoginScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
          fontsLoaded: false,
          isEnabled: false,
          light_theme: true,
          profile_image: "",
          name: ""
        };
      }

    isUserEqual = (googleUser, firebaseUser) => {
        if (firebaseUser) {
            var providerData = firebaseUser.providerData;
            for (var i = 0; i < providerData.length; i++) {
                if (providerData[i].providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID && providerData[i].uid === googleUser.getBasicProfile().getId()) {
                    // Não precisamos reautenticar a conexão do Firebase.
                    return true;
                }
            }
        }
        return false;
    };

    onSignIn = googleUser => {
        // Precisamos registrar um Observer (observador) no Firebase Auth para garantir
        // que a autenticação seja inicializada.
        var unsubscribe = firebase
            .auth()
            .onAuthStateChanged(firebaseUser => {
                unsubscribe();
                // Verifique se já estamos conectados ao Firebase com o usuário correto.
                if (!this.isUserEqual(googleUser, firebaseUser)) {
                    // Crie uma credencial do Firebase com o token de ID do Google.
                    var credential = firebase
                        .auth
                        .GoogleAuthProvider
                        .credential(googleUser.idToken, googleUser.accessToken);

                    // Login com a credencial do usuário do Google.
                    firebase
                        .auth()
                        .signInWithCredential(credential)
                        .then(function (result) {
                            if (result.additionalUserInfo.isNewUser) {
                                firebase
                                    .database()
                                    .ref("/users/" + result.user.uid)
                                    .set({
                                        gmail: result.user.email,
                                        profile_picture: result.additionalUserInfo.profile.picture,
                                        locale: result.additionalUserInfo.profile.locale,
                                        first_name: result.additionalUserInfo.profile.given_name,
                                        last_name: result.additionalUserInfo.profile.family_name,
                                        current_theme: "dark"
                                    })
                                    .then(function (snapshot) {});
                            }
                        })
                        .catch(error => {
                            // Trate os erros aqui.
                            var errorCode = error.code;
                            var errorMessage = error.message;
                            // O e-mail da conta do usuário que foi usada.
                            var email = error.email;
                            // O tipo do firebase.auth.AuthCredential que foi usado.
                            var credential = error.credential;
                            // ...
                        });
                } else {
                    console.log("Usuário já conectado ao Firebase.");
                }
            });
    };

    signInWithGoogleAsync = async() => {
        try {
            const result = await Google.loglnAsync({
                behaviour: "web",
                androidClientld: "786511148569-tber5qc2grcrk1t1ekli3oi2duqgeh0i.apps.googleusercontent.com",
                iosClientld: "786511148569-54n23l032h91r6mlg29ilb3dtqcb6per.apps.googleusercontent.com",
                scopes: ['profile', 'email']
            })
        } catch (e) {
            console.log(e.message);
            return {error: true};
        }
    }

    toggleSwith() {
        const previous_state = this.state.isEnable;
        const theme = !this.state.isEnable
            ? 'black'
            : 'white'
        var updates = {}
        updates["/users/" + firebase
                .auth()
                .currentUser
                .uid + "current_theme"] = theme
        firebase
            .database()
            .ref()
            .update(updates);
        this.setState({
            isEnable: !!previous_state,
            light_theme: previous_state
        })
    };

    render() {
        if (!this.state.fontsLoaded) {
            return <AppLoading/>;
        } else {
            return (
                <View style={styles.container}>
                    <SafeAreaView style={styles.droidSafeArea}/>
                    <View style={styles.appTitle}>
                        <Image source={require("../assets/logo.png")} style={styles.applcon}></Image>
                        <Text style={styles.appTitleText}>{'App Narração de\nHistórias '}</Text>
                    </View>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => this.signInWithGoogleAsync()}>
                            <Image source={require("../assets/google_icon.png")} style={styles.googleIcon}></Image>
                            <Text style={styles.googleText}>Login com o Google</Text>
                        </TouchableOpacity>
                        <Switch
                            style={{
                            transform: [
                                {
                                    scaleX: 1.3
                                }, {
                                    scaleY: 1.3
                                }
                            ]
                        }}
                            trackColor={{
                            false: "#767577",
                            true: this.state.light_theme
                                ? "#eee"
                                : "white"
                        }}
                            thumbColor={this.state.isEnabled
                            ? "#ee8249"
                            : "#f4f3f4"}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={() => this.toggleSwitch()}
                            value={this.state.isEnabled}/>
                    </View>
                    <View style={styles.cloudContainer}>
                        <Image source={require("../assets/cloud.png")} style={styles.cloudlmage}></Image>
                    </View>
                </View>
            );
        }
    }
}