import { useState, useEffect } from 'react';
import { Form, Button, Fade } from 'react-bootstrap';
import { findClosestStop, roundDown } from '../utilities/LocationUtility';
import { language, dayCode } from '../utilities/Locale';
import { extractCtbEta, extractKmbEta, sortCoopEta, extractMtrbusEta, downloadJson, extractMtrEta } from '../utilities/JsonHandler';
import { useNavigate } from 'react-router-dom';
import AppBar from '../ui_components/AppBar';
import styles from './styles/QuickSearchStyle.module.css';
import SpinnerFullscreen from '../ui_components/SpinnerFullscreen';
import ToastAlert from '../ui_components/ToastAlert';
import axios from 'axios';
import * as Icon from 'react-bootstrap-icons';
import { getStorageItem, getStorageItemDB, setStorageItem, setStorageItemDB } from '../utilities/LocalStorage';
import { now } from 'moment';
import { mtrRouteName, mtrRouteNameEn, mtrRouteNameTc } from '../utilities/MtrMetaData';
import { AutoTextSize } from 'auto-text-size'

const QuickSearch = ({lang, setLang, locationMain, setStartGettingLocation}) => {
    var backBtn = <Icon.ArrowLeft onClick={() => navigate('/', { replace: true })} style={{width:'50px', height:'50px', padding:'10px'}} />;
    var shareBtn = <Icon.ShareFill onClick={() => shareLink() } style={{width:'50px', height:'50px', padding:'13px'}} />;
    const navigate = useNavigate();
    const urlParams = new URLSearchParams(window.location.search);
    const[timer, setTimer] = useState(null);

    const[showKeyboard, setShowKeyboard] = useState(true);
    const[showLoading, setShowLoading] = useState(false);
    const[showContent, setShowContent] = useState(false);

    const[toastText, setToastText] = useState('');
    const[toastTrigger,setToastTrigger] = useState(0);

    const[routeStopList, setRouteStopList] = useState({});
    const[routeList, setRotueList] = useState([]);

    const[inputRoutes, setInputRoutes] = useState('');
    const[suggestList, setSuggestList] = useState([]);
    const[etaList, setEtaList] = useState([]);

    const[triggerSearch, setTriggerSearch] = useState(false);
    const[triggerBuildEtaList, setTriggerBuildEtaList] = useState(false);
    const[triggerDownload, setTriggerDownload] = useState(false);
    const[triggerAutoDownload, setTriggerAutoDownload] = useState(false);

    const[history, setHistory] = useState({});

    useEffect(() => {
        initialize();
    },[]);

    useEffect(() => {
        if (triggerSearch)
            setShowLoading(true);
        if (triggerSearch && locationMain.length != 0)
        {
            setTriggerBuildEtaList(true);
            setTriggerSearch(false);
        }
    },[locationMain, triggerSearch])

    useEffect(() => {
        buildEtaList(); 
    }, [triggerBuildEtaList])

    useEffect(() => {
        downloadEta();
    },[triggerDownload])

    useEffect(() => {
        let timerConstant = null;
        if (triggerAutoDownload) 
        {
            timerConstant = setInterval(() => {
                setTriggerDownload(true);
            }, 1000*30);
            
            setTimer(timerConstant);
        } 
        else if (triggerAutoDownload === false) 
        {
            if (timer) 
            {
                clearInterval(timer);
                setTimer(null);
            }
        }

        return () => {
            if (timer) 
            {
                clearInterval(timer);
                setTimer(null);
            }
        };

    }, [triggerAutoDownload])

    async function initialize(){
        setStartGettingLocation(true);

        var uniqueRouteList = await getStorageItemDB('uniqueRouteList', 'array');
        var routeStopListData = await getStorageItemDB('routeStopList', 'object');
        var historyData = await getStorageItemDB('history', 'array');
        if (Object.keys(uniqueRouteList).length == 0 || Object.keys(routeStopListData).length == 0)
        {
            navigate('/downloaddata?autodownload=yes&prevpage=quicksearch', { replace: true });
        }   
        else
        {
            setRotueList(uniqueRouteList);
            setRouteStopList(routeStopListData);
            console.log('history');
            console.log(historyData);
            setHistory(historyData);
        }

        if (urlParams.has('query'))
        {
            var newInputRoutes = urlParams.get('query');
            setInputRoutes(newInputRoutes); 
            setTriggerSearch(true);
        }
        
        setShowContent(true); 
    }

    async function buildEtaList()
    {
        if (triggerBuildEtaList)
        {
            setShowLoading(true);
            if (inputRoutes != '')
            {
                urlParams.set('query', inputRoutes);
                navigate('?' + urlParams.toString(), { replace: true });
    
                var newEtaList = [];
                var inputRoutesArray = inputRoutes.split('/');
                var newHistory = history;
    
                for (var i=0 ; i<inputRoutesArray.length ; i++)
                {
                    var currRouteIdArray = ['kmb' + inputRoutesArray[i] + '_I1','kmb' + inputRoutesArray[i] + '_O1',
                                            'ctb' + inputRoutesArray[i] + '_I1','ctb' + inputRoutesArray[i] + '_O1',
                                            'kmbctb' + inputRoutesArray[i] + '_I1','kmbctb' + inputRoutesArray[i] + '_O1',
                                            'mtrbus' + inputRoutesArray[i] + '_I1','mtrbus' + inputRoutesArray[i] + '_O1'];

                    if (inputRoutesArray[i] in mtrRouteName)
                    {
                        currRouteIdArray.push('mtr' + mtrRouteName[inputRoutesArray[i]] + '_UP1');
                        currRouteIdArray.push('mtr' + mtrRouteName[inputRoutesArray[i]] + '_DOWN1');
                    }

                    for (var j=0 ; j<currRouteIdArray.length ; j++)
                    {
                        if (currRouteIdArray[j] in routeStopList)
                        {    
                            var closestStop = findClosestStop(locationMain[0].toString(), locationMain[1].toString(), routeStopList[currRouteIdArray[j]]);
                            if (closestStop != null) 
                            {
                                closestStop['eta1'] = '-';
                                closestStop['eta2'] = '-';
                                closestStop['eta3'] = '-';
                                newEtaList.push(closestStop);

                                var existIndex = -1;
                                for (var k=0 ; k<newHistory.length ; k++)
                                {
                                    if (newHistory[k] == closestStop['route'])
                                    {
                                        existIndex = k;
                                        break;
                                    }
                                }

                                if (existIndex != -1)
                                    newHistory.splice(existIndex,1);

                                newHistory.unshift(closestStop['route']);
                            }
                        }  
                    }
                }
    

                setStorageItemDB('history', newHistory);
                console.log('new History');
                console.log(newHistory);
                setSuggestList([]);
                setEtaList(newEtaList);
                setTriggerDownload((prev) => prev+1);
            }
            else
            {
                setSuggestList([]);
                setEtaList([]);
                setToastTrigger((prev) => prev+1);
                setToastText(language.pleaseInputRoutes[lang]);
            }
            setTriggerBuildEtaList(false);
            setShowLoading(false);
        }

        
    }

    async function downloadEta(){
        const updateElementByIndex = (index, newValue) => {
            setEtaList(prevArray => {
              const updatedArray = [...prevArray];
              updatedArray[index] = newValue;
              return updatedArray;
            });
        };

        if (triggerDownload)
        {
            if (etaList.length > 0)
            {
                try
                {
                    console.log('download');
                    for (var i=0 ; i<etaList.length ; i++)
                    {
                        var currItem = etaList[i];
                        var company = etaList[i]['company'];
        
                        if (company == 'kmb')
                        {
                            const url = `https://data.etabus.gov.hk/v1/transport/kmb/eta/${currItem['stop']}/${currItem['route']}/1`;
                            const response = await axios.get(url);
                            const resultArray = extractKmbEta(response.data, etaList[i]['direction']);
                            etaList[i]['eta1'] = resultArray[0];
                            etaList[i]['eta2'] = resultArray[1];
                            etaList[i]['eta3'] = resultArray[2];
                        }
                        else if (company == 'ctb')
                        {
                            const url = `https://rt.data.gov.hk/v2/transport/citybus/eta/ctb/${currItem['stop']}/${currItem['route']}`;
                            const response = await axios.get(url);
                            const resultArray = extractCtbEta(response.data, etaList[i]['direction']);
                            etaList[i]['eta1'] = resultArray[0];
                            etaList[i]['eta2'] = resultArray[1];
                            etaList[i]['eta3'] = resultArray[2];
                        }
                        else if (company == 'kmbctb')
                        {
                            const urlKmb = `https://data.etabus.gov.hk/v1/transport/kmb/eta/${currItem['stop']}/${currItem['route']}/1`;
                            const responseKmb = await axios.get(urlKmb);
                            const resultArrayKmb = extractKmbEta(responseKmb.data, etaList[i]['direction']);
        
                            const urlCtb = `https://rt.data.gov.hk/v2/transport/citybus/eta/ctb/${currItem['coopStop']}/${currItem['route']}`;
                            const responseCtb = await axios.get(urlCtb);
                            const resultArrayCtb = extractCtbEta(responseCtb.data, etaList[i]['coopDir']);
        
                            const combinedArray = [...resultArrayKmb, ...resultArrayCtb];
                            const resultArray = sortCoopEta(combinedArray);
        
                            etaList[i]['eta1'] = resultArray[0];
                            etaList[i]['eta2'] = resultArray[1];
                            etaList[i]['eta3'] = resultArray[2];
                        }
                        else if (company == 'mtrbus')
                        {
                            const url = `https://rt.data.gov.hk/v1/transport/mtr/bus/getSchedule`;
                            const body = {"language": "zh", "routeName": currItem['route']};
                            const response = await axios.post(url, body);
                            const resultArray = extractMtrbusEta(response.data, etaList[i]['stop']);

                            etaList[i]['eta1'] = resultArray[0];
                            etaList[i]['eta2'] = resultArray[1];
                            etaList[i]['eta3'] = resultArray[2];
                        }
                        else if (company == 'mtr')
                        {
                            const url = `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${currItem['route']}&sta=${currItem['stop']}`;
                            const response = await axios.get(url);
                            const resultArray = extractMtrEta(response.data, currItem['route'], currItem['stop'], currItem['direction']);
                            etaList[i]['eta1'] = resultArray[0];
                            etaList[i]['eta2'] = resultArray[1];
                            etaList[i]['eta3'] = resultArray[2];
                        }
                        updateElementByIndex(i, etaList[i]);
                    }
                    setTriggerAutoDownload(true);
                }
                catch(error)
                {
                    setToastText(language.unableToDownloadETA[lang]);
                    setToastTrigger((prev) => prev+1);
                }
            }
            setTriggerDownload(false);
        }
    }

    async function shareLink()
    {
        if (navigator.share) {
            try {
              await navigator.share({
                title: 'Share Current Address',
                url: window.location.href
              });
              console.log('Link shared successfully!');
            } catch (error) {
              console.error('Error sharing link:', error);
            }
          } else {
            console.log('Web Share API not supported.');
            // Fallback behavior when Web Share API is not supported
            // You can implement alternative sharing methods or UI here
          }
    }

    async function onChangeInputRoutes(letter){
        setTriggerAutoDownload(false);
        setEtaList([]);
        var currInput = inputRoutes;
        var newInput = '';

        if (letter == 'backspace')
        {
            if (currInput.length > 0)
                newInput = currInput.substring(0, currInput.length-1);
        }
        else if (letter == 'clear')
        {
            newInput = '';
            navigate('', { replace: true });
        }
        else if (letter == '/')
        {
            if (currInput != '' && currInput.charAt(currInput.length-1) != '/')
                newInput = currInput + '/';
            else
                newInput = currInput;
        }
        else
        {
            newInput = currInput + letter;
            if (letter in mtrRouteName)
                newInput += '/';
        }
        

        if (newInput != '')
        {
            var existInputArray = newInput.split('/');
            var existInputMap = {};
            

            if (existInputArray.length >= 2)
            {
                for (var i=0 ; i<existInputArray.length-1 ; i++)
                {
                    existInputMap[existInputArray[i]] = existInputArray[i];
                }
            }
            
            if (existInputArray.length > 0)
            {
                var lastInput = existInputArray[existInputArray.length-1];
                if (lastInput != '')
                {
                    setSuggestList([]);
                    var newSuggestList = [];
                    for (var i=0 ; i<routeList.length ; i++)
                    {
                        const currRoute = routeList[i];
                        if (currRoute in existInputMap == false)
                        {
                            if (currRoute.substring(0, lastInput.length) == lastInput)
                                newSuggestList.push(currRoute);
                        }
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 10));
                    setSuggestList(newSuggestList);

                    if (newSuggestList.length == 1)
                    {
                        if (newSuggestList[0] == lastInput && letter != 'backspace')
                            newInput += '/';
                    }
                }
            }
        }
        else
        {
            setSuggestList([]);
        }

        if (newInput.charAt(newInput.length - 1) == '/')
            setSuggestList([]);

        setInputRoutes(newInput);
    }

    async function onClickRouteSuggestion(route){
        var currInput = inputRoutes;
        var currInputArray = currInput.split('/');
        var newInput = '';

        for(var i=0 ; i<currInputArray.length-1 ; i++)
        {
            newInput += currInputArray[i] + '/';
        }

        newInput += route + '/';
        setInputRoutes(newInput);
    }

    return (
        <div className={styles.body}>

            {/* ===== LOADING SPINNER ===== */}
            <SpinnerFullscreen showLoading={showLoading}/>

            {/* ===== TOAST ===== */}
            <ToastAlert toastText={toastText} toastTrigger={toastTrigger}/>

            {/* ===== MAIN CONTENT ===== */}
            <div style={{height:'100vh'}}>

                {/* ===== APP BAR ===== */}
                <AppBar leftIcon={backBtn} Header={language.quickSearch[lang]} rightIcon={shareBtn}></AppBar>

                
                <Fade in={showContent} appear={true} style={{transitionDuration: '0.3s'}}>
                    <div className={styles.contentContainer}>
                    
                        <div className={styles.etaListContainer}>
                            {/* ===== ROUTE INPUT ===== */}
                            <div className={styles.routeInput}>
                                <Form.Control type="text" value={inputRoutes} placeholder={language.enterMultipleRoutes[lang]} readOnly={true} style={{height:'100%'}}/>
                                <Button variant="light" onClick={() => onChangeInputRoutes('clear')}
                                    style={{position:'absolute', right:'15px', top: '8px', textAlign:'center', height:'44px', width:'44px', borderRadius:'22px', padding:'0px'}} >
                                    <Icon.X style={{height:'25px', width:'25px'}}/>
                                </Button>
                            </div>

                            {/* ===== MAIN ROUTE CONTENT ===== */}
                            <div className={styles.etaList} 
                                style={{'--cusHeight': showKeyboard?'calc(100dvh - 50px - 60px - 248px - 50px)':'calc(100dvh - 50px - 60px)'}}
                            >

                                {suggestList.length > 0 && suggestList.map((item, index) => (
                                    <div key={index} style={{height:'60px', width:'25%', display:'inline-block', textAlign:'center', lineHeight:'52px'}}>
                                        <div style={{margin:'4px', height:'52px', backgroundColor:'#F4F4F4'}} onClick={() => onClickRouteSuggestion(item)}>{item}</div>
                                    </div>
                                ))}

                                {etaList.length > 0 && etaList.map((item, index) => (
                                    <Fade in={true} appear={true} key={index}>
                                        <div style={{height:'74px', width:'100%', display:'block', textAlign:'center', cursor:'pointer'}} onClick={() => { navigate('/routedetails?routeid='+item['route_id']); }}>

                                            <div style={{margin:'2px', marginTop:'0px', height:'66px', backgroundColor:'white', display:'flex', borderRadius:'4px', border: '1px solid #e2e2e2', overflow:'hidden', flexDirection:'row'}} >

                                                <div style={{width:'20%', fontSize:'18px'}}>
                                                    <div style={{lineHeight:'30px', marginTop:'10px', width:'100%', display:'flex', justifyContent:'center'}}><AutoTextSize maxFontSizePx='17'>{item['route']}</AutoTextSize></div>
                                                    <div style={{lineHeight:'15px', fontSize:'11px'}}>
                                                        {item['company'] == 'ctb' ? <div style={{backgroundImage: 'linear-gradient(to right, #fff25c, #fffac2)', marginLeft:'6px', marginRight:'6px', borderRadius:'10px', padding:'1px'}} >{language.ctb[lang]}</div> : ''}
                                                        {item['company'] == 'kmb' ? <div style={{backgroundImage: 'linear-gradient(to right, #fdaaaa, #fde0e0)', marginLeft:'6px', marginRight:'6px', borderRadius:'10px', padding:'1px'}} >{language.kmb[lang]}</div> : ''}
                                                        {item['company'] == 'kmbctb' ? <div style={{backgroundImage: 'linear-gradient(to right, #f4c1c1 50%, #fff68f 50%)', marginLeft:'6px', marginRight:'6px', borderRadius:'10px', padding:'1px'}} >{language.kmbctb[lang]}</div> : ''}
                                                        {item['company'] == 'mtrbus' ? <div style={{backgroundImage: 'linear-gradient(to right, #ab060b 50%, #6c4c9f 50%)', marginLeft:'6px', marginRight:'6px', borderRadius:'10px', padding:'1px', color:'white'}} >{language.mtrbus[lang]}</div> : ''}
                                                        {item['company'] == 'mtr' ? <div style={{background: '#ab060b', marginLeft:'6px', marginRight:'6px', borderRadius:'10px', padding:'1px', color:'white'}} >{language.mtr[lang]}</div> : ''}
                                                    </div>
                                                </div>

                                                <div style={{width:'60%', lineHeight:'30px', textAlign:'left', margin:'4px'}}>
                                                    <div style={{display:'flex', flexDirection:'row', height:'50%'}}>
                                                        <div style={{fontSize:'11px', marginTop: '3px'}}>{language.to[lang]}&nbsp;</div>
                                                        <div style={{width:'100%'}}><AutoTextSize maxFontSizePx='17'>{item[`dest_${lang}`]}</AutoTextSize></div>
                                                    </div>
                                                    <div style={{height:'50%'}}><AutoTextSize maxFontSizePx='17'>{item[`name_${lang}`]}</AutoTextSize></div>
                                                </div>
                                                <div style={{width:'20%', lineHeight:'20px'}}>
                                                    <div style={{display:'flex', flexDirection:'row', height:'33%'}}>
                                                        <div style={{width:'50%', textAlign:'right'}}>{item['eta1']}&nbsp;</div>
                                                        <div style={{width:'50%', textAlign:'left', fontSize:'11px', marginTop: 'auto'}}>{language.minute[lang]}</div>
                                                    </div>
                                                    <div style={{display:'flex', flexDirection:'row', height:'33%'}}>
                                                        <div style={{width:'50%', textAlign:'right'}}>{item['eta2']}&nbsp;</div>
                                                        <div style={{width:'50%', textAlign:'left', fontSize:'11px', marginTop: 'auto'}}>{language.minute[lang]}</div>
                                                    </div>
                                                    <div style={{display:'flex', flexDirection:'row', height:'33%'}}>
                                                        <div style={{width:'50%', textAlign:'right'}}>{item['eta3']}&nbsp;</div>
                                                        <div style={{width:'50%', textAlign:'left', fontSize:'11px', marginTop: 'auto'}}>{language.minute[lang]}</div>
                                                    </div>
                                                </div>
                                                
                                            </div>
                                        </div>
                                    </Fade>
                                ))}

                            </div>
                        </div>

                        <div className={styles.numPadContainer}>
                            {/* ===== HISTORY ===== */}
                            {showKeyboard &&
                                <div style={{height:'49px', width:'100%', display:'flex', flexDirection:'row', overflowX:'scroll', 
                                    scrollbarWidth:'none', borderTop:'1px solid #e2e2e2'}}>
                                    {history.length > 0 && history.map((item, index) => (
                                        <div style={{minWidth:'70px', lineHeight:'49px', textAlign:'center'}}
                                            onClick={() => {setInputRoutes(prev => prev + item + '/')}}
                                        >{item}</div>
                                    ))}
                                </div>                           
                            }


                            {/* ===== NUM PAD ===== */}

                            {showKeyboard == false ? 
                                <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => setShowKeyboard(!showKeyboard)}
                                    style={{position:'fixed', bottom: '0px', width:'50px', height:'50px'}} >
                                    <Icon.Keyboard style={{padding:'0px !important',margin:'0px !important'}}/>
                                </Button>
                                : ''                    
                            }
                            
                            {showKeyboard && 
                                <Fade in={true} appear={true} >
                                    <div style={showKeyboard ? {height:'248px', borderTop:'1px solid #e2e2e2'} : {display:'none'}}>
                                        <div className={styles.row} >
                                            <div style={{width:'70%', paddingLeft:'2px', paddingRight:'1px'}}>
                                                <div className={styles.row} style={{height:'60px', padding:'2px'}}>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('1')}>1</Button>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('2')}>2</Button>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('3')}>3</Button>
                                                </div>
                                                <div className={styles.row} style={{height:'60px', padding:'2px'}}>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('4')}>4</Button>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('5')}>5</Button>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('6')}>6</Button>
                                                </div>
                                                <div className={styles.row} style={{height:'60px', padding:'2px'}}>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('7')}>7</Button>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('8')}>8</Button>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('9')}>9</Button>
                                                </div>
                                                <div className={styles.row} style={{height:'60px', padding:'2px'}}>
                                                    <Button variant="warning" size='lg' className={styles.numPadButton} onClick={() => setShowKeyboard(!showKeyboard)}><Icon.ChevronDown style={{padding:'0px !important',margin:'0px !important'}}/></Button>
                                                    <Button variant="danger" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('backspace')}><Icon.Backspace/></Button>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('0')}>0</Button>
                                                    <Button variant="primary" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('/')}>/</Button>
                                                    <Button variant="success" size='lg' className={styles.numPadButton} onClick={() => {setTriggerSearch(true)}}><Icon.Search/></Button>
                                                </div>
                                            </div>

                                            <div style={{width:'30%',height:'244px', paddingLeft:'1px', paddingRight:'2px', overflowY:'auto', scrollbarWidth: 'none', paddingBottom:'4px'}}>
                                                <div className={styles.row} style={{height:'60px', padding:'2px'}}>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('X')}>X</Button>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('A')}>A</Button>
                                                </div>
                                                <div className={styles.row} style={{height:'60px', padding:'2px'}}>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('B')}>B</Button>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('C')}>C</Button>
                                                </div>
                                                <div className={styles.row} style={{height:'60px', padding:'2px'}}>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('D')}>D</Button>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('E')}>E</Button>
                                                </div>
                                                <div className={styles.row} style={{height:'60px', padding:'2px'}}>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('F')}>F</Button>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('H')}>H</Button>
                                                </div>
                                                <div className={styles.row} style={{height:'60px', padding:'2px'}}>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('K')}>K</Button>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('M')}>M</Button>
                                                </div>
                                                <div className={styles.row} style={{height:'60px', padding:'2px'}}>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('N')}>N</Button>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('P')}>P</Button>
                                                </div>
                                                <div className={styles.row} style={{height:'60px', padding:'2px'}}>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('R')}>R</Button>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('S')}>S</Button>
                                                </div>
                                                <div className={styles.row} style={{height:'60px', padding:'2px'}}>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('U')}>U</Button>
                                                    <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes('W')}>W</Button>
                                                </div>

                                                {lang == 'en' ? mtrRouteNameEn.map((item, index) => (
                                                    <div className={styles.row} style={{height:'60px', padding:'2px'}}>
                                                        <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes(item)}>{item}</Button>
                                                    </div>
                                                )):''}

                                                {lang == 'tc' ? mtrRouteNameTc.map((item, index) => (
                                                    <div className={styles.row} style={{height:'60px', padding:'2px'}}>
                                                        <Button variant="light" size='lg' className={styles.numPadButton} onClick={() => onChangeInputRoutes(item)}>{item}</Button>
                                                    </div>
                                                )):''}
                                            </div>
                                        </div>
                                    </div>
                                </Fade>
                            }
                        </div>
                    </div>
                </Fade>
            </div>
        </div>
    )
}

export default QuickSearch;