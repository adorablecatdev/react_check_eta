import { Button, Fade } from "react-bootstrap";
import OSM from "../ui_components/OSM";
import styles from './styles/RouteDetailsStyle.module.css';
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { language } from "../utilities/Locale";
import AppBar from "../ui_components/AppBar";
import ToastAlert from "../ui_components/ToastAlert";
import SpinnerFullscreen from "../ui_components/SpinnerFullscreen";
import * as Icon from 'react-bootstrap-icons';
import { downloadJson, extractCtbEta, extractKmbEta, extractMtrEta, extractMtrbusEta, sortCoopEta } from "../utilities/JsonHandler";
import axios from "axios";
import { getStorageItemDB, setStorageItemDB } from "../utilities/LocalStorage";
import { findClosestStopIndex } from "../utilities/LocationUtility";
import Timetable from "../ui_components/Timetable";
import StopList from "../ui_components/StopList";

const RouteDetails = ({ lang, setLang, locationMain, setStartGettingLocation }) => {

    const urlParams = new URLSearchParams(window.location.search);
    const navigate = useNavigate();
    const [timer, setTimer] = useState(null);

    const [route, setRoute] = useState(null);
    const [dest, setDest] = useState(null);
    var backBtn = <Icon.ArrowLeft onClick={() => navigate(-1, { replace: true })} style={{ width: '50px', height: '50px', padding: '10px' }} />;
    var appBarHeader = <span>{route} <span style={{ fontSize: '14px' }}> &ensp;&ensp;{language.to[lang]} </span> {dest}</span>;

    const [showLoading, setShowLoading] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const [selectedTab, setSelectedTab] = useState('map');

    const [toastText, setToastText] = useState('');
    const [toastTrigger, setToastTrigger] = useState(0);

    const [stopMarkers, setStopMarkers] = useState(null);
    const [mapLocation, setMapLocation] = useState([22.324681505, 114.176558367]);
    const [mapFullscreen, setMapFullscreen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(1000);
    const [timetable, setTimetable] = useState({});

    const [triggerShowMarkerLabel, setTriggerShowMarkerLabel] = useState(false);
    const [triggerScrollToIndex, setTriggerScrollToIndex] = useState(false);
    const [triggerDownload, setTriggerDownload] = useState(false);
    const [triggerAutoDownload, setTriggerAutoDownload] = useState(false);
    const [triggerFindClosestStop, setTriggerClosestStop] = useState(false);

    useEffect(() => {
        initialize();
    }, []);

    useEffect(() => {
        setTriggerAutoDownload(false);
        downloadEta();
        setTriggerAutoDownload(true);
    }, [triggerDownload])

    useEffect(() => {
        showMarkerLabel();
    }, [triggerShowMarkerLabel])

    useEffect(() => {
        scrollToIndex();
    }, [triggerScrollToIndex])

    useEffect(() => {
        if (triggerFindClosestStop) {
            if (locationMain.length > 0) {
                var newSeq = findClosestStopIndex(locationMain[0], locationMain[1], stopMarkers);
                setSelectedIndex(newSeq);
                setTriggerScrollToIndex(true);
                setTriggerShowMarkerLabel(true);
                setTriggerDownload(true);
                setTriggerClosestStop(false);
            }
        }
    }, [triggerFindClosestStop])

    useEffect(() => {
        let timerConstant = null;
        if (triggerAutoDownload) {
            timerConstant = setInterval(() => {
                setTriggerDownload(true);
            }, 1000 * 30);

            setTimer(timerConstant);
        }
        else if (triggerAutoDownload === false) {
            if (timer) {
                clearInterval(timer);
                setTimer(null);
            }
        }

        return () => {
            if (timer) {
                clearInterval(timer);
                setTimer(null);
            }
        };

    }, [triggerAutoDownload])

    async function initialize() {
        setStartGettingLocation(true);
        setShowLoading(true);

        const routeid = urlParams.get('routeid');

        var routeStopListData = await getStorageItemDB('routeStopList', 'object');
        var timetableData = await getStorageItemDB('timetable', 'object');
        if (Object.keys(routeStopListData).length == 0) {
            navigate(`/downloaddata?autodownload=yes&prevpage=routedetails&routeid=${routeid}`, { replace: true });
        }

        if (routeid in routeStopListData) {
            var routeStopList = routeStopListData[routeid];
            setRoute(routeStopList[0]['route']);
            setDest(routeStopList[0]['dest_' + lang]);
            setStopMarkers(routeStopList);
        }

        if (routeid in timetableData) {
            setTimetable(timetableData[routeid]);
        }

        setShowLoading(false);
        setShowContent(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setTriggerClosestStop(true);
    }

    function showMarkerLabel() {
        if (triggerShowMarkerLabel) {
            const updatedMarkers = stopMarkers.map((currStopMarker, i) => {
                if (i === selectedIndex) {
                    setMapLocation([currStopMarker.lat, currStopMarker.long]);
                    return { ...currStopMarker, show: true };
                }
                else { return { ...currStopMarker, show: false }; }
            });

            setStopMarkers(updatedMarkers);
            setTriggerShowMarkerLabel(false);
        }
    }

    function scrollToIndex() {
        if (triggerScrollToIndex) {
            const element = document.getElementById(`element-${selectedIndex}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
            setTriggerScrollToIndex(false);
        }
    };

    async function downloadEta() {
        const updateElementByIndex = (index, newValue) => {
            setStopMarkers(prevArray => {
                const updatedArray = [...prevArray];
                updatedArray[index] = newValue;
                return updatedArray;
            });
        };

        if (triggerDownload) {
            try {
                var currItem = stopMarkers[selectedIndex];
                var company = stopMarkers[selectedIndex]['company'];

                if (company == 'kmb') {
                    const url = `https://data.etabus.gov.hk/v1/transport/kmb/eta/${currItem['stop']}/${currItem['route']}/1`;
                    const response = await axios.get(url);
                    const resultArray = extractKmbEta(response.data, stopMarkers[selectedIndex]['direction']);
                    stopMarkers[selectedIndex]['eta1'] = resultArray[0];
                    stopMarkers[selectedIndex]['eta2'] = resultArray[1];
                    stopMarkers[selectedIndex]['eta3'] = resultArray[2];
                }
                else if (company == 'ctb') {
                    const url = `https://rt.data.gov.hk/v2/transport/citybus/eta/ctb/${currItem['stop']}/${currItem['route']}`;
                    const response = await axios.get(url);
                    const resultArray = extractCtbEta(response.data, stopMarkers[selectedIndex]['direction']);
                    stopMarkers[selectedIndex]['eta1'] = resultArray[0];
                    stopMarkers[selectedIndex]['eta2'] = resultArray[1];
                    stopMarkers[selectedIndex]['eta3'] = resultArray[2];
                }
                else if (company == 'kmbctb') {
                    const urlKmb = `https://data.etabus.gov.hk/v1/transport/kmb/eta/${currItem['stop']}/${currItem['route']}/1`;
                    const responseKmb = await axios.get(urlKmb);
                    const resultArrayKmb = extractKmbEta(responseKmb.data, stopMarkers[selectedIndex]['direction']);

                    const urlCtb = `https://rt.data.gov.hk/v2/transport/citybus/eta/ctb/${currItem['coopStop']}/${currItem['route']}`;
                    const responseCtb = await axios.get(urlCtb);
                    const resultArrayCtb = extractCtbEta(responseCtb.data, stopMarkers[selectedIndex]['coopDir']);

                    const combinedArray = [...resultArrayKmb, ...resultArrayCtb];
                    const resultArray = sortCoopEta(combinedArray);

                    stopMarkers[selectedIndex]['eta1'] = resultArray[0];
                    stopMarkers[selectedIndex]['eta2'] = resultArray[1];
                    stopMarkers[selectedIndex]['eta3'] = resultArray[2];
                }
                else if (company == 'mtrbus') {
                    const url = `https://rt.data.gov.hk/v1/transport/mtr/bus/getSchedule`;
                    const body = { "language": "zh", "routeName": currItem['route'] };
                    const response = await axios.post(url, body);
                    const resultArray = extractMtrbusEta(response.data, stopMarkers[selectedIndex]['stop']);
                    stopMarkers[selectedIndex]['eta1'] = resultArray[0];
                    stopMarkers[selectedIndex]['eta2'] = resultArray[1];
                    stopMarkers[selectedIndex]['eta3'] = resultArray[2];
                }
                else if (company == 'mtr') {
                    const url = `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${currItem['route']}&sta=${currItem['stop']}`;
                    const response = await axios.get(url);
                    const resultArray = extractMtrEta(response.data, currItem['route'], currItem['stop'], currItem['direction']);
                    stopMarkers[selectedIndex]['eta1'] = resultArray[0];
                    stopMarkers[selectedIndex]['eta2'] = resultArray[1];
                    stopMarkers[selectedIndex]['eta3'] = resultArray[2];
                }

                stopMarkers[selectedIndex]['show'] = true;
                updateElementByIndex(selectedIndex, stopMarkers[selectedIndex]);
                // setTriggerAutoDownload(true);
            }
            catch (error) {
                // setToastText(unableToDownloadETA[lang]);
                // setToastTrigger((prev) => prev+1);
            }
            setTriggerDownload(false);
        }
    }

    return (
        <div className={styles.body}>
            {/* ===== LOADING SPINNER ===== */}
            <SpinnerFullscreen showLoading={showLoading} />

            {/* ===== TOAST ===== */}
            <ToastAlert toastText={toastText} toastTrigger={toastTrigger} />

            {/* ===== MAIN CONTENT ===== */}
            <div style={{ height: '100dvh' }}>

                {/* ===== APP BAR ===== */}
                <AppBar leftIcon={backBtn} Header={appBarHeader} rightIcon={''}></AppBar>

                <div className={styles.contentContainer}>
                    <div className={styles.mapContainer} style={{ '--cusHeight': selectedTab == 'timetable' ? '0%' : mapFullscreen ? '100%' : '45%' }}>
                        {showLoading == false ?
                            <OSM
                                lang={lang}
                                fullscreen={mapFullscreen}
                                selectedIndex={selectedIndex}
                                setFullscreen={setMapFullscreen}
                                mapLocation={mapLocation}
                                stopMarkers={stopMarkers}
                                locationMain={locationMain}
                                setSelectedIndex={setSelectedIndex}
                                setTriggerScrollToIndex={setTriggerScrollToIndex}
                                setTriggerShowMarkerLabel={setTriggerShowMarkerLabel}
                                setTriggerDownload={setTriggerDownload}
                            /> : ''
                        }
                    </div>

                    <div className={styles.rightSection} style={{ '--cusHeight': selectedTab == 'timetable' ? '100%' : mapFullscreen ? '0%' : '55%' }}>
                        {selectedTab == 'map' &&
                            <StopList className={styles.stopListOrTimetableContainer} stopMarkers={stopMarkers} setSelectedIndex={setSelectedIndex} lang={lang}
                                setTriggerShowMarkerLabel={setTriggerShowMarkerLabel} setTriggerDownload={setTriggerDownload} selectedIndex={selectedIndex}/>
                        }

                        {selectedTab == 'timetable' &&
                            <Timetable className={styles.stopListOrTimetableContainer} lang={lang} stopMarkers={stopMarkers} timetable={timetable}/>
                        }

                        <div className={styles.tabContainer}>
                            <div className={selectedTab == 'map' ? styles.tabItemActive : styles.tabItemNonActive}
                                onClick={() => { setSelectedTab('map'); }}>{language.routeTab[lang]}
                            </div>

                            <div className={selectedTab == 'timetable' ? styles.tabItemActive : styles.tabItemNonActive}
                                onClick={() => { setSelectedTab('timetable'); }}>{language.scheduleTab[lang]}
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    )
}

export default RouteDetails;