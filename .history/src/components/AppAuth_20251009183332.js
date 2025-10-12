import { useEffect, useState } from 'react';
import { getIdToken } from './firebase';
import ENV from '../ENV';

const AppAuth = ({ user, setConnectionState, setAuthenticated }) => {

    const [myBody, setMyBody] = useState({
        UID: '',
        TOKEN: '',
    });

    useEffect(() => {
        console.log('🚀 HtWAppAuth-->[useEffect user]: user:', user ? 'present' : 'null');
        if (user) {
            // Get the actual Firebase ID token
            getIdToken(user)
                .then(token => {
                    console.log('🚀 HtWAppAuth-->[getIdToken]: Got Firebase token:', token ? 'VALID' : 'NULL');
                    setMyBody({
                        UID: user.uid,
                        TOKEN: token || 'FAKE', // Use actual token or fallback
                    });
                })
                .catch(error => {
                    console.error('🚀 HtWAppAuth-->[getIdToken]: Error getting token:', error);
                    setMyBody({
                        UID: user.uid,
                        TOKEN: 'FAKE',
                    });
                });
        }
    }, [user]);

    useEffect(() => {
        console.log('HtWAppAuth-->[useEffect myBody]: JSON.stringify(myBody): ', JSON.stringify(myBody));
        if (myBody.UID != '') {

            // Use relative URL when in development to leverage the proxy
            const loginUrl = process.env.NODE_ENV === 'development' ? '/api/login' : ENV.LOGIN_HOST;
            console.log('HtWAppAuth-->[fetch]: Using login URL:', loginUrl);
            
            fetch(loginUrl, {
                method: 'POST',
                mode: 'cors',
                headers: new Headers({
                    Accept: 'application/json',
                    'Content-Type': 'application/json', // <-- Specifying the Content-Type
                }),
                body: JSON.stringify(myBody), // <-- Post parameters
                //});
            })
                .then(response => {
                    // Check if response is JSON before parsing
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        // Get the raw text to see what the server actually returned
                        return response.text().then(text => {
                            console.error('HtWAppAuth-->[fetch error]: Server returned non-JSON response:', text);
                            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
                        });
                    }
                    return response.json();
                })
                .then(json => {
                    console.log('HtWAppAuth-->[fetch api]: JSON.stringify(json): ' + JSON.stringify(json));
                    
                    // Validate that we received the expected data
                    if (!json.jwt) {
                        console.error('HtWAppAuth-->[fetch error]: No JWT token in response:', json);
                        throw new Error('Authentication failed: No JWT token received');
                    }
                    
                    const cState = {
                        tokenIO: json.jwt,
                        roles: json.roles || [],
                        isOnline: true,
                    };
                    //if (cState.roles?.includes('admin')) setShowAdminTab(true)
                    setConnectionState(cState);
                    console.log(
                        'HtWAppAuth-->[fetch api]: connectionState: ' + JSON.stringify(cState),
                    );
                    // AsyncStorage.setItem(
                    //     'connectionState',
                    //     JSON.stringify(cState),
                    //     errs => {
                    //         if (errs) {
                    //             console.log('HtWAppAuth-->[AsyncStorage error]: ' + JSON.stringify(errs));
                    //         }
                    //     },
                    // );
                    setAuthenticated(true)
                })
                .catch(error => {
                    console.error('HtWAppAuth-->[fetch error]: ' + error.message);
                    setAuthenticated(false);
                });
        }

        return setAuthenticated(false);
    }, [myBody]);


    return null;
}

export default AppAuth
