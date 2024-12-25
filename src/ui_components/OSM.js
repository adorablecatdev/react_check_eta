import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as IconReact from 'react-bootstrap-icons';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { getLocation } from '../utilities/LocationUtility';
import { Button } from 'react-bootstrap';
import styles from './OMS.module.css';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [24, 36],
    iconAnchor: [12, 36]
});
L.Marker.prototype.options.icon = DefaultIcon;

let CustomIcon = new Icon({
    iconUrl: `${process.env.PUBLIC_URL}/picture/location.png`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
});


const OSM = ({lang, fullscreen, selectedIndex, setFullscreen, mapLocation, stopMarkers, locationMain, 
    setSelectedIndex, setTriggerScrollToIndex, setTriggerShowMarkerLabel, setTriggerDownload}) => {
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const containerRef = useRef(null);
    const [userLocation, setUserLocation] = useState(null);
    const [autoCenter, setAutoCenter] = useState(false);
    const [autoCenterUserLocation, setAutoCenterUserLocation] = useState(false);
    
    useEffect(() => {
        if (locationMain.length > 0)
        {
            setUserLocation(locationMain);
            if (markerRef.current) {
                const marker = markerRef.current;
                const previousLatLng = marker.getLatLng();
                const newLatLng = L.latLng(locationMain[0], locationMain[1]);
          
                if (previousLatLng && !previousLatLng.equals(newLatLng)) {
                  marker.setLatLng(newLatLng, { duration: 0.5, easeLinearity: 0.25 });
                }
            }
        }
    }, [locationMain]);

    useEffect(() => {
        async function triggerAutoCenter(){
            setAutoCenter(true);
            await new Promise(resolve => setTimeout(resolve, 100));
            setAutoCenter(false);
        }
        triggerAutoCenter();
    },[selectedIndex]);

    useEffect(() => {
        async function triggerAutoCenterUserLocation(){
            if (autoCenterUserLocation)
            {
                await new Promise(resolve => setTimeout(resolve, 100));
                setAutoCenterUserLocation(false);
            }
        }
        triggerAutoCenterUserLocation();
    }, [autoCenterUserLocation])

    useEffect(() => {
        const map = mapRef.current;
        const container = containerRef.current;
        const resizeObserver = new ResizeObserver(() => {
            if (map) { map.invalidateSize(); }
        });
        resizeObserver.observe(container);
        return () => { resizeObserver.unobserve(container); };
    }, [fullscreen]);

    function onClickMarker(index )
    {
        return () => {
            setSelectedIndex(index);
            setTriggerScrollToIndex(true);
            setTriggerShowMarkerLabel(true);
            setTriggerDownload(true);
        }
    }

    const SetMapView = () => {
        const map = useMap();
        map.setView(mapLocation, map.getZoom()); 
        return null;
    };

    const SetMapViewToUserLocation = () => {
        const map = useMap();
        map.setView(userLocation, map.getZoom()); 
        return null;
    };
    
    return (
        <div ref={containerRef} style={{height:'100%', width:'100%'}}>
            <MapContainer ref={mapRef} center={mapLocation} zoom={16} style={{height:'100%', width:'100%'}}>
            
                <TileLayer
                    maxZoom={19} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="Map data &copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a> contributors"
                />
                {autoCenter ? <SetMapView /> : ''}
                {autoCenterUserLocation ? <SetMapViewToUserLocation/> : ''}
                {userLocation ? <Marker ref={markerRef} position={userLocation} icon={CustomIcon}></Marker> : ''}

                {stopMarkers ? stopMarkers.map((item, index) => (
                    <Marker key={index} position={[item.lat, item.long]} eventHandlers={{ click: onClickMarker(index) }} >
                        {item.show ?
                            <Tooltip permanent direction="top" offset={[+0, -36]} >
                                <span>{item['seq'] + '. ' + item['name_'+lang]}</span>
                            </Tooltip> : ''
                        }
                    </Marker>
                )) : ''}

                {userLocation ? <div style={{position:'absolute', zIndex:'1000', right:'10px', top:'10px'}}>
                    <Button variant='light' onClick={() => {setAutoCenterUserLocation(!autoCenterUserLocation)}}>
                        <IconReact.Crosshair/>
                    </Button>
                </div> : ''}

                <div className={styles.btnEnlargeMap}
                // style={{position:'absolute', zIndex:'1000', right:'10px', bottom:'20px'}}
                >
                    <Button variant='light' onClick={() => {setFullscreen(!fullscreen)}}>
                        {fullscreen ? <IconReact.ArrowsAngleContract/> : <IconReact.ArrowsAngleExpand/>}
                    </Button>
                </div>
                
            </MapContainer>
        </div>
       
    );
};

export default OSM;