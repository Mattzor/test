import {EventAggregator} from 'aurelia-event-aggregator';
import {inject} from 'aurelia-framework';
//import * as events from './events';
//import $ from 'bootstrap';
//import $ from 'jquery';

declare var $;

@inject(EventAggregator)
export class JourneyGuide{

    //InfoWindow
    infoWinOpen;
    infoWindowStop: InfoWindowStop;

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
    }

    setHeader(lineNumber, lineName){
        this.lineNumber = lineNumber;
        this.lineName = lineName;
    }

    setHeaderInfo(time, meters){
        this.timeSchedule = time;
        this.metersLeft = meters;
    }

    setTimeSchedule(time){
        this.timeSchedule = time;
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
        this.infoWinOpen = atStop;
        if(atStop){
            this.contentMoverCss = "height: 100px;";
        }else{
            this.contentMoverCss = "height: 0px;";
        }        
    }

    arrivedAtStop(){
        //console.log(this.infoWindowStop);
        //this.updateInfoWindow();
        //this.openInfoWindow();
        this.atStop(true);
    }

    departuredFromStop(){        
        this.atStop(false);
    }

    updateServiceJourney(details){
        this.setHeader(details.line.name, details.line.designation);        
    }

    setInfoWindowStop(holdReason, holdUntil, interconnections){
        this.infoWindowStop = new InfoWindowStop(holdReason, holdUntil, interconnections);
    }

    openInfoWindow(){
        var spInfo = document.getElementById("stopPointInfo");
        var positionInfo = spInfo.getBoundingClientRect();
        console.log(positionInfo);
        var currentLeft = Math.round(positionInfo.x);
    
        if (currentLeft > 649){
            $("#stopPointInfo").css("left", -650);
            this.infoWinOpen = true;
        }  
    }

    closeInfoWindow(){
        var spInfo = document.getElementById("stopPointInfo");
        var positionInfo = spInfo.getBoundingClientRect();
        var currentLeft = Math.round(positionInfo.x);
    
        if (currentLeft < 650){
            $("#stopPointInfo").css("left", 650);
            this.infoWinOpen = false;
        }  
    }

}

class InfoWindowStop{
    holdReason;
    time;
    interconnections;

    constructor(holdReason, time, interconnections){
        this.holdReason = holdReason;
        this.time = time;
        this.interconnections = "";
        if(interconnections){
            this.interconnections = this.parseInterConnections(interconnections);
        }
        
    }

    parseInterConnections(interconnections){
        var res = [];
        for(var i = 0; i < interconnections.length; i++){
            var ic = interconnections[i];
            res.push([ic.transportModeCode, ic.maxWaitingUntilTime, ic.lineDesignation, ic.directionName]);
        }
        return res;
    }
}
