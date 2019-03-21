import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import * as events from './events';
import * as m from 'mapbox-gl';
import { map } from 'bluebird';

@inject(EventAggregator)
export class MapJourneyguide{
    map: any;

    previousBusData = {"lat": 0, "lng": 0, "speed": 0, "bearing": 0};
    busData = {"lat": 58.055952, "lng": 11.822119, "speed": 0, "bearing": 0};

    busTimer;
    busTimerCount;

    demo = false;
    layers = [];

    constructor(ea: EventAggregator){
        ea.subscribe(events.positionEvent, msg => this.updateMap(msg.latitude, msg.longitude, msg.heading, msg.speed));
        ea.subscribe(events.pitchEvent, msg => this.map.setPitch(msg.pitch));
        ea.subscribe(events.addMarkerEvent, msg => this.addMarker(msg.latitude, msg.longitude));
        ea.subscribe(events.addLayerEvent, msg => this.addLayer(msg.layer));
        ea.subscribe(events.removeAllLayersEvent, msg => this.removeAllLayers());
    }

    attached(){
        m.accessToken = "pk.eyJ1IjoibWF0dHpvciIsImEiOiJjanJxOXEwejAxNTc0NDRwc2YzcDhuaHhkIn0.tTZPGI4p0tB7-KUlwiNyLQ";
        this.map = new m.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v9',
            center: [11.822119, 58.055952],
            zoom: 18
        });
    }

    updateMap(latitude: number, longitude: number, heading: number, speed: number){        
        console.log(latitude.toString() + ',' + longitude.toString() + '  speed: ' + speed + '  direction: ' + heading);
    
        if(speed === 0.0 && this.busData.lng === longitude && this.busData.lat === latitude){                            
            return;    
        }        
    
        if(this.demo){
            var cameraOptions = {
                center: [longitude, latitude],
                bearing: heading,               
            }
            this.map.easeTo(cameraOptions);
            return;
        }
        
        this.previousBusData.lat = this.busData.lat;
        this.previousBusData.lng = this.busData.lng;
        this.previousBusData.speed = this.busData.speed;
        this.previousBusData.bearing = this.busData.bearing;
        
    
        this.busData.lat = latitude;
        this.busData.lng = longitude;
        this.busData.speed = speed;
        this.busData.bearing = heading;
        if(this.busTimer){
            clearInterval(this.busTimer);
            this.busTimerCount = 0;
        }
        var t = this;        
        this.busTimer = setInterval(function() { t.busTimerFunction(t); }, 100);       
    }

    busTimerFunction(map){
        if(map.busTimerCount == 9){
            clearInterval(map.busTimer);
            map.busTimerCount = 0;
        }
        var cameraOptions = {
            center: [map.busData.lng, map.busData.lat],
            bearing: map.busData.bearing
        }
        //map.mapGL.easeTo(cameraOptions);
        //map.mapGL.setBearing(map.busData.bearing);
        //map.mapGL.setCenter([map.busData.lng, map.busData.lat]);
        map.map.easeTo(cameraOptions);
        map.estimateNextPosition();
        map.busTimerCount += 1;
    }

    estimateNextPosition(){
    
        var latRad = this.busData.lat * Math.PI / 180;
        var lngRad = this.busData.lng * Math.PI / 180;
        var bearingRad = this.busData.bearing * Math.PI / 180;
        var d = 0.05 * this.busData.speed;
        var R = 6.3781 * 10**6;
        
        var nextLat = Math.asin( Math.sin(latRad) * Math.cos(d/R) + Math.cos(latRad) * Math.sin(d/R) * Math.cos(bearingRad));
        var nextLng = lngRad + Math.atan2(Math.sin(bearingRad) * Math.sin(d/R) * Math.cos(latRad),
                                          Math.cos(d/R) - Math.sin(latRad) * Math.sin(nextLat));
    
        this.busData.lat = (nextLat*180/Math.PI);
        this.busData.lng = (nextLng*180/Math.PI);    
        
    }

    addMarker(lat, lng){        
        var ele = document.createElement("div");
        ele.className = "temp-marker";
        new m.Marker(ele).setLngLat([lng, lat]).addTo(this.map);
    }

    addLayer(layer){
        if(!this.map.getLayer(layer.id)){
            this.map.addLayer(layer);
            this.layers.push(layer.id);
        }
    }

    removeLayer(id){
        if(this.map.getLayer(id)){
            this.map.removeLayer(id);
        }
        if(this.map.getSource(id)){
            this.map.removeSource(id);
        }
    }

    removeAllLayers(){
        for(var i = 0; i < this.layers.length; i++){
            var id = this.layers[i];
            this.removeLayer(id);
        }
        this.layers = [];
    }
}