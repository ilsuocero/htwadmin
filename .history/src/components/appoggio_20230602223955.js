// Edit Mode
useEffect(() => {
    if (!map.current && !mapLoaded) return;

    const switchOffListeners = () => {
        const activeListeners = [];
        for (const eventType in map.current._delegatedListeners) {
            if (eventType === 'click') {
                continue; // Skip the 'click' event type
            }

            const listeners = map.current._delegatedListeners[eventType];
            listeners.forEach(entry => {
                const { layer, listener } = entry;
                console.log('RV-->[editMODE]: eventType, layer, listener', eventType, layer, listener);
                if (layer) {
                    activeListeners.push({
                        eventType,
                        layer,
                        listener
                    });
                    map.current.off(eventType, layer, listener);
                } else {
                    activeListeners.push({
                        eventType,
                        listener
                    });
                    map.current.off(eventType, listener);
                }

                console.log('RV-->[editMODE]: eventType, entry.listener', eventType, entry.listener);
            });
        }
        return activeListeners;
    };

    if (editMODE) {
        console.log('RV-->[editMODE]: true', JSON.stringify(map.current._delegatedListeners));

        const activeListeners = switchOffListeners();
        setStoredListeners(activeListeners);
    }

    if (!editMODE) {
        console.log('RV-->[editMODE]: false', editMode.current);
        // Add contextmenu event listener to the map
        map.current.on('contextmenu', handleContextMenu);
        // To reactivate the listeners:
        if (storedListeners) {
            for (const { eventType, layer, listener } of storedListeners) {
                console.log('RV-->[editMODE]: eventType, layer, listener', eventType, layer, listener);
                if (layer) {
                    map.current.on(eventType, layer, listener);
                } else {
                    map.current.on(eventType, listener);
                }
            }
            setStoredListeners(null);
        }
    }

    return () => {
        // Clean up event listeners when the component unmounts
        const activeListeners = switchOffListeners();
        setStoredListeners(activeListeners);
        map.current.off('contextmenu', handleContextMenu);
    };
}, [editMODE]);
