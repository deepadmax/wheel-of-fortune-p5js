// When visiting the page, the follow arguments must be passed on in the URL:
// fg: URL to foreground image
// mg: URL to image for wheel
// bg: URL to background image
// 
// Ex. http://127.0.0.1:5500/index.html?mg=images/wheel.png&bg=images/background.png&fg=images/foreground.png


// Images
var img_background
var img_wheel
var img_foreground

// Number of different options
var optionCount

// State of the wheel
var state = 'STATIC'
// Angle of rotation
var theta = 0
// How many degrees to add each frame
var speed = 0

// The rate at which the wheel
// accelerates and decelerates
var acceleration_rate // Added each frame
var deceleration_rate // Multiplies by speed

// Maximum speed of the wheel
// Starts to decelerate when it is reached
var threshold = 10
var revolutions = 360 / threshold

// How long to spin at full speed
var timer


// TESTING DISTRIBUTION
var distribution


function preload() {
    let params = getURLParams()
    console.log(params)
    
    // Load images
    img_background = loadImage(params.bg)
    img_wheel = loadImage(params.mg)
    img_foreground = loadImage(params.fg)

    // Set number of options
    optionCount = params.n
}


function setup() {
    imageMode(CENTER)
    angleMode(DEGREES)
    
    // Set size based on small canvas dimension
    let size = img_wheel.width > img_wheel.height ? img_wheel.height : img_wheel.width
    size += 20

    // Scale window based on image
    createCanvas(size, size)


    // SET UP TESTING
    distribution = []
    for (let i = 0; i < optionCount; i++) {
        distribution.push(0)
    }
}


function draw() {
    // Orient to draw relative to the center
    translate(width / 2, height / 2)
    
    background(20, 0, 20) // Always black background

    image(img_background, 0, 0)

    if (state == 'ACCELERATE') {
        // Increase speed by the current rate of acceleration
        speed += acceleration_rate

        // If speed exceeds the threshold,
        // switch to spinning at a constant rate
        if (speed >= threshold) {
            speed = threshold
            state = 'SPIN'
            
            let p = random(revolutions)

            // Random time
            let seconds = random(5, 10) * 30
            // Remove frames that don't align with the revolutions
            seconds -= seconds % revolutions

            timer = seconds + p
        }
    }

    // Spin at a constant speed until timer is up
    else if (state == 'SPIN') {
        // When the timer has reached 0,
        // Switch to decelerate
        if (timer <= 0) {
            state = 'DECELERATE'

            // Set a random rate of deceleration
            deceleration_rate = getDeceleration()
        }

        timer -= 1
    }

    else if (state == 'DECELERATE') {
        speed *= deceleration_rate

        if (speed <= 0.05) {
            state = 'STATIC'
            speed = 0

            // Calculate result
            let result = round(theta / 360 * optionCount) % optionCount
            console.log('Result:', result)

            // UPDATE AND LOG DISTRIBUTION
            distribution[result] += 1
            let total = distribution.reduce((a, b) => a + b, 0)
            let ratios = []

            for (let i = 0; i < distribution.length; i++) {
                let ratio = distribution[i] / total
                ratio = round(ratio * optionCount * 100)
                ratios.push(ratio)
            }

            console.log(ratios)
        }
    }

    // else if (state == 'STATIC') {
    //     state = 'ACCELERATE'
    //     theta = 0

    //     // Set a random rate of acceleration
    //     acceleration_rate = getAcceleration()
    // }
    
    // Update orientation of wheel
    theta += speed
    rotate(theta % 360)

    // Render wheel
    image(img_wheel, 0, 0)
}


function mousePressed() {
    if (state == 'STATIC') {
        state = 'ACCELERATE'

        // Set the rate of acceleration
        acceleration_rate = getAcceleration()
    }
    else if (state == 'ACCELERATE' | state == 'SPIN') {
        state = 'DECELERATE'
        // Set the rate of deceleration
        deceleration_rate = getDeceleration()
    }
}


function getAcceleration() {
    return 0.2
}


function getDeceleration() {
    return 0.995 - 1 / 360
}