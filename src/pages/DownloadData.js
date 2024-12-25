import { useEffect, useState } from "react"
import { downloadJson } from "../utilities/JsonHandler";
import { getStorageItemDB, setStorageItemDB } from "../utilities/LocalStorage";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './styles/DownloadDataStyle.module.css';
import ToastAlert from "../ui_components/ToastAlert";
import AppBar from "../ui_components/AppBar";
import { Form, Button, Fade } from 'react-bootstrap';
import * as Icon from 'react-bootstrap-icons';
import { language } from "../utilities/Locale";
import ProgressBar from 'react-bootstrap/ProgressBar';
import { hostURL } from "../utilities/Constant";

const DownloadData = ({lang, setLang}) => {
    const urlParams = new URLSearchParams(window.location.search);
    const navigate = useNavigate();
    var backBtn = <Icon.ArrowLeft onClick={() => navigate('/', { replace: true })} style={{width:'50px', height:'50px', padding:'10px'}} />;
    const[deviceVersion, setDeviceVersion] = useState('不適用');
    const[serverVersion, setServerVersion] = useState('');
    const[triggerDownload, setTriggerDownload] = useState(false);
    const[downloadedItem, setDownloadedItem] = useState(0);
    const[progress, setProgress] = useState(0);
    const[mainText, setMainText] = useState(language.downloadingData[lang]);

    const[toastText, setToastText] = useState('');
    const[toastTrigger,setToastTrigger] = useState(0);

    const[showDownloadProgress, setShowDownloadProgress] = useState(false);

    useEffect(() => {
        initialize();
    },[])

    useEffect(() => {
        if (triggerDownload)
        {
            download();
            setTriggerDownload(false);
        }
        console.log('test')
    }, [triggerDownload])

    async function initialize()
    {
        const timestamp = new Date().getTime();

        const newDeviceVersion = await getStorageItemDB('version', 'object');
        console.log(newDeviceVersion);
        if ('dateString' in newDeviceVersion)
            setDeviceVersion(newDeviceVersion['dateString']);

        const newServerVersion = await downloadJson(`${hostURL}/data/FINAL_timestamp.json?timestamp=${timestamp}`);
        if ('dateString' in newServerVersion)
            setServerVersion(newServerVersion['dateString']);    

        if (urlParams.has('autodownload'))
        {
            const autodownload = urlParams.get('autodownload');
            if (autodownload == 'yes')
            {
                setTriggerDownload(true);
                setShowDownloadProgress(true);
            }    
        }
    }

    async function download() {
        const timestamp = new Date().getTime();

        const newVersion = await downloadJson(`${hostURL}/data/FINAL_timestamp.json?timestamp=${timestamp}`);
        await setStorageItemDB('version', newVersion);

        setDownloadedItem(1);
        const uniqueroutelistData = await downloadJson(`${hostURL}/data/FINAL_unique_route_list.json?timestamp=${timestamp}`);
        await setStorageItemDB('uniqueRouteList', uniqueroutelistData);
        setProgress(0);
        await new Promise(resolve => setTimeout(resolve, 500));

        setDownloadedItem(2);
        var routeStopListData = await downloadJson(`${hostURL}/data/FINAL_route_stop_list.json?timestamp=${timestamp}`);
        await setStorageItemDB('routeStopList', routeStopListData);
        setProgress(0);
        await new Promise(resolve => setTimeout(resolve, 500));

        setDownloadedItem(3);
        var routeListData = await downloadJson(`${hostURL}/data/FINAL_route_list.json?timestamp=${timestamp}`);
        await setStorageItemDB('routeList', routeListData);
        setProgress(0);
        await new Promise(resolve => setTimeout(resolve, 500));

        setDownloadedItem(4);
        var timetableData = await downloadJson(`${hostURL}/data/FINAL_timetable.json?timestamp=${timestamp}`);
        await setStorageItemDB('timetable', timetableData);
        setProgress(100);
        await new Promise(resolve => setTimeout(resolve, 500));

        setMainText(language.downloadComplete[lang]);
        setToastText(language.downloadComplete[lang]);
        setToastTrigger(prev => prev+1);

        await new Promise(resolve => setTimeout(resolve, 1000));
        if (urlParams.has('prevpage'))
        {
            const prevPage = urlParams.get('prevpage');
            if (prevPage == 'quicksearch')
            {
                navigate(`/${prevPage}`, {replace: true});
            }
            if (prevPage == 'generalsearch')
            {
                navigate(`/${prevPage}`, {replace: true});
            }
            else if (prevPage == 'routedetails')
            {
                const routeid = urlParams.get('routeid');
                const seq = urlParams.get('seq');
                navigate(`/${prevPage}?routeid=${routeid}&seq=${seq}`, {replace: true});
            }
        }
    }

    async function downloadJson(url_in)
    {
        try
        {
            const response = await axios.get(url_in, {
                responseType: 'json',
                onDownloadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    setProgress(progress);
                },
            });
    
            const data = response.data;
            return data;
        }
        catch(error)
        {
            return {};
        }
    }

    return (
        <div className={styles.body}>
            {/* ===== TOAST ===== */}
            <ToastAlert toastText={toastText} toastTrigger={toastTrigger}/>

            {/* ===== MAIN CONTENT ===== */}
            <div style={{height:'100dvh'}}>

                {/* ===== APP BAR ===== */}
                <AppBar leftIcon={backBtn} Header={language.downloadData[lang]} rightIcon={''}></AppBar>

                <Fade in={true} appear={true} style={{transitionDuration: '0.8s'}}>
                    <div style={{height:'100dvh'}}>
                        <div style={{ height: 'calc(100dvh - 50px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontSize: '18px', textAlign: 'center' }}>
                            <div><Icon.Download style={{ width:'70px', height:'70px', padding: '0px'}} /></div>
                            <div style={{marginTop:'20px'}}>{language.deviceVersionText[lang]}: {deviceVersion}</div>
                            <div>{language.serverVersionText[lang]}: {serverVersion}</div>

                            {showDownloadProgress == false ? 
                            <div style={{marginTop:'40px', width:'50%'}}>
                                <Button variant="success" style={{marginTop:'20px'}}
                                    onClick={() => {setTriggerDownload(true); setShowDownloadProgress(true)}}
                                >{language.downloadData[lang]}</Button>
                            </div> : ''}

                            {showDownloadProgress == true ?
                            <div style={{marginTop:'40px', width:'50%'}}>
                                <div >{mainText}</div>
                                <div>{downloadedItem}/4</div>
                                <ProgressBar variant="success" now={progress} style={{width:'100%'}} />
                            </div> : ''}
    
                        </div>
                    </div>
                </Fade>
            </div>
        </div>
    )
}

export default DownloadData