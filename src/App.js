import { BrowserRouter, Route, Routes } from "react-router-dom";
import QuickSearch from "./pages/QuickSearch";
import RouteDetails from "./pages/RouteDetails";
import { useEffect, useRef, useState } from "react";
import ToastAlert from "./ui_components/ToastAlert";
import { pleaseAllowBrowserToAccessLocation } from "./utilities/Locale";
import HomePage from "./pages/HomePage";
import DownloadData from "./pages/DownloadData";
import GeneralSearch from "./pages/GeneralSearch";
import { getStorageItemDB, setStorageItemDB } from "./utilities/LocalStorage";

function App() {
    const [startGettingLocation, setStartGettingLocation] = useState(false);
    const [location, setLocation] = useState([]);

    useEffect(() => {
        if (startGettingLocation)
        {
            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
                distanceFilter: 1
            };
    
            const successCallback = async(position) => {
                const { latitude, longitude } = position.coords;
                // await new Promise(resolve => setTimeout(resolve, 1000));
                setLocation([latitude, longitude]);
            };
    
            const errorCallback = (error) => {
                console.error('Error retrieving location:', error);
                console.log([]);
            };
    
            const watchId = navigator.geolocation.watchPosition(successCallback, errorCallback, options);
    
            return () => {
                navigator.geolocation.clearWatch(watchId);
            };
        }
    }, [startGettingLocation]);

    const[lang, setLang] = useState('tc');

    useEffect(() => {
        initialize();
    },[])

    async function initialize()
    {
        const newLang =  await getStorageItemDB('lang');

        if (newLang['lang'] && newLang['lang'] != '')
            setLang(newLang['lang']);
        else
        {
            const newLang2 = {'lang':'tc'};
            await setStorageItemDB('lang', newLang2);
            setLang('tc');
        }
    }

    return (
        <BrowserRouter basename="/">
            <Routes>
                <Route exact path="/" element={<HomePage lang={lang} setLang={setLang} />}></Route>
                <Route exact path='/quickSearch' element={<QuickSearch lang={lang} setLang={setLang} locationMain={location} setStartGettingLocation={setStartGettingLocation}/>}> </Route>
                <Route exact path='/generalsearch' element={<GeneralSearch locationMain={location} setStartGettingLocation={setStartGettingLocation}/>}></Route>
                <Route exact path='/routedetails' element={<RouteDetails lang={lang} setLang={setLang} locationMain={location} setStartGettingLocation={setStartGettingLocation}/>}></Route>
                <Route exact path='/downloadData' element={<DownloadData lang={lang} setLang={setLang} />}></Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
