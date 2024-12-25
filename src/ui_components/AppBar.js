import styles from './AppBarStyle.module.css';
import { AutoTextSize } from 'auto-text-size';

const AppBar = ({leftIcon, Header, rightIcon}) => {
    return (
        <div className={styles.AppBar}> 
            <div className={styles.AppBarIcon}>{leftIcon}</div>
            <div className={styles.AppBarHeading}>
                <AutoTextSize maxFontSizePx='26' style={{width:'100%'}}>
                    {Header}
                </AutoTextSize>
            </div>
            <div className={styles.AppBarIcon}>{rightIcon}</div>
        </div>
    )
}   

export default AppBar;