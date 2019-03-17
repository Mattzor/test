import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {positionEvent} from './events';
import * as m from 'mapbox-gl';
import { map } from 'bluebird';

@inject(EventAggregator)
export class MapJourneyguide{
    map: any;

    constructor(ea: EventAggregator){
        ea.subscribe(positionEvent, msg => this.updateMap(msg.latitude, msg.longitude));
    }

    attached(){
        m.accessToken = "pk.eyJ1IjoibWF0dHpvciIsImEiOiJjanJxOXEwejAxNTc0NDRwc2YzcDhuaHhkIn0.tTZPGI4p0tB7-KUlwiNyLQ";
        this.map = new m.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v9'
        });
    }

    updateMap(latitude: number, longitude: number){
        this.map.setCenter({'lng': longitude, 'lat': latitude});
    }
}