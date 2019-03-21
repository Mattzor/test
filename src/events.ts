export class positionEvent{
    constructor(public latitude: number, public longitude: number, public heading: number, public speed: number){}
}

export class pitchEvent{
    constructor(public pitch: number){}
}

export class addMarkerEvent{
    constructor(public latitude: number, public longitude: number) {}
}

export class addLayerEvent{
    constructor(public layer){}
}

export class removeAllLayersEvent{
    constructor(){}
}


export class vrMessage{
    constructor(public message){}
}

export class atStopEvent{
    constructor(public atStop: boolean){}
}

export class setHeaderEvent{
    constructor(public lineNumber, public lineName){}
}

export class setHeaderInfoEvent{
    constructor(public time, public meters){}
}

export class setPreviousStopEvent{
    constructor(public data){}
}

export class setNextStopEvent{
    constructor(public data){}
}

export class setSecondStopEvent{
    constructor(public data){}
}

export class setThirdStopEvent{
    constructor(public data){}
}