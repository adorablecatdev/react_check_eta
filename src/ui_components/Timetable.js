import { Fade } from "react-bootstrap"
import { dayCode, language } from "../utilities/Locale"

const Timetable = ({ className, lang, stopMarkers, timetable }) => {
    return (
        <div className={className}>
            <Fade in={true} appear={true} >
                {/* MAIN CONTAINER */}
                <div style={{ height: 'calc(100dvh - 50px - 40px', overflow: 'auto', scrollbarWidth: 'none'}}>

                    {/* HEADER */}
                    <div style={{ marginLeft: '80px', marginRight: '80px', paddingTop: '20px', paddingBottom: '5px',
                        borderBottom: '2px solid #bdffb9', fontSize: '16px', color: '#484848'
                    }}>
                        {language.from[lang] + stopMarkers[0][`name_${lang}`] + language.start[lang]}
                    </div>

                    {/* ACTUAL TIME TABLE */}
                    {Object.entries(timetable).map(([key, value]) => (
                        <div key={key} style={{ paddingLeft: '80px', paddingRight: '80px', paddingTop: '0px', paddingBottom: '20px' }}>

                            {/* WHICH WEEKDAY */}
                            <div>{dayCode[key][lang]}</div>

                            {/* FREQUENCY */}
                            {value.map((item, index) => (
                                <div key={index} style={{ display: 'flex', flexDirection: 'row' }}>

                                    {/* TIME DURATION */}
                                    <div style={{ width: '70%' }}>{item['startTime']}</div>

                                    {/* FREQUENCY */}
                                    <div style={{ width: '30%', textAlign: 'right' }}>
                                        {item['frequency'] == undefined ? "" : item['frequency'] + ' ' + language.minute[lang]}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </Fade>
        </div>
    )
}

export default Timetable