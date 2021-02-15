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
// The angle of an option on the wheel
var optionAngle

// State of the wheel
var state = 'STATIC'
// Target option to land on
var target = 0
var targetAngle = 0
// Angle of rotation
var theta = 0
// How many degrees to add each frame
var velocity = 0

// The rate at which the wheel
// accelerates and decelerates
var acceleration_rate // Added each frame
var deceleration_rate // Multiplies by velocity

// Maximum velocity of the wheel
// Starts to decelerate when it is reached
var threshold = 15

// How long to spin at full velocity
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
    // Calculate option angle
    optionAngle = 360 / optionCount
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
        // Increase velocity by the current rate of acceleration
        velocity += acceleration_rate

        // If velocity exceeds the threshold,
        // switch to spinning at a constant rate
        if (velocity >= threshold) {
            velocity = threshold
            state = 'SPIN'
            
            // Random time
            timer = random(5, 10) * 30
        }

        theta += velocity
    }

    // Spin at a constant velocity until timer is up
    else if (state == 'SPIN') {
        theta += velocity
        
        // When the timer has reached 0,
        // Switch to decelerate
        if (timer <= 0) {
            state = 'DECELERATE'

            // Set a random rate of deceleration
            deceleration_rate = getDeceleration()

            // Pick a random target!
            target = int(random(optionCount))
            console.log('Chosen target:', target)

            // Calculate target angle
            targetAngle = optionAngle * target
            // Add random offset
            targetAngle += random(-optionAngle, optionAngle)
            // Add revolutions
            targetAngle += 360 * int(random(1, 6))
            // Account for already made revolutions
            targetAngle += theta - theta % 360
            
            console.log('Current Angle:', theta, 'Target Angle:', targetAngle)
        }

        timer -= 1
    }

    else if (state == 'DECELERATE') {
        let lerpValue = lerp(theta, targetAngle, deceleration_rate)
        let lerpVelocity = lerpValue - theta

        // Approach the predicted velocity of lerping
        // while current velocity is greater
        if (lerpVelocity <= velocity) {
            velocity = lerp(velocity, lerpVelocity, deceleration_rate)
        }

        theta += velocity

        // If current velocity is less than the predicted velocity,
        // stay spinning at a constant rate until it drops low enough
        // 
        // Once the predicted lerp velocity has dropped
        // and they're within a margin of error,
        // switch state to TRACK
        if (abs(velocity - lerpVelocity) <= 1) {
            state = 'TRACK'
        }
    }

    else if (state == 'TRACK') {
        theta = lerp(theta, targetAngle, deceleration_rate)

        let error = targetAngle - theta

        if (error < 0.1) {
            state = 'STATIC'
            velocity = 0
            theta = targetAngle

            // Calculate result
            let result = angleToOption(theta)
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
    rotate(theta % 360)

    // Render wheel
    image(img_wheel, 0, 0)
}


function mousePressed() {
    // If wheel is not moving when pressed, accelerate!
    if (state == 'STATIC') {
        state = 'ACCELERATE'

        // Set the rate of acceleration
        acceleration_rate = getAcceleration()
    }

    // At any point can the wheel be set to decelerate
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
    return 0.05// - 1 / 360
}


function angleToOption(t) {
    a = t / 360 * optionCount
    b = round(a)
    r = mod(b, 8)

    return r
}


function mod(n, m) {
    /* Standard mathematical modulo */
    return ((n % m) + m) % m
}