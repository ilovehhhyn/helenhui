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
        var leanShift = 0.3; // px of x shift per degree of lean on the corner

        // one gravity for every airborne phase
        var gravity = 2200;
        var delay = 0.25;

        // fall: free fall from rest, y = 1/2 g t^2, stretching with speed
        var dropHeight = landingY - startY;
        var dropDuration = Math.sqrt(2 * dropHeight / gravity);
        var dropStretchMax = 0.06;
        var squashDuration = 0.09;

        // bounce: a small 5px hop. bouncing off a corner puts the contact
        // force off-center, so the hop also torques the tomato — it comes
        // back down already leaning right, straight into the wobble
        var bounceHeight = 5;
        var bounceVelocity = Math.sqrt(2 * gravity * bounceHeight);
        var bounceDuration = 2 * bounceVelocity / gravity;
        var landingLean = 12; // deg of rightward slant it lands with

        // wobble: three slow swings — right (the landing slant), left,
        // right — one full rocking cycle, with the amplitude creeping up
        // so the last rightward swing carries it past the tipping point
        var wobbleDuration = 1.6;
        var wobbleAmplitudeEnd = 16;

        // tip-over: gravity torque about the corner ramps the spin and
        // horizontal speed up from zero, so the fall starts slow; once
        // contact is lost there is no torque about the center, so the
        // rates hold constant while gravity does the speeding up
        var pivotDuration = 0.22;
        var fallSpin = 80;  // deg/s after leaving the corner
        var fallDrift = 90; // px/s of horizontal speed after tipping
        var fallDuration = Math.sqrt(2 * (exitY - landingY) / gravity);

        var dropEnd = dropDuration;
        var squashEnd = dropEnd + squashDuration;
        var bounceEnd = squashEnd + bounceDuration;
        var wobbleEnd = bounceEnd + wobbleDuration;
        var animationEnd = wobbleEnd + fallDuration;

        var tipAngle = baseTilt + wobbleAmplitudeEnd;
        var tipX = landingX + wobbleAmplitudeEnd * leanShift;
        var startedAt = null;

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
                var wobbleProgress = (elapsed - bounceEnd) / wobbleDuration;
                // one slow full cycle of cos: starts at the rightward
                // landing lean, swings left, and returns right — with the
                // amplitude growing so the last swing goes past tipping
                var wobbleAmplitude = landingLean +
                    (wobbleAmplitudeEnd - landingLean) * wobbleProgress;
                var wobbleAngle = wobbleAmplitude * Math.cos(2 * Math.PI * wobbleProgress);
                x = landingX + wobbleAngle * leanShift;
                y = landingY;
                rotation = baseTilt + wobbleAngle;
            } else if (elapsed >= wobbleEnd) {
                var fallTime = Math.min(elapsed - wobbleEnd, fallDuration);
                var spin;
                var drift;
                if (fallTime < pivotDuration) {
                    // constant angular acceleration about the corner
                    spin = 0.5 * (fallSpin / pivotDuration) * fallTime * fallTime;
                    drift = 0.5 * (fallDrift / pivotDuration) * fallTime * fallTime;
                } else {
                    var freeTime = fallTime - pivotDuration;
                    spin = 0.5 * fallSpin * pivotDuration + fallSpin * freeTime;
                    drift = 0.5 * fallDrift * pivotDuration + fallDrift * freeTime;
                }
                x = tipX + drift;
                y = landingY + 0.5 * gravity * fallTime * fallTime;
                rotation = tipAngle + spin;
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
