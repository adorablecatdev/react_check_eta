import { language } from "./Locale";

const getLocation = async (setToastText, setToastTrigger, lang_in) => {
	return new Promise(async (resolve, reject) => {
		await new Promise(resolve => setTimeout(resolve, 5000));
		if (navigator.permissions) {
			navigator.permissions.query({ name: 'geolocation' }).then(result => {
				if (result.state === 'granted' || result.state === 'prompt') 
				{
					const options = { enableHighAccuracy: false, timeout: 5000, maximumAge: 0};

					navigator.geolocation.getCurrentPosition((position) => {
						resolve([position.coords.latitude.toString(), position.coords.longitude.toString()]);
					},error => {
							console.log('Error retrieving location:', error);
							resolve([]);
					}, options);
				}
				else 
				{
					setToastText(language.pleaseAllowBrowserToAccessLocation[lang_in]);
					setToastTrigger((prev) => prev+1);
					resolve([]);
				}
			});
		}
		else 
		{
			setToastText(language.pleaseAllowBrowserToAccessLocation[lang_in]);
			setToastTrigger((prev) => prev+1);
			resolve([]);
		}
	})
}

function getLocationStream(locationRef, setToastText, setToastTrigger, lang){
	const options = { enableHighAccuracy: false, timeout: 1000, maximumAge: 0, distanceFilter: 10 };

	const locationWatcher = navigator.geolocation.watchPosition((currPosition) => 
	{
		const { latitude, longitude } = currPosition.coords;
		locationRef.current = [latitude, longitude];
	},(error) => {
		locationRef.current = [];
		setToastText(language.pleaseAllowBrowserToAccessLocation[lang]);
		setToastTrigger((prev) => prev+1);
	},options);
	
	return locationWatcher;
}

function roundDown(lat) {
	var first = lat.split('.')[0];
	var second = parseInt(lat.split('.')[1].substring(0, 5));

	var result1 = parseInt(second / 300);
	var result2 = result1 * 300;

	var output = first + '.' + result2.toString().padStart(5, '0');
	return output;
}

function addInterval(value) {
	var first = value.split('.')[0];
	var second = parseInt(value.split('.')[1].substring(0, 5));

	var result1 = (parseInt(second) + 300);

	var output = first + '.' + result1.toString().padStart(5, '0');
	return output;
}

function minusInterval(value) {
	var first = value.split('.')[0];
	var second = parseInt(value.split('.')[1].substring(0, 5));

	var result1 = (parseInt(second) - 300);

	var output = first + '.' + result1.toString().padStart(5, '0');
	return output;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
	const earthRadius = 6371; // Radius of the Earth in kilometers
	const dLat = toRadians(lat2 - lat1);
	const dLon = toRadians(lon2 - lon1);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	const distance = earthRadius * c * 1000; // Distance in meters
	return distance;
}

function toRadians(degrees) {
	return degrees * (Math.PI / 180);
}

function findClosestStop(lat, lon, routeStopList) {
	var closestStop = routeStopList[0];
	var closestDistance = 1000;

	for (var i = 0; i < routeStopList.length; i++) {
		var currDistance = calculateDistance(parseFloat(lat), parseFloat(lon), parseFloat(routeStopList[i]['lat']), parseFloat(routeStopList[i]['long']));
		if (currDistance < closestDistance) {
			closestDistance = currDistance;
			closestStop = routeStopList[i];
		}
	}

	return closestStop;
}

function findClosestStopIndex(lat, lon, routeStopList) {
	var closestStopIndex = 0;
	var closestDistance = 1000;

	for (var i = 0; i < routeStopList.length; i++) {
		var currDistance = calculateDistance(parseFloat(lat), parseFloat(lon), parseFloat(routeStopList[i]['lat']), parseFloat(routeStopList[i]['long']));
		if (currDistance < closestDistance) {
			closestDistance = currDistance;
			closestStopIndex = i;
		}
	}

	return closestStopIndex;
}

export { getLocation, roundDown, addInterval, minusInterval, calculateDistance, findClosestStop, getLocationStream, findClosestStopIndex }