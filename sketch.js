// When visiting the page, the follow arguments must be passed in the URL:
// 
// bgcolor     : color behind graphics
// sectors     : number of sectors
// duration    : spin animation duration
// smoothness  : how slowly the target is approached, >1.0
// revolutions : number of revolutions to reach target
// offset      : how far from the sector center the target angle may be
// wheel       : URL to image for wheel
// foreground  : URL to foreground image
// background  : URL to background image
// tick        : URL to tick sound file
// 
// Ex. http://127.0.0.1:5500/index.html?bgcolor=000000&sectors=8&...


// Whether spinning or not
var state = 'INACTIVE'
// Background color
var backgroundColor

// Images
var img_background
var img_wheel
var img_foreground
var snd_tick

// Labels
var sectorCount
var sectorAngle

// Target
var startAngle = 0
var targetSector
var targetAngle = 1

// Animation
var startFrame = 0
var endFrame = 0
var duration
var smoothness
var revolutions
var offset
var tickPitch

var tickCounter = 0

// Orientation
var wheelAngle = 0


function preload() {
    // Load and prepare URL arguments
    let params = getURLParams()
    console.log(params)
    
    backgroundColor = '#' + params.bgcolor
    sectorCount = parseInt(params.sectors)
    duration = parseFloat(params.duration)
    smoothness = parseFloat(params.smoothness)
    revolutions = parseFloat(params.revolutions)
    offset = parseFloat(params.offset)
    tickPitch = params.pitch == 'true'

    // Calculate the width of each label
    sectorAngle = 360 / sectorCount

    // Load all images
    img_background = loadImage(params.background)
    img_wheel = loadImage(params.wheel)
    img_foreground = loadImage(params.foreground)

    // Load tick sound file
    snd_tick = loadSound(params.tick)
}


function setup() {
    imageMode(CENTER)
    angleMode(DEGREES)
    textAlign(CENTER, CENTER)

    // Create a canvas only slightly larger than the wheel image
    let size = img_wheel.width > img_wheel.height ? img_wheel.width : img_wheel.height
    size += 20
    createCanvas(size, size)
}


function draw() {
    translate(width / 2, height / 2)
    background(color(backgroundColor))

    // Render background image
    image(img_background, 0, 0)


    if (state == 'ACTIVE') {
        let previousAngle = wheelAngle

        // Move wheel along according to a slerp function
        let playingFrame = constrain(frameCount, startFrame, endFrame)
        let p = map(playingFrame, startFrame, endFrame, 0, 1)
        wheelAngle = slerp(startAngle, targetAngle, p, k=smoothness)

        
        // Get which labels the previous and current angles are on
        let labelA = round(previousAngle / sectorAngle)
        let labelB = round(wheelAngle / sectorAngle)

        // Add the difference to counter
        tickCounter += labelB - labelA

        // Adjust the pitch of the tick to the velocity of the wheel
        if (tickPitch) {
            let velocity = wheelAngle - previousAngle
            let v = constrain(velocity, 0, 40) / 40
            let rate = slerp(2.0, 0.8, 1 - v, k=1.2)
            snd_tick.rate(rate)
        }

        // Play tick sound for each and every sector passed
        for (; tickCounter > 0; tickCounter--) {
            snd_tick.play()
        }


        // Switch state to INACTIVE when duration has passed
        if (frameCount > endFrame) {
            state = 'INACTIVE'
            
            // Minimize the value of the wheel angle
            wheelAngle = wheelAngle % 360
        }
    }

    // Render wheel image
    push()
    rotate(wheelAngle % 360)
    image(img_wheel, 0, 0)
    pop()

    // Render foreground image
    image(img_foreground, 0, 0)
}


function mousePressed() {
    if (state == 'INACTIVE') {
        // Set start and end frames
        startFrame = frameCount
        endFrame = startFrame + 60 * duration
    
        startAngle = wheelAngle
        newTarget()
    
        state = 'ACTIVE'
    }
}


function newTarget() {
    // Pick a random target label!
    targetId = int(random(sectorCount))
    
    // Calculate an exact angle on which to land,
    // which is of the current target label

    // Get the center of the label
    targetAngle = sectorAngle * targetId


    // Get half of the label angle
    let halfLabelAngle = sectorAngle * 0.5

    // Make an angle for each side
    let leftAngle = -halfLabelAngle
    let rightAngle = halfLabelAngle - 1
        // Minus 1 to stay out of the next label
    
    // How much of an offset
    leftAngle *= offset
    rightAngle *= offset
    
    // Add a random offset
    targetAngle += random(leftAngle, rightAngle)


    // Add revolutions
    targetAngle += 360 * revolutions

    // Account for already made revolutions
    targetAngle += wheelAngle - wheelAngle % 360 + 360

    return targetId
}


function getLabel(angle) {
    /* Determine which result an angle is on */
    a = angle / 360 * sectorCount
    b = round(a)
    r = mod(b, 8)
    return r
}


function mod(n, m) {
    /** Standard mathematical modulo */
    return ((n % m) + m) % m
}


function slerp(x, t, p, k=1){
    /** Sloping interpolation
     * x : start value
     * t : target value
     * p : how far inbetween, 0.0 to 1.0
     * k : smoothness of ending
    */

    // Invert p and smoothen it with k
    let P = pow(1 - p, k)
    // Value from slope, between x=0 and x=1
    let sigmoidValue = cos(P * 180)
    // Adjust y-values to between 0 and 1
    let adjustedSigmoid = sigmoidValue * 0.5 + 0.5
    // Move to range between x and t
    let slerpedValue = map(adjustedSigmoid, 0, 1, x, t)

    return slerpedValue
}


function spinWheel(x, t, p, a, b, c) {
    /**
     * 1. While p is lower than a, return the first half of slerp
     * 2. While p is center in between a and b, return linearly
     * 3. While p is higher than b, return the second half of slerp
     * 
     * This creates an S curve with a middle straigh line of constant change
     */

    // Calculate the ratios of the whole
    let total = a + b + c
    ra = a / total
    rb = ra + b / total
    rc = rb + c / total

    // *1.
    if (p < ra) {
        p = map(p, 0, ra, 0, 0.5)
        return slerp(x, t, p)
    }

    else {
        // The angle halfway through the slerp
        let middleStart = slerp(x, t, 0.5)
        // How long the middle bit lasts
        let middleDuration = duration * (b / total)
        // How far the center line goes
        let extension = HALF_PI * b * 90 * middleDuration
        // The angle at the end of the middle bit
        let middleEnd = middleStart + extension
        
        // *2.
        if (p < rb) {
            p =  map(p, ra, rb, 0, 1)
            let r = middleStart + extension * p
            return r
        }

        // *3.
        else {
            p = map(p, rb, rc, 0.5, 1)
            return slerp(x, t, p)
        }
    }
}