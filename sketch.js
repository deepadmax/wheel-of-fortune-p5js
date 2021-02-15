// When visiting the page, the follow arguments must be passed on in the URL:
// n:  number of different labels
// fg: URL to foreground image
// mg: URL to image for wheel
// bg: URL to background image
// 
// Ex. http://127.0.0.1:5500/index.html?n=8&mg=images/wheel.png&bg=images/background.png&fg=images/foreground.png


var state = 'INACTIVE'

// Images
var img_bg // Background
var img_wh // Wheel
var img_fg // Foreground

// Labels
var labelCount
var labelAngle

// Target
var startAngle = 0 // Angle at start of spin
var targetLabel
var targetAngle = 1

// Timing
var startFrame = 0
var endFrame = 0
var duration = 8

// Orientation
var wheelAngle = 0


function preload() {
    // Load and prepare URL arguments
    let params = getURLParams()
    console.log(params)
    
    labelCount = parseInt(params.n)

    // Calculate the width of each label
    labelAngle = 360 / labelCount

    // Load all images
    img_bg = loadImage(params.bg)
    img_wh = loadImage(params.wh)
    img_fg = loadImage(params.fg)
}


function setup() {
    imageMode(CENTER)
    angleMode(DEGREES)

    // Create a canvas only slightly larger than the wheel image
    let size = img_wh.width > img_wh.height ? img_wh.width : img_wh.height
    size += 20
    createCanvas(size, size)
}


function draw() {
    translate(width / 2, height / 2)
    background(0)

    // Render background image
    image(img_bg, 0, 0)


    if (state == 'ACTIVE') {
        let p = map(frameCount, startFrame, endFrame, 0, 1)
        wheelAngle = slerp(startAngle, targetAngle, p)

        // Switch state to INACTIVE when duration has passed
        if (frameCount > endFrame) {
            state = 'INACTIVE'
        }
    }


    // Render wheel image
    push()
    rotate(wheelAngle % 360)
    image(img_wh, 0, 0)
    pop()

    // Render debug text for which label it is on
    let labelId = getLabel(wheelAngle)
    textSize(56)
    text(labelId, 0, 0)
}


function mousePressed() {
    state = 'ACTIVE'
    startAngle = wheelAngle
    newTarget()

    // Set start and end frames
    startFrame = frameCount
    endFrame = startFrame + 30 * duration
}


function newTarget() {
    // Pick a random target label!
    targetId = int(random(labelCount))
    
    // Calculate an exact angle on which to land,
    // which is of the current target label

    // Get the center of the label
    targetAngle = labelAngle * targetId

    // Add random offset
    targetAngle += random(-labelAngle * 0.45, labelAngle * 0.45)

    // Add revolutions
    targetAngle += 360 * int(random(6, 8))

    // Account for already made revolutions
    targetAngle += wheelAngle - wheelAngle % 360 + 360

    return targetId
}


function getLabel(angle) {
    /* Determine which result an angle is on */
    a = angle/ 360 * labelCount
    b = round(a)
    r = mod(b, 8)
    return r
}


function mod(n, m) {
    /** Standard mathematical modulo */
    return ((n % m) + m) % m
}


function slerp(x, t, p){
    /** Sloping interpolation */
    return t + (x - t) * (cos(p * 180) * 0.5 + 0.5)
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