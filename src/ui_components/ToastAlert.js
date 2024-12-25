import { useEffect, useState } from "react";
import { Toast } from "react-bootstrap";
import styles from './ToastAlert.module.css';

const ToastAlert = ({toastText, toastTrigger}) => {
    const[activeTimeout, setActiveTimeout] = useState('');
    const[showToast, setShowToast] = useState(false);

    const showToastAlert = () => {
        if (activeTimeout != '')
            clearTimeout(activeTimeout);

        setShowToast(true);

        const timeoutID = setTimeout(() => {
            setShowToast(false);
        }, 2000)
        setActiveTimeout(timeoutID);
    }

    useEffect(() => {
        showToastAlert();
    }, [toastTrigger]);

    return (
        <div>
        {toastText != '' ? 
            <Toast show={showToast} bg={'light'} className={styles.toastBody} style={{display:showToast ? 'flex':'none'}} >
                <Toast.Body>{toastText}</Toast.Body>
            </Toast> : ''
        }
        </div>
    );
}

export default ToastAlert;