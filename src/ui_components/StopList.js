import { Fade } from "react-bootstrap";
import { language } from "../utilities/Locale";


const StopList = ({className, stopMarkers, setSelectedIndex, setTriggerShowMarkerLabel, setTriggerDownload, selectedIndex, lang }) => {
    return (
        <div className={className}>
            {stopMarkers && stopMarkers.map((item, index) => (
                <Fade in={true} appear={true} >
                    <div id={`element-${index}`} key={index}
                        onClick={() => { setSelectedIndex(index); setTriggerShowMarkerLabel(true); setTriggerDownload(true); }}
                        style={index === selectedIndex ?
                            { height: '74px', width: '100%', display: 'block', textAlign: 'center', lineHeight: '60px', padding: '5px', cursor:'pointer' } :
                            { height: '54px', width: '100%', display: 'block', textAlign: 'center', lineHeight: '40px', padding: '5px', cursor:'pointer' }
                        }
                    >

                        <div style={index === selectedIndex ?
                            { margin: '2px', marginTop: '0px', height: '66px', backgroundColor: 'white', display: 'flex', borderRadius: '4px', border: '1px solid #e2e2e2', overflow: 'hidden', flexDirection: 'row' } :
                            { margin: '2px', marginTop: '0px', height: '46px', backgroundColor: 'white', display: 'flex', borderRadius: '4px', border: '1px solid #e2e2e2', overflow: 'hidden', flexDirection: 'row' }}
                        >

                            {/* STOP SEQ */}
                            <div style={{ width: '10%', textAlign: 'right', margin: '4px' }}>
                                {item['seq'] + '.'}
                            </div>

                            {/* STOP NAME */}
                            <div style={{ width: '70%', textAlign: 'left', margin: '4px' }}>
                                {item[`name_${lang}`]}
                            </div>

                            {/* ETA */}
                            {index === selectedIndex ?
                                <div style={{ width: '20%', lineHeight: '20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'row', height: '33%' }}>
                                        <div style={{ width: '50%', textAlign: 'right' }}>{item['eta1']}&nbsp;</div>
                                        <div style={{ width: '50%', textAlign: 'left', fontSize: '11px', marginTop: 'auto' }}>{language.minute[lang]}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'row', height: '33%' }}>
                                        <div style={{ width: '50%', textAlign: 'right' }}>{item['eta2']}&nbsp;</div>
                                        <div style={{ width: '50%', textAlign: 'left', fontSize: '11px', marginTop: 'auto' }}>{language.minute[lang]}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'row', height: '33%' }}>
                                        <div style={{ width: '50%', textAlign: 'right' }}>{item['eta3']}&nbsp;</div>
                                        <div style={{ width: '50%', textAlign: 'left', fontSize: '11px', marginTop: 'auto' }}>{language.minute[lang]}</div>
                                    </div>
                                </div> : ''
                            }

                        </div>
                    </div>
                </Fade>
            ))}
        </div>
    )
}

export default StopList