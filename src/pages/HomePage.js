import { Button, Fade } from 'react-bootstrap';
import styles from './styles/HomePageStyle.module.css';
import * as ReactIcon from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { hostURL } from '../utilities/Constant';
import { setStorageItemDB } from '../utilities/LocalStorage';
import { downloadData, language } from '../utilities/Locale';

const HomePage = ({lang, setLang}) => {
    const navigate = useNavigate();

    async function changeLang(lang_in)
    {
        const newLang = {'lang':lang_in};
        await setStorageItemDB('lang', newLang);
        setLang(lang_in);
    }

    return (
        <div className={styles.body}>
            <Fade in={true} appear={true} style={{transitionDuration: '0.8s'}}>
                <div>
                    <div className={styles.languageSelectionContainer}>
                        <div className={styles.languageBtn} style={{'--cusBold': lang == 'tc' ? 'bold':'normal'}}
                            onClick={() => {changeLang('tc')}}
                        >
                            繁
                        </div>
                        <div className={styles.languageBtn} style={{'--cusBold': lang == 'sc' ? 'bold':'normal'}}
                            onClick={() => {changeLang('sc')}}
                        >
                            簡
                        </div>
                        <div className={styles.languageBtn} style={{'--cusBold': lang == 'en' ? 'bold':'normal'}}
                            onClick={() => {changeLang('en')}}
                        >Eng</div>
                    </div>

                    <div className={styles.contentContainer}>
                        <div className={styles.logoTitleContainer}>
                            <img src={`${hostURL}/picture/logo_large.png`} style={{ width: '50%', height: 'auto', padding: '0px', border: '0px solid black', borderRadius: '15px' }} />
                            <div className={styles.mainTitle}>{language.checkETA[lang]}</div>
                            <div className={styles.mainSubtitle}>{language.subtitle[lang]}</div>
                        </div>

                        <div className={styles.shortcutContainer}>
                            <Button variant="light" size='lg' style={{width:'26%', height:'120px'}} onClick={() => navigate('/quicksearch')}>
                                <div >
                                    <ReactIcon.Magic style={{width:'55px', height:'55px', marginBottom:'10px', marginRight:'7.5%'}}/>
                                    <div>{language.quickSearch[lang]}</div>
                                </div>
                            </Button>

                            <Button variant="light" size='lg' style={{width:'26%', height:'120px', marginLeft:'7.5%'}} onClick={() => navigate('/generalsearch')}>
                                <div >
                                    <ReactIcon.Search style={{width:'55px', height:'55px', marginBottom:'10px'}}/>
                                    <div>{language.generalSearch[lang]}</div>
                                </div>
                            </Button>

                            <Button variant="light" size='lg' style={{width:'26%', height:'120px', marginLeft:'7.5%'}} onClick={() => navigate('/downloaddata')}>
                                <div >
                                    <ReactIcon.Download style={{width:'55px', height:'55px', marginBottom:'10px'}}/>
                                    <div>{language.downloadData[lang]}</div>
                                </div>
                            </Button>
                        </div>
                    </div>

                    <div className={styles.versionContainer}>
                        Beta 1.0
                    </div>
                </div>
            </Fade>
        </div>
    )
}

export default HomePage;