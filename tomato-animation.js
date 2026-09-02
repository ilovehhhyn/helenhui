(function () {
    "use strict";

    var tomato = document.querySelector(".tomato-animation");
    var tomatoArt = tomato && tomato.querySelector(".tomato-art");
    var target = document.getElementById("tomato-tree-target");

    if (!tomato || !tomatoArt || !target) {
        return;
    }

    function easeCos(from, to, progress) {
        return from + (to - from) * (1 - Math.cos(Math.PI * progress)) / 2;
    }

    function runTomatoAnimation() {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        var tomatoRect = tomato.getBoundingClientRect();
        var targetRect = target.getBoundingClientRect();
        var tomatoWidth = tomatoRect.width;
        var tomatoHeight = tomatoRect.height;

        if (targetRect.bottom < 0 || targetRect.top > window.innerHeight) {
            return;
        }

        // land with the center of mass right over the corner of "tree":
        // an unstable equilibrium, so it settles into a rock, not a rest
        var landingX = targetRect.right - tomatoWidth * 0.5;
        var landingY = targetRect.top - tomatoHeight + 4;
        var startY = -tomatoHeight - 20;
        var exitY = window.innerHeight + tomatoHeight + 30;
        var baseTilt = -2;
        var leanShift = 0.3; // px of x shift per degree of lean while rocking

        // one gravity for every airborne phase
        var gravity = 1100;
        var delay = 0.25;

        // fall: free fall from rest, y = 1/2 g t^2, stretching with speed
        var dropHeight = landingY - startY;
        var dropDuration = Math.sqrt(2 * dropHeight / gravity);
        var dropStretchMax = 0.06;
        var squashDuration = 0.09;

        // bounce: a hop one-quarter of the tomato's rendered height.
        // Bouncing off a corner puts the contact
        // force off-center, so the hop also torques the tomato — it comes
        // back down already leaning right, straight into the wobble
        var bounceHeight = tomatoHeight * 0.25;
        var bounceVelocity = Math.sqrt(2 * gravity * bounceHeight);
        var bounceDuration = 2 * bounceVelocity / gravity;
        var landingLean = 12; // deg of rightward slant it lands with

        // wobble: right (the landing slant), left, and back up through
        // vertical — three quarters of a slow rocking cycle. The cut at
        // 3/4 leaves it upright and swinging rightward, and that momentum
        // is what the topple below inherits
        var wobblePeriod = 1.6;
        var wobbleDuration = 0.75 * wobblePeriod;

        // topple: the third rightward swing never comes back. A body
        // pivoting on a corner is an inverted pendulum, theta'' = K sin(theta):
        // torque grows with the lean, so it peels away slowly and then
        // whips over. The center swings on an arc about the corner until,
        // nearly sideways, it loses contact with the word and flies off
        // tangentially. K is kept below g/r so the exit spin stays readable
        var toppleK = 12;                        // rad/s^2 per sin(lean)
        var releaseAngle = 78 * Math.PI / 180;   // lean where contact is lost
        var pivotArm = tomatoWidth / 2;          // corner-to-center distance
        var toppleOmega0 = (landingLean * Math.PI / 180) * 2 * Math.PI / wobblePeriod;
        var toppleStep = 1 / 240;
        var toppleSamples = [0];
        var toppleTheta = 0;
        var toppleOmega = toppleOmega0;
        while (toppleTheta < releaseAngle && toppleSamples.length < 2000) {
            toppleOmega += toppleK * Math.sin(toppleTheta) * toppleStep;
            toppleTheta += toppleOmega * toppleStep;
            toppleSamples.push(toppleTheta);
        }
        var toppleDuration = (toppleSamples.length - 1) * toppleStep;
        var releaseTheta = toppleTheta;
        var releaseOmega = toppleOmega; // rad/s, constant once airborne

        // free fall from release: the center keeps the tangential velocity
        // it had about the pivot, gravity curves it down, and with no
        // contact there is no torque, so the spin rate stays fixed
        var releaseX = landingX + pivotArm * Math.sin(releaseTheta);
        var releaseY = landingY + pivotArm * (1 - Math.cos(releaseTheta));
        var releaseVx = releaseOmega * pivotArm * Math.cos(releaseTheta);
        var releaseVy = releaseOmega * pivotArm * Math.sin(releaseTheta);
        var fallDrop = exitY - releaseY;
        var fallDuration = (Math.sqrt(releaseVy * releaseVy + 2 * gravity * fallDrop) - releaseVy) / gravity;

        var dropEnd = dropDuration;
        var squashEnd = dropEnd + squashDuration;
        var bounceEnd = squashEnd + bounceDuration;
        var wobbleEnd = bounceEnd + wobbleDuration;
        var toppleEnd = wobbleEnd + toppleDuration;
        var animationEnd = toppleEnd + fallDuration;
        var startedAt = null;

        function toppleAngleAt(time) {
            var index = time / toppleStep;
            var low = Math.floor(index);
            if (low >= toppleSamples.length - 1) {
                return releaseTheta;
            }
            return toppleSamples[low] +
                (toppleSamples[low + 1] - toppleSamples[low]) * (index - low);
        }

        function renderTomato(x, y, rotation, scaleX, scaleY) {
            tomato.style.opacity = "1";
            tomato.style.transform = "translate(" + x + "px, " + y + "px)";
            tomatoArt.style.transform = "rotate(" + rotation + "deg) " +
                "scale(" + scaleX + ", " + scaleY + ")";
        }

        function animateFrame(timestamp) {
            if (startedAt === null) {
                startedAt = timestamp;
            }

            var elapsed = (timestamp - startedAt) / 1000 - delay;
            var x = landingX;
            var y = startY;
            var rotation = baseTilt;
            var scaleX = 1;
            var scaleY = 1;

            if (elapsed >= 0 && elapsed < dropEnd) {
                y = startY + 0.5 * gravity * elapsed * elapsed;
                // stretch along the velocity as it picks up speed
                var dropStretch = dropStretchMax * (elapsed / dropDuration);
                scaleY = 1 + dropStretch;
                scaleX = 1 - dropStretch * 0.8;
            } else if (elapsed >= dropEnd && elapsed < squashEnd) {
                // dip from the incoming stretch into the squash, recover;
                // cosine-eased so both ends join their neighbors smoothly
                var squashProgress = (elapsed - dropEnd) / squashDuration;
                y = landingY;
                if (squashProgress < 0.35) {
                    scaleY = easeCos(1 + dropStretchMax, 0.8, squashProgress / 0.35);
                } else {
                    scaleY = easeCos(0.8, 1, (squashProgress - 0.35) / 0.65);
                }
                scaleX = 1 - (scaleY - 1) * 0.8;
            } else if (elapsed >= squashEnd && elapsed < bounceEnd) {
                var bounceTime = elapsed - squashEnd;
                y = landingY - (bounceVelocity * bounceTime - 0.5 * gravity * bounceTime * bounceTime);
                // the corner's torque leans it over during the hop
                rotation = easeCos(baseTilt, baseTilt + landingLean,
                    bounceTime / bounceDuration);
                x = landingX + (rotation - baseTilt) * leanShift;
            } else if (elapsed >= bounceEnd && elapsed < wobbleEnd) {
                var wobbleTime = elapsed - bounceEnd;
                var wobbleAngle = landingLean * Math.cos(2 * Math.PI * wobbleTime / wobblePeriod);
                x = landingX + wobbleAngle * leanShift;
                y = landingY;
                rotation = baseTilt + wobbleAngle;
            } else if (elapsed >= wobbleEnd && elapsed < toppleEnd) {
                var leanAngle = toppleAngleAt(elapsed - wobbleEnd);
                // the center arcs around the corner as it keels over
                x = landingX + pivotArm * Math.sin(leanAngle);
                y = landingY + pivotArm * (1 - Math.cos(leanAngle));
                rotation = baseTilt + leanAngle * (180 / Math.PI);
            } else if (elapsed >= toppleEnd) {
                var fallTime = Math.min(elapsed - toppleEnd, fallDuration);
                x = releaseX + releaseVx * fallTime;
                y = releaseY + releaseVy * fallTime + 0.5 * gravity * fallTime * fallTime;
                rotation = baseTilt + (releaseTheta + releaseOmega * fallTime) * (180 / Math.PI);
            }

            renderTomato(x, y, rotation, scaleX, scaleY);

            if (elapsed < animationEnd) {
                window.requestAnimationFrame(animateFrame);
            } else {
                tomato.style.opacity = "0";
            }
        }

        window.requestAnimationFrame(animateFrame);
    }

    if (document.readyState === "complete") {
        window.requestAnimationFrame(runTomatoAnimation);
    } else {
        window.addEventListener("load", function () {
            window.requestAnimationFrame(runTomatoAnimation);
        }, { once: true });
    }
}());
