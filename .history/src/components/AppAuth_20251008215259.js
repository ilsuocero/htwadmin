import { useEffect, useState } from 'react';
import { getIdToken } from './firebase';
import ENV from '../ENV';

const AppAuth = ({ user, setConnectionState, setAuthenticated }) => {

    const [myBody, setMyBody] = useState({
        UID: '',
        TOKEN: '',
    });

    useEffect(() => {
        console.log('HtWAppAuth-->[useEffect user]: JSON.stringify(user): ', JSON.stringify(user));
        if (user) {
            // Get the actual Firebase ID token
            getIdToken(user)
                .then(token => {
                    console.log('HtWAppAuth-->[getIdToken]: Got Firebase token: ', token ? 'Yes' : 'No');
                    setMyBody({
                        UID: user.uid,
                        TOKEN: token || 'FAKE', // Use actual token or fallback
                    });
                })
                .catch(error => {
                    console.error('HtWAppAuth-->[getIdToken]: Error getting token: ', error);
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

            fetch(ENV.LOGIN_HOST, {
                method: 'POST',
                mode: 'cors',
                headers: new Headers({
                    Accept: 'application/json',
                    'Content-Type': 'application/json', // <-- Specifying the Content-Type
                }),
                body: JSON.stringify(myBody), // <-- Post parameters
                //});
            })
                .then(response => response.json())
                .then(json => {
                    console.log('HtWAppAuth-->[fetch api]: JSON.stringify(json): ' + JSON.stringify(json));
                    const cState = {
                        tokenIO: json.jwt,
                        roles: json.roles,
                        isOnline: true,
                    };
                    //if (cState.roles?.includes('admin')) setShowAdminTab(true)
                    setConnectionState({
                        tokenIO: json.jwt,
                        roles: json.roles,
                        isOnline: true,
                    });
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
                    console.error('RV-->[myBody in splash:POST ' + error);
                });
        }

        return setAuthenticated(false);
    }, [myBody]);


    return null;
}

export default AppAuth
