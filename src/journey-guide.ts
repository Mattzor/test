import {EventAggregator} from 'aurelia-event-aggregator';
import {inject} from 'aurelia-framework';
import * as events from './events';
//import $ from 'bootstrap';
//import $ from 'jquery';

declare var $;

@inject(EventAggregator)
export class JourneyGuide{

    //Header
    lineNumber: string = "";
    lineName: string = "";

    //Header Info
    timeSchedule = "";
    metersLeft = "";

    contentMoverCss = "";
    // Icon classes
    noBoarding = "no-boarding-image";
    noAlighting = "no-alighting-image";
    interconnections = "interconnection-image";
    regulatedStop = "regulation-stop-image";

    // Previous stop
    previousStopName: string = "";
    previousStopTime: string = "";

    // Next stop
    nextStopName: string = "";
    nextStopDesignation: string = "";
    nextStopTime: string = "";
    nextStopCircle: string = "notVisible";
    nextStopCircleData: string = '<circle cx=35px cy=50% r="20" stroke="white" stroke-width="4" fill="#00BFAD" />';
    nextStopRegulatedStop = "";
    nextStopInterconnections ="";
    nextStopCancelled = "";
    nextStopNoBoarding = "";
    nextStopNoAlighting = ""; 


    // Second Stop
    secondStopName: string = "";
    secondStopDesignation: string = "";
    secondStopTime: string = "";
    secondStopCircle: string = "notVisible";
    secondStopCircleData: string = '<circle cx=35px cy=65% r="14" stroke="white" stroke-width="4" fill="#00BFAD" />';
    secondStopRegulatedStop = "";
    secondStopInterconnections = "";
    secondStopCancelled = "";
    secondStopNoBoarding = "";
    secondStopNoAlighting = "";

    // Third Stop
    thirdStopName: string = "";
    thirdStopDesignation: string = ""
    thirdStopTime: string = "";
    thirdStopCircle: string = "notVisible";
    thirdStopCircleData: string = '<circle cx=35px cy=65% r="10" stroke="white" stroke-width="4" fill="#00BFAD" />';
    thirdStopRegulatedStop = "";
    thirdStopInterconnections = "";
    thirdStopCancelled = "";
    thirdStopNoBoarding = "";
    thirdStopNoAlighting = "";
    //thirdStopCircle = "";


    constructor(private ea: EventAggregator){
        ea.subscribe(events.setHeaderEvent, msg => this.setHeader(msg.lineNumber, msg.lineName));
        ea.subscribe(events.setHeaderInfoEvent, msg => this.setHeaderInfo(msg.time, msg.meters));
        ea.subscribe(events.setPreviousStopEvent, msg => this.setPreviousStop(msg.data));
        ea.subscribe(events.setNextStopEvent, msg => this.setNextStop(msg.data));
        ea.subscribe(events.setSecondStopEvent, msg => this.setSecondStop(msg.data));
        ea.subscribe(events.setThirdStopEvent, msg => this.setThirdStop(msg.data));
        ea.subscribe(events.atStopEvent, msg => this.atStop(msg.atStop));
    }

    setHeader(lineNumber, lineName){
        this.lineNumber = lineNumber;
        this.lineName = lineName;
    }

    setHeaderInfo(time, meters){
        this.timeSchedule = time;
        this.metersLeft = meters;
    }

    setPreviousStop(data){
        this.previousStopName = data.stopName;        
    }

    setNextStop(data){
        if(data.stopName){
            this.nextStopCircle = "";
        }else{
            this.nextStopCircle ="notVisible";
        }
        if(data.isRegulatedStop){
            this.nextStopRegulatedStop = this.regulatedStop;
        }else{
            this.nextStopRegulatedStop = "";
        }
        if(data.hasInterconnections){
            this.nextStopInterconnections = this.interconnections;
        }else{
            this.nextStopInterconnections = "";
        }
        if(data.noBoarding){
            this.nextStopNoBoarding = this.noAlighting;
        }else{
            this.nextStopNoBoarding = "";
        }
        if(data.noAlighting){
            this.nextStopNoAlighting = this.noBoarding;
        }else{
            this.nextStopNoAlighting = "";
        }
        this.nextStopName = data.stopName;
        this.nextStopDesignation = data.designation;
        this.nextStopTime = data.time;        

    }

    setSecondStop(data){
        if(data.stopName){            
            this.secondStopCircle = "";
        }else{
            this.secondStopCircle = "notVisible";
        }
        if(data.isRegulatedStop){
            this.secondStopRegulatedStop = this.regulatedStop;
        }else{
            this.secondStopRegulatedStop = "";
        }
        if(data.hasInterconnections){
            this.secondStopInterconnections = this.interconnections;
        }else{
            this.secondStopInterconnections = "";
        }
        if(data.noBoarding){
            this.secondStopNoBoarding = this.noAlighting;
        }else{
            this.secondStopNoBoarding = "";
        }
        if(data.noAlighting){
            this.secondStopNoAlighting = this.noBoarding;
        }else{
            this.secondStopNoAlighting = "";
        }
        this.secondStopName = data.stopName;
        this.secondStopTime = data.time;
        this.secondStopDesignation = data.designation;
    }

    setThirdStop(data){
        if(data.stopName){
            this.thirdStopCircle = "";
        }else{
            this.thirdStopCircle = "notVisible";
        }
        if(data.isRegulatedStop){
            this.thirdStopRegulatedStop = this.regulatedStop;
        }else{
            this.thirdStopRegulatedStop = "";
        }
        if(data.hasInterconnections){
            this.thirdStopInterconnections = this.interconnections;
        }else{
            this.thirdStopInterconnections = "";
        }
        if(data.noBoarding){
            this.thirdStopNoBoarding = this.noAlighting;
        }else{
            this.thirdStopNoBoarding = "";
        }
        if(data.noAlighting){
            this.thirdStopNoAlighting = this.noBoarding;
        }else{
            this.thirdStopNoAlighting = "";
        }
        this.thirdStopName = data.stopName;
        this.thirdStopTime = data.time;
        this.thirdStopDesignation = data.designation;
    }

    atStop(atStop){
        if(atStop){
            this.contentMoverCss = "height: 100px;";
        }else{
            this.contentMoverCss = "height: 0px;";
        }
        
    }

}