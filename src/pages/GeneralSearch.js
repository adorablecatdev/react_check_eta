import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles/GeneralSearchStyle.module.css';
import { Form, Button, Fade } from 'react-bootstrap';
import { language } from '../utilities/Locale';
import AppBar from '../ui_components/AppBar';
import SpinnerFullscreen from '../ui_components/SpinnerFullscreen';
import ToastAlert from '../ui_components/ToastAlert';
import * as Icon from 'react-bootstrap-icons';
import { getStorageItemDB } from '../utilities/LocalStorage';
import { mtrRouteId, mtrRouteName, mtrRouteNameEn, mtrRouteNameTc } from '../utilities/MtrMetaData';

const GeneralSearch = ({locationMain, setStartGettingLocation}) => {
    var backBtn = <Icon.ArrowLeft onClick={() => navigate('/', { replace: true })} style={{width:'50px', height:'50px', padding:'10px'}} />;
    const navigate = useNavigate();
    const urlParams = new URLSearchParams(window.location.search);
    const [lang, setLang] = useState('tc');

    const [showKeyboard, setShowKeyboard] = useState(true);
    const [showLoading, setShowLoading] = useState(false);
    const [showContent, setShowContent] = useState(false);

    const [toastText, setToastText] = useState('');
    const [toastTrigger,setToastTrigger] = useState(0);

    const [routeList, setRotueList] = useState({});
    const [displayList, setDisplayList] = useState([]);
    const [inputRoutes, setInputRoutes] = useState('');

    const [triggerSearch, setTriggerSearch] = useState(0);

    useEffect(() => {
        initialize();
    }, [])

    useEffect(() => {
        searchRoute();
    }, [triggerSearch])

    async function initialize()
    {
        setStartGettingLocation(true);
        setShowLoading(true);

        var routeListData = await getStorageItemDB('routeList', 'array');
        if (Object.keys(routeListData).length == 0)
        {
            navigate('/downloaddata?autodownload=yes&prevpage=generalsearch', { replace: true });
        }   
        else
        {
            var newRouteListData = {};
            for (var i=0 ; i<routeListData.length ; i++)
            {
                var theKey = '';
                var route = routeListData[i]['route'];

                if (route in mtrRouteId)
                    theKey = route;
                else
                    theKey = route.substring(0, 1);

                if (theKey in newRouteListData)
                {
                    newRouteListData[theKey].push(routeListData[i]);
                }
                else
                {
                    var newArr = [routeListData[i]];
                    newRouteListData[theKey] = newArr;
                }
            }

            setRotueList(newRouteListData);
        }

        if (urlParams.has('query'))
        {
            var newInputRoutes = urlParams.get('query');
            setInputRoutes(newInputRoutes); 
            setTriggerSearch(true);
        }
        
        setShowLoading(false);
        setShowContent(true); 
    }

    async function searchRoute()
    {
        var newDisplayList = [];
        const inputLength = inputRoutes.toString().length;
        
        if (inputLength > 0)
        {
            var theKey = inputRoutes.substring(0, 1);

            if (inputRoutes.toString() in mtrRouteName)
            {
                theKey = mtrRouteName[inputRoutes.toString()];

                if (theKey in routeList)
                {
                    const searchTarger = routeList[theKey];
    
                    for (var i=0 ; i<searchTarger.length ; i++)
                    {
                        newDisplayList.push(searchTarger[i]);
                    }
                }
            }
            else
            {
                theKey = inputRoutes.substring(0, 1);

                if (theKey in routeList)
                {
                    const searchTarger = routeList[theKey];
    
                    for (var i=0 ; i<searchTarger.length ; i++)
                    {
                        if (searchTarger[i]['route'].substring(0, inputLength) == inputRoutes)
                        {
                            newDisplayList.push(searchTarger[i]);
                        }
                    }
                }
            } 
        }

        setDisplayList(newDisplayList);
    }

    async function onChangeInputRoutes(letter){
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
        }
        else
        {
            if (letter in mtrRouteName)
                newInput = letter;
            else
                newInput = currInput + letter;
        }
        
        if (newInput == '')
        {
            navigate('', { replace: true });
        }
        else
        {
            navigate(`?query=${newInput}`, { replace: true });
        }

        setInputRoutes(newInput);
        setTriggerSearch(prev => prev+1);
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
                <AppBar leftIcon={backBtn} Header={language.generalSearch[lang]} rightIcon={''}></AppBar>

                
                <Fade in={showContent} appear={true} style={{transitionDuration: '0.3s'}}>
                    <div style={{height:'calc(100vh - 50px)'}}>
                    
                        {/* ===== ROUTE INPUT ===== */}
                        <div style={{height:'60px', display:'flex', direction:'column', alignContent:'center', padding:'5px'}}>
                            <Form.Control type="text" value={inputRoutes} placeholder={language.enterMultipleRoutes[lang]} readOnly={true}/>
                            <Button variant="light" onClick={() => onChangeInputRoutes('clear')}
                                style={{position:'fixed', right:'15px', top: '58px', textAlign:'center', height:'44px', width:'44px', borderRadius:'22px', padding:'0px'}} >
                                <Icon.X style={{height:'25px', width:'25px'}}/>
                            </Button>
                        </div>

                        {/* ===== MAIN COUTE CONTENT ===== */}
                        <div style={ showKeyboard ? 
                            {height:'calc(100dvh - 50px - 60px - 248px)', padding:'5px', overflowY:'hidden', display:'block', 
                            flexDirection:'row', justifyContent:'flex-start', flexWrap:'wrap', overflow: 'auto', scrollbarWidth: 'none',} :
                            {height:'calc(100dvh - 50px - 60px)', padding:'5px', overflowY:'hidden', display:'block', 
                            flexDirection:'row', justifyContent:'flex-start', flexWrap:'wrap', overflow: 'auto', scrollbarWidth: 'none',} 
                        }>

                            {displayList.length > 0 && displayList.map((item, index) => (
                                // <Fade in={true} appear={true} key={index}>
                                    <div style={{height:'64px', width:'100%', display:'block', textAlign:'center'}} onClick={() => { navigate('/routedetails?routeid='+item['route_id']); }}>

                                        <div style={{margin:'2px', marginTop:'0px', height:'56px', backgroundColor:'white', display:'flex', borderRadius:'4px', border: '1px solid #e2e2e2', overflow:'hidden', flexDirection:'row'}} >

                                            <div style={{width:'20%', lineHeight:'50px', textAlign:'center', margin:'4px'}}>
                                                <div style={{fontSize:'18px'}}>{item['route']}</div>
                                            </div>

                                            <div style={{width:'60%', lineHeight:'50px', textAlign:'left', margin:'4px'}}>
                                                <div style={{display:'flex', flexDirection:'row', height:'100%'}}>
                                                    <div style={{fontSize:'11px', marginTop: '3px'}}>{language.to[lang]}&nbsp;</div>
                                                    <div style={{fontSize:'17px', overflow:'hidden', wordBreak:'break-all'}}>{item['dest_tc']}</div>
                                                </div>
                                            </div>

                                            <div style={{width:'20%', lineHeight:'50px', textAlign:'center', margin:'4px',  display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                <div style={{lineHeight:'15px', fontSize:'11px', width:'100%'}}>
                                                    {item['company'] == 'ctb' ? <div style={{backgroundImage: 'linear-gradient(to right, #fff25c, #fffac2)', marginLeft:'6px', marginRight:'6px', borderRadius:'10px', padding:'1px'}} >{language.ctb[lang]}</div> : ''}
                                                    {item['company'] == 'kmb' ? <div style={{backgroundImage: 'linear-gradient(to right, #fdaaaa, #fde0e0)', marginLeft:'6px', marginRight:'6px', borderRadius:'10px', padding:'1px'}} >{language.kmb[lang]}</div> : ''}
                                                    {item['company'] == 'kmbctb' ? <div style={{backgroundImage: 'linear-gradient(to right, #f4c1c1 50%, #fff68f 50%)', marginLeft:'6px', marginRight:'6px', borderRadius:'10px', padding:'1px'}} >{language.kmbctb[lang]}</div> : ''}
                                                    {item['company'] == 'mtrbus' ? <div style={{backgroundImage: 'linear-gradient(to right, #ab060b 50%, #6c4c9f 50%)', marginLeft:'6px', marginRight:'6px', borderRadius:'10px', padding:'1px', color:'white'}} >{language.mtrbus[lang]}</div> : ''}
                                                    {item['company'] == 'mtr' ? <div style={{background: '#ab060b', marginLeft:'6px', marginRight:'6px', borderRadius:'10px', padding:'1px', color:'white'}} >{language.mtr[lang]}</div> : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                // </Fade>
                            ))}

                        </div>

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
                </Fade>
            </div>
        </div>
    )
}

export default GeneralSearch