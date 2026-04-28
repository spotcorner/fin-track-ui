import React from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID } from "@config";
import userService from "@services/userService";
import { connect } from "react-redux";
import { setUserDetails } from "@store";
import About, { AboutHeader } from "@components/home/About.jsx";

class Login extends React.Component {

    onSuccess = (credentialResponse) => {
        userService.login(credentialResponse.credential).then(data => {
            if (data.user) {
                this.props.dispatch(setUserDetails(data.user));
            } else {
                console.error("Login failed:", data.error);
            }
        });
    }

    onError = () => {
        console.log("Google Login Failed");
    }

    render() {
        return <div className="bg-dark text-light" style={{ minHeight: "100vh" }}>
            <div className="container py-3">
                <AboutHeader dark />
                <div className="d-flex justify-content-center mb-4">
                    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                        <GoogleLogin onSuccess={this.onSuccess} onError={this.onError} />
                    </GoogleOAuthProvider>
                </div>
                <About dark />
            </div>
        </div>;
    }
}

export default connect()(Login);
